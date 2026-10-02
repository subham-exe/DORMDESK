import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import { RecurringIssueService } from '../recurring-issue';

import crypto from 'crypto';

describe('R5 - Recurring Issue Detection', () => {
  let adminId: string;
  let studentId: string;

  beforeAll(async () => {
    let admin = await prisma.user.findFirst({ where: { role: 'Admin' } });
    if (!admin) {
      admin = await prisma.user.create({ data: { email: `admin_${crypto.randomUUID()}@r5.local`, name: 'Admin', role: 'Admin' } });
    }
    adminId = admin.id;

    let student = await prisma.user.findFirst({ where: { role: 'Student' } });
    if (!student) {
      student = await prisma.user.create({ data: { email: `student_${crypto.randomUUID()}@r5.local`, name: 'Student', role: 'Student' } });
    }
    studentId = student.id;
  });

  describe('1. Detection Boundaries', () => {
    it('does not detect recurring issue if below threshold (2 occurrences)', async () => {
      const loc = `Loc_Below_${crypto.randomUUID()}`;
      
      await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Electrical', location: loc, description: 'Flickering light', requesterId: studentId
      });

      // Need to force time difference so they don't cluster into ONE incident.
      // Wait, R3 clustering uses 24h window. If they are created now, they might cluster into ONE incident.
      // So they count as ONE occurrence. Let's create two standalone incidents manually to simulate past occurrences.
      
      await prisma.incident.create({
        data: {
          title: 'Past 1', description: 'Past', category: 'Electrical', location: loc, assignedDepartment: 'General',
          createdAt: new Date(Date.now() - 5 * 86400000)
        }
      });

      // Now we have 2 incidents. Let's run detection.
      const recurring = await RecurringIssueService.detectRecurring('Electrical', loc, adminId);
      expect(recurring).toBeNull();
    });

    it('detects recurring issue exactly at threshold (3 occurrences)', async () => {
      const loc = `Loc_Exact_${crypto.randomUUID()}`;
      
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 5 * 86400000) }});
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 6 * 86400000) }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 7 * 86400000) }});

      const recurring = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      expect(recurring).not.toBeNull();
      expect(recurring?.occurrenceCount).toBe(3);
      expect(recurring?.status).toBe('ACTIVE');
    });

    it('above threshold updates the SAME recurring issue', async () => {
      const loc = `Loc_Above_${crypto.randomUUID()}`;
      
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 5 * 86400000) }});
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 6 * 86400000) }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 7 * 86400000) }});

      const rec1 = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      expect(rec1?.occurrenceCount).toBe(3);

      await prisma.incident.create({ data: { title: '4', description: '4', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 2 * 86400000) }});
      
      const rec2 = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      expect(rec2?.id).toBe(rec1?.id);
      expect(rec2?.occurrenceCount).toBe(4);
    });

    it('different category or location does not trigger match', async () => {
      const loc = `Loc_Diff_${crypto.randomUUID()}`;
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 5 * 86400000) }});
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 6 * 86400000) }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Electrical', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 7 * 86400000) }}); // Diff category

      const recurringPlumbing = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      expect(recurringPlumbing).toBeNull(); // Only 2 plumbing
    });

    it('outside historical window (30 days) is excluded', async () => {
      const loc = `Loc_Old_${crypto.randomUUID()}`;
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 40 * 86400000) }}); // 40 days ago
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 35 * 86400000) }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date(Date.now() - 5 * 86400000) }}); // 1 valid

      const recurring = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      expect(recurring).toBeNull(); // Only 1 in window
    });
  });

  describe('2. Occurrence Semantics', () => {
    it('multiple Requests in one Incident count as 1 occurrence', async () => {
      const loc = `Loc_Cluster_${crypto.randomUUID()}`;
      
      await await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '1', requesterId: studentId });
      await await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '2', requesterId: studentId });
      await await RequestEngine.createRequest({ requestType: 'COMPLAINT', category: 'Plumbing', location: loc, description: '3', requesterId: studentId });

      // This should auto-cluster into 1 incident via R3
      const inc = await prisma.incident.findFirst({ where: { category: 'Plumbing', location: loc } });
      expect(inc).not.toBeNull();

      // There is only 1 incident and 0 standalone requests.
      const recurring = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      expect(recurring).toBeNull(); // 1 occurrence is < 3
    });

    it('resolved historical incidents remain eligible for recurrence', async () => {
      const loc = `Loc_Resolved_${crypto.randomUUID()}`;
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General', status: 'RESOLVED', createdAt: new Date(Date.now() - 5 * 86400000) }});
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General', status: 'RESOLVED', createdAt: new Date(Date.now() - 6 * 86400000) }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Plumbing', location: loc, assignedDepartment: 'General', status: 'OPEN', createdAt: new Date(Date.now() - 1 * 86400000) }});

      const recurring = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      expect(recurring?.occurrenceCount).toBe(3);
    });
  });

  describe('3. Duplicate Prevention & Concurrency', () => {
    it('same Incident evaluated twice does not duplicate RecurringIssue', async () => {
      const loc = `Loc_Dup_${crypto.randomUUID()}`;
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date() }});
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date() }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date() }});

      await await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);
      await await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);

      const issues = await prisma.recurringIssue.findMany({ where: { category: 'Plumbing', location: loc } });
      expect(issues.length).toBe(1);
      
      const count = await prisma.recurringIssue.count({ where: { category: 'Plumbing', location: loc } });
      expect(count).toBe(1);
    });

    it('concurrent detection yields one record', async () => {
      const loc = `Loc_Conc_${crypto.randomUUID()}`;
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date() }});
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date() }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Plumbing', location: loc, assignedDepartment: 'General', createdAt: new Date() }});

      await Promise.all([
        RecurringIssueService.detectRecurring('Plumbing', loc, adminId),
        RecurringIssueService.detectRecurring('Plumbing', loc, adminId)
      ]);

      // Due to in-memory lock, r_temp might be null, but DB won't have 2 records
      const count = await prisma.recurringIssue.count({ where: { category: 'Plumbing', location: loc } });
      expect(count).toBe(1);
    });
  });

  describe('4. Accountability & Audit', () => {
    it('preserves underlying Requests, Incidents, and logs detection', async () => {
      const loc = `Loc_Acct_${crypto.randomUUID()}`;
      await prisma.incident.create({ data: { title: '1', description: '1', category: 'Plumbing', location: loc, assignedDepartment: 'General' }});
      await prisma.incident.create({ data: { title: '2', description: '2', category: 'Plumbing', location: loc, assignedDepartment: 'General' }});
      await prisma.incident.create({ data: { title: '3', description: '3', category: 'Plumbing', location: loc, assignedDepartment: 'General' }});

      const recurring = await RecurringIssueService.detectRecurring('Plumbing', loc, adminId);

      const incidents = await prisma.incident.findMany({ where: { location: loc } });
      expect(incidents.length).toBe(3);
      for (const inc of incidents) {
        expect(inc.recurringIssueId).toBe(recurring?.id);
      }

      const logs = await prisma.auditLog.findMany({ where: { entityId: recurring?.id } });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('RECURRING_ISSUE_DETECTED');
    });
  });
});
