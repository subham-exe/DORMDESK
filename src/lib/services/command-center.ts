import { prisma } from '../db/prisma';
import { SLAService } from './sla';

interface CommandSummary {
  activeRequests: number;
  criticalIssues: number;
  activeIncidents: number;
  activeRecurring: number;
  breachedSla: number;
  unassigned: number;
  escalations: number;
}

export class CommandCenterService {
  /**
   * Main command center aggregation.
   * Consumes SLAService, Incident Intelligence, and basic queries.
   */
  static async getDashboard(actor?: { id: string, role: string, department?: string | null, hostel?: string | null }) {
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestWhere: any = {
      status: { notIn: ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED', 'CANCELLED'] }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incidentWhere: any = {
      status: { notIn: ['RESOLVED', 'CLOSED'] }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recurringWhere: any = {
      status: 'ACTIVE'
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const escalationWhere: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolvedWhere: any = { status: 'RESOLVED' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyWhere: any = {
      status: { in: ['RESOLVED', 'VERIFIED', 'CLOSED'] },
      assignedAuthorityId: { not: null },
      resolvedAt: { gte: new Date(now.getTime() - 7 * 24 * 3600000) }
    };

    if (actor && actor.role !== 'Admin') {
      if (actor.role === 'Warden' && actor.hostel) {
        requestWhere.location = { contains: actor.hostel };
        resolvedWhere.location = { contains: actor.hostel };
        historyWhere.location = { contains: actor.hostel };
        incidentWhere.location = { contains: actor.hostel };
        recurringWhere.location = { contains: actor.hostel };
        escalationWhere.request = { location: { contains: actor.hostel } };
      } else if ((actor.role === 'Faculty' || actor.role === 'Staff') && actor.department) {
        requestWhere.assignedDepartment = actor.department;
        resolvedWhere.assignedDepartment = actor.department;
        historyWhere.assignedDepartment = actor.department;
        incidentWhere.requests = { some: { assignedDepartment: actor.department } };
        recurringWhere.requests = { some: { assignedDepartment: actor.department } };
        escalationWhere.request = { assignedDepartment: actor.department };
      } else {
        requestWhere.id = 'NO_ACCESS';
        resolvedWhere.id = 'NO_ACCESS';
        historyWhere.id = 'NO_ACCESS';
        incidentWhere.id = 'NO_ACCESS';
        recurringWhere.id = 'NO_ACCESS';
        escalationWhere.id = 'NO_ACCESS';
      }
    }

    // Fetch active requests
    const activeRequests = await prisma.request.findMany({
      where: requestWhere,
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
      RESOLVED_AWAITING_VERIFICATION: await prisma.request.count({ where: resolvedWhere }),
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

      // SLA Check via SLAService in memory (prevents N+1 database queries)
      const sla = SLAService.calculate(req, now);
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
      where: escalationWhere,
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

    // Recurring Issues
    const activeRecurringRecs = await prisma.recurringIssue.findMany({
      where: recurringWhere,
      orderBy: { occurrenceCount: 'desc' },
      take: 20,
      include: {
        incidents: { select: { id: true } },
        requests: { select: { id: true } }
      }
    });

    const recurring = activeRecurringRecs.map(ri => ({
      id: ri.id,
      category: ri.category,
      location: ri.location,
      occurrenceCount: ri.occurrenceCount,
      firstDetectedAt: ri.firstDetectedAt,
      lastDetectedAt: ri.lastDetectedAt,
      status: ri.status,
      relatedIncidentCount: ri.incidents.length,
      relatedRequestCount: ri.requests.length
    }));

    // Incidents
    const activeIncidentsRecs = await prisma.incident.findMany({
      where: incidentWhere,
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
      where: historyWhere,
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
      activeRecurring: recurring.length,
      breachedSla: workload.BREACHED,
      unassigned: workload.UNASSIGNED,
      escalations: escalations.length
    };

    return {
      summary,
      sla: slaIssues,
      incidents,
      recurring,
      unassigned,
      stale,
      escalations,
      workload,
      staffWorkload: Object.values(staffMap),
      activity
    };
  }
}
