import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../db/prisma';
import { CommandCenterService } from '../command-center';
import { SLAService } from '../sla';

describe('CommandCenterService', () => {
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
          email: 'admin_cc_test@dormdesk.local',
          password: 'hash',
          name: 'Admin CC',
          role: 'Admin',
        }
      });
    }
    adminId = admin.id;

    let student = await prisma.user.findFirst({ where: { role: 'Student' } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          email: 'student_cc_test@dormdesk.local',
          password: 'hash',
          name: 'Student CC',
          role: 'Student',
          
        }
      });
    }
    studentId = student.id;
  });

  it('should surface unassigned, breached SLA, and stale requests', async () => {
    // Unassigned
    await prisma.request.create({
      data: {
        ticketNumber: `CC-UNASSIGNED`,
        requestType: 'COMPLAINT',
        category: 'Test',
        description: 'Need help',
        priority: 'LOW',
        status: 'PENDING',
        requesterId: studentId,
      }
    });

    // Breached
    await prisma.request.create({
      data: {
        ticketNumber: `CC-BREACHED`,
        requestType: 'COMPLAINT',
        category: 'Test',
        description: 'Need help now',
        priority: 'CRITICAL',
        status: 'PENDING',
        requesterId: studentId,
        SLA: 2,
        createdAt: new Date(Date.now() - 4 * 3600000) // 4 hours ago, SLA is 2 hours
      }
    });

    // Stale
    await prisma.request.create({
      data: {
        ticketNumber: `CC-STALE`,
        requestType: 'COMPLAINT',
        category: 'Test',
        description: 'Stale',
        priority: 'LOW',
        status: 'PENDING',
        requesterId: studentId,
        createdAt: new Date(Date.now() - 25 * 3600000) // 25 hours ago, no assignment
      }
    });

    const dashboard = await CommandCenterService.getDashboard(adminId);
    
    expect(dashboard.workload.UNASSIGNED).toBe(3); // All are unassigned
    expect(dashboard.workload.BREACHED).toBe(1);
    
    // Check needsAttention array
    const reasons = dashboard.needsAttention.map(n => n.reason);
    expect(reasons).toContain('Unassigned request');
    expect(reasons).toContain('SLA Breached');
    expect(reasons).toContain('Stale: No progress for 24 hours');
  });

  it('should handle empty state gracefully', async () => {
    // Clear out requests (done in beforeEach anyway)
    const dashboard = await CommandCenterService.getDashboard(adminId);
    expect(dashboard.needsAttention.length).toBe(0);
    expect(dashboard.incidents.length).toBe(0);
  });
});
