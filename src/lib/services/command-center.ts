import { prisma } from '../db/prisma';
import { SLAService } from './sla';

interface AttentionItem {
  id: string;
  identifier: string;
  description: string;
  location: string;
  status: string;
  ageMs: number;
  assignedStaff: string | null;
  reasons: string[];
  priority: string;
  type: 'REQUEST' | 'INCIDENT';
}

export class CommandCenterService {
  /**
   * Main command center aggregation.
   * This is a READ-ONLY operation. It does NOT mutate the database.
   * Incident auto-clustering should be triggered via a separate explicit admin action.
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

    const attentionMap = new Map<string, AttentionItem>();
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

    const addAttention = (id: string, reason: string, base: Omit<AttentionItem, 'id' | 'reasons'>) => {
      const existing = attentionMap.get(id);
      if (existing) {
        if (!existing.reasons.includes(reason)) {
          existing.reasons.push(reason);
        }
        // Escalate priority if the new reason has higher priority
        const prio = (p: string) => ({ 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }[p] || 0);
        if (prio(base.priority) > prio(existing.priority)) {
          existing.priority = base.priority;
        }
      } else {
        attentionMap.set(id, { id, reasons: [reason], ...base });
      }
    };

    // Process requests
    for (const req of activeRequests) {
      workload[req.status as keyof typeof workload] = (workload[req.status as keyof typeof workload] || 0) + 1;

      const baseItem = {
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
        addAttention(req.id, 'Unassigned request', baseItem);
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
        const policyContext = req.SLA ? ` (${req.SLA}h policy)` : '';
        if (sla.isBreached) {
          workload.BREACHED++;
          addAttention(req.id, `SLA Breached${policyContext}`, baseItem);
          if (req.assignedAuthorityId && staffMap[req.assignedAuthorityId]) {
            staffMap[req.assignedAuthorityId].overdue++;
          }
        } else if (sla.remainingMs > 0 && sla.remainingMs <= 4 * 3600000) {
          addAttention(req.id, `SLA Warning (Due soon)${policyContext}`, baseItem);
        }
      }

      // Stale Check
      // Rule: PENDING with no progress for > 24h (measured from createdAt since no status change has occurred)
      // Rule: PROCESSING with no update for > 72h (measured from updatedAt)
      const isPendingStale = req.status === 'PENDING' && (now.getTime() - req.createdAt.getTime() > 24 * 3600000);
      const isProcessingStale = req.status === 'PROCESSING' && (now.getTime() - req.updatedAt.getTime() > 72 * 3600000);

      if (isPendingStale) {
        addAttention(req.id, 'Stale: No progress for 24 hours', baseItem);
      }
      if (isProcessingStale) {
        addAttention(req.id, 'Stale: No update for 72 hours', baseItem);
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
        addAttention(inc.id, 'High-Impact Incident', {
          identifier: `INC-${inc.id.substring(0, 5).toUpperCase()}`,
          description: inc.title,
          location: inc.location || inc.category,
          status: inc.status,
          ageMs: now.getTime() - inc.createdAt.getTime(),
          assignedStaff: null,
          priority: 'CRITICAL',
          type: 'INCIDENT',
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

    // Convert attention map to sorted array
    const needsAttention = Array.from(attentionMap.values())
      .sort((a, b) => {
        const priorityScore = (p: string) => ({ 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }[p] || 0);
        return priorityScore(b.priority) - priorityScore(a.priority);
      });

    return {
      needsAttention,
      incidents: incidents.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0)),
      workload,
      staffWorkload: Object.values(staffMap)
    };
  }
}
