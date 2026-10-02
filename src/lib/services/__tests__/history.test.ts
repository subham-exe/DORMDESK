import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { RequestEngine } from '../request-engine';
import { AdminAPI } from '@/lib/admin/api';

describe('History and Accountability Persistence (Q2.3)', () => {
  beforeEach(async () => {
    await prisma.requestAssignment.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.request.deleteMany();
    await prisma.user.delete({ where: { id: 'usr-staff' } }).catch(() => {});
  });

  it('preserves chronologically ordered status and assignment history', async () => {
    // 1. Setup
    const nonce = Date.now().toString();
    const student = await prisma.user.create({
      data: { id: `student-${nonce}`, name: 'Student 1', email: `stu-${nonce}@demo.local`, role: 'Student' }
    });
    const warden = await prisma.user.create({
      data: { id: `warden-${nonce}`, name: 'Warden 1', email: `war-${nonce}@demo.local`, role: 'Warden' }
    });
    const staff = await prisma.user.create({
      data: { id: `staff-${nonce}`, name: 'Staff 1', email: `staff-${nonce}@demo.local`, role: 'Staff' }
    });

    // 2. Create Request (creates PENDING history natively)
    const request = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Cleaning',
      requesterId: student.id,
      description: 'Dirty room',
      location: 'Room 101'
    });

    // 3. Assign Request (creates Assignment history and Status history)
    await RequestEngine.assignRequest({
      requestId: request.id,
      assigneeId: warden.id,
      department: 'Warden',
      actorId: warden.id
    });

    // 4. Reassign Request
    await RequestEngine.assignRequest({
      requestId: request.id,
      assigneeId: staff.id,
      department: 'Maintenance',
      actorId: warden.id
    });

    // 5. Transition to RESOLVED
    await RequestEngine.transitionStatus({
      requestId: request.id,
      newStatus: 'RESOLVED',
      actorId: staff.id,
      notes: 'Fixed pipe'
    });

    // Verify DB structural history
    const statusHistory = await prisma.requestStatusHistory.findMany({ where: { requestId: request.id }, orderBy: { createdAt: 'asc' } });
    expect(statusHistory.length).toBe(3); // PENDING, ASSIGNED, RESOLVED
    expect(statusHistory[0].toStatus).toBe('PENDING');
    expect(statusHistory[1].toStatus).toBe('ASSIGNED');
    expect(statusHistory[2].toStatus).toBe('RESOLVED');
    expect(statusHistory[2].actorId).toBe(staff.id);
    expect(statusHistory[2].reason).toBe('Fixed pipe');

    const assignmentHistory = await prisma.requestAssignment.findMany({ where: { requestId: request.id }, orderBy: { assignedAt: 'asc' } });
    expect(assignmentHistory.length).toBe(2); // Warden, Staff
    expect(assignmentHistory[0].assigneeId).toBe(warden.id);
    expect(assignmentHistory[1].assigneeId).toBe(staff.id);

    // Verify Timeline generation via AdminAPI
    // (mocking requireAuth is hard here, but since it's just DB testing for getRequestDetail, we can bypass Auth since we call getRequestDetail directly)
    const detail = await AdminAPI.getRequestDetail(request.id);
    expect(detail).not.toBeNull();
    const events = detail!.events;
    
    // Sort chronological: the API returns descending, so first is newest (RESOLVED)
    // Wait, AdminAPI returns descending (events.sort((a, b) => b.timestamp - a.timestamp))
    expect(events[0].action).toBe('STATUS_CHANGED_RESOLVED');
    expect(events[0].actor.id).toBe(staff.id);
    
    const assignedEvents = events.filter(e => e.action === 'ASSIGNED');
    expect(assignedEvents.length).toBe(2);
    expect(assignedEvents[0].actor.id).toBe(warden.id);
    expect(assignedEvents[0].metadata?.assignedTo).toBe(staff.name);
    
    expect(assignedEvents[1].metadata?.assignedTo).toBe(warden.name);

    const statusEvents = events.filter(e => e.action.startsWith('STATUS_CHANGED'));
    expect(statusEvents.some(e => e.action === 'STATUS_CHANGED_ASSIGNED')).toBe(true);
    
    const hasCreated = events.some(e => e.action === 'CREATED');
    expect(hasCreated).toBe(true);

    // Verify AuditLog identity preservation
    const auditLogs = await prisma.auditLog.findMany({ where: { entityId: request.id } });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].actorName).toBeDefined();
  });
});
