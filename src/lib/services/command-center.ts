import { prisma } from '../db/prisma';
import { SLAService } from './sla';
import { IncidentIntelligenceService } from './incident-intelligence';

export class CommandCenterService {
  /**
   * Main command center aggregation
   */
  static async getDashboard(adminId: string) {
    const now = new Date();
    
    // Auto-cluster incidents before generating dashboard
    await IncidentIntelligenceService.autoClusterIncidents(adminId);

    // Fetch active requests
    const activeRequests = await prisma.request.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED', 'CANCELLED'] }
      },
      include: {
        requester: { select: { name: true, id: true } },
        assignedAuthority: { select: { name: true, id: true } }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const needsAttention: any[] = [];
    const workload = {
      PENDING: 0,
      ASSIGNED: 0,
      ACKNOWLEDGED: 0,
      PROCESSING: 0,
      UNASSIGNED: 0,
      BREACHED: 0,
      RESOLVED_AWAITING_VERIFICATION: await prisma.request.count({ where: { status: 'RESOLVED' } }),
    };

    const staffMap: Record<string, { id: string, name: string, active: number, overdue: number, recentlyResolved: number }> = {};

    // Process requests
    for (const req of activeRequests) {
      workload[req.status as keyof typeof workload] = (workload[req.status as keyof typeof workload] || 0) + 1;
      
      if (!req.assignedAuthorityId) {
        workload.UNASSIGNED++;
        needsAttention.push({
          id: req.id,
          identifier: req.ticketNumber,
          description: req.description,
          location: req.location || req.category,
          status: req.status,
          ageMs: now.getTime() - req.createdAt.getTime(),
          assignedStaff: null,
          reason: 'Unassigned request',
          priority: req.priority,
          type: 'REQUEST'
        });
      } else {
        const sid = req.assignedAuthorityId;
        if (!staffMap[sid]) {
          staffMap[sid] = { id: sid, name: req.assignedAuthority?.name || 'Unknown', active: 0, overdue: 0, recentlyResolved: 0 };
        }
        staffMap[sid].active++;
      }

      // SLA Check
      const sla = SLAService.evaluate(req, now);
      if (sla) {
        if (sla.isBreached) {
          workload.BREACHED++;
          needsAttention.push({
            id: req.id,
            identifier: req.ticketNumber,
            description: req.description,
            location: req.location || req.category,
            status: req.status,
            ageMs: now.getTime() - req.createdAt.getTime(),
            assignedStaff: req.assignedAuthority?.name || null,
            reason: 'SLA Breached',
            priority: req.priority,
            type: 'REQUEST'
          });
          if (req.assignedAuthorityId && staffMap[req.assignedAuthorityId]) {
             staffMap[req.assignedAuthorityId].overdue++;
          }
        } else if (sla.remainingMs > 0 && sla.remainingMs <= 4 * 3600000) { // < 4 hours
          needsAttention.push({
            id: req.id,
            identifier: req.ticketNumber,
            description: req.description,
            location: req.location || req.category,
            status: req.status,
            ageMs: now.getTime() - req.createdAt.getTime(),
            assignedStaff: req.assignedAuthority?.name || null,
            reason: 'SLA Warning (Due soon)',
            priority: req.priority,
            type: 'REQUEST'
          });
        }
      }

      // Stale Check
      // Rule: Pending for > 24 hours OR Processing for > 72 hours
      const isPendingStale = req.status === 'PENDING' && (now.getTime() - req.createdAt.getTime() > 24 * 3600000);
      const isProcessingStale = req.status === 'PROCESSING' && (now.getTime() - req.updatedAt.getTime() > 72 * 3600000);
      
      if (isPendingStale || isProcessingStale) {
        needsAttention.push({
          id: req.id,
          identifier: req.ticketNumber,
          description: req.description,
          location: req.location || req.category,
          status: req.status,
          ageMs: now.getTime() - req.createdAt.getTime(),
          assignedStaff: req.assignedAuthority?.name || null,
          reason: `Stale: No progress for ${isPendingStale ? '24' : '72'} hours`,
          priority: req.priority,
          type: 'REQUEST'
        });
      }
    }

    // Incidents
    const activeIncidents = await prisma.incident.findMany({
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      include: {
        requests: { select: { id: true, requesterId: true, priority: true } }
      }
    });

    const incidents = [];
    for (const inc of activeIncidents) {
      const userIds = new Set(inc.requests.map(r => r.requesterId));
      
      incidents.push({
        id: inc.id,
        identifier: `INC-${inc.id.substring(0, 5).toUpperCase()}`,
        title: inc.title,
        category: inc.category,
        location: inc.location,
        status: inc.status,
        ageMs: now.getTime() - inc.createdAt.getTime(),
        requestCount: inc.requests.length,
        userCount: userIds.size,
        impactScore: inc.impactScore,
        groupingReason: inc.groupingReason,
      });

      if ((inc.impactScore || 0) >= 30) {
        needsAttention.push({
          id: inc.id,
          identifier: `INC-${inc.id.substring(0, 5).toUpperCase()}`,
          description: inc.title,
          location: inc.location || inc.category,
          status: inc.status,
          ageMs: now.getTime() - inc.createdAt.getTime(),
          assignedStaff: null,
          reason: 'High-Impact Incident',
          priority: 'CRITICAL',
          type: 'INCIDENT'
        });
      }
    }

    // Recently resolved requests by staff (last 7 days)
    const recentResolved = await prisma.request.findMany({
      where: { 
        status: { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] },
        assignedAuthorityId: { not: null },
        resolvedAt: { gte: new Date(now.getTime() - 7 * 24 * 3600000) }
      },
      select: { assignedAuthorityId: true }
    });
    for (const rr of recentResolved) {
      if (rr.assignedAuthorityId && staffMap[rr.assignedAuthorityId]) {
        staffMap[rr.assignedAuthorityId].recentlyResolved++;
      }
    }

    // Deduplicate needsAttention based on ID to avoid spamming the same request
    const uniqueNeedsAttention = Array.from(new Map(needsAttention.map(item => [item.id, item])).values())
      .sort((a, b) => {
        const priorityScore = (p: string) => ({'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}[p] || 0);
        return priorityScore(b.priority) - priorityScore(a.priority);
      });

    return {
      needsAttention: uniqueNeedsAttention,
      incidents: incidents.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0)),
      workload,
      staffWorkload: Object.values(staffMap)
    };
  }
}
