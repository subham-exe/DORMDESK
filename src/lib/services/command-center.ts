import { prisma } from '../db/prisma';
import { SLAService } from './sla';

interface CommandSummary {
  activeRequests: number;
  criticalIssues: number;
  activeIncidents: number;
  breachedSla: number;
  unassigned: number;
  escalations: number;
}

export class CommandCenterService {
  /**
   * Main command center aggregation.
   * Consumes SLAService, Incident Intelligence, and basic queries.
   */
  static async getDashboard() {
    const now = new Date();

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

    const slaIssues = [];
    const unassigned = [];
    const stale = [];

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

    for (const req of activeRequests) {
      workload[req.status as keyof typeof workload] = (workload[req.status as keyof typeof workload] || 0) + 1;

      const baseItem = {
        id: req.id,
        identifier: req.ticketNumber,
        description: req.description,
        location: req.location || req.category,
        status: req.status,
        ageMs: now.getTime() - req.createdAt.getTime(),
        assignedStaff: req.assignedAuthority?.name || null,
        priority: req.priority,
        type: 'REQUEST' as const,
      };

      if (!req.assignedAuthorityId) {
        workload.UNASSIGNED++;
        unassigned.push({ ...baseItem, reason: 'Unassigned request' });
      } else {
        const sid = req.assignedAuthorityId;
        if (!staffMap[sid]) {
          staffMap[sid] = { id: sid, name: req.assignedAuthority?.name || 'Unknown', active: 0, overdue: 0, recentlyResolved: 0 };
        }
        staffMap[sid].active++;
      }

      // SLA Check via SLAService
      const sla = await SLAService.evaluate(req, now);
      if (sla) {
        const policyContext = req.SLA ? ` (${req.SLA}h policy)` : '';
        if (sla.isBreached) {
          workload.BREACHED++;
          slaIssues.push({ ...baseItem, reason: `SLA Breached${policyContext}`, severity: 'BREACH' });
          if (req.assignedAuthorityId && staffMap[req.assignedAuthorityId]) {
            staffMap[req.assignedAuthorityId].overdue++;
          }
        } else if (sla.remainingMs > 0 && sla.remainingMs <= 4 * 3600000) {
          slaIssues.push({ ...baseItem, reason: `SLA Warning (Due soon)${policyContext}`, severity: 'WARNING' });
        }
      }

      // Stale Check
      const isPendingStale = req.status === 'PENDING' && (now.getTime() - req.createdAt.getTime() > 24 * 3600000);
      const isProcessingStale = req.status === 'PROCESSING' && (now.getTime() - req.updatedAt.getTime() > 72 * 3600000);

      if (isPendingStale) {
        stale.push({ ...baseItem, reason: 'Stale: No progress for 24 hours' });
      } else if (isProcessingStale) {
        stale.push({ ...baseItem, reason: 'Stale: No update for 72 hours' });
      }
    }

    // Escalations
    const activeEscalations = await prisma.escalation.findMany({
      include: {
        request: { select: { ticketNumber: true, description: true, priority: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const escalations = activeEscalations.map(e => ({
      id: e.id,
      requestId: e.requestId,
      identifier: e.request.ticketNumber,
      description: e.request.description,
      level: e.level,
      ageMs: now.getTime() - e.createdAt.getTime(),
      priority: e.request.priority
    }));

    // Incidents
    const activeIncidentsRecs = await prisma.incident.findMany({
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      include: {
        requests: { select: { id: true, requesterId: true } }
      }
    });

    const incidents = activeIncidentsRecs.map(inc => {
      const userIds = new Set(inc.requests.map(r => r.requesterId));
      return {
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
        priority: (inc.impactScore || 0) >= 30 ? 'CRITICAL' : 'HIGH'
      };
    }).sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));

    // Workload History (Resolved in last 7 days)
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

    // Activity Log
    const recentActivity = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: { actor: { select: { name: true, role: true } } }
    });

    const activity = recentActivity.map(a => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      actorName: a.actor?.name || 'System',
      actorRole: a.actor?.role || 'System',
      timestamp: a.timestamp
    }));

    const summary: CommandSummary = {
      activeRequests: activeRequests.length,
      criticalIssues: incidents.filter(i => i.priority === 'CRITICAL').length + slaIssues.filter(s => s.severity === 'BREACH').length,
      activeIncidents: incidents.length,
      breachedSla: workload.BREACHED,
      unassigned: workload.UNASSIGNED,
      escalations: escalations.length
    };

    return {
      summary,
      sla: slaIssues,
      incidents,
      unassigned,
      stale,
      escalations,
      workload,
      staffWorkload: Object.values(staffMap),
      activity
    };
  }
}
