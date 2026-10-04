import { prisma } from '@/lib/db/prisma';
import { createHash } from 'crypto';
import { AuditService } from './audit';

export type ConsentStatus = 'GRANTED' | 'WITHDRAWN';
export type ConsentPurpose = 
  | 'EMAIL_REQUEST_NOTIFICATIONS'
  | 'EMAIL_SLA_NOTIFICATIONS'
  | 'EMAIL_CAMPUS_ANNOUNCEMENTS';
export type ConsentMethod = 'WEB' | 'KIOSK' | 'ADMIN' | 'SYSTEM';
export type ConsentSource = 'student-portal' | 'warden-desk' | 'admin-console' | 'kiosk';

export interface ConsentRequest {
  userId: string;
  purpose: ConsentPurpose;
  consentVersion: string;
  consentText: string;
  method: ConsentMethod;
  source: ConsentSource;
}

export class ConsentLedgerService {
  /**
   * Hashes the consent text securely
   */
  static hashConsentText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  static readonly VALID_PURPOSES = [
    'EMAIL_REQUEST_NOTIFICATIONS',
    'EMAIL_SLA_NOTIFICATIONS',
    'EMAIL_CAMPUS_ANNOUNCEMENTS'
  ];

  /**
   * Grant consent
   */
  static async grantConsent(req: ConsentRequest, actorId: string): Promise<void> {
    if (!this.VALID_PURPOSES.includes(req.purpose)) {
      throw new Error('INVALID_PURPOSE');
    }
    
    // Validate version format (prevent arbitrary strings if needed, though typing helps)
    if (!req.consentVersion || !req.consentText) {
      throw new Error('MISSING_VERSION_OR_TEXT');
    }

    const consentTextHash = this.hashConsentText(req.consentText);

    await prisma.$transaction(async (tx) => {
      // Check current state to handle idempotency securely
      const current = await tx.consentRecord.findFirst({
        where: { userId: req.userId, purpose: req.purpose },
        orderBy: { createdAt: 'desc' }
      });

      // If already granted for exactly this version and text, skip inserting duplicate
      if (current && current.status === 'GRANTED' && current.consentVersion === req.consentVersion && current.consentTextHash === consentTextHash) {
        return;
      }

      await tx.consentRecord.create({
        data: {
          userId: req.userId,
          purpose: req.purpose,
          status: 'GRANTED',
          grantedAt: new Date(),
          withdrawnAt: null,
          consentVersion: req.consentVersion,
          consentTextHash,
          method: req.method,
          source: req.source
        }
      });
    });

    await AuditService.log({
      actorId,
      action: 'CONSENT_GRANTED',
      domain: 'Consent',
      targetId: req.userId,
      metadata: { purpose: req.purpose, consentVersion: req.consentVersion }
    });
  }

  /**
   * Withdraw consent
   */
  static async withdrawConsent(
    req: { userId: string; purpose: ConsentPurpose; method: ConsentMethod; source: ConsentSource; consentVersion?: string; consentText?: string },
    actorId: string
  ): Promise<void> {
    if (!this.VALID_PURPOSES.includes(req.purpose)) {
      throw new Error('INVALID_PURPOSE');
    }

    // Hash text if provided, otherwise 'N/A' (since they are withdrawing, text may not be strictly required)
    const consentTextHash = req.consentText ? this.hashConsentText(req.consentText) : 'N/A';
    const consentVersion = req.consentVersion || 'N/A';

    await prisma.$transaction(async (tx) => {
      const current = await tx.consentRecord.findFirst({
        where: { userId: req.userId, purpose: req.purpose },
        orderBy: { createdAt: 'desc' }
      });

      // If already withdrawn (or never granted), idempotent
      if (!current || current.status === 'WITHDRAWN') {
        return; 
      }

      await tx.consentRecord.create({
        data: {
          userId: req.userId,
          purpose: req.purpose,
          status: 'WITHDRAWN',
          grantedAt: null,
          withdrawnAt: new Date(),
          consentVersion,
          consentTextHash,
          method: req.method,
          source: req.source
        }
      });
    });

    await AuditService.log({
      actorId,
      action: 'CONSENT_WITHDRAWN',
      domain: 'Consent',
      targetId: req.userId,
      metadata: { purpose: req.purpose }
    });
  }

  /**
   * Server-side resolver for current consent
   */
  static async hasCurrentConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    const current = await prisma.consentRecord.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: 'desc' }
    });

    return current?.status === 'GRANTED';
  }

  /**
   * Get the full current consent record if needed
   */
  static async getCurrentConsent(userId: string, purpose: ConsentPurpose) {
    return prisma.consentRecord.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: 'desc' }
    });
  }
}
