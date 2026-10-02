import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import { EvidenceService } from '../evidence';
import crypto from 'crypto';

describe('R4 - Accountability & Evidence', () => {
  let student: import('@prisma/client').User;
  let staff: import('@prisma/client').User;
  let admin: import('@prisma/client').User;

  beforeAll(async () => {
    student = await prisma.user.findFirst({ where: { role: 'Student' } }) as import('@prisma/client').User;
    if (!student) {
      student = await prisma.user.create({ data: { email: `r4_student_${crypto.randomUUID()}@test.com`, name: 'R4 Student', role: 'Student' } });
    }
    staff = await prisma.user.findFirst({ where: { role: 'Staff' } }) as import('@prisma/client').User;
    if (!staff) {
      staff = await prisma.user.create({ data: { email: `r4_staff_${crypto.randomUUID()}@test.com`, name: 'R4 Staff', role: 'Staff', department: 'Maintenance' } });
    }
    admin = await prisma.user.findFirst({ where: { role: 'Admin' } }) as import('@prisma/client').User;
    if (!admin) {
      admin = await prisma.user.create({ data: { email: `r4_admin_${crypto.randomUUID()}@test.com`, name: 'R4 Admin', role: 'Admin' } });
    }
  });

  // ─── 1. EVIDENCE MODEL ──────────────────────────────────────
  describe('1. Evidence Model', () => {
    it('creates immutable evidence attached to a Request', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'Dirty room',
        requesterId: student.id
      });

      const ev = await EvidenceService.addEvidence({
        requestId: req.id,
        type: 'IMAGE',
        reference: 'https://storage.local/img1.jpg',
        description: 'Photo of the leak',
        actorId: student.id
      });

      expect(ev.id).toBeDefined();
      expect(ev.requestId).toBe(req.id);
      expect(ev.createdBy).toBe(student.id);

      const logs = await prisma.auditLog.findMany({ where: { entityId: req.id, action: 'EVIDENCE_ADDED' } });
      expect(logs.length).toBe(1);
    });

    it('rejects unauthorized evidence creation (cross-student)', async () => {
      const otherStudent = await prisma.user.create({
        data: { email: `other_${crypto.randomUUID()}@test.com`, name: 'Other', role: 'Student' }
      });

      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'Dirty room',
        requesterId: student.id
      });

      await expect(EvidenceService.addEvidence({
        requestId: req.id,
        type: 'TEXT_NOTE',
        reference: 'I am tampering',
        actorId: otherStudent.id
      })).rejects.toThrow('Not authorized');
    });

    it('allows admin to add evidence to any request', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'Dirty room',
        requesterId: student.id
      });

      const ev = await EvidenceService.addEvidence({
        requestId: req.id,
        type: 'DOCUMENT',
        reference: 'https://storage.local/doc.pdf',
        actorId: admin.id
      });

      expect(ev.createdBy).toBe(admin.id);
    });

    it('allows assigned staff to add evidence', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'Dirty room',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({
        requestId: req.id,
        assigneeId: staff.id,
        department: 'Maintenance',
        actorId: admin.id
      });

      const ev = await EvidenceService.addEvidence({
        requestId: req.id,
        type: 'TEXT_NOTE',
        reference: 'Inspected site, confirmed leak.',
        actorId: staff.id
      });

      expect(ev.createdBy).toBe(staff.id);
    });

    it('rejects evidence for nonexistent request', async () => {
      await expect(EvidenceService.addEvidence({
        requestId: 'nonexistent-id',
        type: 'IMAGE',
        reference: 'img.jpg',
        actorId: student.id
      })).rejects.toThrow('Request not found');
    });
  });

  // ─── 2. ASSIGNMENT ACCOUNTABILITY ───────────────────────────
  describe('2. Assignment Accountability', () => {
    it('preserves assignment history chronologically', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'Dirty room',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({
        requestId: req.id,
        assigneeId: staff.id,
        department: 'Maintenance',
        actorId: admin.id
      });

      await RequestEngine.assignRequest({
        requestId: req.id,
        assigneeId: admin.id,
        department: 'Maintenance',
        actorId: admin.id
      });

      const history = await prisma.requestAssignment.findMany({
        where: { requestId: req.id },
        orderBy: { assignedAt: 'asc' }
      });

      expect(history.length).toBe(2);
      expect(history[0].assigneeId).toBe(staff.id);
      expect(history[1].assigneeId).toBe(admin.id);

      const updatedReq = await prisma.request.findUnique({ where: { id: req.id } });
      expect(updatedReq?.assignedAuthorityId).toBe(admin.id);
    });

    it('records who performed the assignment', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({
        requestId: req.id,
        assigneeId: staff.id,
        department: 'Maintenance',
        actorId: admin.id
      });

      const assignment = await prisma.requestAssignment.findFirst({
        where: { requestId: req.id }
      });

      expect(assignment?.assignedBy).toBe(admin.id);
    });
  });

  // ─── 3. STATUS HISTORY ──────────────────────────────────────
  describe('3. Status History', () => {
    it('records status transitions with actor', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({
        requestId: req.id,
        assigneeId: staff.id,
        department: 'Maintenance',
        actorId: admin.id
      });

      const history = await prisma.requestStatusHistory.findMany({
        where: { requestId: req.id },
        orderBy: { createdAt: 'asc' }
      });

      // PENDING -> ASSIGNED
      const assignTransition = history.find(h => h.toStatus === 'ASSIGNED');
      expect(assignTransition).toBeDefined();
      expect(assignTransition?.fromStatus).toBe('PENDING');
      expect(assignTransition?.actorId).toBe(admin.id);
    });

    it('rejects invalid status transitions', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await expect(RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'CLOSED',
        actorId: admin.id
      })).rejects.toThrow('Invalid transition');
    });

    it('does not create history for invalid transitions', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      const beforeCount = await prisma.requestStatusHistory.count({ where: { requestId: req.id } });

      try {
        await RequestEngine.transitionStatus({
          requestId: req.id,
          newStatus: 'CLOSED',
          actorId: admin.id
        });
      } catch { /* expected */ }

      const afterCount = await prisma.requestStatusHistory.count({ where: { requestId: req.id } });
      expect(afterCount).toBe(beforeCount);
    });
  });

  // ─── 4. RESOLUTION VS VERIFICATION ─────────────────────────
  describe('4. Resolution vs Verification', () => {
    it('allows staff to resolve with evidence', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'Dirty room',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({ requestId: req.id, assigneeId: staff.id, department: 'Maintenance', actorId: admin.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'ACKNOWLEDGED', actorId: staff.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'PROCESSING', actorId: staff.id });

      const resolved = await RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'RESOLVED',
        actorId: staff.id,
        notes: 'Fixed the pipe',
        evidence: [{ type: 'IMAGE', reference: 'https://storage/fixed.jpg', description: 'After fixing' }]
      }) as import('@prisma/client').Request;

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).not.toBeNull();

      const evidence = await prisma.evidence.findMany({ where: { requestId: req.id } });
      expect(evidence.length).toBe(1);
      expect(evidence[0].reference).toBe('https://storage/fixed.jpg');
    });

    it('only the student creator can verify', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({ requestId: req.id, assigneeId: staff.id, department: 'Maintenance', actorId: admin.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'ACKNOWLEDGED', actorId: staff.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'PROCESSING', actorId: staff.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'RESOLVED', actorId: staff.id });

      // Staff cannot verify
      await expect(RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'VERIFIED',
        actorId: staff.id
      })).rejects.toThrow('Only students can verify requests');

      // Admin cannot verify
      await expect(RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'VERIFIED',
        actorId: admin.id
      })).rejects.toThrow('Only students can verify requests');
    });

    it('different student cannot verify another student request', async () => {
      const otherStudent = await prisma.user.create({
        data: { email: `verifier_${crypto.randomUUID()}@test.com`, name: 'Verifier', role: 'Student' }
      });

      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({ requestId: req.id, assigneeId: staff.id, department: 'Maintenance', actorId: admin.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'ACKNOWLEDGED', actorId: staff.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'PROCESSING', actorId: staff.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'RESOLVED', actorId: staff.id });

      await expect(RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'VERIFIED',
        actorId: otherStudent.id
      })).rejects.toThrow('Only the request creator can verify');
    });

    it('verification auto-closes and records both transitions', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({ requestId: req.id, assigneeId: staff.id, department: 'Maintenance', actorId: admin.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'ACKNOWLEDGED', actorId: staff.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'PROCESSING', actorId: staff.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'RESOLVED', actorId: staff.id });

      const closed = await RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'VERIFIED',
        actorId: student.id
      }) as import('@prisma/client').Request;

      expect(closed.status).toBe('CLOSED');

      const history = await prisma.requestStatusHistory.findMany({
        where: { requestId: req.id },
        orderBy: { createdAt: 'asc' }
      });

      const verified = history.find(h => h.toStatus === 'VERIFIED');
      const closedH = history.find(h => h.toStatus === 'CLOSED');
      expect(verified).toBeDefined();
      expect(closedH).toBeDefined();
      expect(verified?.actorId).toBe(student.id);
    });

    it('resolution does not fabricate verification', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({ requestId: req.id, assigneeId: staff.id, department: 'Maintenance', actorId: admin.id });
      await RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'RESOLVED', actorId: staff.id });

      const after = await prisma.request.findUnique({ where: { id: req.id } });
      expect(after?.status).toBe('RESOLVED');

      const history = await prisma.requestStatusHistory.findMany({
        where: { requestId: req.id },
        orderBy: { createdAt: 'asc' }
      });

      // Should NOT contain VERIFIED or CLOSED
      expect(history.find(h => h.toStatus === 'VERIFIED')).toBeUndefined();
      expect(history.find(h => h.toStatus === 'CLOSED')).toBeUndefined();
    });
  });

  // ─── 5. AUDIT LOG ──────────────────────────────────────────
  describe('5. Audit Log Integrity', () => {
    it('records creation, assignment, and status transitions in audit log', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await RequestEngine.assignRequest({
        requestId: req.id,
        assigneeId: staff.id,
        department: 'Maintenance',
        actorId: admin.id
      });

      await RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'RESOLVED',
        actorId: staff.id,
        notes: 'Done'
      });

      const logs = await prisma.auditLog.findMany({
        where: { entityId: req.id },
        orderBy: { timestamp: 'asc' }
      });

      const actions = logs.map(l => l.action);
      expect(actions).toContain('CREATED');
      expect(actions).toContain('ASSIGNED');
      expect(actions).toContain('STATUS_CHANGED');
    });

    it('system actions use null actorId with System Engine name', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      // ROUTED is a system action created during createRequest
      const routedLog = await prisma.auditLog.findFirst({
        where: { entityId: req.id, action: 'ROUTED' }
      });

      expect(routedLog).not.toBeNull();
      expect(routedLog?.actorId).toBeNull();
      expect(routedLog?.actorName).toBe('System Engine');
    });
  });

  // ─── 6. SECURITY ───────────────────────────────────────────
  describe('6. Security', () => {
    it('students cannot reject requests', async () => {
      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await expect(RequestEngine.transitionStatus({
        requestId: req.id,
        newStatus: 'REJECTED',
        actorId: student.id
      })).rejects.toThrow('Students cannot reject requests');
    });

    it('evidence getEvidenceForRequest rejects cross-student access', async () => {
      const otherStudent = await prisma.user.create({
        data: { email: `sec_${crypto.randomUUID()}@test.com`, name: 'SecTest', role: 'Student' }
      });

      const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Cleaning',
        location: `Loc_${crypto.randomUUID()}`,
        description: 'test',
        requesterId: student.id
      });

      await expect(
        EvidenceService.getEvidenceForRequest(req.id, otherStudent.id)
      ).rejects.toThrow('Not authorized');
    });
  });
});
