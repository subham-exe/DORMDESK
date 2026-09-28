import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmsService } from '../sms';
import { prisma } from '@/lib/db/prisma';
import { AuditService } from '../audit';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    smsOutbox: {
      create: vi.fn(),
      findMany: vi.fn(),
    }
  }
}));

vi.mock('../audit', () => ({
  AuditService: {
    log: vi.fn(),
  }
}));

describe('SmsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('simulateSendSms', () => {
    it('creates an outbox entry and logs audit', async () => {
      (prisma.smsOutbox.create as unknown as import('vitest').Mock).mockResolvedValue({ id: 'sms1', status: 'SIMULATED_SENT' });

      const res = await SmsService.simulateSendSms({
        phoneNumber: '+123',
        message: 'Hello',
        type: 'GENERAL'
      }, 'actor1');

      expect(res.id).toBe('sms1');
      expect(prisma.smsOutbox.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ phoneNumber: '+123', message: 'Hello', status: 'SIMULATED_SENT' })
      }));
      expect(AuditService.log).toHaveBeenCalled();
    });

    it('throws on empty message', async () => {
      await expect(SmsService.simulateSendSms({ phoneNumber: '+1', message: '', type: 'G' }, 'actor'))
        .rejects.toThrow('between 1 and 160');
    });
  });
});
