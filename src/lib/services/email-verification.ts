import { prisma } from '@/lib/db/prisma';
import { createHash, randomBytes } from 'crypto';
import { AuditService } from './audit';

const TOKEN_EXPIRY_HOURS = 24;
const TOKEN_BYTE_LENGTH = 32; // 256-bit token

/**
 * Hash a plaintext token using SHA-256.
 * Only the hash is ever stored; plaintext is returned to the caller once and never persisted.
 */
function hashToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}

export class EmailVerificationService {
  /**
   * Request email verification for the currently authenticated user.
   * Returns the plaintext token (for inclusion in a verification URL).
   * The plaintext is NEVER stored or logged.
   */
  static async requestVerification(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (user.accountStatus !== 'ACTIVE') throw new Error('Account is not active');
    if (user.emailVerified) throw new Error('Email already verified');

    // Invalidate any existing unconsumed tokens for this user
    await prisma.emailVerificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() } // Mark old tokens as consumed/invalidated
    });

    // Generate cryptographically secure token
    const plaintext = randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
    const tokenHash = hashToken(plaintext);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      }
    });

    // Audit: record that verification was requested (NO secrets in metadata)
    await AuditService.log({
      actorId: userId,
      action: 'EMAIL_VERIFICATION_REQUESTED',
      domain: 'User',
      targetId: userId,
      metadata: { email: user.email }
    });

    return { token: plaintext, expiresAt };
  }

  /**
   * Verify email using a plaintext token.
   * Validates: existence, expiry, consumption, user match.
   */
  static async verifyEmail(token: string, userId: string): Promise<{ success: boolean }> {
    if (!token || typeof token !== 'string' || token.length < 16) {
      throw new Error('INVALID_TOKEN');
    }

    const tokenHash = hashToken(token);

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash }
    });

    if (!record) {
      throw new Error('INVALID_TOKEN');
    }

    // Token must belong to the requesting user
    if (record.userId !== userId) {
      throw new Error('INVALID_TOKEN');
    }

    // Token must not be already consumed
    if (record.consumedAt) {
      throw new Error('TOKEN_ALREADY_USED');
    }

    // Token must not be expired
    if (record.expiresAt < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }

    // Consume the token and verify the user's email atomically, guarding against concurrency
    await prisma.$transaction(async (tx) => {
      const updated = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, consumedAt: null },
        data: { consumedAt: new Date() }
      });
      if (updated.count === 0) {
        throw new Error('TOKEN_ALREADY_USED');
      }
      await tx.user.update({
        where: { id: userId },
        data: { emailVerified: true }
      });
    });

    // Audit: record verification success (NO secrets)
    await AuditService.log({
      actorId: userId,
      action: 'EMAIL_VERIFIED',
      domain: 'User',
      targetId: userId,
      metadata: { tokenId: record.id }
    });

    return { success: true };
  }

  /**
   * Get verification status for a user (used internally).
   */
  static async getStatus(userId: string): Promise<{ emailVerified: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true }
    });
    if (!user) throw new Error('User not found');
    return { emailVerified: user.emailVerified };
  }
}
