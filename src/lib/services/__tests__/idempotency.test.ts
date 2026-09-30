import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { RequestEngine } from '../request-engine';

describe('Idempotency Hardening (Q2.5)', () => {
  beforeEach(async () => {
    await prisma.requestAssignment.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.request.deleteMany();
  });

  it('handles sequential retry returning the same request', async () => {
    const student = await prisma.user.create({
      data: { id: 'idem-student-1-' + Math.random(), name: 'Student', email: 'idem1-' + Math.random() + '@demo', role: 'Student' }
    });

    const key = 'idem-key-1-' + Math.random();

    const req1 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'WIFI',
      requesterId: student.id,
      description: 'First attempt',
      idempotencyKey: key
    });

    const req2 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'WIFI',
      requesterId: student.id,
      description: 'Second attempt with same key',
      idempotencyKey: key
    });

    expect(req1.id).toBe(req2.id);

    const totalRequests = await prisma.request.count();
    expect(totalRequests).toBe(1);

    const histories = await prisma.requestStatusHistory.findMany({ where: { requestId: req1.id } });
    expect(histories.length).toBe(1); // Only 1 initialization
  });

  it('safely handles concurrent races returning exactly one request', async () => {
    const student = await prisma.user.create({
      data: { id: 'idem-student-2-' + Math.random(), name: 'Student', email: 'idem2-' + Math.random() + '@demo', role: 'Student' }
    });

    const key = 'idem-key-2-' + Math.random();

    // Fire 5 concurrent requests with the same idempotency key
    const promises = Array.from({ length: 5 }).map(() => RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'WIFI',
      requesterId: student.id,
      description: 'Concurrent attempt',
      idempotencyKey: key
    }));

    const results = await Promise.all(promises);

    // All results should be the exact same request ID
    const firstId = results[0].id;
    for (const req of results) {
      expect(req.id).toBe(firstId);
    }

    const totalRequests = await prisma.request.count();
    expect(totalRequests).toBe(1);

    const histories = await prisma.requestStatusHistory.findMany({ where: { requestId: firstId } });
    expect(histories.length).toBe(1);

    // Audit logs shouldn't be spammed
    const audits = await prisma.auditLog.findMany({ where: { entityId: firstId, action: 'CREATED' } });
    expect(audits.length).toBe(1);
  });

  it('different keys create different requests', async () => {
    const student = await prisma.user.create({
      data: { id: 'idem-student-3-' + Math.random(), name: 'Student', email: 'idem3-' + Math.random() + '@demo', role: 'Student' }
    });

    const promises = Array.from({ length: 3 }).map((_, i) => RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'WIFI',
      requesterId: student.id,
      description: 'Different key attempt',
      idempotencyKey: 'idem-key-multi-' + Math.random() + '-' + i
    }));

    const results = await Promise.all(promises);

    const ids = new Set(results.map(r => r.id));
    expect(ids.size).toBe(3);

    const totalRequests = await prisma.request.count();
    expect(totalRequests).toBe(3);
  });
});
