import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { EmailService } from '../email-service';
import { EmailQuotaService } from '../quota-service';
import { ConsentLedgerService } from '@/lib/services/consent-ledger';
import { ResendEmailProvider } from '../resend-provider';

// We explicitly test Resend adapter isolated from the API limit check
vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: vi.fn().mockResolvedValue({ data: { id: 'test-resend-id' } })
      };
      constructor(_apiKey: string) {}
    }
  };
});

describe('Phase 5 - Real Email Provider & Quota', () => {
  let user1Id: string;
  let sysAdminId: string;

  beforeEach(async () => {
    // Ensure we start with a clean state for quota and logs
    await prisma.emailDeliveryLog.deleteMany();
    await prisma.emailQuota.deleteMany();
    await prisma.consentRecord.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: ['p5test1@test.com', 'p5sa@test.com'] } } });

    const u1 = await prisma.user.create({ data: { email: 'p5test1@test.com', name: 'T1', role: 'Student', accountStatus: 'ACTIVE', password: 'pwd' } });
    const sa = await prisma.user.create({ data: { email: 'p5sa@test.com', name: 'SA', role: 'SystemAdmin', accountStatus: 'ACTIVE', password: 'pwd' } });

    user1Id = u1.id;
    sysAdminId = sa.id;
    
    EmailService.getMockProvider().clearSentEmails();
    EmailService.forceMock = true; // Use mock by default in these tests to avoid real API
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.emailDeliveryLog.deleteMany();
    await prisma.emailQuota.deleteMany();
    await prisma.consentRecord.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: ['p5test1@test.com', 'p5sa@test.com'] } } });
  });

  // =======================================================
  // 1. RATE LIMITING & QUOTA (Core Security Boundary)
  // =======================================================
  describe('Rate Limiting & Quota', () => {
    it('consumes quota deterministically on success', async () => {
      const success = await EmailService.sendEmail({
        to: 'p5test1@test.com',
        subject: 'Test Email',
        text: 'Hello',
        purpose: 'TEST' // Arbitrary internal purpose, bypasses Phase 4 checks
      });
      expect(success).toBe(true);

      const stats = await EmailQuotaService.getQuotaStats();
      expect(stats.daily).toBe(1);
      expect(stats.monthly).toBe(1);

      const logs = await prisma.emailDeliveryLog.findMany();
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('SENT');
      expect(logs[0].provider).toBe('MOCK');
    });

    it('consumes quota on provider failure to prevent abuse', async () => {
      EmailService.getMockProvider().shouldFail = true;

      const success = await EmailService.sendEmail({
        to: 'p5test1@test.com',
        subject: 'Test Email',
        text: 'Hello',
        purpose: 'TEST'
      });
      expect(success).toBe(false);

      const stats = await EmailQuotaService.getQuotaStats();
      expect(stats.daily).toBe(1); // Quota was consumed!

      const logs = await prisma.emailDeliveryLog.findMany();
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('FAILED');
    });

    it('rejects email strictly at the absolute daily maximum (70)', async () => {
      // Force quota to 70 (Absolute Maximum)
      const dateStr = new Date().toISOString().split('T')[0];
      await prisma.emailQuota.create({
        data: { id: dateStr, period: 'DAILY', count: 70 }
      });

      const success = await EmailService.sendEmail({
        to: 'p5test1@test.com',
        subject: 'Test Email',
        text: 'Hello',
        purpose: 'TEST'
      });
      
      expect(success).toBe(false);
      
      // Quota remains 70, not 71
      const stats = await EmailQuotaService.getQuotaStats();
      expect(stats.daily).toBe(70);

      // No log should be generated if rejected by quota
      const logs = await prisma.emailDeliveryLog.findMany();
      expect(logs).toHaveLength(0);
    });

    it('concurrent sends race correctly and do not exceed limit', async () => {
      // Set to 68, limit is 70, so only 2 should succeed out of 5
      const dateStr = new Date().toISOString().split('T')[0];
      await prisma.emailQuota.create({
        data: { id: dateStr, period: 'DAILY', count: 68 }
      });
      // Bypass configured daily limit in tests to rely purely on max
      process.env.DORMDESK_DAILY_EMAIL_LIMIT = '70';

      const sends = Array(5).fill(0).map((_, i) => EmailService.sendEmail({
        to: `p5test1_${i}@test.com`,
        subject: 'Test Concurrent',
        text: 'Hello',
        purpose: 'TEST'
      }));

      const results = await Promise.all(sends);
      const successCount = results.filter(r => r === true).length;
      
      // Exactly 2 must succeed, the rest fail
      expect(successCount).toBe(2);

      const stats = await EmailQuotaService.getQuotaStats();
      expect(stats.daily).toBe(70);
      
      const logs = await prisma.emailDeliveryLog.findMany();
      expect(logs).toHaveLength(2);
    });
  });

  // =======================================================
  // 2. PHASE 4 CONSENT INTEGRATION
  // =======================================================
  describe('Consent Integration', () => {
    it('optional notification is dropped if consent is missing', async () => {
      const success = await EmailService.sendEmail({
        to: 'p5test1@test.com',
        subject: 'Test Email',
        text: 'Hello',
        purpose: 'EMAIL_REQUEST_NOTIFICATIONS', // Optional purpose
        recipientId: user1Id
      });
      expect(success).toBe(false);

      // Quota NOT consumed for permission rejection
      const stats = await EmailQuotaService.getQuotaStats();
      expect(stats.daily).toBe(0);
    });

    it('optional notification sends if consent is granted', async () => {
      await ConsentLedgerService.grantConsent({
        userId: user1Id,
        purpose: 'EMAIL_REQUEST_NOTIFICATIONS',
        consentVersion: 'v1.0',
        consentText: 'granted',
        method: 'SYSTEM',
        source: 'admin-console'
      }, sysAdminId);

      const success = await EmailService.sendEmail({
        to: 'p5test1@test.com',
        subject: 'Test Email',
        text: 'Hello',
        purpose: 'EMAIL_REQUEST_NOTIFICATIONS',
        recipientId: user1Id
      });
      expect(success).toBe(true);
      
      const stats = await EmailQuotaService.getQuotaStats();
      expect(stats.daily).toBe(1);
    });
  });

  // =======================================================
  // 3. RESEND PROVIDER ADAPTER
  // =======================================================
  describe('Resend Adapter', () => {
    it('missing config returns false from isConfigured', () => {
      const originalApiKey = process.env.RESEND_API_KEY;
      const originalFrom = process.env.DORMDESK_EMAIL_FROM;
      delete process.env.RESEND_API_KEY;
      delete process.env.DORMDESK_EMAIL_FROM;
      
      const provider = new ResendEmailProvider();
      expect(provider.isConfigured()).toBe(false);
      
      process.env.RESEND_API_KEY = originalApiKey;
      process.env.DORMDESK_EMAIL_FROM = originalFrom;
    });

    it('configured adapter sends using mocked SDK', async () => {
      process.env.RESEND_API_KEY = 're_test_123';
      process.env.DORMDESK_EMAIL_FROM = 'no-reply@dormdesk.test';
      
      const provider = new ResendEmailProvider();
      expect(provider.isConfigured()).toBe(true);

      const result = await provider.sendEmail({
        to: 'p5test1@test.com',
        subject: 'Real provider',
        text: 'Test',
        purpose: 'TEST'
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('RESEND');
      expect(result.providerId).toBe('test-resend-id');
      expect(result.error).toBeUndefined();
    });

    it('safely normalizes provider errors without exposing secrets', async () => {
      process.env.RESEND_API_KEY = 're_test_123';
      process.env.DORMDESK_EMAIL_FROM = 'no-reply@dormdesk.test';

      const provider = new ResendEmailProvider();
      // Force the mocked SDK to throw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (provider as any).resend.emails.send = vi.fn().mockRejectedValue(new Error('Provider network timeout'));

      const result = await provider.sendEmail({
        to: 'p5test1@test.com',
        subject: 'Real provider',
        text: 'Test',
        purpose: 'TEST'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Provider network timeout');
      expect(result.error).not.toContain('re_test_123'); // API key not in error
    });
  });
});
