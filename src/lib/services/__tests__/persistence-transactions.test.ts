import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { RequestEngine } from '../request-engine';

describe('Persistence: Transactions & Partial Failure (Q2.9)', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.requestAssignment.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.request.deleteMany();
    await prisma.policy.deleteMany();
    await prisma.smsOutbox.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('rolls back completely if a nested relation constraint fails', async () => {
    const invalidRequesterId = 'invalid-user-123';

    try {
      await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Test',
        requesterId: invalidRequesterId,
        description: 'Should fail completely'
      });
      expect.fail('Should have thrown an error');
    } catch {
      // Expected to fail due to foreign key constraint
    }

    const requests = await prisma.request.count();
    const history = await prisma.requestStatusHistory.count();
    const slas = await prisma.requestSLA.count();

    expect(requests).toBe(0);
    expect(history).toBe(0);
    expect(slas).toBe(0);
  });
});
