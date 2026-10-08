import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { AnnouncementService } from '../announcement';
import { ConsentLedgerService } from '../consent-ledger';
import { NotificationService } from '../notification';
import { EmailService } from '../email/email-service';

describe('Announcement Integration (Email & Consent)', () => {
  let adminId: string;
  let studentGranted: string;
  let studentWithdrawn: string;

  beforeAll(async () => {
    // Basic setup
    const college = await prisma.college.upsert({
      where: { name: 'Test College' },
      update: {},
      create: { name: 'Test College', status: 'ACTIVE' }
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin.ann@example.com',
        name: 'Admin',
        role: 'Admin',
        collegeId: college.id,
        emailVerified: true,
      }
    });
    adminId = admin.id;

    const s1 = await prisma.user.create({
      data: {
        email: 'student.granted@example.com',
        name: 'Student Granted',
        role: 'Student',
        branch: 'CS',
        year: 1,
        collegeId: college.id,
        emailVerified: true,
      }
    });
    studentGranted = s1.id;

    const s2 = await prisma.user.create({
      data: {
        email: 'student.withdrawn@example.com',
        name: 'Student Withdrawn',
        role: 'Student',
        branch: 'CS',
        year: 1,
        collegeId: college.id,
        emailVerified: true,
      }
    });
    studentWithdrawn = s2.id;
  });

  afterAll(async () => {
    await prisma.emailDeliveryLog.deleteMany({ where: { recipientId: { in: [studentGranted, studentWithdrawn] } } });
    await prisma.notification.deleteMany({ where: { recipientId: { in: [studentGranted, studentWithdrawn] } } });
    await prisma.announcementReceipt.deleteMany({ where: { userId: { in: [studentGranted, studentWithdrawn] } } });
    await prisma.consentRecord.deleteMany({ where: { userId: { in: [studentGranted, studentWithdrawn] } } });
    await prisma.auditLog.deleteMany({ where: { actorId: adminId } });
    await prisma.announcement.deleteMany({ where: { createdById: adminId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, studentGranted, studentWithdrawn] } } });
  });

  beforeEach(async () => {
    // Clear delivery logs and notifications before each test
    await prisma.emailDeliveryLog.deleteMany({ where: { recipientId: { in: [studentGranted, studentWithdrawn] } } });
    await prisma.notification.deleteMany({ where: { recipientId: { in: [studentGranted, studentWithdrawn] } } });
    await prisma.announcementReceipt.deleteMany({ where: { userId: { in: [studentGranted, studentWithdrawn] } } });
    
    // Setup Consent
    await ConsentLedgerService.grantConsent({
      userId: studentGranted,
      purpose: 'EMAIL_CAMPUS_ANNOUNCEMENTS',
      consentVersion: '1.0',
      consentText: 'I agree',
      method: 'WEB',
      source: 'student-portal'
    }, studentGranted);

    // Ensure withdrawn
    await prisma.consentRecord.create({
      data: {
        userId: studentWithdrawn,
        purpose: 'EMAIL_CAMPUS_ANNOUNCEMENTS',
        status: 'WITHDRAWN',
        consentVersion: '1.0',
        consentTextHash: 'hash',
        method: 'WEB',
        source: 'student-portal',
        withdrawnAt: new Date()
      }
    });
  });

  it('creates in-app notifications and sends emails ONLY to students with consent', async () => {
    const { announcement, recipientsCount } = await AnnouncementService.create({
      title: 'Important Campus Update',
      body: 'Campus is closed tomorrow due to weather.',
      createdById: adminId,
      targetBranch: 'CS',
      targetYear: 1
    });

    // 1. Both students should get the in-app notification
    const notifications = await prisma.notification.findMany({
      where: { recipientId: { in: [studentGranted, studentWithdrawn] } }
    });
    expect(notifications.length).toBe(2);
    expect(notifications.some(n => n.recipientId === studentGranted)).toBe(true);
    expect(notifications.some(n => n.recipientId === studentWithdrawn)).toBe(true);

    // 2. Only the granted student should get an email delivery log
    const emailLogs = await prisma.emailDeliveryLog.findMany({
      where: { recipientId: { in: [studentGranted, studentWithdrawn] } }
    });
    
    expect(emailLogs.length).toBe(1);
    expect(emailLogs[0].recipientId).toBe(studentGranted);
    expect(emailLogs[0].purpose).toBe('EMAIL_CAMPUS_ANNOUNCEMENTS');
    
    // 3. Duplicate check - Calling create again doesn't magically break things
    // (though Announcements can be created multiple times, the emails should just fire again for the new one)
  });

  it('logs quota usage appropriately for the sent email', async () => {
    // Current date for quota
    const period = new Date().toISOString().substring(0, 7); // YYYY-MM
    const initialQuota = await prisma.emailQuota.findUnique({ where: { id: period }});
    const initialCount = initialQuota ? initialQuota.count : 0;

    await AnnouncementService.create({
      title: 'Another Update',
      body: 'Just a test.',
      createdById: adminId,
      targetBranch: 'CS',
      targetYear: 1
    });

    const newQuota = await prisma.emailQuota.findUnique({ where: { id: period }});
    // Should have incremented by 1 because studentWithdrawn doesn't get an email
    expect(newQuota?.count).toBe(initialCount + 1);
  });
});
