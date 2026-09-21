import { db } from './db';


export type AuditAction = 
  | 'REQUEST_CREATED'
  | 'REQUEST_CLASSIFIED'
  | 'REQUEST_ROUTED'
  | 'REQUEST_ASSIGNED'
  | 'REQUEST_ACKNOWLEDGED'
  | 'REQUEST_PROCESSED'
  | 'REQUEST_RESOLVED'
  | 'REQUEST_VERIFIED'
  | 'REQUEST_CLOSED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_CANCELLED'
  | 'REQUEST_REOPENED'
  | 'REQUEST_ESCALATED'
  | 'REQUEST_AUTO_APPROVED'
  | 'INCIDENT_CREATED'
  | 'REQUEST_ATTACHED_TO_INCIDENT'
  | 'INCIDENT_RESOLVED';

interface LogOptions {
  actorId?: string;
  action: AuditAction;
  entity: 'REQUEST' | 'INCIDENT';
  entityId: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(options: LogOptions) {
  return db.auditLog.create({
    data: {
      actorId: options.actorId,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      requestId: options.requestId,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
    }
  });
}
