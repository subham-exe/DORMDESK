import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../db/prisma';
import { IncidentIntelligenceService } from '../incident-intelligence';

describe('IncidentIntelligenceService', () => {
  let adminId: string;
  let studentId: string;

  beforeEach(async () => {
    // Reset
    await prisma.request.deleteMany();
    await prisma.incident.deleteMany();
    
    let admin = await prisma.user.findFirst({ where: { role: 'Admin' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin_inc_test@dormdesk.local',
          password: 'hash',
          name: 'Admin Test',
          role: 'Admin',
        }
      });
    }
    adminId = admin.id;

    let student = await prisma.user.findFirst({ where: { role: 'Student' } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          email: 'student_inc_test@dormdesk.local',
          password: 'hash',
          name: 'Student Test',
          role: 'Student',
          
        }
      });
    }
    studentId = student.id;
  });

  it('should auto-cluster requests with same category and location', async () => {
    // Create 3 identical requests
    for (let i = 0; i < 3; i++) {
      await prisma.request.create({
        data: {
          ticketNumber: `INC-TEST-${i}`,
          requestType: 'COMPLAINT',
          category: 'Plumbing',
          location: 'Hostel A',
          description: `Leak ${i}`,
          priority: 'MEDIUM',
          status: 'PENDING',
          requesterId: studentId
        }
      });
    }

    const clusters = await IncidentIntelligenceService.autoClusterIncidents(adminId);
    expect(clusters).toBe(1);

    const incidents = await prisma.incident.findMany({ include: { requests: true } });
    expect(incidents.length).toBe(1);
    expect(incidents[0].category).toBe('Plumbing');
    expect(incidents[0].location).toBe('Hostel A');
    expect(incidents[0].requests.length).toBe(3);
    
    expect(incidents[0].groupingReason).toContain("Grouped 3 requests sharing category 'Plumbing' and location 'Hostel A'");
  });

  it('should not cluster if fewer than 3 requests', async () => {
    for (let i = 0; i < 2; i++) {
      await prisma.request.create({
        data: {
          ticketNumber: `INC-TEST2-${i}`,
          requestType: 'COMPLAINT',
          category: 'Plumbing',
          location: 'Hostel B',
          description: `Leak ${i}`,
          priority: 'MEDIUM',
          status: 'PENDING',
          requesterId: studentId
        }
      });
    }

    const clusters = await IncidentIntelligenceService.autoClusterIncidents(adminId);
    expect(clusters).toBe(0);
    const incidents = await prisma.incident.findMany();
    expect(incidents.length).toBe(0);
  });

  it('should calculate impact score deterministically', async () => {
    const inc = await prisma.incident.create({
      data: {
        title: 'Test',
        description: 'Test',
        category: 'Test',
        location: 'Test',
        assignedDepartment: 'General'
      }
    });

    await prisma.request.create({
      data: {
        ticketNumber: `INC-TEST3-1`,
        requestType: 'COMPLAINT',
        category: 'Test',
        location: 'Test',
        description: `Leak`,
        priority: 'CRITICAL',
        status: 'PENDING',
        requesterId: studentId,
        incidentId: inc.id
      }
    });

    await prisma.request.create({
      data: {
        ticketNumber: `INC-TEST3-2`,
        requestType: 'COMPLAINT',
        category: 'Test',
        location: 'Test',
        description: `Leak 2`,
        priority: 'MEDIUM',
        status: 'PENDING',
        requesterId: studentId,
        incidentId: inc.id
      }
    });

    const score = await IncidentIntelligenceService.calculateImpact(inc.id);
    
    // Formula: (requestCount * 2) + (userCount * 5) + priorityScore
    // requestCount = 2 -> 4
    // userCount = 1 -> 5
    // priority = CRITICAL(10) + MEDIUM(2) = 12
    // total = 4 + 5 + 12 = 21
    expect(score).toBe(21);
  });
});
