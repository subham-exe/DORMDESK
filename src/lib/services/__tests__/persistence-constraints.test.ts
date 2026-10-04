import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Persistence: Constraints (Q2.9)', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();

    try {
      await prisma.emailDeliveryLog.deleteMany();
      await prisma.smsOutbox.deleteMany();
      await prisma.escalation.deleteMany();
      await prisma.requestSLA.deleteMany();
      await prisma.notification.deleteMany();
      await prisma.auditLog.deleteMany();
      await prisma.requestStatusHistory.deleteMany();
      await prisma.requestAssignment.deleteMany();
      await prisma.request.deleteMany();
      await prisma.consentRecord.deleteMany();
      await prisma.policy.deleteMany();
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { startsWith: 'req-tester' } },
            { email: { startsWith: 'staff-' } },
            { email: { startsWith: 'notif@' } },
            { email: { startsWith: 'staff-elec' } },
            { email: { startsWith: 'test-r2' } }
          ]
        }
      });
    } catch (e) {}

  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('enforces ticketNumber uniqueness', async () => {
    const user = await prisma.user.create({
      data: { id: 'usr-pers-constr', email: 'constr@demo.local', name: 'Tester', role: 'Student' }
    });

    await prisma.request.create({
      data: {
        id: 'req-1',
        ticketNumber: 'TKT-001',
        requestType: 'COMPLAINT',
        category: 'Test',
        requesterId: user.id,
        description: 'First',
        status: 'PENDING'
      }
    });

    await expect(prisma.request.create({
      data: {
        id: 'req-2',
        ticketNumber: 'TKT-001', // Duplicate!
        requestType: 'COMPLAINT',
        category: 'Test',
        requesterId: user.id,
        description: 'Second',
        status: 'PENDING'
      }
    })).rejects.toThrow(/Unique constraint failed on the fields: \(`ticketNumber`\)/);
  });

  it('enforces idempotencyKey uniqueness', async () => {
    const user = await prisma.user.create({
      data: { id: 'usr-pers-idem', email: 'idem@demo.local', name: 'Tester', role: 'Student' }
    });

    await prisma.request.create({
      data: {
        id: 'req-idem-1',
        ticketNumber: 'TKT-002',
        requestType: 'COMPLAINT',
        category: 'Test',
        requesterId: user.id,
        description: 'First',
        status: 'PENDING',
        idempotencyKey: 'idem-123'
      }
    });

    await expect(prisma.request.create({
      data: {
        id: 'req-idem-2',
        ticketNumber: 'TKT-003', 
        requestType: 'COMPLAINT',
        category: 'Test',
        requesterId: user.id,
        description: 'Second',
        status: 'PENDING',
        idempotencyKey: 'idem-123' // Duplicate key
      }
    })).rejects.toThrow(/Unique constraint failed on the fields: \(`idempotencyKey`\)/);
  });

  it('enforces Policy name+version uniqueness', async () => {
    await prisma.policy.create({
      data: { name: 'Strict SLA', version: 1, isActive: true }
    });

    await expect(prisma.policy.create({
      data: { name: 'Strict SLA', version: 1, isActive: true }
    })).rejects.toThrow(/Unique constraint failed on the fields: \(`name`,`version`\)/);
    
    // Should succeed with a different version
    await prisma.policy.create({
      data: { name: 'Strict SLA', version: 2, isActive: true }
    });
  });

  it('enforces RequestSLA 1:1 relationship', async () => {
    const user = await prisma.user.create({
      data: { id: 'usr-pers-sla', email: 'sla@demo.local', name: 'Tester', role: 'Student' }
    });

    const req = await prisma.request.create({
      data: {
        id: 'req-sla-1',
        ticketNumber: 'TKT-004',
        requestType: 'COMPLAINT',
        category: 'Test',
        requesterId: user.id,
        description: 'First',
        status: 'PENDING'
      }
    });

    await prisma.requestSLA.create({
      data: {
        id: 'sla-1',
        requestId: req.id,
        targetHours: 24,
        dueAt: new Date()
      }
    });

    await expect(prisma.requestSLA.create({
      data: {
        id: 'sla-2',
        requestId: req.id, // Duplicate requestId on a 1:1 relation
        targetHours: 48,
        dueAt: new Date()
      }
    })).rejects.toThrow(/Unique constraint failed on the fields: \(`requestId`\)/);
  });
});
