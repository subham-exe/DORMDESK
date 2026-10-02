/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';

describe('S - Reliability & Failure Hardening', () => {
  let student1Id: string;
  let student2Id: string;
  let wardenId: string;
  let adminId: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    await prisma.evidence.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestAssignment.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.request.deleteMany();
    await prisma.recurringIssue.deleteMany();
    await prisma.policy.deleteMany();

    const admin = await prisma.user.upsert({
      where: { email: 'admin_s@dormdesk.local' },
      update: {},
      create: { email: 'admin_s@dormdesk.local', name: 'Admin', role: 'Admin', password: 'hash' }
    });
    adminId = admin.id;

    const warden = await prisma.user.upsert({
      where: { email: 'warden_s@dormdesk.local' },
      update: {},
      create: { email: 'warden_s@dormdesk.local', name: 'Warden', role: 'Warden', hostel: 'Block-A', password: 'hash' }
    });
    wardenId = warden.id;

    const student1 = await prisma.user.upsert({
      where: { email: 'student1_s@dormdesk.local' },
      update: {},
      create: { email: 'student1_s@dormdesk.local', name: 'Student 1', role: 'Student', hostel: 'Block-A', password: 'hash' }
    });
    student1Id = student1.id;

    const student2 = await prisma.user.upsert({
      where: { email: 'student2_s@dormdesk.local' },
      update: {},
      create: { email: 'student2_s@dormdesk.local', name: 'Student 2', role: 'Student', hostel: 'Block-A', password: 'hash' }
    });
    student2Id = student2.id;
  });

  it('Cannot transition a CLOSED request', async () => {
    const req = await RequestEngine.createRequest({
      requestType: 'COMPLAINT' as any, category: 'Plumbing', location: 'Room', description: 'Test', requesterId: student1Id
    });
    await RequestEngine.assignRequest({ requestId: req.id, assigneeId: wardenId, actorId: adminId, department: 'Admin' });
    await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'ACKNOWLEDGED', actorId: wardenId });
    await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'RESOLVED', actorId: wardenId });
    await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'VERIFIED', actorId: student1Id });
    
    // Now it's CLOSED
    const closed = await prisma.request.findUnique({ where: { id: req.id } });
    expect(closed!.status).toBe('CLOSED');

    await expect(
      RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'PROCESSING', actorId: wardenId })
    ).rejects.toThrow(/Invalid transition from CLOSED to PROCESSING/);
  });

  it('Cross-user Idempotency Key collision should be rejected', async () => {
    const idempotencyKey = 'shared-key-123';
    // User 1 creates successfully
    await RequestEngine.createRequest({
      requestType: 'COMPLAINT' as any, category: 'Plumbing', location: 'Room', description: 'Test', requesterId: student1Id, idempotencyKey
    });

    // User 2 attempts to use the same key
    await expect(
      RequestEngine.createRequest({
        requestType: 'COMPLAINT' as any, category: 'Plumbing', location: 'Room', description: 'Test', requesterId: student2Id, idempotencyKey
      })
    ).rejects.toThrow(/Idempotency key collision with different user/);
  });

  it('API handles missing body and malformed input safely', async () => {
    // 1. Empty body (Will fail auth due to no session but let's say we test RequestEngine directly instead of API)
    await expect(
      RequestEngine.createRequest({} as any)
    ).rejects.toThrow();

    // 2. Invalid Enum
    await expect(
      RequestEngine.createRequest({ requestType: 'HACK', category: 'Plumbing', description: 'desc', location: 'loc', requesterId: student1Id } as any)
    ).rejects.toThrow();
  });
});
