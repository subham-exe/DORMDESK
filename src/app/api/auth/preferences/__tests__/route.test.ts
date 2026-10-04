import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { GET, PATCH } from '../route';
import { ConsentLedgerService } from '@/lib/services/consent-ledger';

// Mock session to simulate authenticated user
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
}));
import { requireAuth } from '@/lib/auth/session';

describe('Phase 4 - Notification Preferences API', () => {
  let user1Id: string;
  let sysAdminId: string;

  beforeEach(async () => {
    await prisma.consentRecord.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: ['p4test1@test.com', 'p4test2@test.com', 'p4sa@test.com'] } } });
    await prisma.auditLog.deleteMany({ where: { entity: 'Consent' } });

    const u1 = await prisma.user.create({ data: { email: 'p4test1@test.com', name: 'T1', role: 'Student', accountStatus: 'ACTIVE', password: 'pwd' } });
    const sa = await prisma.user.create({ data: { email: 'p4sa@test.com', name: 'SA', role: 'SystemAdmin', accountStatus: 'ACTIVE', password: 'pwd' } });

    user1Id = u1.id;
    sysAdminId = sa.id;
  });

  afterAll(async () => {
    await prisma.consentRecord.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: ['p4test1@test.com', 'p4test2@test.com', 'p4sa@test.com'] } } });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockReq = (body?: any) => {
    return {
      json: async () => body,
      url: 'http://localhost/api/auth/preferences'
    } as Request;
  };

  it('1. unauthorized access is rejected', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('UNAUTHORIZED'));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('2. default disabled state & independent isolation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.EMAIL_REQUEST_NOTIFICATIONS).toBe(false);
    expect(data.EMAIL_SLA_NOTIFICATIONS).toBe(false);
    expect(data.EMAIL_CAMPUS_ANNOUNCEMENTS).toBe(false);
  });

  it('3. grant and read all three purposes independently', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    
    // Grant REQUEST
    const res1 = await PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: true }));
    expect(res1.status).toBe(200);
    
    const getRes1 = await (await GET()).json();
    expect(getRes1.EMAIL_REQUEST_NOTIFICATIONS).toBe(true);
    expect(getRes1.EMAIL_SLA_NOTIFICATIONS).toBe(false);
    
    // Grant SLA
    await PATCH(mockReq({ purpose: 'EMAIL_SLA_NOTIFICATIONS', enabled: true }));
    const getRes2 = await (await GET()).json();
    expect(getRes2.EMAIL_REQUEST_NOTIFICATIONS).toBe(true);
    expect(getRes2.EMAIL_SLA_NOTIFICATIONS).toBe(true);
    expect(getRes2.EMAIL_CAMPUS_ANNOUNCEMENTS).toBe(false);
    
    // Withdraw REQUEST
    await PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: false }));
    const getRes3 = await (await GET()).json();
    expect(getRes3.EMAIL_REQUEST_NOTIFICATIONS).toBe(false);
    expect(getRes3.EMAIL_SLA_NOTIFICATIONS).toBe(true);
  });

  it('4. cross-user IDOR attempt & SYSTEM_ADMIN isolation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: sysAdminId } as any);
    
    await PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: true, userId: user1Id }));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    const getRes = await (await GET()).json();
    expect(getRes.EMAIL_REQUEST_NOTIFICATIONS).toBe(false); // IDOR prevented
  });

  it('5. invalid purpose/status', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    
    const res1 = await PATCH(mockReq({ purpose: 'INVALID_PURPOSE', enabled: true }));
    expect(res1.status).toBe(400);
    
    const res2 = await PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: 'yes' }));
    expect(res2.status).toBe(400);
  });

  it('6. grant -> withdraw -> grant history and ledger history preservation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    
    await PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: true }));
    await PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: false }));
    await PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: true }));
    
    const records = await prisma.consentRecord.findMany({
      where: { userId: user1Id, purpose: 'EMAIL_REQUEST_NOTIFICATIONS' },
      orderBy: { createdAt: 'asc' }
    });
    
    expect(records.length).toBe(3);
    expect(records[0].status).toBe('GRANTED');
    expect(records[1].status).toBe('WITHDRAWN');
    expect(records[2].status).toBe('GRANTED');
  });

  it('7. verification/consent separation (emailVerified does not imply consent)', async () => {
    await prisma.user.update({
      where: { id: user1Id },
      data: { emailVerified: true }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    const getRes = await (await GET()).json();
    expect(getRes.EMAIL_REQUEST_NOTIFICATIONS).toBe(false);
  });

  it('8. concurrent mutation idempotency', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    
    await Promise.all([
      PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: true })),
      PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: true })),
      PATCH(mockReq({ purpose: 'EMAIL_REQUEST_NOTIFICATIONS', enabled: true })),
    ]);

    const getRes = await (await GET()).json();
    expect(getRes.EMAIL_REQUEST_NOTIFICATIONS).toBe(true);

    const current = await ConsentLedgerService.hasCurrentConsent(user1Id, 'EMAIL_REQUEST_NOTIFICATIONS');
    expect(current).toBe(true);
  });

  it('9. no secrets/tokens exposed in API response', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(requireAuth).mockResolvedValue({ id: user1Id } as any);
    const res = await GET();
    const data = await res.json();
    
    expect(data.consentTextHash).toBeUndefined();
    expect(data.password).toBeUndefined();
    expect(Object.keys(data)).toEqual(['EMAIL_REQUEST_NOTIFICATIONS', 'EMAIL_SLA_NOTIFICATIONS', 'EMAIL_CAMPUS_ANNOUNCEMENTS']);
  });
});
