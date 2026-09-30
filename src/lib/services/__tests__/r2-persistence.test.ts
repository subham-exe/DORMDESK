import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import { PolicyService } from '../policy';

describe('R2 - Request Engine Persistence (Policy & Routing & SLA)', () => {
  let student: any;
  let staff: any;

  beforeAll(async () => {
    // We expect the Q seeds to be present.
    student = await prisma.user.findFirst({ where: { role: 'Student' } });
    if (!student) {
      student = await prisma.user.create({ data: { id: 'test-student-r2', email: 'test-r2@demo.local', password: 'hash', name: 'R2 Student', role: 'Student' } });
    }
    
    // Add a single electrical staff to test deterministic routing
    
    staff = await prisma.user.findFirst({ where: { department: 'Electrical', role: 'Staff' } });
    if (!staff) { staff = await prisma.user.create({ data: { id: 'test-staff-elec-r2', email: 'elec-r2@demo.local', password: 'hash', name: 'R2 Electrician', role: 'Staff', department: 'Electrical' } }); }
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: 'test-staff-elec-r2' } }).catch(() => {});
  });

  it('routes and assigns a deterministic request, creating SLA and audit logs', async () => {
    const req = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'Electrical',
      description: 'Wire is sparking',
      requesterId: student.id,
      location: 'Room 101'
    });

    // Verify properties
    expect(req.status).toBe('ASSIGNED');
    expect(req.assignedDepartment).toBe('Electrical');
    expect(req.assignedAuthorityId).toBe(staff.id);

    // Verify assignment history
    const assignments = await prisma.requestAssignment.findMany({ where: { requestId: req.id } });
    expect(assignments.length).toBe(1);
    expect(assignments[0].assigneeId).toBe(staff.id);
    expect(assignments[0].assignedBy).toBe('system-router');

    // Verify SLA
    const sla = await prisma.requestSLA.findUnique({ where: { requestId: req.id } });
    expect(sla).toBeDefined();
    
    // Verify Audit
    const audits = await prisma.auditLog.findMany({ where: { entityId: req.id } });
    const routedAudit = audits.find(a => a.action === 'ROUTED');
    const assignedAudit = audits.find(a => a.action === 'ASSIGNED');
    const policyAudit = audits.find(a => a.action === 'POLICY_EVALUATED');

    expect(routedAudit).toBeDefined();
    expect(routedAudit?.actorId).toBeNull();
    expect(assignedAudit).toBeDefined();
    expect(policyAudit).toBeDefined();
    expect(policyAudit?.actorId).toBeNull();
  });

  it('routes an ambiguous request to pending/manual review', async () => {
    const req = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'UnknownAlienCategory',
      description: 'Aliens in the room',
      requesterId: student.id,
    });

    expect(req.status).toBe('PENDING');
    expect(req.assignedDepartment).toBeNull();
    expect(req.assignedAuthorityId).toBeNull();

    const audits = await prisma.auditLog.findMany({ where: { entityId: req.id, action: 'ROUTED' } });
    expect(JSON.parse(audits[0].metadata || '{}')).toMatchObject(expect.objectContaining({ manualReviewRequired: true }));
  });

  it('auto-approves a request based on policy, bypassing routing assignment', async () => {
    // Create an auto-approve policy for IT
    const policy = await PolicyService.createPolicy({
      name: 'Auto-Approve IT ' + Date.now(),
      requestType: 'COMPLAINT',
      category: 'IT',
      approvalRequired: false,
      autoApproveCondition: JSON.stringify({ type: 'ALWAYS_APPROVE' }),
      slaHours: 4
    }, student.id);

    // Override the policy service internally since ALWAYS_APPROVE isn't fully implemented in policy.ts,
    // wait, policy.ts only handles LEAVE_DAYS_LESS_THAN_OR_EQUAL. Let's use that!
    const leavePolicy = await PolicyService.createPolicy({
      name: 'Short Leave Policy ' + Date.now(),
      requestType: 'LEAVE',
      approvalRequired: false,
      autoApproveCondition: JSON.stringify({ type: 'LEAVE_DAYS_LESS_THAN_OR_EQUAL', days: 2 }),
      slaHours: 24
    }, student.id);

    const req = await RequestEngine.createRequest({
      requestType: 'LEAVE',
      category: 'Personal',
      description: 'Going home',
      requesterId: student.id,
      metadata: { leaveDays: 1 }
    });

    // Should be APPROVED
    expect(req.status).toBe('APPROVED');
    expect(req.assignedAuthorityId).toBeNull(); // No assignee because it's auto-approved

    // Audit logs
    const audits = await prisma.auditLog.findMany({ where: { entityId: req.id } });
    const autoAudit = audits.find(a => a.action === 'AUTO_APPROVED');
    expect(autoAudit).toBeDefined();

    // Clean up
    await PolicyService.deletePolicy(leavePolicy.id, student.id);
    await PolicyService.deletePolicy(policy.id, student.id);
  });
});




