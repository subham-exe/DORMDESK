import { prisma } from '../db/prisma';
import { CreateRequestPayload, TransitionRequestPayload, AssignRequestPayload, RequestStatus } from '../types/request';

const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ['ASSIGNED', 'REJECTED', 'CLOSED', 'APPROVED'],
  ASSIGNED: ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['PROCESSING', 'RESOLVED'],
  PROCESSING: ['RESOLVED', 'ASSIGNED'], // Can be reassigned
  RESOLVED: ['VERIFIED', 'PROCESSING'], // Verification fail -> back to processing
  VERIFIED: ['CLOSED'],
  APPROVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
};

// Hook placeholders for Snigdhaa's Platform Services
async function triggerNotification(requestId: string, event: string) {
  // TODO: Integrate with Snigdhaa's Notification service
  console.log(`[Notification] Request ${requestId} event: ${event}`);
}

async function logAudit(requestId: string, actorId: string, action: string, metadata?: Record<string, unknown>) {
  // TODO: Integrate with Snigdhaa's Audit service
  console.log(`[Audit] Request ${requestId} action: ${action} by ${actorId}`, metadata || '');
}

export class RequestEngine {
  static async createRequest(payload: CreateRequestPayload) {
    // Zero-Touch auto-approval for short leaves (Differentiator)
    let autoApprove = false;
    if (payload.requestType === 'LEAVE' && (payload.metadata?.leaveDays as number) <= 2) {
      autoApprove = true;
    }

    const ticketNumber = `${payload.requestType.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    const request = await prisma.request.create({
      data: {
        ticketNumber,
        requestType: payload.requestType,
        category: payload.category,
        requesterId: payload.requesterId,
        description: payload.description,
        location: payload.location,
        priority: payload.priority || 'LOW',
        status: autoApprove ? 'APPROVED' : 'PENDING',
        // SLA logic can be injected here based on category
        SLA: payload.requestType === 'COMPLAINT' ? 24 : undefined,
      },
    });

    await logAudit(request.id, payload.requesterId, 'CREATED');
    await triggerNotification(request.id, 'CREATED');
    
    if (autoApprove) {
      await logAudit(request.id, 'SYSTEM', 'AUTO_APPROVED', { reason: 'Leave <= 2 days' });
    }

    return request;
  }

  static async assignRequest(payload: AssignRequestPayload) {
    const request = await prisma.request.findUnique({ where: { id: payload.requestId } });
    if (!request) throw new Error('Request not found');

    const updated = await prisma.request.update({
      where: { id: payload.requestId },
      data: {
        assignedAuthorityId: payload.assigneeId,
        assignedDepartment: payload.department,
        status: 'ASSIGNED',
      },
    });

    await logAudit(updated.id, payload.actorId, 'ASSIGNED', { assigneeId: payload.assigneeId });
    await triggerNotification(updated.id, 'ASSIGNED');

    return updated;
  }

  static async transitionStatus(payload: TransitionRequestPayload) {
    const request = await prisma.request.findUnique({ where: { id: payload.requestId } });
    if (!request) throw new Error('Request not found');

    const validNext = VALID_TRANSITIONS[request.status as RequestStatus] || [];
    if (!validNext.includes(payload.newStatus) && request.status !== payload.newStatus) {
      throw new Error(`Invalid transition from ${request.status} to ${payload.newStatus}`);
    }

    const updated = await prisma.request.update({
      where: { id: payload.requestId },
      data: {
        status: payload.newStatus,
        ...(payload.newStatus === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
      },
    });

    await logAudit(updated.id, payload.actorId, 'STATUS_CHANGED', { newStatus: payload.newStatus, notes: payload.notes });
    await triggerNotification(updated.id, `STATUS_CHANGED_${payload.newStatus}`);

    return updated;
  }

  static async clusterIntoIncident(requestIds: string[], title: string, description: string, category: string, location: string, department: string) {
    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        category,
        location,
        assignedDepartment: department,
        status: 'OPEN',
      },
    });

    await prisma.request.updateMany({
      where: { id: { in: requestIds } },
      data: { incidentId: incident.id },
    });

    return incident;
  }
}
