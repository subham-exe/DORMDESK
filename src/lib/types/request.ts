export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RequestStatus = 'PENDING' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'PROCESSING' | 'RESOLVED' | 'VERIFIED' | 'CLOSED' | 'REJECTED' | 'APPROVED' | 'CANCELLED';
export type RequestType = 'COMPLAINT' | 'LEAVE' | 'CERTIFICATE' | 'OTHER';

export interface CreateRequestPayload {
  requestType: RequestType;
  category: string;
  requesterId: string;
  description: string;
  location?: string;
  priority?: RequestPriority;
  metadata?: Record<string, unknown>;
}

export interface TransitionRequestPayload {
  requestId: string;
  newStatus: RequestStatus;
  actorId: string;
  notes?: string;
}

export interface AssignRequestPayload {
  requestId: string;
  assigneeId: string;
  department: string;
  actorId: string;
}
