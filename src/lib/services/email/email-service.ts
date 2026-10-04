import { prisma } from '@/lib/db/prisma';
import { EmailPayload, EmailProvider } from './types';
import { MockEmailProvider } from './mock-provider';
import { ResendEmailProvider } from './resend-provider';
import { GmailEmailProvider } from './gmail-provider';
import { EmailQuotaService } from './quota-service';
import { ConsentLedgerService, ConsentPurpose } from '@/lib/services/consent-ledger';

export class EmailService {
  private static mockProvider = new MockEmailProvider();
  
  // Test hook to force mock provider even if ENV is set
  public static forceMock = process.env.NODE_ENV === 'test';

  private static getProvider(): EmailProvider {
    if (this.forceMock) return this.mockProvider;

    if (process.env.EMAIL_PROVIDER === 'gmail') {
      const gmail = new GmailEmailProvider();
      if (gmail.isConfigured()) {
        return gmail;
      }
    }

    const resend = new ResendEmailProvider();
    if (resend.isConfigured()) {
      return resend;
    }
    
    // Fallback securely to mock if credentials missing
    return this.mockProvider;
  }

  /**
   * For test visibility
   */
  static getMockProvider() {
    return this.mockProvider;
  }

  /**
   * Primary entry point for sending emails.
   * Handles optional consent checks, quota enforcement, and delivery tracking.
   */
  static async sendEmail(payload: EmailPayload): Promise<boolean> {
    if (ConsentLedgerService.VALID_PURPOSES.includes(payload.purpose)) {
      if (!payload.recipientId) {
        throw new Error('Optional notifications require a recipientId for consent check');
      }
      
      // Sanitize subject for CRLF injection
      payload.subject = payload.subject.replace(/[\r\n]/g, ' ').trim();
      const hasConsent = await ConsentLedgerService.hasCurrentConsent(
        payload.recipientId, 
        payload.purpose as ConsentPurpose
      );
      if (!hasConsent) {
        console.log(`[EmailService] Dropping ${payload.purpose} email to ${payload.to} - No Consent`);
        return false; // Safely return false without consuming quota
      }
    }

    // 2. Idempotency Reservation
    // If an idempotencyKey is provided, attempt to create the log record first with PENDING status.
    let logRecord = null;
    if (payload.idempotencyKey) {
      try {
        logRecord = await prisma.emailDeliveryLog.create({
          data: {
            recipientId: payload.recipientId,
            recipient: payload.to,
            subject: payload.subject,
            purpose: payload.purpose,
            provider: 'PENDING',
            status: 'PENDING',
            idempotencyKey: payload.idempotencyKey
          }
        });
      } catch (e: unknown) {
        // Unique constraint violation means we already processed this event
        if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
          console.log(`[EmailService] Idempotency hit for key ${payload.idempotencyKey}`);
          return true; // Pretend success since it was already handled
        }
        // If it's a different DB error, we log but don't fail the request
        console.error(`[EmailService] DB error reserving idempotency key`, e);
      }
    }

    // 3. Quota Check
    // Quota is consumed deterministically. If provider fails, quota is STILL consumed
    // to prevent infinite retry abuse.
    const hasQuota = await EmailQuotaService.acquireQuota();
    if (!hasQuota) {
      console.error(`[EmailService] CRITICAL: Hard email quota exceeded. Dropped email to ${payload.to}`);
      if (logRecord) {
        await prisma.emailDeliveryLog.update({
          where: { id: logRecord.id },
          data: { status: 'FAILED', error: 'QUOTA_EXCEEDED' }
        }).catch(console.error);
      }
      return false;
    }

    // 4. Provider Delivery
    const provider = this.getProvider();
    const result = await provider.sendEmail(payload);

    // 5. Persistence / Tracking Update
    try {
      if (logRecord) {
        await prisma.emailDeliveryLog.update({
          where: { id: logRecord.id },
          data: {
            provider: result.provider,
            providerId: result.providerId,
            status: result.success ? 'SENT' : 'FAILED',
            error: result.error
          }
        });
      } else {
        await prisma.emailDeliveryLog.create({
          data: {
            recipientId: payload.recipientId,
            recipient: payload.to,
            subject: payload.subject,
            purpose: payload.purpose,
            provider: result.provider,
            providerId: result.providerId,
            status: result.success ? 'SENT' : 'FAILED',
            error: result.error,
            idempotencyKey: payload.idempotencyKey
          }
        });
      }
    } catch (e) {
      console.error(`[EmailService] Failed to persist delivery log for ${payload.to}`, e);
    }

    return result.success;
  }
}
