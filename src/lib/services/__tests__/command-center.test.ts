import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../db/prisma';
import { CommandCenterService } from '../command-center';

describe('CommandCenterService', () => {
  let adminId: string;
  let studentId: string;

  beforeEach(async () => {
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

    const dashboard = await CommandCenterService.getDashboard(adminId);

    expect(dashboard.workload.UNASSIGNED).toBe(3);
    expect(dashboard.workload.BREACHED).toBe(1);

    // Check needsAttention: items have reasons arrays, not a single reason string
    const allReasons = dashboard.needsAttention.flatMap(n => n.reasons);
    expect(allReasons).toContain('Unassigned request');
    expect(allReasons).toContain('SLA Breached');
    expect(allReasons).toContain('Stale: No progress for 24 hours');

    // The stale request should have BOTH "Unassigned" and "Stale" reasons
    const staleItem = dashboard.needsAttention.find(n => n.identifier === 'CC-STALE');
    expect(staleItem).toBeDefined();
    expect(staleItem!.reasons).toContain('Unassigned request');
    expect(staleItem!.reasons).toContain('Stale: No progress for 24 hours');
  });

  it('should handle empty state gracefully', async () => {
    const dashboard = await CommandCenterService.getDashboard(adminId);
    expect(dashboard.needsAttention.length).toBe(0);
    expect(dashboard.incidents.length).toBe(0);
    expect(dashboard.workload.PENDING).toBe(0);
    expect(dashboard.workload.BREACHED).toBe(0);
    expect(dashboard.workload.UNASSIGNED).toBe(0);
    expect(dashboard.staffWorkload.length).toBe(0);
  });

  it('should not mutate database on getDashboard call', async () => {
    // Create 3 matching complaint requests (enough to trigger auto-clustering)
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

    // getDashboard should NOT auto-cluster
    await CommandCenterService.getDashboard(adminId);

    const incidents = await prisma.incident.findMany();
    expect(incidents.length).toBe(0); // No incidents created by a read operation
  });
});
