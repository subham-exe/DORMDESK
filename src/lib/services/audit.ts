import { prisma } from '@/lib/db/prisma';
import { Domain } from '@/lib/auth/policies';

export interface AuditEvent {
  actorId?: string | null;
  actorName?: string;
  action: string;
  domain: Domain | string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export interface AuditQueryFilter {
  actorId?: string;
  action?: string;
  domain?: Domain | string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AuditService {
  /**
   * Sanitizes metadata to remove sensitive credentials.
   * Only allows safe operational fields.
   */
  private static sanitizeMetadata(metadata?: Record<string, unknown>): string | null {
    if (!metadata) return null;

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'secret', 'token', 'jwt', 'cookie', 'hash', 'credential'];

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (!sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        // Only include if it's a primitive or a simple object, avoid deep complex objects
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          sanitized[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = JSON.parse(JSON.stringify(value)); // safe clone, will strip functions/symbols
        }
      }
    }

    return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized) : null;
  }

  /**
   * Appends an immutable audit event to the ledger.
   */
  static async log(event: AuditEvent) {
    if (event.actorId === undefined || !event.action || !event.domain || !event.targetId) {
      throw new Error('AuditLog validation failed: Missing required fields');
    }

    const safeMetadata = this.sanitizeMetadata(event.metadata);

    let actorName: string | null = event.actorName || null;
    let actorEmail: string | null = null;
    if (event.actorId) {
      const actor = await prisma.user.findUnique({ where: { id: event.actorId } });
      if (actor) {
        actorName = actor.name;
        actorEmail = actor.email;
      }
    }

    return await prisma.auditLog.create({
      data: {
        actorId: event.actorId,
        action: event.action,
        entity: event.domain,
        entityId: event.targetId,
        metadata: safeMetadata,
        actorName,
        actorEmail,
      },
    });
  }

  /**
   * Retrieves read-only audit history based on contract-backed filters.
   */
  static async getHistory(filter: AuditQueryFilter) {
    return await prisma.auditLog.findMany({
      where: {
        ...(filter.actorId && { actorId: filter.actorId }),
        ...(filter.action && { action: filter.action }),
        ...(filter.domain && { entity: filter.domain }),
        ...(filter.targetId && { entityId: filter.targetId }),
        ...( (filter.startDate || filter.endDate) && {
          timestamp: {
            ...(filter.startDate && { gte: filter.startDate }),
            ...(filter.endDate && { lte: filter.endDate }),
          }
        }),
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  // Strictly NO update() or delete() methods are exposed to enforce immutability.
}

