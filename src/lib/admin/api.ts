import { RequestStatus, RequestPriority, RequestType } from "../types/request";

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

export type ScholarshipStatus = "PENDING_REVIEW" | "UNDER_VERIFICATION" | "APPROVED" | "REJECTED" | "DISBURSED";

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

export interface AnalyticsSummary {
  totalRequests: number;
  resolvedRequests: number;
  byCategory: Array<{ category: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  bySlaStatus: Array<{ slaStatus: string; count: number }>;
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

const MOCK_REQUESTS: AdminRequest[] = [
  {
    id: "req-001",
    ticketNumber: "REQ-2026-001",
    requestType: "COMPLAINT",
    category: "Plumbing",
    requesterId: "stu-101",
    requesterName: "Rahul Sharma",
    description: "Water tap is leaking continuously in Room 204.",
    location: "Hostel B - Room 204",
    priority: "MEDIUM",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    slaStatus: "ON_TRACK",
    ageingHours: 2,
  },
  {
    id: "req-002",
    ticketNumber: "REQ-2026-002",
    requestType: "COMPLAINT",
    category: "Electrical",
    requesterId: "stu-102",
    requesterName: "Anjali Gupta",
    description: "Fan regulator is broken, fan stuck at max speed.",
    location: "Hostel A - Room 112",
    priority: "LOW",
    status: "ASSIGNED",
    assignedDepartment: "Maintenance",
    assignedAuthorityId: "stf-201",
    assignedAuthorityName: "Ramesh Electrician",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    dueAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    slaStatus: "BREACHED",
    ageingHours: 26,
  },
  {
    id: "req-003",
    ticketNumber: "REQ-2026-003",
    requestType: "LEAVE",
    category: "Outstation",
    requesterId: "stu-103",
    requesterName: "Karan Singh",
    description: "Going home for Diwali holidays.",
    priority: "MEDIUM",
    status: "ACKNOWLEDGED",
    assignedDepartment: "Hostel Admin",
    assignedAuthorityId: "wrd-001",
    assignedAuthorityName: "Warden Sharma",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    slaStatus: "ON_TRACK",
    ageingHours: 5,
  },
  {
    id: "req-004",
    ticketNumber: "REQ-2026-004",
    requestType: "CERTIFICATE",
    category: "Bonafide",
    requesterId: "stu-104",
    requesterName: "Priya Das",
    description: "Need bonafide certificate for bank loan.",
    priority: "HIGH",
    status: "PROCESSING",
    assignedDepartment: "Academic Office",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    slaStatus: "WARNING",
    ageingHours: 48,
  },
  {
    id: "req-005",
    ticketNumber: "REQ-2026-005",
    requestType: "COMPLAINT",
    category: "Internet",
    requesterId: "stu-105",
    requesterName: "Vikram Patel",
    description: "Wi-Fi is completely down in the entire wing.",
    location: "Hostel C - Ground Floor",
    priority: "CRITICAL",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    slaStatus: "ON_TRACK",
    ageingHours: 0.5,
    incidentId: "inc-001"
  },
  {
    id: "req-006",
    ticketNumber: "REQ-2026-006",
    requestType: "COMPLAINT",
    category: "Internet",
    requesterId: "stu-106",
    requesterName: "Sneha Nair",
    description: "Cannot connect to the network in Room 102, keeps dropping.",
    location: "Hostel C - Ground Floor",
    priority: "HIGH",
    status: "ACKNOWLEDGED",
    assignedDepartment: "IT Support",
    assignedAuthorityId: "stf-401",
    assignedAuthorityName: "Network Admin",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    slaStatus: "ON_TRACK",
    ageingHours: 2,
    incidentId: "inc-001"
  }
];

const MOCK_EVENTS: Record<string, AdminRequestEvent[]> = {};

const MOCK_INCIDENTS: AdminIncident[] = [
  {
    id: "inc-001",
    incidentNumber: "INC-2026-001",
    title: "Block A Network Outage",
    category: "Internet",
    location: "Block A",
    status: "OPEN",
    affectedStudentCount: 15,
    assignedTeam: "Network Admin",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    slaStatus: "WARNING",
  }
];

let demoClockOffset = 0;

function applySLA(req: AdminRequest): AdminRequest {
  const simulatedNow = Date.now() + demoClockOffset;
  
  // Freeze SLA if resolved/closed
  if (["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED"].includes(req.status)) {
    const endMs = new Date(req.updatedAt).getTime();
    const createdMs = new Date(req.createdAt).getTime();
    // In a real system, you'd use the actual resolved timestamp.
    const ageingHours = Math.max(0, Math.round(((endMs - createdMs) / (1000 * 60 * 60)) * 10) / 10);
    return { ...req, ageingHours };
  }

  const createdMs = new Date(req.createdAt).getTime();
  const ageingMs = simulatedNow - createdMs;
  const ageingHours = Math.max(0, Math.round((ageingMs / (1000 * 60 * 60)) * 10) / 10);

  let slaStatus: "ON_TRACK" | "WARNING" | "BREACHED" = "ON_TRACK";
  if (req.dueAt) {
    const dueMs = new Date(req.dueAt).getTime();
    if (simulatedNow >= dueMs) {
      slaStatus = "BREACHED";
    } else if (dueMs - simulatedNow <= 1000 * 60 * 60 * 6) { 
      // 6 hours warning threshold for demo purposes
      slaStatus = "WARNING";
    }
  }

  return { ...req, slaStatus, ageingHours };
}

// ----------------------------------------------------------------------
// MOCK SCHOLARSHIP DATA (Isolated for BON-10 visibility)
// ----------------------------------------------------------------------
const MOCK_SCHOLARSHIPS: ScholarshipApplication[] = [
  {
    id: "schol-001",
    applicationNumber: "SCH-2026-001",
    studentId: "stu-101",
    studentName: "Rahul Sharma",
    programName: "Merit-cum-Means Grant",
    status: "PENDING_REVIEW",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    amountRequested: 50000,
  },
  {
    id: "schol-002",
    applicationNumber: "SCH-2026-002",
    studentId: "stu-108",
    studentName: "Aditi Desai",
    programName: "Research Travel Grant",
    status: "UNDER_VERIFICATION",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    amountRequested: 15000,
    notes: "Awaiting recommendation letter from guide.",
  },
  {
    id: "schol-003",
    applicationNumber: "SCH-2026-003",
    studentId: "stu-112",
    studentName: "Vikas Kumar",
    programName: "Merit-cum-Means Grant",
    status: "APPROVED",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    amountRequested: 50000,
  }
];

// ----------------------------------------------------------------------
// MOCK ADAPTER LAYER (BON-11 INTEGRATION BOUNDARY)
// ----------------------------------------------------------------------
// The following AdminAPI object isolates all admin data access from the UI.
// To complete the backend handover:
// 1. Swap these mock methods with actual calls to `RequestEngine` (or API endpoints).
// 2. Remove the MOCK_REQUESTS, MOCK_INCIDENTS, and MOCK_SCHOLARSHIPS arrays.
// 3. Move metric aggregations (KPIs, Analytics) into optimized backend queries.

export const AdminAPI = {
  // Demo Clock
  getDemoClockOffset() {
    return demoClockOffset;
  },
  advanceDemoClock(hours: number) {
    demoClockOffset += hours * 1000 * 60 * 60;
  },
  resetDemoClock() {
    demoClockOffset = 0;
  },

  // Requests
  async listRequests(filters?: { status?: RequestStatus; category?: string; assigneeId?: string; priority?: RequestPriority }): Promise<AdminRequest[]> {
    let results = MOCK_REQUESTS.map(applySLA);
    if (filters) {
      if (filters.status) {
        results = results.filter(r => r.status === filters.status);
      }
      if (filters.category) {
        results = results.filter(r => r.category === filters.category);
      }
      if (filters.assigneeId) {
        results = results.filter(r => r.assignedAuthorityId === filters.assigneeId);
      }
      if (filters.priority) {
        results = results.filter(r => r.priority === filters.priority);
      }
    }

    return results;
  },

  async getRequestDetail(id: string): Promise<AdminRequestDetail | null> {
    const requests = await this.listRequests();
    const req = requests.find(r => r.id === id);
    if (!req) return null;

    if (!MOCK_EVENTS[id]) {
      // Generate initial mock timeline based on status
      const events: AdminRequestEvent[] = [
        {
          id: `evt-${id}-0`,
          action: "SUBMITTED",
          timestamp: req.createdAt,
          actor: { name: req.requesterName, id: req.requesterId }
        }
      ];

      if (req.status !== "PENDING") {
        events.push({
          id: `evt-${id}-1`,
          action: "ASSIGNED",
          timestamp: new Date(new Date(req.createdAt).getTime() + 1000 * 60 * 10).toISOString(),
          actor: { name: "System Auto-Assign", id: "sys-001" },
          metadata: { assignedTo: req.assignedAuthorityName }
        });
      }

      if (["ACKNOWLEDGED", "PROCESSING", "RESOLVED", "VERIFIED", "CLOSED"].includes(req.status)) {
        events.push({
          id: `evt-${id}-2`,
          action: "STATUS_CHANGED",
          timestamp: new Date(new Date(req.createdAt).getTime() + 1000 * 60 * 30).toISOString(),
          actor: { name: req.assignedAuthorityName || "System", id: req.assignedAuthorityId || "sys-001" },
          metadata: { newStatus: "ACKNOWLEDGED" }
        });
      }

      MOCK_EVENTS[id] = events;
    }

    return {
      ...req,
      events: [...MOCK_EVENTS[id]].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  },

  async assignRequest(id: string, assigneeId: string, department: string): Promise<boolean> {
    const reqIndex = MOCK_REQUESTS.findIndex(r => r.id === id);
    if (reqIndex === -1) return false;

    // Determine staff name (mocking a DB lookup)
    const staffNames: Record<string, string> = {
      "stf-201": "Ramesh Electrician",
      "wrd-001": "Warden Sharma",
      "stf-301": "Plumber Singh",
      "stf-401": "Network Admin",
    };
    const staffName = staffNames[assigneeId] || "Assigned Staff";

    const simulatedNow = new Date(Date.now() + demoClockOffset).toISOString();

    const updatedReq = { 
      ...MOCK_REQUESTS[reqIndex], 
      assignedAuthorityId: assigneeId,
      assignedAuthorityName: staffName,
      assignedDepartment: department,
      status: "ASSIGNED" as RequestStatus,
      updatedAt: simulatedNow
    };
    
    MOCK_REQUESTS[reqIndex] = updatedReq;

    // Append to timeline
    if (MOCK_EVENTS[id]) {
      MOCK_EVENTS[id].push({
        id: `evt-${id}-${Date.now()}`,
        action: "ASSIGNED",
        timestamp: simulatedNow,
        actor: { name: "Current Admin", id: "adm-001" }, // Mock actor
        metadata: { assignedTo: staffName }
      });
    }

    return true;
  },

  async updateRequestStatus(id: string, status: RequestStatus, notes?: string): Promise<boolean> {
    const reqIndex = MOCK_REQUESTS.findIndex(r => r.id === id);
    if (reqIndex === -1) return false;

    const currentReq = MOCK_REQUESTS[reqIndex];
    
    // Simulate valid transitions check
    const validTransitions: Record<RequestStatus, RequestStatus[]> = {
      PENDING: ['ASSIGNED', 'REJECTED', 'CLOSED', 'APPROVED'],
      ASSIGNED: ['ACKNOWLEDGED', 'REJECTED'],
      ACKNOWLEDGED: ['PROCESSING', 'RESOLVED'],
      PROCESSING: ['RESOLVED', 'ASSIGNED'],
      RESOLVED: ['VERIFIED', 'PROCESSING'],
      VERIFIED: ['CLOSED'],
      APPROVED: ['CLOSED'],
      CLOSED: [],
      REJECTED: [],
    };

    const allowed = validTransitions[currentReq.status] || [];
    if (!allowed.includes(status) && currentReq.status !== status) {
       console.error(`Invalid transition from ${currentReq.status} to ${status}`);
       return false;
    }

    const simulatedNow = new Date(Date.now() + demoClockOffset).toISOString();

    const updatedReq = { 
      ...currentReq, 
      status,
      updatedAt: simulatedNow
    };
    
    MOCK_REQUESTS[reqIndex] = updatedReq;

    // Append to timeline
    if (MOCK_EVENTS[id]) {
      MOCK_EVENTS[id].push({
        id: `evt-${id}-${Date.now()}`,
        action: status,
        timestamp: simulatedNow,
        actor: { name: "Current Admin", id: "adm-001" }, // Mock actor
        metadata: notes ? { resolutionNotes: notes } : undefined
      });
    }

    return true;
  },

  // Incidents
  async listIncidents(): Promise<AdminIncident[]> {
    return MOCK_INCIDENTS;
  },

  async getIncident(id: string): Promise<AdminIncident | null> {
    const inc = MOCK_INCIDENTS.find(i => i.id === id);
    return inc || null;
  },

  async groupRequestsIntoIncident(incidentId: string | null, title: string, requestIds: string[]): Promise<string | null> {
    const simulatedNow = new Date(Date.now() + demoClockOffset).toISOString();
    let targetIncidentId: string | null = incidentId;
    
    // Check if any selected requests already belong to an incident to merge into
    const existingIncidents = MOCK_REQUESTS
      .filter(r => requestIds.includes(r.id) && r.incidentId)
      .map(r => r.incidentId);

    if (existingIncidents.length > 0) {
      targetIncidentId = existingIncidents[0] as string;
      const incIndex = MOCK_INCIDENTS.findIndex(i => i.id === targetIncidentId);
      if (incIndex !== -1) {
        MOCK_INCIDENTS[incIndex].affectedStudentCount += requestIds.length; // rough addition
        MOCK_INCIDENTS[incIndex].updatedAt = simulatedNow;
      }
    } else {
      targetIncidentId = `inc-new-${Date.now()}`;
      const newInc: AdminIncident = {
        id: targetIncidentId,
        incidentNumber: `INC-2026-${MOCK_INCIDENTS.length + 101}`,
        title: title,
        category: "Operational Incident",
        location: "Multiple Locations",
        status: "OPEN",
        affectedStudentCount: requestIds.length,
        createdAt: simulatedNow,
        updatedAt: simulatedNow,
        slaStatus: "ON_TRACK"
      };
      MOCK_INCIDENTS.push(newInc);
    }

    requestIds.forEach(reqId => {
      const reqIndex = MOCK_REQUESTS.findIndex(r => r.id === reqId);
      if (reqIndex !== -1) {
        MOCK_REQUESTS[reqIndex].incidentId = targetIncidentId!;
        MOCK_REQUESTS[reqIndex].updatedAt = simulatedNow;

        if (!MOCK_EVENTS[reqId]) MOCK_EVENTS[reqId] = [];
        MOCK_EVENTS[reqId].push({
          id: `evt-${reqId}-${Date.now()}`,
          action: "GROUPED",
          timestamp: simulatedNow,
          actor: { name: "Current Admin", id: "adm-001" },
          metadata: { incidentId: targetIncidentId, title }
        });
      }
    });

    return targetIncidentId;
  },

  async resolveIncident(incidentId: string, resolutionNotes: string): Promise<boolean> {
    const incIndex = MOCK_INCIDENTS.findIndex(i => i.id === incidentId);
    if (incIndex === -1) return false;

    const simulatedNow = new Date(Date.now() + demoClockOffset).toISOString();

    // Mark incident resolved
    MOCK_INCIDENTS[incIndex].status = "RESOLVED";
    MOCK_INCIDENTS[incIndex].updatedAt = simulatedNow;

    // Cascade resolution to requests
    const affectedReqs = MOCK_REQUESTS.filter(r => r.incidentId === incidentId);
    for (const req of affectedReqs) {
      // Only resolve active requests
      if (["PENDING", "ASSIGNED", "ACKNOWLEDGED", "PROCESSING"].includes(req.status)) {
        await this.updateRequestStatus(req.id, "RESOLVED", resolutionNotes);
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
    
    // An item needs attention if it's active and (BREACHED, WARNING, or unassigned/PENDING > 24h)
    return reqs
      .filter(r => {
        const isFrozen = ["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED", "APPROVED"].includes(r.status);
        if (isFrozen) return false;
        if (r.slaStatus === "BREACHED" || r.slaStatus === "WARNING") return true;
        if (!r.assignedAuthorityId && r.ageingHours > 24) return true;
        return false;
      })
      .sort((a, b) => {
        // Sort order: BREACHED first, then WARNING, then by ageing
        if (a.slaStatus === "BREACHED" && b.slaStatus !== "BREACHED") return -1;
        if (b.slaStatus === "BREACHED" && a.slaStatus !== "BREACHED") return 1;
        if (a.slaStatus === "WARNING" && b.slaStatus !== "WARNING") return -1;
        if (b.slaStatus === "WARNING" && a.slaStatus !== "WARNING") return 1;
        return b.ageingHours - a.ageingHours;
      });
  },

  // Scholarships
  async listScholarshipApplications(): Promise<ScholarshipApplication[]> {
    return MOCK_SCHOLARSHIPS;
  },

  async getScholarshipApplication(id: string): Promise<ScholarshipApplication | null> {
    const app = MOCK_SCHOLARSHIPS.find(a => a.id === id);
    return app || null;
  },

  async getScholarshipStats(academicYear: string, scope?: string): Promise<ScholarshipStats> {
    return {
      academicYear,
      totalEligible: 0, // Mock contract boundary 
      applied: MOCK_SCHOLARSHIPS.length,
      underVerification: MOCK_SCHOLARSHIPS.filter(a => a.status === "UNDER_VERIFICATION").length,
      approved: MOCK_SCHOLARSHIPS.filter(a => a.status === "APPROVED").length,
      disbursed: MOCK_SCHOLARSHIPS.filter(a => a.status === "DISBURSED").length,
    };
  },

  async updateScholarshipStatus(id: string, newStatus: ScholarshipStatus, notes?: string): Promise<boolean> {
    const idx = MOCK_SCHOLARSHIPS.findIndex(a => a.id === id);
    if (idx === -1) return false;

    const simulatedNow = new Date(Date.now() + demoClockOffset).toISOString();
    MOCK_SCHOLARSHIPS[idx].status = newStatus;
    MOCK_SCHOLARSHIPS[idx].updatedAt = simulatedNow;
    if (notes) MOCK_SCHOLARSHIPS[idx].notes = notes;

    return true;
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsSummary> {
    const reqs = await this.listRequests();
    const summary: AnalyticsSummary = {
      totalRequests: reqs.length,
      resolvedRequests: reqs.filter(r => ["RESOLVED", "VERIFIED", "CLOSED", "APPROVED"].includes(r.status)).length,
      byCategory: [],
      byStatus: [],
      byPriority: [],
      bySlaStatus: []
    };

    const catMap: Record<string, number> = {};
    const statMap: Record<string, number> = {};
    const prioMap: Record<string, number> = {};
    const slaMap: Record<string, number> = {};

    for (const r of reqs) {
      catMap[r.category] = (catMap[r.category] || 0) + 1;
      statMap[r.status] = (statMap[r.status] || 0) + 1;
      prioMap[r.priority] = (prioMap[r.priority] || 0) + 1;
      slaMap[r.slaStatus] = (slaMap[r.slaStatus] || 0) + 1;
    }

    summary.byCategory = Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
    summary.byStatus = Object.entries(statMap).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    summary.byPriority = Object.entries(prioMap).map(([priority, count]) => ({ priority, count })).sort((a, b) => b.count - a.count);
    summary.bySlaStatus = Object.entries(slaMap).map(([slaStatus, count]) => ({ slaStatus, count })).sort((a, b) => b.count - a.count);

    return summary;
  },

  async getRecurringIssues(): Promise<RecurringIssue[]> {
    const reqs = await this.listRequests();
    
    // Group requests by a deterministic pattern: "Category | Location"
    const groups: Record<string, AdminRequest[]> = {};
    
    for (const r of reqs) {
      // Exclude requests with no location
      if (!r.location) continue;
      
      const patternKey = `${r.category}|${r.location}`;
      if (!groups[patternKey]) groups[patternKey] = [];
      groups[patternKey].push(r);
    }

    const issues: RecurringIssue[] = [];
    
    // RECURRENCE THRESHOLD: 
    // Set to 2 for this demo environment due to the small underlying dataset.
    // In a production environment, this might be >= 3 within a 30-day window.
    const RECURRENCE_THRESHOLD = 2;

    let index = 1;
    for (const [key, groupReqs] of Object.entries(groups)) {
      if (groupReqs.length >= RECURRENCE_THRESHOLD) {
        // Sort chronologically to find first and last seen
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

    // Sort by most occurrences first
    return issues.sort((a, b) => b.occurrences - a.occurrences);
  }
};
