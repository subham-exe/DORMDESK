/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import { CommandCenterService } from '../command-center';
import { IncidentIntelligenceService } from '../incident-intelligence';
import { syncOfflineMutations } from '../sync-engine-client';
import * as offlineStore from '../offline-store';
import { POST } from '../../../app/api/requests/route';
import { NextRequest } from 'next/server';
import { requireAuth } from '../../auth/session';

// --- MOCKS ---
vi.mock('../offline-store', () => ({
  getOfflineMutations: vi.fn(),
  deleteOfflineMutation: vi.fn(),
  saveOfflineMutation: vi.fn()
}));

vi.mock('../../auth/session', () => ({
  requireAuth: vi.fn()
}));

// Mock global fetch to bridge to the Next.js API route directly
global.fetch = vi.fn(async (url, options) => {
  if (url === '/api/requests' && options.method === 'POST') {
    const req = new NextRequest('http://localhost/api/requests', {
      method: 'POST',
      body: options.body
    });
    const res = await POST(req);
    return {
      ok: res.status === 201 || res.status === 200,
      json: async () => res.json()
    };
  }
  return { ok: false, json: async () => ({ error: 'Not found' }) };
}) as any as typeof fetch;

describe('R8 - Full Integration + Regression', () => {
  let student1Id: string;
  let student2Id: string;
  let wardenId: string;
  let adminId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', { onLine: true });

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

    const admin = await prisma.user.upsert({
      where: { email: 'admin_r8@dormdesk.local' },
      update: {},
      create: { email: 'admin_r8@dormdesk.local', name: 'Admin', role: 'Admin', password: 'hash' }
    });
    adminId = admin.id;

    const warden = await prisma.user.upsert({
      where: { email: 'warden_r8@dormdesk.local' },
      update: {},
      create: { email: 'warden_r8@dormdesk.local', name: 'Warden', role: 'Warden', hostel: 'Block-A', password: 'hash' }
    });
    wardenId = warden.id;

    const student1 = await prisma.user.upsert({
      where: { email: 'student1_r8@dormdesk.local' },
      update: {},
      create: { email: 'student1_r8@dormdesk.local', name: 'Student 1', role: 'Student', hostel: 'Block-A', password: 'hash' }
    });
    student1Id = student1.id;

    const student2 = await prisma.user.upsert({
      where: { email: 'student2_r8@dormdesk.local' },
      update: {},
      create: { email: 'student2_r8@dormdesk.local', name: 'Student 2', role: 'Student', hostel: 'Block-A', password: 'hash' }
    });
    student2Id = student2.id;
  });

  it('Stage A-D: Full Request Lifecycle + SLA + Command Center', async () => {
    // A. Student creates
    const req1 = await RequestEngine.createRequest({
      requestType: String('COMPLAINT') as any,
      category: 'Cleaning',
      description: 'Dirty room',
      location: 'Block-A-101',
      priority: 'HIGH',
      requesterId: student1Id
    });

    expect(req1.status).toBe('PENDING');

    // B. Authority Handling
    const assigned = await RequestEngine.assignRequest({
      requestId: req1.id,
      assigneeId: wardenId,
      actorId: wardenId,
      department: 'Block-A'
    });
    expect(assigned.status).toBe('ASSIGNED');

    await RequestEngine.transitionStatus({
      requestId: req1.id,
      newStatus: 'ACKNOWLEDGED',
      actorId: wardenId
    });

    // C. Evidence + Resolve
    const resolved: any = await RequestEngine.transitionStatus({
      requestId: req1.id,
      newStatus: 'RESOLVED',
      actorId: wardenId,
      evidence: [{ type: 'PHOTO', description: 'Fixed pipe', reference: 'http://img.com/pipe' }]
    });
    expect(resolved.resolvedAt).not.toBeNull();

    // Verify SLA resolves
    const resolvedSla = await prisma.requestSLA.findUnique({ where: { requestId: req1.id } });
    expect(resolvedSla!.status).toBe('RESOLVED');

    // D. Student Verifies
    const verified: any = await RequestEngine.transitionStatus({
      requestId: req1.id,
      newStatus: 'VERIFIED',
      actorId: student1Id
    });
    expect(verified.status).toBe('CLOSED');
  });

  it('Offline -> Online Integration: Actual Path execution', async () => {
    const idempotencyKey = 'offline-sync-r8';
    
    (requireAuth as Mock).mockResolvedValue({ id: student1Id, role: 'Student' });

    (offlineStore.getOfflineMutations as Mock).mockResolvedValue([{
      idempotencyKey,
      userId: student1Id,
      type: 'CREATE_REQUEST',
      payload: { requestType: String('COMPLAINT') as any, category: 'Electrical', description: 'Test', location: 'Block-A-102', idempotencyKey },
      status: 'PENDING_SYNC',
      timestamp: Date.now()
    }]);

    await syncOfflineMutations(student1Id);

    const reqs = await prisma.request.findMany({ where: { idempotencyKey } });
    expect(reqs.length).toBe(1);
    expect(offlineStore.deleteOfflineMutation).toHaveBeenCalledWith(idempotencyKey);
  });

  it('Incident + Recurring Integration (3 -> 1 -> 1)', async () => {
    const loc = 'Block-A-Washroom';

    await RequestEngine.createRequest({ requestType: String('COMPLAINT') as any, category: 'Cleaning', location: loc, description: 'Leak 1', requesterId: student1Id });
    await RequestEngine.createRequest({ requestType: String('COMPLAINT') as any, category: 'Cleaning', location: loc, description: 'Leak 2', requesterId: student2Id });
    await RequestEngine.createRequest({ requestType: String('COMPLAINT') as any, category: 'Cleaning', location: loc, description: 'Leak 3', requesterId: student1Id });

    const incidents = await prisma.incident.findMany({ include: { requests: true } });
    expect(incidents.length).toBe(1);
    expect(incidents[0].requests.length).toBe(3);

    // 1 group -> 1 occurrence. Threshold is 3, so length = 0.
    const recurring = await prisma.recurringIssue.findMany();
    expect(recurring.length).toBe(0);

    // Separate location = independent count
    await RequestEngine.createRequest({ requestType: String('COMPLAINT') as any, category: 'Cleaning', location: 'Different-Room', description: 'Leak', requesterId: student1Id });
    const otherReqs = await prisma.request.count({ where: { location: 'Different-Room' } });
    expect(otherReqs).toBe(1);
  });

  it('Failure Isolation: Intelligence failure does not abort Request', async () => {
    vi.spyOn(IncidentIntelligenceService, 'matchAndLinkNewRequest').mockRejectedValueOnce(new Error('AI Service Down'));
    
    const req = await RequestEngine.createRequest({
      requestType: String('COMPLAINT') as any, category: 'Network', location: 'Block-A', description: 'Test', requesterId: student1Id
    });

    expect(req.id).toBeDefined(); // Still created
    
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: req.id, action: 'INCIDENT_INTELLIGENCE_FAILED' }
    });
    expect(audit).not.toBeNull();
  });

  it('Idempotency / Retry: Concurrent duplicate', async () => {
    const key = 'concurrent-duplicate-key';
    const payload = { requestType: String('COMPLAINT') as any, category: 'Cleaning', location: 'Room', description: 'Test', requesterId: student1Id, idempotencyKey: key };
    
    // Simulate concurrent creation. Prisma P2002 catch will handle it.
    const results = await Promise.allSettled([
      RequestEngine.createRequest(payload),
      RequestEngine.createRequest(payload)
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('fulfilled');

    // Only 1 request should be saved
    const count = await prisma.request.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });

  it('Security Regression: Students cannot perform authority transitions', async () => {
    const req = await RequestEngine.createRequest({
      requestType: String('COMPLAINT') as any, category: 'Cleaning', location: 'Room', description: 'Test', requesterId: student1Id
    });
    await RequestEngine.assignRequest({ requestId: req.id, assigneeId: wardenId, actorId: adminId, department: 'Admin' }); // Status -> ASSIGNED

    await expect(
      RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'ACKNOWLEDGED', actorId: student1Id })
    ).rejects.toThrow('Students cannot perform authority transitions');
  });

  it('Security Regression: Unassigned authority cannot mutate assigned work', async () => {
    const req = await RequestEngine.createRequest({
      requestType: String('COMPLAINT') as any, category: 'Cleaning', location: 'Room', description: 'Test', requesterId: student1Id
    });
    await RequestEngine.assignRequest({ requestId: req.id, assigneeId: adminId, actorId: adminId, department: 'Admin' }); // Assigned to Admin

    await expect(
      RequestEngine.transitionStatus({ requestId: req.id, newStatus: 'ACKNOWLEDGED', actorId: wardenId })
    ).rejects.toThrow('Only the assigned authority or an Admin can perform this transition');
  });

  it('Command Center Scope: Warden only sees own hostel', async () => {
    await RequestEngine.createRequest({ requestType: String('COMPLAINT') as any, category: 'Cleaning', location: 'Block-A', description: 'Test', requesterId: student1Id });
    await RequestEngine.createRequest({ requestType: String('COMPLAINT') as any, category: 'Cleaning', location: 'Block-B', description: 'Test', requesterId: student1Id });

    const ccA = await CommandCenterService.getDashboard({ id: wardenId, role: 'Warden', hostel: 'Block-A' });
    const ccB = await CommandCenterService.getDashboard({ id: wardenId, role: 'Warden', hostel: 'Block-B' });
    const ccAdmin = await CommandCenterService.getDashboard({ id: adminId, role: 'Admin' });

    expect(ccA.summary.activeRequests).toBe(1);
    expect(ccB.summary.activeRequests).toBe(1);
    expect(ccAdmin.summary.activeRequests).toBe(2);
  });
});
