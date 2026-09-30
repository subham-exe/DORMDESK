import { prisma } from '../db/prisma';
import { CreateRequestPayload, TransitionRequestPayload, AssignRequestPayload, RequestStatus } from '../types/request';
import { AuditService } from './audit';
import { NotificationService, NotificationType } from './notification';
import { PolicyService } from './policy';
import { RoutingEngine } from './routing-engine';

const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ['ASSIGNED', 'RESOLVED', 'CANCELLED', 'REJECTED', 'APPROVED'],
  ASSIGNED: ['ACKNOWLEDGED', 'CANCELLED', 'REJECTED', 'RESOLVED'],
  ACKNOWLEDGED: ['PROCESSING', 'RESOLVED', 'CANCELLED', 'REJECTED'],
  PROCESSING: ['RESOLVED', 'CANCELLED', 'REJECTED', 'ASSIGNED'],
  RESOLVED: ['VERIFIED', 'PROCESSING'],
  VERIFIED: ['CLOSED'],
  APPROVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
};

async function triggerNotification(requestId: string, event: string, assigneeId?: string) {
  const req = await prisma.request.findUnique({ where: { id: requestId }});
  if (!req) return;
  
  if (event === 'ASSIGNED') {
    await NotificationService.notifyRequestLifecycleEvent(req, NotificationType.REQUEST_ASSIGNED, assigneeId);
  } else if (event === 'STATUS_CHANGED_RESOLVED') {
    await NotificationService.notifyRequestLifecycleEvent(req, NotificationType.REQUEST_RESOLVED);
  } else if (event === 'STATUS_CHANGED_REJECTED') {
    await NotificationService.notifyRequestLifecycleEvent(req, NotificationType.REQUEST_REJECTED);
  } else if (event === 'STATUS_CHANGED_VERIFIED') {
    await NotificationService.notifyRequestLifecycleEvent(req, NotificationType.REQUEST_VERIFIED);
  } else if (event === 'STATUS_CHANGED_ACKNOWLEDGED') {
    await NotificationService.notifyRequestLifecycleEvent(req, NotificationType.REQUEST_ACKNOWLEDGED);
  } else if (event === 'STATUS_CHANGED_PROCESSING' || event === 'STATUS_CHANGED_PENDING') {
    await NotificationService.notifyRequestLifecycleEvent(req, NotificationType.REQUEST_REOPENED);
  } else if (event === 'CREATED') {
    // Keep generic update for creation, or don't spam. The prompt says "Do not spam users with redundant notifications. Do not send notifications merely because a page was opened."
    // Let's not send notification on CREATED unless needed. We will skip CREATED.
  } else if (event === 'ATTACHED_TO_INCIDENT') {
    await NotificationService.create({
      recipientId: req.requesterId,
      title: 'Incident Update',
      message: `Your request ${req.ticketNumber} has been linked to a larger incident.`,
      type: NotificationType.INCIDENT_HIGH_IMPACT,
      metadata: { requestId: req.id }
    });
  }
}

async function logAudit(requestId: string, actorId: string | null, action: string, metadata?: Record<string, unknown>) {
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
    if (payload.idempotencyKey) {
      const existing = await prisma.request.findUnique({ where: { idempotencyKey: payload.idempotencyKey } });
      if (existing) return existing;
    }

    // 1. Classification & Routing
    const routeResult = await RoutingEngine.classifyAndRoute({
      requestType: payload.requestType,
      category: payload.category,
      description: payload.description,
      location: payload.location
    });

    // 2. Policy Evaluation
    const policyResult = await PolicyService.resolvePolicyForRequest(
      { requestType: payload.requestType, category: payload.category, domain: routeResult.domain },
      { request: { metadata: payload.metadata ? JSON.stringify(payload.metadata) : null } }
    );

    const autoApprove = policyResult.autoApproveAllowed;

    const ticketNumber = `${payload.requestType.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 90000 + 10000)}`;
    
    // Determine initial status
    let initialStatus = 'PENDING';
    if (autoApprove) {
       initialStatus = 'APPROVED';
    } else if (routeResult.authorityUserId) {
       initialStatus = 'ASSIGNED';
    }

    try {
      const request = await prisma.request.create({
        data: {
          ticketNumber,
          requestType: payload.requestType,
          category: payload.category,
          requesterId: payload.requesterId,
          description: payload.description,
          location: payload.location,
          priority: payload.priority || 'LOW',
          status: initialStatus,
          assignedDepartment: routeResult.department || null,
          assignedAuthorityId: autoApprove ? null : (routeResult.authorityUserId || null),
          metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
          idempotencyKey: payload.idempotencyKey || null,
          SLA: policyResult.slaHours,
          dueAt: policyResult.slaHours ? new Date(Date.now() + policyResult.slaHours * 3600000) : null,
          policyId: policyResult.policyId || null,
          requestSla: policyResult.slaHours ? {
            create: {
              targetHours: policyResult.slaHours,
              dueAt: new Date(Date.now() + policyResult.slaHours * 3600000)
            }
          } : undefined,
          statusHistory: {
            createMany: {
              data: [
                { toStatus: 'PENDING', actorId: payload.requesterId },
                ...(initialStatus !== 'PENDING' ? [{ toStatus: initialStatus, actorId: autoApprove ? null : 'system-router' }] : [])
              ]
            }
          },
          assignmentHistory: (!autoApprove && routeResult.authorityUserId) ? {
            create: {
              assigneeId: routeResult.authorityUserId,
              assignedBy: 'system-router',
              reason: routeResult.reason
            }
          } : undefined
        },
      });

      await logAudit(request.id, payload.requesterId, 'CREATED');
      await triggerNotification(request.id, 'CREATED');

      // Audit Routing
      await logAudit(request.id, null, 'ROUTED', {
         domain: routeResult.domain,
         department: routeResult.department,
         reason: routeResult.reason,
         manualReviewRequired: routeResult.manualReviewRequired
      });

      // Audit Policy
      await logAudit(request.id, null, 'POLICY_EVALUATED', {
         policyId: policyResult.policyId,
         policyName: policyResult.policyName,
         reason: policyResult.explanation
      });
      
      if (autoApprove) {
        await logAudit(request.id, payload.requesterId, 'AUTO_APPROVED', { reason: policyResult.explanation, policyId: policyResult.policyId });
      } else if (routeResult.authorityUserId) {
        await logAudit(request.id, null, 'ASSIGNED', { assigneeId: routeResult.authorityUserId, reason: routeResult.reason });
        await triggerNotification(request.id, 'ASSIGNED', routeResult.authorityUserId);
      }

      return request;
    } catch (error: unknown) {
      if (
        error && 
        typeof error === 'object' && 
        'code' in error && 
        error.code === 'P2002' && 
        payload.idempotencyKey
      ) {
        // Inspect meta target. In SQLite it usually looks like ['idempotencyKey']
        // We do a final read to ensure it's specifically the idempotencyKey constraint that failed.
        const e = error as { meta?: { target?: string[] } };
        const isIdempotencyConflict = Array.isArray(e.meta?.target) && e.meta?.target.includes('idempotencyKey');
        const fallbackExisting = await prisma.request.findUnique({ where: { idempotencyKey: payload.idempotencyKey } });
        
        if (isIdempotencyConflict && fallbackExisting) {
          return fallbackExisting;
        } else if (fallbackExisting) {
          return fallbackExisting; // If target check is flaky, but we DO have it
        }
      }
      throw error;
    }
  }

  static async assignRequest(payload: AssignRequestPayload) {
    const request = await prisma.request.findUnique({ where: { id: payload.requestId } });
    if (!request) throw new Error('Request not found');

    const validNext = VALID_TRANSITIONS[request.status as RequestStatus] || [];
    if (!validNext.includes('ASSIGNED') && request.status !== 'ASSIGNED') {
      throw new Error(`Invalid transition from ${request.status} to ASSIGNED`);
    }

    const actor = await prisma.user.findUnique({ where: { id: payload.actorId } });
    if (actor) {
       const transitionCheck = await PolicyService.validateTransition(
          request,
          'ASSIGNED',
          { id: actor.id, role: actor.role, domain: actor.department || undefined }
       );
       if (!transitionCheck.valid) {
          throw new Error(transitionCheck.explanation);
       }
    }

    const updated = await prisma.request.update({
      where: { id: payload.requestId },
      data: {
        assignedAuthorityId: payload.assigneeId,
        assignedDepartment: payload.department,
        status: 'ASSIGNED',
        assignmentHistory: {
          create: {
            assigneeId: payload.assigneeId,
            assignedBy: payload.actorId
          }
        },
        statusHistory: request.status !== 'ASSIGNED' ? {
          create: {
            fromStatus: request.status,
            toStatus: 'ASSIGNED',
            actorId: payload.actorId
          }
        } : undefined
      },
    });

    await logAudit(updated.id, payload.actorId, 'ASSIGNED', { assigneeId: payload.assigneeId });
    await triggerNotification(updated.id, 'ASSIGNED', payload.assigneeId);

    return updated;
  }

  static async transitionStatus(payload: TransitionRequestPayload): Promise<unknown> {
    const request = await prisma.request.findUnique({ where: { id: payload.requestId } });
    if (!request) throw new Error('Request not found');

    const validNext = VALID_TRANSITIONS[request.status as RequestStatus] || [];
    if (!validNext.includes(payload.newStatus) && request.status !== payload.newStatus) {
      throw new Error(`Invalid transition from ${request.status} to ${payload.newStatus}`);
    }

    const actor = await prisma.user.findUnique({ where: { id: payload.actorId } });
    if (payload.newStatus === 'REJECTED') {
      if (actor?.role === 'Student') {
        throw new Error('Students cannot reject requests');
      }
    }

    if (actor) {
       const transitionCheck = await PolicyService.validateTransition(
          request,
          payload.newStatus,
          { id: actor.id, role: actor.role, domain: actor.department || undefined }
       );
       if (!transitionCheck.valid) {
          throw new Error(transitionCheck.explanation);
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
        statusHistory: request.status !== payload.newStatus ? {
          create: {
            fromStatus: request.status,
            toStatus: payload.newStatus,
            actorId: payload.actorId,
            reason: payload.notes
          }
        } : undefined
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





