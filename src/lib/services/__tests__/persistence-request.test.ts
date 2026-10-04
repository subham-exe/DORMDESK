import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, Request } from '@prisma/client';
import { RequestEngine } from '../request-engine';
import { PolicyService } from '../policy';
import { SLAService } from '../sla';

describe('Persistence: Request Lifecycle (Q2.9)', () => {
  let mainPrisma: PrismaClient;
  let testUserId: string;
  let testStaffId: string;

  beforeEach(async () => {
    mainPrisma = new PrismaClient();
    try {
      await mainPrisma.emailDeliveryLog.deleteMany();
      await mainPrisma.smsOutbox.deleteMany();
      await mainPrisma.escalation.deleteMany();
      await mainPrisma.requestSLA.deleteMany();
      await mainPrisma.notification.deleteMany();
      await mainPrisma.auditLog.deleteMany();
      await mainPrisma.requestStatusHistory.deleteMany();
      await mainPrisma.requestAssignment.deleteMany();
      await mainPrisma.request.deleteMany();
      await mainPrisma.consentRecord.deleteMany();
      await mainPrisma.policy.deleteMany();
      await mainPrisma.user.deleteMany({
        where: {
          OR: [
            { email: { startsWith: 'req-tester' } },
            { email: { startsWith: 'req-staff' } }
          ]
        }
      });
    } catch (e) {}

    const user = await mainPrisma.user.create({
      data: { id: 'usr-pers-req', email: 'req-tester@demo.local', name: 'Tester', role: 'Student' }
    });
    testUserId = user.id;

    const staff = await mainPrisma.user.create({
      data: { id: 'usr-pers-staff', email: 'req-staff@demo.local', name: 'Staff', role: 'Staff' }
    });
    testStaffId = staff.id;
  });

  afterEach(async () => {
    await mainPrisma.$disconnect();
  });

  it('persists complete lifecycle and survives process reload', async () => {
    await PolicyService.createPolicy({
      name: 'Maintenance Policy',
      domain: 'Hostel',
      category: 'Maintenance',
      requestType: 'COMPLAINT',
      slaHours: 24,
      escalationPolicy: JSON.stringify({ escalateToRole: 'Warden', sendSms: false })
    }, testUserId);

    const req = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Maintenance',
      requesterId: testUserId,
      description: 'End-to-end persistence test',
      location: 'Block A'
    });

    await RequestEngine.assignRequest({
      requestId: req.id,
      assigneeId: testStaffId,
      actorId: testStaffId,
      department: 'Maintenance'
    });

    await RequestEngine.transitionStatus({
      requestId: req.id,
      newStatus: 'ACKNOWLEDGED',
      actorId: testStaffId
    });

    await RequestEngine.transitionStatus({
      requestId: req.id,
      newStatus: 'RESOLVED',
      actorId: testStaffId,
      notes: 'Fixed the issue'
    });

    await RequestEngine.transitionStatus({
      requestId: req.id,
      newStatus: 'VERIFIED',
      actorId: testUserId
    });

    const freshPrisma = new PrismaClient();
    try {
      const persisted = await freshPrisma.request.findUnique({
        where: { id: req.id },
        include: {
          statusHistory: { orderBy: { createdAt: 'asc' } },
          assignmentHistory: { orderBy: { assignedAt: 'asc' } },
          requestSla: true
        }
      });

      expect(persisted).toBeDefined();
      expect(persisted!.status).toBe('CLOSED');
      expect(persisted!.resolvedAt).not.toBeNull();
      
      const statuses = persisted!.statusHistory.map(h => h.toStatus);
      expect(statuses).toEqual(['PENDING', 'ASSIGNED', 'ACKNOWLEDGED', 'RESOLVED', 'VERIFIED', 'CLOSED']);
      
      expect(persisted!.assignmentHistory.length).toBe(1);
      expect(persisted!.assignmentHistory[0].assigneeId).toBe(testStaffId);
      
      expect(persisted!.requestSla).toBeDefined();

      await SLAService.evaluate(persisted as Request, new Date());
      
      const slaCheck = await freshPrisma.requestSLA.findUnique({
        where: { requestId: req.id }
      });
      
      expect(slaCheck!.status).toBe('RESOLVED');
      expect(slaCheck!.resolvedAt).not.toBeNull();
    } finally {
      await freshPrisma.$disconnect();
    }
  });
});
