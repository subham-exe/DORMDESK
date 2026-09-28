/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnnouncementService } from '../announcement';
import { prisma } from '../../db/prisma';

vi.mock('../../db/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn(), count: vi.fn() },
    announcement: { create: vi.fn(), findUnique: vi.fn() },
    announcementReceipt: { createMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    notification: { createMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((cb) => cb(prisma)),
  }
}));

describe('AnnouncementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Filtering', () => {
    it('resolves all students when no filters provided', async () => {
      (prisma.user.findMany as any).mockResolvedValue([{ id: 's1' }, { id: 's2' }]);
      (prisma.announcement.create as any).mockResolvedValue({ id: 'a1' });
      
      await AnnouncementService.create({
        title: 'Test', body: 'Body', createdById: 'admin1'
      });
      
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'Student' }, select: { id: true }
      });
      expect(prisma.announcementReceipt.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ userId: 's1' }),
            expect.objectContaining({ userId: 's2' })
          ])
        })
      );
    });

    it('applies branch and year filters', async () => {
      (prisma.user.findMany as any).mockResolvedValue([{ id: 's1' }]);
      (prisma.announcement.create as any).mockResolvedValue({ id: 'a1' });
      
      await AnnouncementService.create({
        title: 'Test', body: 'Body', createdById: 'admin1', targetBranch: 'CSE', targetYear: 3
      });
      
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'Student', branch: 'CSE', year: 3 }, select: { id: true }
      });
    });
  });

  describe('Read Idempotency', () => {
    it('sets readAt on first read', async () => {
      (prisma.announcementReceipt.findUnique as any).mockResolvedValue({ id: 'r1', readAt: null });
      (prisma.announcementReceipt.update as any).mockResolvedValue({ id: 'r1', readAt: new Date() });

      await AnnouncementService.markRead('a1', 'u1');
      expect(prisma.announcementReceipt.update).toHaveBeenCalled();
    });

    it('does not update on repeated read', async () => {
      (prisma.announcementReceipt.findUnique as any).mockResolvedValue({ id: 'r1', readAt: new Date() });

      await AnnouncementService.markRead('a1', 'u1');
      expect(prisma.announcementReceipt.update).not.toHaveBeenCalled();
    });
  });

  describe('Ack Idempotency and requiresAck', () => {
    it('rejects ack when requiresAck is false', async () => {
      (prisma.announcement.findUnique as any).mockResolvedValue({ id: 'a1', requiresAck: false });
      
      await expect(AnnouncementService.markAcknowledged('a1', 'u1'))
        .rejects.toThrow('BAD_REQUEST');
    });

    it('sets ackAt on first ack', async () => {
      (prisma.announcement.findUnique as any).mockResolvedValue({ id: 'a1', requiresAck: true });
      (prisma.announcementReceipt.findUnique as any).mockResolvedValue({ id: 'r1', acknowledgedAt: null });
      (prisma.announcementReceipt.update as any).mockResolvedValue({ id: 'r1', acknowledgedAt: new Date() });

      await AnnouncementService.markAcknowledged('a1', 'u1');
      expect(prisma.announcementReceipt.update).toHaveBeenCalled();
    });

    it('does not update on repeated ack', async () => {
      (prisma.announcement.findUnique as any).mockResolvedValue({ id: 'a1', requiresAck: true });
      (prisma.announcementReceipt.findUnique as any).mockResolvedValue({ id: 'r1', acknowledgedAt: new Date() });

      await AnnouncementService.markAcknowledged('a1', 'u1');
      expect(prisma.announcementReceipt.update).not.toHaveBeenCalled();
    });
  });
});