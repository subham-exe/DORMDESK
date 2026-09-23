import { prisma } from '@/lib/db/prisma';

export interface CreateNotificationPayload {
  recipientId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
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

    return await prisma.notification.create({
      data: {
        recipientId: payload.recipientId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        metadata: safeMetadata,
      },
    });
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
}
