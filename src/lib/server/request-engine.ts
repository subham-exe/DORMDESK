import { db } from './db';
import { logAudit, AuditAction } from './audit';
import { hasAuthority, ActionType } from './auth';
import { calculateDueDate } from './sla';
import { User } from '@prisma/client';

// Generate a deterministic ticket number format
function generateTicketNumber(type: string): string {
  const prefix = type.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  'CREATE': ['CLASSIFY', 'CANCEL', 'REJECT', 'AUTO_APPROVE'],
  'CLASSIFY': ['ROUTE', 'CANCEL', 'REJECT', 'AUTO_APPROVE'],
  'ROUTE': ['ASSIGN', 'REJECT'],
  'ASSIGN': ['ACKNOWLEDGE', 'REJECT', 'ESCALATE'],
  'ACKNOWLEDGE': ['PROCESS', 'ESCALATE'],
  'PROCESS': ['RESOLVE', 'ESCALATE'],
  'RESOLVE': ['VERIFY', 'REOPEN'],
  'VERIFY': ['CLOSE', 'REOPEN'],
  'CLOSE': [],
  'REJECT': [],
  'CANCEL': [],
  'ESCALATE': ['ASSIGN'], // Re-assign after escalation
  'AUTO_APPROVE': ['CLOSE']
};

export class RequestEngine {
  
  static async createRequest(actor: User, data: { requestType: string; category: string; description: string; location?: string; priority?: string; slaDurationHours?: number }) {
    if (!hasAuthority(actor, 'CREATE_REQUEST')) throw new Error("Unauthorized");

    const ticketNumber = generateTicketNumber(data.requestType);
    const createdAt = new Date();
    const dueAt = calculateDueDate(createdAt, data.slaDurationHours || null);

    const req = await db.request.create({
      data: {
        ticketNumber,
        requestType: data.requestType,
        category: data.category,
        description: data.description,
        location: data.location,
        priority: data.priority || 'MEDIUM',
        status: 'CREATE',
        requesterId: actor.id,
        slaDurationHours: data.slaDurationHours,
        dueAt,
        createdAt
      }
    });

    await logAudit({
      actorId: actor.id,
      action: 'REQUEST_CREATED',
      entity: 'REQUEST',
      entityId: req.id,
      requestId: req.id,
      metadata: { ticketNumber }
    });

    return req;
  }

  private static validateTransition(currentStatus: string, nextStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid state transition from ${currentStatus} to ${nextStatus}`);
    }
  }

  static async transitionStatus(actor: User, requestId: string, nextStatus: string, authAction: ActionType, auditAction: AuditAction, extraData: Record<string, unknown> = {}) {
    const req = await db.request.findUnique({ where: { id: requestId }, include: { requester: true } });
    if (!req) throw new Error("Request not found");

    this.validateTransition(req.status, nextStatus);

    if (!hasAuthority(actor, authAction, { 
      requesterId: req.requesterId, 
      domain: req.assignedDepartment || undefined,
      assignedAuthorityId: req.assignedAuthorityId || undefined 
    })) {
      throw new Error(`Unauthorized to perform ${nextStatus}`);
    }

    const updated = await db.request.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        ...extraData
      }
    });

    await logAudit({
      actorId: actor.id,
      action: auditAction,
      entity: 'REQUEST',
      entityId: req.id,
      requestId: req.id,
      metadata: { from: req.status, to: nextStatus, ...extraData }
    });

    return updated;
  }

  static async classifyRequest(actor: User, requestId: string, category: string) {
    return this.transitionStatus(actor, requestId, 'CLASSIFY', 'ASSIGN_REQUEST', 'REQUEST_CLASSIFIED', { category });
  }

  static async routeRequest(actor: User, requestId: string, department: string) {
    return this.transitionStatus(actor, requestId, 'ROUTE', 'ASSIGN_REQUEST', 'REQUEST_ROUTED', { assignedDepartment: department });
  }

  static async assignRequest(actor: User, requestId: string, assignedAuthorityId: string) {
    return this.transitionStatus(actor, requestId, 'ASSIGN', 'ASSIGN_REQUEST', 'REQUEST_ASSIGNED', { assignedAuthorityId });
  }

  static async acknowledgeRequest(actor: User, requestId: string) {
    return this.transitionStatus(actor, requestId, 'ACKNOWLEDGE', 'PROCESS_REQUEST', 'REQUEST_ACKNOWLEDGED');
  }

  static async processRequest(actor: User, requestId: string) {
    return this.transitionStatus(actor, requestId, 'PROCESS', 'PROCESS_REQUEST', 'REQUEST_PROCESSED');
  }

  static async resolveRequest(actor: User, requestId: string, resolutionNotes: string) {
    return this.transitionStatus(actor, requestId, 'RESOLVE', 'RESOLVE_REQUEST', 'REQUEST_RESOLVED', { resolutionNotes, resolvedAt: new Date() });
  }

  static async verifyRequest(actor: User, requestId: string) {
    return this.transitionStatus(actor, requestId, 'VERIFY', 'VERIFY_REQUEST', 'REQUEST_VERIFIED');
  }

  static async closeRequest(actor: User, requestId: string) {
    return this.transitionStatus(actor, requestId, 'CLOSE', 'CLOSE_REQUEST', 'REQUEST_CLOSED');
  }

  static async rejectRequest(actor: User, requestId: string, reason: string) {
    return this.transitionStatus(actor, requestId, 'REJECT', 'REJECT_REQUEST', 'REQUEST_REJECTED', { resolutionNotes: reason });
  }

  static async cancelRequest(actor: User, requestId: string) {
    return this.transitionStatus(actor, requestId, 'CANCEL', 'CANCEL_REQUEST', 'REQUEST_CANCELLED');
  }

  static async reopenRequest(actor: User, requestId: string, reason: string) {
    return this.transitionStatus(actor, requestId, 'REOPEN', 'VERIFY_REQUEST', 'REQUEST_REOPENED', { resolutionNotes: reason, resolvedAt: null });
  }

  static async escalateRequest(actor: User, requestId: string) {
    return this.transitionStatus(actor, requestId, 'ESCALATE', 'ESCALATE_REQUEST', 'REQUEST_ESCALATED', { priority: 'HIGH' });
  }

  static async autoApproveRequest(actor: User, requestId: string) {
    // Usually done by system (ADMIN role)
    return this.transitionStatus(actor, requestId, 'AUTO_APPROVE', 'CLOSE_REQUEST', 'REQUEST_AUTO_APPROVED', { resolvedAt: new Date(), resolutionNotes: "Auto-approved by policy" });
  }
}
