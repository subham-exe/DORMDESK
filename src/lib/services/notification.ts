import { prisma } from '@/lib/db/prisma';
import { EmailService } from './email/email-service';
import { ConsentLedgerService } from './consent-ledger';

export enum NotificationType {
  REQUEST_ASSIGNED = 'REQUEST_ASSIGNED',
  REQUEST_ACKNOWLEDGED = 'REQUEST_ACKNOWLEDGED',
  REQUEST_RESOLVED = 'REQUEST_RESOLVED',
  REQUEST_VERIFIED = 'REQUEST_VERIFIED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  REQUEST_REOPENED = 'REQUEST_REOPENED',
  SLA_WARNING = 'SLA_WARNING',
  SLA_BREACH = 'SLA_BREACH',
  ESCALATION = 'ESCALATION',
  INCIDENT_HIGH_IMPACT = 'INCIDENT_HIGH_IMPACT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export interface CreateNotificationPayload {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {

  static async _trySendEmail(recipientId: string, type: string, subject: string, message: string, requestId?: string) {
    try {
console.log('Sending email for', recipientId, type);
      const user = await prisma.user.findUnique({ where: { id: recipientId }});
      console.log('User:', user?.id, 'emailVerified:', user?.emailVerified); if (!user || !user.emailVerified) return;
      
      const purpose = type === NotificationType.ANNOUNCEMENT ? 'EMAIL_CAMPUS_ANNOUNCEMENTS' : 
                      (type.startsWith('SLA_') || type === 'ESCALATION' ? 'EMAIL_SLA_NOTIFICATIONS' : 'EMAIL_REQUEST_NOTIFICATIONS');
      
      const hasConsent = await ConsentLedgerService.hasCurrentConsent(recipientId, purpose);
      console.log('Has consent:', hasConsent); if (!hasConsent) return;
      
      await EmailService.sendEmail({
        to: user.email,
        recipientId,
        purpose,
        subject: `[DORMDESK] ${subject}`,
        text: message,
        idempotencyKey: requestId ? `${type}_${requestId}` : undefined
      });
    } catch (e) {
      console.error('Failed to send operational email', e);
    }
  }

  /**
   * Sanitizes metadata to remove sensitive credentials.
   */
  private static sanitizeMetadata(metadata?: Record<string, unknown>): string | null {
    if (!metadata) return null;

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'secret', 'token', 'jwt', 'cookie', 'hash', 'credential'];

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (!sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          sanitized[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = JSON.parse(JSON.stringify(value));
        }
      }
    }

    return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized) : null;
  }

  static async create(payload: CreateNotificationPayload) {
    if (!payload.recipientId || !payload.title || !payload.message || !payload.type) {
      throw new Error('Notification creation failed: Missing required fields');
    }

    const safeMetadata = this.sanitizeMetadata(payload.metadata);
    const requestId = payload.metadata?.requestId as string | undefined;

    const notif = await prisma.notification.create({
      data: {
        recipientId: payload.recipientId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        metadata: safeMetadata,
        requestId: requestId || null,
      },
    });
    
    await this._trySendEmail(payload.recipientId, payload.type, payload.title, payload.message, requestId);
    return notif;
  }

  static async list(recipientId: string) {
    if (!recipientId) throw new Error('recipientId is required');

    return await prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async markRead(notificationId: string, recipientId: string) {
    if (!notificationId || !recipientId) throw new Error('Missing parameters');

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('NOT_FOUND');
    }

    if (notification.recipientId !== recipientId) {
      throw new Error('FORBIDDEN');
    }

    if (notification.readAt) {
      return notification; // Idempotent
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  static async notifyRequestLifecycleEvent(request: import('@prisma/client').Request, eventType: NotificationType, assigneeId?: string) {
    if (eventType === NotificationType.REQUEST_ASSIGNED) {
      // Notify requester
      await this.create({
        recipientId: request.requesterId,
        title: 'Request Assigned',
        message: `Your request ${request.ticketNumber} has been assigned.`,
        type: eventType,
        metadata: { requestId: request.id }
      });
      // Notify staff
      if (assigneeId) {
        await this.create({
          recipientId: assigneeId,
          title: 'Request Assigned to You',
          message: `Request ${request.ticketNumber} has been assigned to you.`,
          type: eventType,
          metadata: { requestId: request.id }
        });
      }
    } else if (eventType === NotificationType.REQUEST_RESOLVED) {
      await this.create({
        recipientId: request.requesterId,
        title: 'Request Resolved',
        message: `Your request ${request.ticketNumber} has been resolved and is ready for verification.`,
        type: eventType,
        metadata: { requestId: request.id }
      });
    } else if (eventType === NotificationType.REQUEST_REJECTED) {
      await this.create({
        recipientId: request.requesterId,
        title: 'Request Rejected',
        message: `Your request ${request.ticketNumber} has been rejected.`,
        type: eventType,
        metadata: { requestId: request.id }
      });
    } else if (eventType === NotificationType.REQUEST_VERIFIED) {
      await this.create({
        recipientId: request.requesterId,
        title: 'Request Verified',
        message: `Your request ${request.ticketNumber} has been successfully verified.`,
        type: eventType,
        metadata: { requestId: request.id }
      });
    } else if (eventType === NotificationType.REQUEST_ACKNOWLEDGED) {
      await this.create({
        recipientId: request.requesterId,
        title: 'Request Acknowledged',
        message: `Your request ${request.ticketNumber} has been acknowledged.`,
        type: eventType,
        metadata: { requestId: request.id }
      });
    } else if (eventType === NotificationType.REQUEST_REOPENED) {
      await this.create({
        recipientId: request.requesterId,
        title: 'Request Reopened',
        message: `Your request ${request.ticketNumber} has been reopened.`,
        type: eventType,
        metadata: { requestId: request.id }
      });
    }
  }
}
