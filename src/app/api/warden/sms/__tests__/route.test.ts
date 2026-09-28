import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { requireAuth } from '@/lib/auth/session';
import { SmsService } from '@/lib/services/sms';

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/services/sms', () => ({
  SmsService: {
    listSmsOutbox: vi.fn(),
    simulateSendSms: vi.fn(),
  }
}));

describe('Warden SMS API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns outbox for Warden', async () => {
      (requireAuth as unknown as import('vitest').Mock).mockResolvedValue({ id: 'w1', role: 'Warden' });
      (SmsService.listSmsOutbox as unknown as import('vitest').Mock).mockResolvedValue([{ id: 's1' }]);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
    });

    it('denies Student', async () => {
      (requireAuth as unknown as import('vitest').Mock).mockResolvedValue({ id: 's1', role: 'Student' });
      const res = await GET();
      expect(res.status).toBe(403);
    });
  });

  describe('POST', () => {
    it('allows Warden to simulate SMS', async () => {
      (requireAuth as unknown as import('vitest').Mock).mockResolvedValue({ id: 'w1', role: 'Warden' });
      (SmsService.simulateSendSms as unknown as import('vitest').Mock).mockResolvedValue({ id: 'sms1' });

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '+123', message: 'Test' })
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('denies Student', async () => {
      (requireAuth as unknown as import('vitest').Mock).mockResolvedValue({ id: 's1', role: 'Student' });
      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '+123', message: 'Test' })
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });
});
