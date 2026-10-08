import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import { CommandCenterService } from '../command-center';

describe('R7 - Cross-Module Integration', () => {
  let student1Id: string;
  let student2Id: string;
  let wardenId: string;

  beforeEach(async () => {
    await prisma.evidence.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestAssignment.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.request.deleteMany();
    await prisma.user.delete({ where: { id: 'usr-staff' } }).catch(() => {});
    await prisma.recurringIssue.deleteMany();
    await prisma.policy.deleteMany();
    

    await prisma.policy.create({
      data: {
        name: 'Standard Cleaning Policy',
        domain: 'Cleaning',
        category: 'Cleaning',
        isActive: true,
        slaHours: 24
      }
    });

    await prisma.user.upsert({
      where: { email: 'admin_r7@dormdesk.local' },
      update: {},
      create: { email: 'admin_r7@dormdesk.local', name: 'Admin', role: 'Admin', password: 'hash' }
    });

    const warden = await prisma.user.upsert({
      where: { email: 'warden_r7@dormdesk.local' },
      update: {},
      create: { email: 'warden_r7@dormdesk.local', name: 'Warden', role: 'Warden', hostel: 'Block-A', password: 'hash' }
    });
    wardenId = warden.id;

    const student1 = await prisma.user.upsert({
      where: { email: 'student1_r7@dormdesk.local' },
      update: {},
      create: { email: 'student1_r7@dormdesk.local', name: 'Student 1', role: 'Student', hostel: 'Block-A', password: 'hash' }
    });
    student1Id = student1.id;

    const student2 = await prisma.user.upsert({
      where: { email: 'student2_r7@dormdesk.local' },
      update: {},
      create: { email: 'student2_r7@dormdesk.local', name: 'Student 2', role: 'Student', hostel: 'Block-A', password: 'hash' }
    });
    student2Id = student2.id;
  });

  it('Flow 1: Online Request Full Lifecycle + SLA + Command Center', async () => {
    // 1. Create request
    const req1 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Cleaning',
      description: 'Dirty room',
      location: 'Block-A-101',
      priority: 'HIGH',
      requesterId: student1Id
    });

    expect(req1.status).toBe('PENDING');
    expect(req1.assignedDepartment).toBe('Housekeeping');

    // SLA should exist
    const slaRec = await prisma.requestSLA.findUnique({ where: { requestId: req1.id } });
    expect(slaRec).not.toBeNull();
    expect(slaRec!.status).toBe('ACTIVE');

    // 2. Command Center sees it
    const ccWarden = await CommandCenterService.getDashboard({ id: wardenId, role: 'Warden', hostel: 'Block-A' });
    expect(ccWarden.summary.activeRequests).toBeGreaterThanOrEqual(1);

    // 3. Warden assigns
    const assigned = await RequestEngine.assignRequest({
      requestId: req1.id,
      assigneeId: wardenId,
      actorId: wardenId, department: 'Block-A' });
    expect(assigned.assignedAuthorityId).toBe(wardenId);
    expect(assigned.status).toBe('ASSIGNED');

    // 4. Warden acknowledges, then transitions to PROCESSING
    await RequestEngine.transitionStatus({
      requestId: req1.id,
      newStatus: 'ACKNOWLEDGED',
      actorId: wardenId });
    
    await RequestEngine.transitionStatus({
      requestId: req1.id,
      newStatus: 'PROCESSING',
      actorId: wardenId });

    // 5. Warden adds evidence + transition to RESOLVED
    const resolved = await RequestEngine.transitionStatus({
      requestId: req1.id,
      newStatus: 'RESOLVED',
      actorId: wardenId,
      evidence: [{ type: 'PHOTO', description: 'Fixed pipe', reference: 'http://img.com/pipe' }]
    });
    expect((resolved as { resolvedAt: Date }).resolvedAt).not.toBeNull();

    // SLA should be updated correctly now that it is terminal
    const resolvedSla = await prisma.requestSLA.findUnique({ where: { requestId: req1.id } });
    expect(resolvedSla!.status).toBe('RESOLVED');

    // 6. Student verified
    const verified = await RequestEngine.transitionStatus({
      requestId: req1.id,
      newStatus: 'VERIFIED',
      actorId: student1Id
    });
    expect((verified as { status: string }).status).toBe('CLOSED'); // VERIFIED auto transitions to CLOSED

    const ccWardenAfter = await CommandCenterService.getDashboard({ id: wardenId, role: 'Warden', hostel: 'Block-A' });
    expect(ccWardenAfter.summary.unassigned).toBe(0);
  });

  it('Flow 2: Incident & Recurring Issue clustering', async () => {
    const loc = 'Block-A-Washroom';

    await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Cleaning', location: loc, description: 'Leak 1', requesterId: student1Id });
    await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Cleaning', location: loc, description: 'Leak 2', requesterId: student2Id });
    await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Cleaning', location: loc, description: 'Leak 3', requesterId: student1Id });

    // R3 threshold is 3
    const incidents = await prisma.incident.findMany({ include: { requests: true } });
    expect(incidents.length).toBe(1);
    expect(incidents[0].requests.length).toBe(3);

    // R5 threshold is 3 occurrences. 1 grouped incident = 1 occurrence. Thus, 1 < 3 -> 0 recurring issues.
    const recurring = await prisma.recurringIssue.findMany();
    expect(recurring.length).toBe(0);
  });

  it('Flow 3: Offline Idempotency & Duplicate Safety', async () => {
    const key = 'offline-key-1234';

    const r1 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Electrical',
      description: 'Bulb broken',
      location: 'Room 201',
      requesterId: student1Id,
      idempotencyKey: key
    });

    const r2 = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Electrical',
      description: 'Bulb broken (duplicate sync)',
      location: 'Room 201',
      requesterId: student1Id,
      idempotencyKey: key
    });

    expect(r1.id).toBe(r2.id); // Idempotency returns same request
    
    const count = await prisma.request.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1); // No duplicates
  });

  it('TEST: Verifies Seriousness classification integration', async () => {
    const student1 = await prisma.user.findFirst({ where: { role: 'Student' } });
    if (!student1) return;
    const req = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Ragging',
      description: 'Serious threat',
      requesterId: student1.id
    });
    
    expect(req.isSerious).toBe(true);
    expect(req.seriousCategory).toBe('SAFETY_SENSITIVE_CATEGORY');
    expect(req.status).toBe('ASSIGNED');
    
    const logs = await prisma.auditLog.findMany({ where: { entityId: req.id } });
    expect(logs.some(l => l.action === 'SERIOUSNESS_CLASSIFIED')).toBe(true);
  });
});