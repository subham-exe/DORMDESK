export type RequestDomain = 'maintenance' | 'leave_pass' | 'certificates' | 'campus_ops';

export type RequestStatus = 
  | 'CREATED'
  | 'CLASSIFIED'
  | 'ROUTED'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'PROCESSING'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'ESCALATED'
  | 'CANCELLED';

export interface TimelineEvent {
  id: string;
  action: string;
  stage: string;
  humanStatus: string;
  timestamp: string;
  actor: string;
  actorRole?: string;
  description: string;
  notes?: string;
  badgeType?: 'default' | 'info' | 'success' | 'warning' | 'error';
}

export interface TechnicianInfo {
  name: string;
  id: string;
  role: string;
  department: string;
  rating: number;
  jobsCompleted: number;
  avatarUrl?: string;
}

export interface IncidentContext {
  id: string;
  title: string;
  status: string;
  linkedRequestsCount: number;
  description: string;
  investigatingTeam: string;
}

export interface TicketPhoto {
  id: string;
  title: string;
  timestamp: string;
  url: string;
  type: 'initial' | 'resolved' | 'inspection';
}

export interface CampusTicket {
  id: string; // e.g. "REQ-1043"
  domain: RequestDomain;
  category: string;
  title: string;
  description: string;
  status: RequestStatus;
  humanStatus: string;
  location: string;
  hostelBlock: string;
  room: string;
  createdAt: string;
  updatedAt: string;
  slaTargetHours: number;
  slaRemainingText: string;
  slaStatus: 'normal' | 'approaching' | 'breached' | 'met';
  priority: 'normal' | 'urgent';
  assignedTo?: TechnicianInfo;
  resolutionNotes?: string;
  resolvedAt?: string;
  reopenNotes?: string;
  verifiedAt?: string;
  incident?: IncidentContext;
  photos?: TicketPhoto[];
  autoCloseHoursRemaining?: number;
  assetAffected?: string;
  timeline: TimelineEvent[];
}

export interface CampusNotice {
  id: string;
  title: string;
  category: 'General' | 'Hostel' | 'Academic' | 'Maintenance' | 'Emergency';
  priority: 'High' | 'Normal' | 'Advisory';
  date: string;
  window?: string;
  summary: string;
  content: string;
  issuer: string;
  read: boolean;
  actionRequired?: boolean;
}

export interface StudentProfile {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  department: string;
  degree: string;
  year: string;
  institution: string;
  hostelBlock: string;
  wing: string;
  room: string;
  bed: string;
  occupancyId: string;
  wingSteward: string;
  wingStewardPhone: string;
  wardenName: string;
  wardenExt: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}
