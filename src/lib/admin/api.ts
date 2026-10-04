import { RequestStatus, RequestPriority, RequestType } from "../types/request";
import { prisma } from "../db/prisma";
import { RequestEngine } from "../services/request-engine";
import { requireAuth } from "../auth/session";

export interface AdminRequest {
  id: string;
  ticketNumber: string;
  requestType: RequestType;
  category: string;
  requesterId: string;
  requesterName: string;
  description: string;
  location?: string;
  priority: RequestPriority;
  status: RequestStatus;
  assignedDepartment?: string;
  assignedAuthorityId?: string;
  assignedAuthorityName?: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  slaStatus: "ON_TRACK" | "WARNING" | "BREACHED";
  ageingHours: number;
  incidentId?: string;
}

export interface AdminIncident {
  id: string;
  incidentNumber: string;
  title: string;
  category: string;
  location: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  affectedStudentCount: number;
  assignedTeam?: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  slaStatus: "ON_TRACK" | "WARNING" | "BREACHED";
}

export interface DashboardKPIs {
  pendingRequests: number;
  overdueRequests: number;
  activeIncidents: number;
  unassignedRequests: number;
  ageingBuckets: {
    under24h: number;
    hours24to48: number;
    over48h: number;
  };
}

export interface ScholarshipStats {
  academicYear: string;
  totalEligible: number;
  applied: number;
  underVerification: number;
  approved: number;
  disbursed: number;
}

export type ScholarshipStatus = "SUBMITTED" | "UNDER_VERIFICATION" | "APPROVED" | "REJECTED" | "SANCTIONED" | "DISBURSED";

export interface ScholarshipApplication {
  id: string;
  applicationNumber: string;
  studentId: string;
  studentName: string;
  programName: string;
  status: ScholarshipStatus;
  submittedAt: string;
  updatedAt: string;
  amountRequested?: number;
  notes?: string;
}

export interface RecurringIssue {
  id: string;
  pattern: string;
  category: string;
  location: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  relatedRequestIds: string[];
}


export interface ResolutionAnalytics {
  resolvedCount: number;
  averageHours: number | null;
  medianHours: number | null;
}

export interface StaffWorkload {
  userId: string;
  name: string;
  role: string;
  assignedCount: number;
  activeCount: number;
  resolvedCount: number;
  averageResolutionHours: number | null;
}

export interface AnalyticsSummary {
  totalRequests: number;
  resolvedRequests: number;
  byCategory: Array<{ category: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  bySlaStatus: Array<{ slaStatus: string; count: number }>;
  resolution: ResolutionAnalytics;
}

export interface AdminRequestEvent {
  id: string;
  action: string;
  timestamp: string;
  actor: { name: string; id: string };
  metadata?: Record<string, unknown>;
}

export interface AdminRequestDetail extends AdminRequest {
  events: AdminRequestEvent[];
}

function calculateSLA(createdAt: Date, dueAt: Date | null, resolvedAt: Date | null, status: string, updatedAt: Date): { ageingHours: number, slaStatus: "ON_TRACK" | "WARNING" | "BREACHED" } {
  const simulatedNow = Date.now();
  
  if (["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED", "APPROVED"].includes(status)) {
    const endMs = resolvedAt ? resolvedAt.getTime() : updatedAt.getTime();
    const createdMs = createdAt.getTime();
    const ageingHours = Math.max(0, Math.round(((endMs - createdMs) / (1000 * 60 * 60)) * 10) / 10);
    return { ageingHours, slaStatus: "ON_TRACK" }; // if resolved, it's not breached anymore for the live dashboard
  }

  const createdMs = createdAt.getTime();
  const ageingMs = simulatedNow - createdMs;
  const ageingHours = Math.max(0, Math.round((ageingMs / (1000 * 60 * 60)) * 10) / 10);

  let slaStatus: "ON_TRACK" | "WARNING" | "BREACHED" = "ON_TRACK";
  if (dueAt) {
    const dueMs = dueAt.getTime();
    if (simulatedNow >= dueMs) {
      slaStatus = "BREACHED";
    } else if (dueMs - simulatedNow <= 1000 * 60 * 60 * 6) { 
      slaStatus = "WARNING";
    }
  } else if (ageingHours > 24) {
    slaStatus = "BREACHED";
  }

  return { ageingHours, slaStatus };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToAdminRequest(req: any): AdminRequest {
  const sla = calculateSLA(req.createdAt, req.dueAt, req.resolvedAt, req.status, req.updatedAt);
  return {
    id: req.id,
    ticketNumber: req.ticketNumber,
    requestType: req.requestType as RequestType,
    category: req.category,
    requesterId: req.requesterId,
    requesterName: req.requester?.name || "Unknown",
    description: req.description,
    location: req.location || undefined,
    priority: req.priority as RequestPriority,
    status: req.status as RequestStatus,
    assignedDepartment: req.assignedDepartment || undefined,
    assignedAuthorityId: req.assignedAuthorityId || undefined,
    assignedAuthorityName: req.assignedAuthority?.name || undefined,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    dueAt: req.dueAt ? req.dueAt.toISOString() : undefined,
    slaStatus: sla.slaStatus,
    ageingHours: sla.ageingHours,
    incidentId: req.incidentId || undefined
  };
}

// Helper for hackathon basic RBAC logic
export async function verifyAdminAuthority() {
  const user = await requireAuth();
  if (!['SystemAdmin', 'Admin', 'Warden', 'Staff', 'Faculty'].includes(user.role)) {
    throw new Error("Unauthorized: Actor is not an admin or staff");
  }
  return user;
}

export const AdminAPI = {

  // Requests
  async listRequests(filters?: { status?: RequestStatus; category?: string; assigneeId?: string; priority?: RequestPriority }): Promise<AdminRequest[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.category) where.category = filters.category;
      if (filters.assigneeId) where.assignedAuthorityId = filters.assigneeId;
      if (filters.priority) where.priority = filters.priority;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, department: true, hostel: true } },
        assignedAuthority: { select: { id: true, name: true, email: true, role: true, department: true, hostel: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests.map(mapToAdminRequest);
  },

  async getRequestDetail(id: string): Promise<AdminRequestDetail | null> {
    const req = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, department: true, hostel: true } },
        assignedAuthority: { select: { id: true, name: true, email: true, role: true, department: true, hostel: true } },
        statusHistory: true,
        assignmentHistory: true
      }
    });
    if (!req) return null;

    const auditLogs = await prisma.auditLog.findMany({
      where: { entity: "Request", entityId: id },
      orderBy: { timestamp: 'asc' }
    });

    const actorIds = new Set<string>();
    req.statusHistory.forEach(h => { if (h.actorId) actorIds.add(h.actorId); });
    req.assignmentHistory.forEach(h => { 
      if (h.assignedBy) actorIds.add(h.assignedBy); 
      if (h.assigneeId) actorIds.add(h.assigneeId); 
    });
    auditLogs.forEach(l => { if (l.actorId) actorIds.add(l.actorId); });

    const actors = await prisma.user.findMany({ where: { id: { in: Array.from(actorIds) } } });
    const actorMap = new Map(actors.map(a => [a.id, a]));

    const events: AdminRequestEvent[] = [];

    req.statusHistory.forEach(h => {
      const actor = h.actorId ? actorMap.get(h.actorId) : null;
      events.push({
        id: h.id,
        action: h.fromStatus === null ? "CREATED" : `STATUS_CHANGED_${h.toStatus}`,
        timestamp: h.createdAt.toISOString(),
        actor: { name: actor?.name || 'SYSTEM', id: h.actorId || 'SYSTEM' },
        metadata: h.reason ? { resolutionNotes: h.reason } : undefined
      });
    });

    req.assignmentHistory.forEach(h => {
      const assigner = h.assignedBy ? actorMap.get(h.assignedBy) : null;
      const assignee = actorMap.get(h.assigneeId);
      events.push({
        id: h.id,
        action: 'ASSIGNED',
        timestamp: h.assignedAt.toISOString(),
        actor: { name: assigner?.name || 'SYSTEM', id: h.assignedBy || 'SYSTEM' },
        metadata: { assignedTo: assignee?.name || h.assigneeId }
      });
    });

    auditLogs.forEach(log => {
      if (log.action !== 'STATUS_CHANGED' && !log.action.startsWith('STATUS_CHANGED_') && log.action !== 'ASSIGNED' && log.action !== 'CREATED') {
        events.push({
          id: log.id,
          action: log.action,
          timestamp: log.timestamp.toISOString(),
          actor: { name: log.actorName || (log.actorId ? actorMap.get(log.actorId)?.name || 'SYSTEM' : 'SYSTEM'), id: log.actorId || 'SYSTEM' },
          metadata: log.metadata ? JSON.parse(log.metadata) : undefined
        });
      }
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      ...mapToAdminRequest(req),
      events
    };
  },

  async assignRequest(id: string, assigneeId: string, department: string): Promise<boolean> {
    const actor = await verifyAdminAuthority();
    try {
      await RequestEngine.assignRequest({
        requestId: id,
        assigneeId,
        department,
        actorId: actor.id
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async updateRequestStatus(id: string, status: RequestStatus, notes?: string): Promise<boolean> {
    const actor = await verifyAdminAuthority();
    try {
      await RequestEngine.transitionStatus({
        requestId: id,
        newStatus: status,
        notes,
        actorId: actor.id
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  // Incidents
  async listIncidents(): Promise<AdminIncident[]> {
    const incidents = await prisma.incident.findMany({
      include: { _count: { select: { requests: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return incidents.map(inc => ({
      id: inc.id,
      incidentNumber: inc.id.substring(0, 8),
      title: inc.title,
      category: inc.category,
      location: inc.location,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: inc.status as any,
      affectedStudentCount: inc._count.requests,
      assignedTeam: inc.assignedDepartment,
      createdAt: inc.createdAt.toISOString(),
      updatedAt: inc.updatedAt.toISOString(),
      slaStatus: "ON_TRACK"
    }));
  },

  async getIncident(id: string): Promise<AdminIncident | null> {
    const inc = await prisma.incident.findUnique({
      where: { id },
      include: { _count: { select: { requests: true } } }
    });
    if (!inc) return null;
    return {
      id: inc.id,
      incidentNumber: inc.id.substring(0, 8),
      title: inc.title,
      category: inc.category,
      location: inc.location,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: inc.status as any,
      affectedStudentCount: inc._count.requests,
      assignedTeam: inc.assignedDepartment,
      createdAt: inc.createdAt.toISOString(),
      updatedAt: inc.updatedAt.toISOString(),
      slaStatus: "ON_TRACK"
    };
  },

  async groupRequestsIntoIncident(incidentId: string | null, title: string, requestIds: string[]): Promise<string | null> {
    const actor = await verifyAdminAuthority();
    const targetIncidentId: string | null = incidentId;
    
    // In a real app, you might find existing incident ID if they are already grouped
    if (!targetIncidentId) {
      const inc = await RequestEngine.clusterIntoIncident(requestIds, title, "Grouped Incident", "General", "Multiple", "General", actor.id);
      return inc.id;
    } else {
      await RequestEngine.attachToIncident(targetIncidentId, requestIds, actor.id);
      return targetIncidentId;
    }
  },

  async resolveIncident(incidentId: string, resolutionNotes: string): Promise<boolean> {
    const actor = await verifyAdminAuthority();
    
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });

    const requests = await prisma.request.findMany({
      where: { incidentId, status: { notIn: ['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED'] } }
    });

    for (const req of requests) {
      try {
        await RequestEngine.transitionStatus({
          requestId: req.id,
          newStatus: 'RESOLVED',
          notes: resolutionNotes,
          actorId: actor.id
        });
      } catch {
        console.warn(`Skipping auto-resolve for request ${req.id} due to state constraints.`);
      }
    }

    return true;
  },

  // Dashboard
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const reqs = await this.listRequests();
    const activeReqs = reqs.filter(r => !["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED", "APPROVED"].includes(r.status));
    const incidents = await this.listIncidents();

    const pendingRequests = reqs.filter(r => r.status === "PENDING").length;
    const overdueRequests = activeReqs.filter(r => r.slaStatus === "BREACHED").length;
    const activeIncidents = incidents.filter(i => i.status === "OPEN").length;
    const unassignedRequests = activeReqs.filter(r => !r.assignedAuthorityId).length;

    let under24h = 0;
    let hours24to48 = 0;
    let over48h = 0;

    for (const r of activeReqs) {
      if (r.ageingHours < 24) under24h++;
      else if (r.ageingHours <= 48) hours24to48++;
      else over48h++;
    }

    return {
      pendingRequests,
      overdueRequests,
      activeIncidents,
      unassignedRequests,
      ageingBuckets: {
        under24h,
        hours24to48,
        over48h,
      }
    };
  },

  async getAttentionRequests(): Promise<AdminRequest[]> {
    const reqs = await this.listRequests();
    
    return reqs
      .filter(r => {
        const isFrozen = ["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED", "APPROVED"].includes(r.status);
        if (isFrozen) return false;
        if (r.slaStatus === "BREACHED" || r.slaStatus === "WARNING") return true;
        if (!r.assignedAuthorityId && r.ageingHours > 24) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.slaStatus === "BREACHED" && b.slaStatus !== "BREACHED") return -1;
        if (b.slaStatus === "BREACHED" && a.slaStatus !== "BREACHED") return 1;
        if (a.slaStatus === "WARNING" && b.slaStatus !== "WARNING") return -1;
        if (b.slaStatus === "WARNING" && a.slaStatus !== "WARNING") return 1;
        return b.ageingHours - a.ageingHours;
      });
  },

  // Scholarships
  async listScholarshipApplications(): Promise<ScholarshipApplication[]> {
    const apps = await prisma.scholarship.findMany({ include: { student: true } });
    return apps.map(app => ({
      id: app.id,
      applicationNumber: `SCH-${app.id.substring(0,8)}`,
      studentId: app.studentId,
      studentName: app.student.name,
      programName: "General Scholarship",
      status: app.status as ScholarshipStatus,
      submittedAt: app.updatedAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }));
  },

  async getScholarshipApplication(id: string): Promise<ScholarshipApplication | null> {
    const app = await prisma.scholarship.findUnique({ where: { id }, include: { student: true } });
    if (!app) return null;
    return {
      id: app.id,
      applicationNumber: `SCH-${app.id.substring(0,8)}`,
      studentId: app.studentId,
      studentName: app.student.name,
      programName: "General Scholarship",
      status: app.status as ScholarshipStatus,
      submittedAt: app.updatedAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  },

  async getScholarshipStats(academicYear: string): Promise<ScholarshipStats> {
    const apps = await prisma.scholarship.findMany();
    return {
      academicYear,
      totalEligible: 0,
      applied: apps.length,
      underVerification: apps.filter(a => a.status === "UNDER_VERIFICATION").length,
      approved: apps.filter(a => a.status === "APPROVED").length,
      disbursed: apps.filter(a => a.status === "DISBURSED").length,
    };
  },

  async updateScholarshipStatus(id: string, newStatus: ScholarshipStatus): Promise<boolean> {
    await verifyAdminAuthority();
    try {
      await prisma.scholarship.update({
        where: { id },
        data: { status: newStatus }
      });
      return true;
    } catch {
      return false;
    }
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsSummary> {
    const reqs = await prisma.request.findMany({
      select: { category: true, status: true, priority: true, createdAt: true, resolvedAt: true, dueAt: true, updatedAt: true }
    });

    let totalResolved = 0;
    const resolutionDurations: number[] = [];

    const catMap: Record<string, number> = {};
    const statMap: Record<string, number> = {};
    const prioMap: Record<string, number> = {};
    const slaMap: Record<string, number> = {};

    for (const r of reqs) {
      catMap[r.category] = (catMap[r.category] || 0) + 1;
      statMap[r.status] = (statMap[r.status] || 0) + 1;
      prioMap[r.priority] = (prioMap[r.priority] || 0) + 1;
      
      const isResolved = ["RESOLVED", "VERIFIED", "CLOSED", "APPROVED"].includes(r.status);
      if (isResolved && r.resolvedAt) {
        totalResolved++;
        const durationHours = (r.resolvedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
        if (durationHours >= 0) {
          resolutionDurations.push(durationHours);
        }
      }

      let slaStatus = "ON_TRACK";
      if (!isResolved && r.dueAt && r.dueAt.getTime() < Date.now()) slaStatus = "BREACHED";
      else if (!isResolved && r.dueAt && (r.dueAt.getTime() - Date.now()) < 24 * 3600 * 1000) slaStatus = "WARNING";
      slaMap[slaStatus] = (slaMap[slaStatus] || 0) + 1;
    }

    resolutionDurations.sort((a, b) => a - b);
    const resolvedCount = resolutionDurations.length;
    let averageHours = null;
    let medianHours = null;

    if (resolvedCount > 0) {
      const sum = resolutionDurations.reduce((a, b) => a + b, 0);
      averageHours = sum / resolvedCount;
      const mid = Math.floor(resolvedCount / 2);
      medianHours = resolvedCount % 2 !== 0 ? resolutionDurations[mid] : (resolutionDurations[mid - 1] + resolutionDurations[mid]) / 2;
    }

    const summary: AnalyticsSummary = {
      totalRequests: reqs.length,
      resolvedRequests: totalResolved,
      byCategory: Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
      byStatus: Object.entries(statMap).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      byPriority: Object.entries(prioMap).map(([priority, count]) => ({ priority, count })).sort((a, b) => b.count - a.count),
      bySlaStatus: Object.entries(slaMap).map(([slaStatus, count]) => ({ slaStatus, count })).sort((a, b) => b.count - a.count),
      resolution: {
        resolvedCount,
        averageHours: averageHours !== null ? parseFloat(averageHours.toFixed(2)) : null,
        medianHours: medianHours !== null ? parseFloat(medianHours.toFixed(2)) : null
      }
    };

    return summary;
  },

  async getStaffWorkload(): Promise<StaffWorkload[]> {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['Warden', 'Faculty', 'Admin', 'Staff'] } },
      include: {
        requestsAssigned: {
          select: { status: true, createdAt: true, resolvedAt: true }
        }
      }
    });

    return staff.map(user => {
      let activeCount = 0;
      let resolvedCount = 0;
      let sumDuration = 0;
      let validResolvedForAvg = 0;

      for (const req of user.requestsAssigned) {
        const isResolved = ["RESOLVED", "VERIFIED", "CLOSED", "APPROVED"].includes(req.status);
        if (isResolved) {
          resolvedCount++;
          if (req.resolvedAt) {
            const hours = (req.resolvedAt.getTime() - req.createdAt.getTime()) / (1000 * 60 * 60);
            if (hours >= 0) {
              sumDuration += hours;
              validResolvedForAvg++;
            }
          }
        } else if (req.status !== "REJECTED" && req.status !== "CANCELLED") {
          activeCount++;
        }
      }

      let averageResolutionHours = null;
      if (validResolvedForAvg > 0) {
        averageResolutionHours = parseFloat((sumDuration / validResolvedForAvg).toFixed(2));
      }

      return {
        userId: user.id,
        name: user.name,
        role: user.role,
        assignedCount: user.requestsAssigned.length,
        activeCount,
        resolvedCount,
        averageResolutionHours
      };
    }).sort((a, b) => b.assignedCount - a.assignedCount);
  },

async getRecurringIssues(): Promise<RecurringIssue[]> {
    const reqs = await this.listRequests();
    const groups: Record<string, AdminRequest[]> = {};
    
    for (const r of reqs) {
      if (!r.location) continue;
      const patternKey = `${r.category}|${r.location}`;
      if (!groups[patternKey]) groups[patternKey] = [];
      groups[patternKey].push(r);
    }

    const issues: RecurringIssue[] = [];
    const RECURRENCE_THRESHOLD = 2;

    let index = 1;
    for (const [, groupReqs] of Object.entries(groups)) {
      if (groupReqs.length >= RECURRENCE_THRESHOLD) {
        const sorted = groupReqs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        issues.push({
          id: `rec-issue-${index++}`,
          pattern: `${sorted[0].category} issue in ${sorted[0].location}`,
          category: sorted[0].category,
          location: sorted[0].location!,
          occurrences: sorted.length,
          firstSeen: sorted[0].createdAt,
          lastSeen: sorted[sorted.length - 1].createdAt,
          relatedRequestIds: sorted.map(r => r.id)
        });
      }
    }

    return issues.sort((a, b) => b.occurrences - a.occurrences);
  },

  async listStaffDirectory(): Promise<Array<{ id: string, name: string, department: string }>> {
    const staff = await prisma.user.findMany({
      where: { role: { in: ['Staff', 'Warden', 'Admin', 'Faculty'] } }
    });
    return staff.map(s => ({
      id: s.id,
      name: s.name,
      department: s.department || 'General'
    }));
  }
};

