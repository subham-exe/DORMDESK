import { prisma } from '@/lib/db/prisma';
import { AuditService } from './audit';

export class SmsService {
  /**
   * Queue a simulated SMS message.
   */
  static async simulateSendSms(
    data: {
      recipientId?: string;
      phoneNumber: string;
      message: string;
      type: string;
      referenceId?: string;
    },
    actorId: string
  ) {
    if (!data.message || data.message.length > 160) {
      throw new Error("Message must be between 1 and 160 characters");
    }
    if (!data.phoneNumber) {
      throw new Error("Phone number is required");
    }

    const outbox = await prisma.smsOutbox.create({
      data: {
        recipientId: data.recipientId,
        phoneNumber: data.phoneNumber,
        message: data.message,
        type: data.type,
        referenceId: data.referenceId,
        status: "SIMULATED_SENT",
        sentAt: new Date(),
      }
    });

    await AuditService.log({
      actorId,
      action: "SIMULATE_SMS",
      domain: "SmsOutbox",
      targetId: outbox.id,
      metadata: {
        type: data.type,
        phoneNumber: data.phoneNumber
      }
    });

    return outbox;
  }

  /**
   * List recent SMS outbox entries.
   */
  static async listSmsOutbox(limit = 10) {
    return prisma.smsOutbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        recipient: {
          select: { name: true, room: true, hostel: true }
        }
      }
    });
  }
}
