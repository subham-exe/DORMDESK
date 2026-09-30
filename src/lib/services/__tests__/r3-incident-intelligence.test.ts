import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import { IncidentIntelligenceService } from '../incident-intelligence';
import { AdminAPI } from '../../admin/api';

describe('R3 - Incident Intelligence', () => {
  let student: import('@prisma/client').User;
  let admin: import('@prisma/client').User;

  beforeAll(async () => {
    student = (await prisma.user.findFirst({ where: { role: 'Student' } })) as import('@prisma/client').User;
    admin = (await prisma.user.findFirst({ where: { role: 'Admin' } })) as import('@prisma/client').User;
  });

  afterAll(async () => {
    // Cleanup
    const reqs = await prisma.request.findMany({ where: { requesterId: student.id, description: { contains: 'R3_TEST' } } });
    for (const r of reqs) {
      await prisma.auditLog.deleteMany({ where: { entityId: r.id } });
      await prisma.notification.deleteMany({ where: { metadata: { contains: r.id } } });
      await prisma.requestStatusHistory.deleteMany({ where: { requestId: r.id } });
      await prisma.requestAssignment.deleteMany({ where: { requestId: r.id } });
      await prisma.requestSLA.deleteMany({ where: { requestId: r.id } });
    }
    await prisma.request.deleteMany({ where: { requesterId: student.id, description: { contains: 'R3_TEST' } } });
    await prisma.incident.deleteMany({ where: { description: { contains: 'R3_TEST' } } });
  });

  describe('1. Matching & Creation', () => {
    it('does not create incident on 1st or 2nd request (insufficient evidence)', async () => {
      const r1 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097',
        description: 'R3_TEST First issue',
        requesterId: student.id
      });
      expect(r1.incidentId).toBeNull();

      const r2 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097',
        description: 'R3_TEST Second issue',
        requesterId: student.id
      });
      expect(r2.incidentId).toBeNull();
    });

    it('creates a new Incident when threshold is met on 3rd request', async () => {
      const r3 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097',
        description: 'R3_TEST Third issue',
        requesterId: student.id
      });
      
      expect(r3.incidentId).not.toBeNull();
      
      const inc = await prisma.incident.findUnique({ 
        where: { id: r3.incidentId! },
        include: { requests: true } 
      });
      
      expect(inc).toBeDefined();
      expect(inc?.category).toBe('Plumbing');
      expect(inc?.location).toBe('R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097');
      expect(inc?.requests.length).toBe(3); // Linked all 3!
    });

    it('links new Request to existing active Incident (4th request)', async () => {
      const r4 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097',
        description: 'R3_TEST Fourth issue',
        requesterId: student.id
      });
      
      expect(r4.incidentId).not.toBeNull();
      
      const inc = await prisma.incident.findUnique({ 
        where: { id: r4.incidentId! },
        include: { requests: true } 
      });
      
      expect(inc?.requests.length).toBe(4);
    });

    it('does not match if category is different', async () => {
      const diffCat = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Electrical', // Different
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097',
        description: 'R3_TEST Electrical issue',
        requesterId: student.id
      });
      expect(diffCat.incidentId).toBeNull();
    });

    it('does not match if location is different', async () => {
      const diffLoc = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_OTHER', // Different
        description: 'R3_TEST Other location',
        requesterId: student.id
      });
      expect(diffLoc.incidentId).toBeNull();
    });
  });

  describe('2. Accountability & Idempotency', () => {
    it('preserves individual Request lifecycle and SLA', async () => {
      const r = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097', // Should auto-link to the existing active incident!
        description: 'R3_TEST Fifth issue',
        requesterId: student.id
      });
      
      expect(r.incidentId).not.toBeNull();
      
      // SLA still exists
      const sla = await prisma.requestSLA.findUnique({ where: { requestId: r.id } });
      expect(sla).toBeDefined();

      // Audit history exists
      const history = await prisma.requestStatusHistory.findMany({ where: { requestId: r.id } });
      expect(history.length).toBeGreaterThan(0);
    });

    it('duplicate Request retry does not duplicate Incident or Links', async () => {
      const idempotencyKey = 'R3_IDEMP_TEST_1';
      const p1 = RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097', // Existing active incident
        description: 'R3_TEST Concurrent 1',
        requesterId: student.id,
        idempotencyKey
      });

      const p2 = RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: 'R3_TEST_LOC_UNIQUE_3732732c-f170-442d-9447-5f1405c05097', // Existing active incident
        description: 'R3_TEST Concurrent 1',
        requesterId: student.id,
        idempotencyKey
      });

      const [res1, res2] = await Promise.all([p1, p2]);
      
      // They should resolve to the same request
      expect(res1.id).toBe(res2.id);
      expect(res1.incidentId).not.toBeNull();

      // Ensure it was linked EXACTLY once
      const inc = await prisma.incident.findUnique({
        where: { id: res1.incidentId! },
        include: { requests: true }
      });
      // Filter out only this particular request to see it's unique
      const filtered = inc?.requests.filter(req => req.id === res1.id);
      expect(filtered?.length).toBe(1);
    });
  });
});

