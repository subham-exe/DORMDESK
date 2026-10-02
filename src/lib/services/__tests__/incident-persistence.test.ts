import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { RequestEngine } from '../request-engine';
import { IncidentIntelligenceService } from '../incident-intelligence';

describe('Incident Persistence (Q2.4)', () => {
  beforeEach(async () => {
    await prisma.requestAssignment.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.request.deleteMany();
    await prisma.incident.deleteMany();
  });

  it('deterministically clusters requests and persists incident grouping reasons', async () => {
    const student = await prisma.user.create({
      data: { id: 'student-inc-' + Math.random(), name: 'Student', email: 'inc1-' + Math.random() + '@demo', role: 'Student' }
    });

    for (let i = 0; i < 3; i++) {
      await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'WIFI',
        location: 'Block A',
        requesterId: student.id,
        description: 'No internet'
      });
    }

    // R3 matchAndLinkNewRequest creates the incident inline on the 3rd request.
    // autoClusterIncidents should find 0 unclustered requests.
    const clustersCreated = await IncidentIntelligenceService.autoClusterIncidents(student.id);
    expect(clustersCreated).toBe(0);

    const incidents = await prisma.incident.findMany({ include: { requests: true } });
    expect(incidents.length).toBe(1);
    const incident = incidents[0];
    
    expect(incident.requests.length).toBe(3);

    for (const req of incident.requests) {
      expect(req.incidentId).toBe(incident.id);
    }
    
    await prisma.incident.delete({ where: { id: incident.id } });
    
    const remainingRequests = await prisma.request.findMany();
    expect(remainingRequests.length).toBe(3);
    for (const req of remainingRequests) {
      expect(req.incidentId).toBeNull();
    }
  });

  it('safely handles repeated clustering without duplicate incidents', async () => {
    const student = await prisma.user.create({
      data: { id: 'student-inc2-' + Math.random(), name: 'Student', email: 'inc2-' + Math.random() + '@demo', role: 'Student' }
    });

    for (let i = 0; i < 3; i++) {
      await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'WIFI',
        location: 'Block A',
        requesterId: student.id,
        description: 'No internet'
      });
    }

    await IncidentIntelligenceService.autoClusterIncidents(student.id);
    
    // Add 3 more so it meets the threshold to cluster again
    for (let i = 0; i < 3; i++) {
      await RequestEngine.createRequest({
        requestType: 'COMPLAINT',
        category: 'WIFI',
        location: 'Block A',
        requesterId: student.id,
        description: 'No internet'
      });
    }

    const clustersCreated = await IncidentIntelligenceService.autoClusterIncidents(student.id);
    expect(clustersCreated).toBe(0); // 0 NEW clusters

    const incidents = await prisma.incident.findMany({ include: { requests: true } });
    expect(incidents.length).toBe(1);
    expect(incidents[0].requests.length).toBe(6);
  });
});
