import { prisma } from '../db/prisma';
import { CreateRequestPayload, TransitionRequestPayload, AssignRequestPayload, RequestStatus } from '../types/request';
import { AuditService } from './audit';
import { NotificationService } from './notification';

const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ['ASSIGNED', 'REJECTED', 'CLOSED', 'APPROVED', 'CANCELLED', 'RESOLVED'],
  ASSIGNED: ['ACKNOWLEDGED', 'REJECTED', 'CANCELLED'],
  ACKNOWLEDGED: ['PROCESSING', 'RESOLVED', 'CANCELLED', 'REJECTED'],
  PROCESSING: ['RESOLVED', 'ASSIGNED', 'CANCELLED', 'REJECTED'],
  RESOLVED: ['VERIFIED', 'PROCESSING'],
  VERIFIED: ['CLOSED'],
  APPROVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
};

async function triggerNotification(requestId: string, event: string) {
  const req = await prisma.request.findUnique({ where: { id: requestId }});
  if (!req) return;
  await NotificationService.create({
    recipientId: req.requesterId,
    title: 'Request Update',
    message: `Your request status changed: ${event}`,
    type: 'UPDATE',
    metadata: { requestId }
  });
}

async function logAudit(requestId: string, actorId: string, action: string, metadata?: Record<string, unknown>) {
  try {
    await AuditService.log({
      actorId,
      action,
      domain: 'Request',
      targetId: requestId,
      metadata
    });
  } catch (e) {
    console.error('Failed to save audit log', e);
  }
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
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        // SLA logic can be injected here based on category
        SLA: payload.requestType === 'COMPLAINT' ? 24 : undefined,
      },
    });

    await logAudit(request.id, payload.requesterId, 'CREATED');
    await triggerNotification(request.id, 'CREATED');
    
    if (autoApprove) {
      await logAudit(request.id, payload.requesterId, 'AUTO_APPROVED', { reason: 'Leave <= 2 days' });
    }

    return request;
  }

  static async assignRequest(payload: AssignRequestPayload) {
    const request = await prisma.request.findUnique({ where: { id: payload.requestId } });
    if (!request) throw new Error('Request not found');

    const validNext = VALID_TRANSITIONS[request.status as RequestStatus] || [];
    if (!validNext.includes('ASSIGNED') && request.status !== 'ASSIGNED') {
      throw new Error(`Invalid transition from ${request.status} to ASSIGNED`);
    }

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

  static async transitionStatus(payload: TransitionRequestPayload): Promise<unknown> {
    const request = await prisma.request.findUnique({ where: { id: payload.requestId } });
    if (!request) throw new Error('Request not found');

    const validNext = VALID_TRANSITIONS[request.status as RequestStatus] || [];
    if (!validNext.includes(payload.newStatus) && request.status !== payload.newStatus) {
      throw new Error(`Invalid transition from ${request.status} to ${payload.newStatus}`);
    }

    if (payload.newStatus === 'REJECTED') {
      const actor = await prisma.user.findUnique({ where: { id: payload.actorId } });
      if (actor?.role === 'Student') {
        throw new Error('Students cannot reject requests');
      }
    }

    const isTerminal = ['RESOLVED', 'APPROVED', 'CANCELLED', 'REJECTED', 'CLOSED'].includes(payload.newStatus);
    const isWIP = ['PROCESSING', 'ASSIGNED', 'ACKNOWLEDGED'].includes(payload.newStatus);

    const updated = await prisma.request.update({
      where: { id: payload.requestId },
      data: {
        status: payload.newStatus,
        resolvedAt: isTerminal ? new Date() : (isWIP ? null : undefined),
        updatedAt: new Date(),
      },
    });

    await logAudit(updated.id, payload.actorId, 'STATUS_CHANGED', { newStatus: payload.newStatus, notes: payload.notes });
    await triggerNotification(updated.id, `STATUS_CHANGED_${payload.newStatus}`);

    // Auto-transition VERIFIED to CLOSED
    if (payload.newStatus === 'VERIFIED') {
      return await RequestEngine.transitionStatus({
        requestId: payload.requestId,
        newStatus: 'CLOSED',
        actorId: payload.actorId,
        notes: 'System: Auto-closed after verification'
      });
    }

    return updated;
  }

  static async clusterIntoIncident(requestIds: string[], title: string, description: string, category: string, location: string, department: string, actorId: string) {
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

    for (const id of requestIds) {
      const request = await prisma.request.findUnique({ where: { id } });
      if (!request) continue;
      
      // Basic state validation: don't cluster terminal requests
      if (['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED', 'CANCELLED'].includes(request.status)) {
        continue;
      }

      await prisma.request.update({
        where: { id },
        data: { incidentId: incident.id, updatedAt: new Date() },
      });

      await logAudit(id, actorId, 'ATTACHED_TO_INCIDENT', { incidentId: incident.id });
      await triggerNotification(id, 'ATTACHED_TO_INCIDENT');
    }

    return incident;
  }

  static async attachToIncident(incidentId: string, requestIds: string[], actorId: string) {
    for (const id of requestIds) {
      const request = await prisma.request.findUnique({ where: { id } });
      if (!request) continue;

      if (['RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED', 'APPROVED', 'CANCELLED'].includes(request.status)) {
        continue;
      }

      await prisma.request.update({
        where: { id },
        data: { incidentId, updatedAt: new Date() },
      });

      await logAudit(id, actorId, 'ATTACHED_TO_INCIDENT', { incidentId });
      await triggerNotification(id, 'ATTACHED_TO_INCIDENT');
    }
  }
}
