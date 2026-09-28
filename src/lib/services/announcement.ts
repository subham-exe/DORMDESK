import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  createdById: string;
  targetBranch?: string | null;
  targetYear?: number | null;
  targetHostel?: string | null;
  targetBlock?: string | null;
  requiresAck?: boolean;
  priority?: string;
}

export class AnnouncementService {
  static async create(payload: CreateAnnouncementPayload) {
    if (!payload.title || !payload.body || !payload.createdById) {
      throw new Error('Announcement creation failed: Missing required fields');
    }

    // 1. Resolve eligible students
    const userWhere: Prisma.UserWhereInput = { role: 'Student' };
    if (payload.targetBranch) userWhere.branch = payload.targetBranch;
    if (payload.targetYear) userWhere.year = payload.targetYear;
    if (payload.targetHostel) userWhere.hostel = payload.targetHostel;
    if (payload.targetBlock) userWhere.block = payload.targetBlock;

    const eligibleStudents = await prisma.user.findMany({
      where: userWhere,
      select: { id: true }
    });

    // 2. Create Announcement, Receipts, and Notifications inside a transaction
    const announcement = await prisma.$transaction(async (tx) => {
      const createdAnnouncement = await tx.announcement.create({
        data: {
          title: payload.title,
          body: payload.body,
          createdById: payload.createdById,
          targetBranch: payload.targetBranch,
          targetYear: payload.targetYear,
          targetHostel: payload.targetHostel,
          targetBlock: payload.targetBlock,
          requiresAck: payload.requiresAck || false,
          priority: payload.priority || 'LOW',
        }
      });

      if (eligibleStudents.length > 0) {
        const now = new Date();
        
        // Prepare Receipts
        const receiptsData = eligibleStudents.map(student => ({
          announcementId: createdAnnouncement.id,
          userId: student.id,
          deliveredAt: now
        }));
        
        await tx.announcementReceipt.createMany({
          data: receiptsData,
        });

        // Prepare Notifications
        const notificationsData = eligibleStudents.map(student => ({
          recipientId: student.id,
          title: 'New Announcement: ' + payload.title,
          message: payload.body.substring(0, 100) + (payload.body.length > 100 ? '...' : ''),
          type: 'SYSTEM_ALERT',
          createdAt: now,
          metadata: JSON.stringify({ announcementId: createdAnnouncement.id })
        }));

        await tx.notification.createMany({
          data: notificationsData,
        });
      }

      // Log the audit event using tx if possible, but AuditService uses global prisma. 
      // We will create the audit log directly in the transaction to maintain atomicity.
      await tx.auditLog.create({
        data: {
          actorId: payload.createdById,
          action: 'CREATE',
          entity: 'ANNOUNCEMENT',
          entityId: createdAnnouncement.id,
          metadata: JSON.stringify({
            recipientsCount: eligibleStudents.length,
            filters: {
              targetBranch: payload.targetBranch,
              targetYear: payload.targetYear,
              targetHostel: payload.targetHostel,
              targetBlock: payload.targetBlock
            }
          })
        }
      });

      return createdAnnouncement;
    });

    return { announcement, recipientsCount: eligibleStudents.length };
  }

  static async markRead(announcementId: string, userId: string) {
    if (!announcementId || !userId) throw new Error('Missing parameters');

    const receipt = await prisma.announcementReceipt.findUnique({
      where: {
        announcementId_userId: {
          announcementId,
          userId
        }
      }
    });

    if (!receipt) {
      throw new Error('NOT_FOUND');
    }

    if (receipt.readAt) {
      return receipt; // Idempotent
    }

    return await prisma.announcementReceipt.update({
      where: { id: receipt.id },
      data: { readAt: new Date() }
    });
  }

  static async markAcknowledged(announcementId: string, userId: string) {
    if (!announcementId || !userId) throw new Error('Missing parameters');

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) throw new Error('NOT_FOUND');
    if (!announcement.requiresAck) throw new Error('BAD_REQUEST: Announcement does not require acknowledgement');

    const receipt = await prisma.announcementReceipt.findUnique({
      where: {
        announcementId_userId: {
          announcementId,
          userId
        }
      }
    });

    if (!receipt) {
      throw new Error('NOT_FOUND');
    }

    if (receipt.acknowledgedAt) {
      return receipt; // Idempotent
    }

    return await prisma.announcementReceipt.update({
      where: { id: receipt.id },
      data: { 
        acknowledgedAt: new Date(),
        // Also mark as read if they didn't explicitly read it (though UI should prevent this, it's safer)
        readAt: receipt.readAt || new Date()
      }
    });
  }

  static async getPreviewCount(filters: { targetBranch?: string, targetYear?: number, targetHostel?: string, targetBlock?: string }) {
    const userWhere: Prisma.UserWhereInput = { role: 'Student' };
    if (filters.targetBranch) userWhere.branch = filters.targetBranch;
    if (filters.targetYear) userWhere.year = filters.targetYear;
    if (filters.targetHostel) userWhere.hostel = filters.targetHostel;
    if (filters.targetBlock) userWhere.block = filters.targetBlock;

    return await prisma.user.count({ where: userWhere });
  }
}
