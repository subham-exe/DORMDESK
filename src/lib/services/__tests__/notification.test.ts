/* eslint-disable @typescript-eslint/no-explicit-any -- specific reason: practical testing with partial Prisma objects */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService, NotificationType } from '../notification';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a notification and sanitizes metadata', async () => {
    
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-1' } as any /* specific reason: testing with partial Prisma objects */);

    await NotificationService.create({
      recipientId: 'user-1',
      title: 'Test',
      message: 'Hello',
      type: NotificationType.ANNOUNCEMENT,
      metadata: { safeKey: 'value', password: 'secretpassword' }
    });

    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        metadata: JSON.stringify({ safeKey: 'value' })
      })
    }));
  });

  it('allows reading own notification', async () => {
    
    vi.mocked(prisma.notification.findUnique).mockResolvedValue({
      id: 'notif-1',
      recipientId: 'user-1',
      readAt: null
    } as any /* specific reason: testing with partial Prisma objects */);

    
    vi.mocked(prisma.notification.update).mockResolvedValue({} as any /* specific reason: testing with partial Prisma objects */);

    await NotificationService.markRead('notif-1', 'user-1');
    expect(prisma.notification.update).toHaveBeenCalled();
  });

  it('forbids reading another users notification', async () => {
    
    vi.mocked(prisma.notification.findUnique).mockResolvedValue({
      id: 'notif-1',
      recipientId: 'user-2',
      readAt: null
    } as any /* specific reason: testing with partial Prisma objects */);

    await expect(NotificationService.markRead('notif-1', 'user-1')).rejects.toThrow('FORBIDDEN');
  });

  it('notifies on request lifecycle events', async () => {
    const request = {
      id: 'req-1',
      requesterId: 'student-1',
      ticketNumber: 'REQ-111'
    };
    
    
    await NotificationService.notifyRequestLifecycleEvent(request as any /* specific reason: testing with partial Prisma objects */, NotificationType.REQUEST_RESOLVED);
    
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        recipientId: 'student-1',
        title: 'Request Resolved',
      })
    }));
  });
});
