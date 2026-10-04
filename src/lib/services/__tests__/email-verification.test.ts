import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { EmailVerificationService } from '../email-verification';
import { createHash, randomBytes } from 'crypto';

describe('Phase 2 - Email Verification', () => {
  let testUserId: string;
  let testUserEmail: string;
  let sysAdminId: string;
  let principalId: string;
  let inactiveUserId: string;
  let verifiedUserId: string;
  let collegeId: string;

  beforeAll(async () => {
    await prisma.college.upsert({ where: { id: 'test-college' }, update: {}, create: { id: 'test-college', name: 'Test College', status: 'ACTIVE' } });
    // await prisma.user.updateMany({ data: { collegeId: 'test-college' } }); /* Removed global pollution */
    await prisma.college.upsert({ where: { id: 'test-college' }, update: {}, create: { id: 'test-college', name: 'Test College', status: 'ACTIVE' } });
    // Get or create a college for test users
    let college = await prisma.college.findFirst();
    if (!college) {
      college = await prisma.college.create({ data: { name: 'Phase2 Test College' } });
    }
    collegeId = college.id;

    const authStudent = await prisma.authorityLevel.upsert({ where: { name: 'STUDENT' }, update: {}, create: { name: 'STUDENT', levelNumber: 10 } });
    const authPrin = await prisma.authorityLevel.upsert({ where: { name: 'PRINCIPAL' }, update: {}, create: { name: 'PRINCIPAL', levelNumber: 80 } });
    const authSys = await prisma.authorityLevel.upsert({ where: { name: 'SYSTEM_ADMIN' }, update: {}, create: { name: 'SYSTEM_ADMIN', levelNumber: 100 } });

    testUserEmail = `p2_student_${crypto.randomUUID()}@test.com`;
    const testUser = await prisma.user.create({
      data: { 
        email: testUserEmail,
        name: 'P2 Student',
        role: 'Student',
        collegeId,
        authorityId: authStudent?.id,
        emailVerified: false,
        accountStatus: 'ACTIVE'
        }
    });
    testUserId = testUser.id;

    // SYSTEM_ADMIN (no college)
    let sysAdmin = await prisma.user.findFirst({ where: { authorityId: authSys?.id } });
    if (!sysAdmin) {
      sysAdmin = await prisma.user.create({
        data: {
          email: `p2_sysadmin_${crypto.randomUUID()}@test.com`,
          name: 'P2 SysAdmin',
          role: 'Admin',
          authorityId: authSys?.id,
          emailVerified: false,
          accountStatus: 'ACTIVE'
         }
      });
    } else {
      // Ensure the existing one is ready for the test
      await prisma.user.update({ where: { id: sysAdmin.id }, data: { emailVerified: false } });
    }
    sysAdminId = sysAdmin.id;

    // PRINCIPAL (with college)
    const principal = await prisma.user.create({
      data: {
        email: `p2_principal_${crypto.randomUUID()}@test.com`,
        name: 'P2 Principal',
        role: 'Admin',
        collegeId,
        authorityId: authPrin?.id,
        emailVerified: false,
        accountStatus: 'ACTIVE'
       }
    });
    principalId = principal.id;

    // Inactive user
    const inactiveUser = await prisma.user.create({
      data: {
        email: `p2_inactive_${crypto.randomUUID()}@test.com`,
        name: 'P2 Inactive',
        role: 'Student',
        collegeId,
        authorityId: authStudent?.id,
        emailVerified: false,
        accountStatus: 'SUSPENDED'
       }
    });
    inactiveUserId = inactiveUser.id;

    // Already-verified user
    const verifiedUser = await prisma.user.create({
      data: {
        email: `p2_verified_${crypto.randomUUID()}@test.com`,
        name: 'P2 Verified',
        role: 'Student',
        collegeId,
        authorityId: authStudent?.id,
        emailVerified: true,
        accountStatus: 'ACTIVE'
       }
    });
    verifiedUserId = verifiedUser.id;
  });

  afterAll(async () => {
    // Cleanup tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: { in: [testUserId, sysAdminId, principalId, inactiveUserId, verifiedUserId] } }
    });
  });

  // ========================================================
  // TOKEN SECURITY
  // ========================================================
  describe('Token Security', () => {
    it('generates a cryptographically secure token', async () => {
      const { token } = await EmailVerificationService.requestVerification(testUserId);
      // 32 bytes -> 64 hex chars
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('stores only the token hash, never the plaintext', async () => {
      // Reset verified status
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      // Invalidate old tokens
      await prisma.emailVerificationToken.updateMany({
        where: { userId: testUserId, consumedAt: null },
        data: { consumedAt: new Date() }
      });

      const { token } = await EmailVerificationService.requestVerification(testUserId);
      const expectedHash = createHash('sha256').update(token).digest('hex');

      const stored = await prisma.emailVerificationToken.findFirst({
        where: { userId: testUserId, consumedAt: null },
        orderBy: { createdAt: 'desc' }
      });

      expect(stored).toBeTruthy();
      expect(stored!.tokenHash).toBe(expectedHash);
      // The plaintext is NOT the tokenHash
      expect(stored!.tokenHash).not.toBe(token);
    });

    it('token expires after the configured period', async () => {
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      await prisma.emailVerificationToken.updateMany({
        where: { userId: testUserId, consumedAt: null },
        data: { consumedAt: new Date() }
      });

      const { expiresAt } = await EmailVerificationService.requestVerification(testUserId);
      const now = new Date();
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      // Should be approximately 24 hours
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThanOrEqual(24.1);
    });

    it('expired token is rejected', async () => {
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      // Create an already-expired token
      const plaintext = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(plaintext).digest('hex');
      await prisma.emailVerificationToken.create({
        data: {
          userId: testUserId,
          tokenHash,
          expiresAt: new Date(Date.now() - 1000) // Already expired
        }
      });

      await expect(EmailVerificationService.verifyEmail(plaintext, testUserId))
        .rejects.toThrow('TOKEN_EXPIRED');
    });

    it('token is single-use — replay fails', async () => {
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      await prisma.emailVerificationToken.updateMany({
        where: { userId: testUserId, consumedAt: null },
        data: { consumedAt: new Date() }
      });

      const { token } = await EmailVerificationService.requestVerification(testUserId);
      // First use succeeds
      await EmailVerificationService.verifyEmail(token, testUserId);
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user!.emailVerified).toBe(true);

      // Reset and try again — token is consumed
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      await expect(EmailVerificationService.verifyEmail(token, testUserId))
        .rejects.toThrow('TOKEN_ALREADY_USED');
    });

    it('malformed token is rejected', async () => {
      await expect(EmailVerificationService.verifyEmail('short', testUserId))
        .rejects.toThrow('INVALID_TOKEN');
      await expect(EmailVerificationService.verifyEmail('', testUserId))
        .rejects.toThrow('INVALID_TOKEN');
    });

    it('nonexistent token is rejected', async () => {
      const fakeToken = randomBytes(32).toString('hex');
      await expect(EmailVerificationService.verifyEmail(fakeToken, testUserId))
        .rejects.toThrow('INVALID_TOKEN');
    });

    it('old token is invalidated when a new one is requested', async () => {
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      await prisma.emailVerificationToken.updateMany({
        where: { userId: testUserId, consumedAt: null },
        data: { consumedAt: new Date() }
      });

      const { token: oldToken } = await EmailVerificationService.requestVerification(testUserId);
      // Request a new one — old should be invalidated
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      const { token: newToken } = await EmailVerificationService.requestVerification(testUserId);

      // Old token should now be consumed/invalidated
      await expect(EmailVerificationService.verifyEmail(oldToken, testUserId))
        .rejects.toThrow('TOKEN_ALREADY_USED');

      // New token should work
      await EmailVerificationService.verifyEmail(newToken, testUserId);
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user!.emailVerified).toBe(true);
    });
  });

  // ========================================================
  // IDENTITY ISOLATION
  // ========================================================
  describe('Identity Isolation', () => {
    it('token for user A cannot verify user B', async () => {
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      await prisma.emailVerificationToken.updateMany({
        where: { userId: testUserId, consumedAt: null },
        data: { consumedAt: new Date() }
      });

      const { token } = await EmailVerificationService.requestVerification(testUserId);
      // Try to use testUser's token for principal
      await expect(EmailVerificationService.verifyEmail(token, principalId))
        .rejects.toThrow('INVALID_TOKEN');
    });

    it('correct user becomes verified and authority remains unchanged', async () => {
      await prisma.user.update({ where: { id: testUserId }, data: { emailVerified: false } });
      await prisma.emailVerificationToken.updateMany({
        where: { userId: testUserId, consumedAt: null },
        data: { consumedAt: new Date() }
      });

      const beforeUser = await prisma.user.findUnique({ where: { id: testUserId }, include: { authority: true } });
      const { token } = await EmailVerificationService.requestVerification(testUserId);
      await EmailVerificationService.verifyEmail(token, testUserId);

      const afterUser = await prisma.user.findUnique({ where: { id: testUserId }, include: { authority: true } });
      expect(afterUser!.emailVerified).toBe(true);
      // Authority unchanged
      expect(afterUser!.authorityId).toBe(beforeUser!.authorityId);
      expect(afterUser!.authority?.name).toBe(beforeUser!.authority?.name);
      // College unchanged
      expect(afterUser!.collegeId).toBe(beforeUser!.collegeId);
      // Account status unchanged
      expect(afterUser!.accountStatus).toBe(beforeUser!.accountStatus);
    });

    it('SYSTEM_ADMIN can request verification and authority is preserved', async () => {
      const beforeSysAdmin = await prisma.user.findUnique({ where: { id: sysAdminId }, include: { authority: true } });

      const { token } = await EmailVerificationService.requestVerification(sysAdminId);
      await EmailVerificationService.verifyEmail(token, sysAdminId);

      const afterSysAdmin = await prisma.user.findUnique({ where: { id: sysAdminId }, include: { authority: true } });
      expect(afterSysAdmin!.emailVerified).toBe(true);
      expect(afterSysAdmin!.authorityId).toBe(beforeSysAdmin!.authorityId);
      expect(afterSysAdmin!.authority?.name).toBe('SYSTEM_ADMIN');
      expect(afterSysAdmin!.collegeId).toBeNull();
    });
  });

  // ========================================================
  // ACCOUNT STATUS
  // ========================================================
  describe('Account Status', () => {
    it('inactive account cannot request verification', async () => {
      await expect(EmailVerificationService.requestVerification(inactiveUserId))
        .rejects.toThrow('Account is not active');
    });

    it('already-verified user cannot request a new token', async () => {
      await expect(EmailVerificationService.requestVerification(verifiedUserId))
        .rejects.toThrow('Email already verified');
    });
  });

  // ========================================================
  // AUDIT SAFETY
  // ========================================================
  describe('Audit Safety', () => {
    it('audit log does not contain plaintext token', async () => {
      await prisma.user.update({ where: { id: principalId }, data: { emailVerified: false } });
      await prisma.emailVerificationToken.updateMany({
        where: { userId: principalId, consumedAt: null },
        data: { consumedAt: new Date() }
      });

      const { token } = await EmailVerificationService.requestVerification(principalId);
      await EmailVerificationService.verifyEmail(token, principalId);

      const logs = await prisma.auditLog.findMany({
        where: {
          entityId: principalId,
          action: { in: ['EMAIL_VERIFICATION_REQUESTED', 'EMAIL_VERIFIED'] }
        },
        orderBy: { timestamp: 'desc' },
        take: 2
      });

      for (const log of logs) {
        // Token plaintext must NOT appear in metadata
        if (log.metadata) {
          expect(log.metadata).not.toContain(token);
        }
      }
    });
  });

  // ========================================================
  // ENUMERATION RESISTANCE
  // ========================================================
  describe('Enumeration Resistance', () => {
    it('requestVerification requires a real userId — nonexistent user throws generic error', async () => {
      await expect(EmailVerificationService.requestVerification('nonexistent-user-id'))
        .rejects.toThrow('User not found');
    });
  });

  // ========================================================
  // PASSWORD LIFECYCLE
  // ========================================================
  describe('Password Lifecycle', () => {
    it('email verification does not change mustChangePassword', async () => {
      // Create a user with mustChangePassword=true
      const authStudent = await prisma.authorityLevel.findUnique({ where: { name: 'STUDENT' } });
      const pwUser = await prisma.user.create({
        data: {
          email: `p2_pwuser_${crypto.randomUUID()}@test.com`,
          name: 'P2 PW User',
          role: 'Student',
          collegeId,
          authorityId: authStudent?.id,
          mustChangePassword: true,
          emailVerified: false,
          accountStatus: 'ACTIVE'
         }
      });

      const { token } = await EmailVerificationService.requestVerification(pwUser.id);
      await EmailVerificationService.verifyEmail(token, pwUser.id);

      const updated = await prisma.user.findUnique({ where: { id: pwUser.id } });
      expect(updated!.emailVerified).toBe(true);
      // mustChangePassword must NOT be affected
      expect(updated!.mustChangePassword).toBe(true);

      // Cleanup
      await prisma.emailVerificationToken.deleteMany({ where: { userId: pwUser.id } });
    });
  });

  // ========================================================
  // VERIFICATION STATUS
  // ========================================================
  describe('Verification Status', () => {
    it('getStatus returns correct verification state', async () => {
      const status = await EmailVerificationService.getStatus(verifiedUserId);
      expect(status.emailVerified).toBe(true);
    });
  });
});
