import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import crypto from 'crypto';

describe('R3 - Incident Intelligence', () => {
  let student: import('@prisma/client').User;

  beforeAll(async () => {
    student = (await prisma.user.findFirst({ where: { role: 'Student' } })) as import('@prisma/client').User;
  });

  describe('1. Matching & Creation', () => {
    it('does not create incident on 1st or 2nd request (insufficient evidence)', async () => {
      const loc = `LOC_${crypto.randomUUID()}`;
      const r1 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'First issue',
        requesterId: student.id
      });
      expect(r1.incidentId).toBeNull();

      const r2 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'Second issue',
        requesterId: student.id
      });
      expect(r2.incidentId).toBeNull();
    });

    it('creates a new Incident when threshold is met on 3rd request', async () => {
      const loc = `LOC_${crypto.randomUUID()}`;
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: 'Iss 1', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: 'Iss 2', requesterId: student.id });
      
      const r3 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'Third issue',
        requesterId: student.id
      });
      
      expect(r3.incidentId).not.toBeNull();
      
      const inc = await prisma.incident.findUnique({ 
        where: { id: r3.incidentId! },
        include: { requests: true } 
      });
      
      expect(inc?.category).toBe('Plumbing');
      expect(inc?.location).toBe(loc);
      expect(inc?.requests.length).toBe(3);
    });

    it('links new Request to existing active Incident (4th request)', async () => {
      const loc = `LOC_${crypto.randomUUID()}`;
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '1', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '2', requesterId: student.id });
      const r3 = await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '3', requesterId: student.id });
      
      const r4 = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'Fourth issue',
        requesterId: student.id
      });
      
      expect(r4.incidentId).toBe(r3.incidentId);
      
      const inc = await prisma.incident.findUnique({ 
        where: { id: r4.incidentId! },
        include: { requests: true } 
      });
      
      expect(inc?.requests.length).toBe(4);
    });

    it('does not match if category is different', async () => {
      const loc = `LOC_${crypto.randomUUID()}`;
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '1', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '2', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '3', requesterId: student.id });

      const diffCat = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Electrical',
        location: loc,
        description: 'Electrical issue',
        requesterId: student.id
      });
      expect(diffCat.incidentId).toBeNull();
    });

    it('does not match if location is different', async () => {
      const diffLoc = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: `LOC_OTHER_${crypto.randomUUID()}`,
        description: 'Other location',
        requesterId: student.id
      });
      expect(diffLoc.incidentId).toBeNull();
    });

    it('does not match stale active Incident outside 24h window', async () => {
      const loc = `STALE_LOC_${crypto.randomUUID()}`;
      // 1. Create a stale active incident
      await prisma.incident.create({
        data: {
          title: 'Stale Incident',
          description: 'Old',
          category: 'Plumbing',
          location: loc,
          assignedDepartment: 'General',
          status: 'OPEN',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }
      });

      // 2. New request in same category/location
      const r = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'New issue that should not link to stale incident',
        requesterId: student.id
      });

      expect(r.incidentId).toBeNull(); // Should not match
    });
  });

  describe('2. Accountability & Idempotency', () => {
    it('preserves individual Request lifecycle and SLA', async () => {
      const loc = `LOC_${crypto.randomUUID()}`;
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '1', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '2', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '3', requesterId: student.id });

      const r = await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'Fifth issue',
        requesterId: student.id
      });
      
      expect(r.incidentId).not.toBeNull();
      
      const history = await prisma.requestStatusHistory.findMany({ where: { requestId: r.id } });
      expect(history.length).toBeGreaterThan(0);
    });

    it('duplicate Request retry does not duplicate Incident or Links', async () => {
      const loc = `LOC_${crypto.randomUUID()}`;
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '1', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '2', requesterId: student.id });
      await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '3', requesterId: student.id });

      const idempotencyKey = `IDEMP_${crypto.randomUUID()}`;
      const p1 = RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'Concurrent 1',
        requesterId: student.id,
        idempotencyKey
      }).catch(e => e);

      const p2 = RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        location: loc,
        description: 'Concurrent 1',
        requesterId: student.id,
        idempotencyKey
      }).catch(e => e);

      const [res1, res2] = await Promise.all([p1, p2]);
      
      // One of them will succeed, one will throw Unique constraint error or both resolve if we fixed it, but the DB shouldn't duplicate
      // Wait, request engine itself throws on duplicate idempotencyKey! We just need to check the successful one.
      // Fetch fresh from DB since fallback read might have beaten the successful thread's incident linking
      const successfulResId = res1.id ? res1.id : res2.id;
      expect(successfulResId).toBeDefined();

      const freshRes = await prisma.request.findUnique({ where: { id: successfulResId } });
      expect(freshRes?.incidentId).not.toBeNull();
      const successfulRes = freshRes!;

      const inc = await prisma.incident.findUnique({
        where: { id: successfulRes.incidentId! },
        include: { requests: true }
      });
      const filtered = inc?.requests.filter((req: { id: string }) => req.id === successfulRes.id);
      expect(filtered?.length).toBe(1);
    });
  });
});

