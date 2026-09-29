import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestEngine } from '../request-engine';
import { prisma } from '../../db/prisma';

// Mock notification service
vi.mock('../notification', () => ({
  NotificationService: { create: vi.fn() }
}));

describe('Idempotency logic in RequestEngine', () => {
  let userId: string;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.request.deleteMany();
    let user = await prisma.user.findFirst({ where: { role: 'Student' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'testsync@example.com',
          name: 'Sync Test User',
          role: 'Student'
        }
      });
    }
    userId = user.id;
  });

  it('creates a new request when idempotency key is fresh', async () => {
    const key = 'test-key-1';
    const req1 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'WIFI',
      requesterId: userId,
      description: 'First request',
      idempotencyKey: key,
    });
    
    expect(req1.idempotencyKey).toBe(key);
    expect(req1.description).toBe('First request');
  });

  it('returns existing request on repeated submission with same key', async () => {
    const key = 'test-key-2';
    
    const req1 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'WIFI',
      requesterId: userId,
      description: 'First request',
      idempotencyKey: key,
    });

    const req2 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'PLUMBING', // different category, should be ignored
      requesterId: userId,
      description: 'Duplicate request', // should be ignored
      idempotencyKey: key,
    });

    expect(req1.id).toBe(req2.id); // Same record returned
    expect(req2.category).toBe('WIFI'); // Didn't change
    
    const count = await prisma.request.count();
    expect(count).toBe(1);
  });
});
