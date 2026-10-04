import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NotificationService, NotificationType } from '../notification';
import { AuditService } from '../audit';
import { RequestEngine } from '../request-engine';

describe('Persistence: Audit & Notification (Q2.9)', () => {
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

  it('persists real notification records linked to requests', async () => {
    const user = await prisma.user.create({
      data: { id: 'usr-pers-notif', email: 'notif@demo.local', name: 'Tester', role: 'Student' }
    });

    const request = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Test',
      requesterId: user.id,
      description: 'Notif test'
    });

    await NotificationService.create({
      recipientId: user.id,
      title: 'Real Persisted Notification',
      message: 'This is in SQLite',
      type: NotificationType.REQUEST_ASSIGNED,
      metadata: { requestId: request.id }
    });

    const freshPrisma = new PrismaClient();
    try {
      const persisted = await freshPrisma.notification.findFirst({
        where: { recipientId: user.id, type: 'REQUEST_ASSIGNED' },
        include: { request: true, recipient: true }
      });

      expect(persisted).toBeDefined();
      expect(persisted!.title).toBe('Real Persisted Notification');
      expect(persisted!.request).toBeDefined();
      expect(persisted!.request!.id).toBe(request.id);
      expect(persisted!.recipient.name).toBe('Tester');
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('persists real audit records with immutable actor data', async () => {
    const user = await prisma.user.create({
      data: { id: 'usr-pers-audit', email: 'audit@demo.local', name: 'Auditor', role: 'Staff' }
    });

    await AuditService.log({
      action: 'TEST_ACTION',
      actorId: user.id,
      domain: 'Testing',
      targetId: 'test-123',
      metadata: { foo: 'bar' }
    });

    await prisma.user.delete({ where: { id: user.id } });

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'TEST_ACTION' }
    });

    expect(audit).toBeDefined();
    expect(audit!.actorId).toBeNull();
    expect(audit!.actorName).toBe('Auditor'); 
    expect(audit!.actorEmail).toBe('audit@demo.local'); 
    expect(audit!.entityId).toBe('test-123');
    
    expect(JSON.parse(audit!.metadata as string)).toEqual(expect.objectContaining({ foo: 'bar' }));
  });
});
