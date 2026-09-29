import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../db/prisma';
import { CommandCenterService } from '../command-center';

describe('CommandCenterService', () => {
  let studentId: string;

  beforeEach(async () => {
    await prisma.request.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.auditLog.deleteMany();

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
    // Unassigned (not stale — created just now)
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

    // Breached SLA (also unassigned and stale — 4 hours > SLA 2h, but < 24h so not stale)
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
        createdAt: new Date(Date.now() - 4 * 3600000)
      }
    });

    // Stale (25h old, also unassigned)
    await prisma.request.create({
      data: {
        ticketNumber: `CC-STALE`,
        requestType: 'COMPLAINT',
        category: 'Test',
        description: 'Stale',
        priority: 'LOW',
        status: 'PENDING',
        requesterId: studentId,
        createdAt: new Date(Date.now() - 25 * 3600000)
      }
    });

    const dashboard = await CommandCenterService.getDashboard();

    expect(dashboard.workload.UNASSIGNED).toBe(3);
    expect(dashboard.workload.BREACHED).toBe(1);

    const allReasons = [
      ...dashboard.unassigned.map(n => n.reason),
      ...dashboard.sla.map(n => n.reason),
      ...dashboard.stale.map(n => n.reason)
    ];

    expect(allReasons).toContain('Unassigned request');
    expect(allReasons.some((r: string) => r.includes('SLA Breached'))).toBe(true);
    expect(allReasons).toContain('Stale: No progress for 24 hours');

    const unassignedItem = dashboard.unassigned.find(n => n.identifier === 'CC-STALE');
    const staleItem = dashboard.stale.find(n => n.identifier === 'CC-STALE');
    expect(unassignedItem).toBeDefined();
    expect(staleItem).toBeDefined();
  });

  it('should handle empty state gracefully', async () => {
    const dashboard = await CommandCenterService.getDashboard();
    expect(dashboard.unassigned.length).toBe(0);
    expect(dashboard.sla.length).toBe(0);
    expect(dashboard.stale.length).toBe(0);
    expect(dashboard.incidents.length).toBe(0);
    expect(dashboard.workload.PENDING).toBe(0);
    expect(dashboard.workload.BREACHED).toBe(0);
    expect(dashboard.workload.UNASSIGNED).toBe(0);
    expect(dashboard.staffWorkload.length).toBe(0);
  });

  it('should not mutate database on getDashboard call', async () => {
    for (let i = 0; i < 3; i++) {
      await prisma.request.create({
        data: {
          ticketNumber: `CC-NOMUTATE-${i}`,
          requestType: 'COMPLAINT',
          category: 'Plumbing',
          location: 'Hostel X',
          description: `Leak ${i}`,
          priority: 'MEDIUM',
          status: 'PENDING',
          requesterId: studentId,
        }
      });
    }

    await CommandCenterService.getDashboard();
    const incidents = await prisma.incident.findMany();
    expect(incidents.length).toBe(0);
  });
});
