import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { RequestEngine } from '../request-engine';
import { EscalationService } from '../escalation';
import { ConsentLedgerService } from '../consent-ledger';
import { EmailService } from '../email/email-service';

beforeAll(async () => {
    await prisma.college.upsert({ where: { id: 'test-college' }, update: {}, create: { id: 'test-college', name: 'Test College', status: 'ACTIVE' } });
  });

  describe('Phase 6 - Operational Email', () => {
  let student1: string;
  let principal1: string;
  let admin001: string;

  beforeEach(async () => {
    await prisma.college.upsert({ where: { id: 'test-college' }, update: {}, create: { id: 'test-college', name: 'Test College', status: 'ACTIVE' } });
    // await prisma.user.updateMany({ data: { collegeId: 'test-college' } }); /* Removed global pollution */
    await prisma.emailDeliveryLog.deleteMany();
    await prisma.emailQuota.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.requestAssignment.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.notification.deleteMany(); await prisma.request.deleteMany();
    await prisma.consentRecord.deleteMany();
    await prisma.policy.deleteMany();
    await prisma.user.deleteMany({ where: { email: { startsWith: 'p6' } } });
    await prisma.college.deleteMany({ where: { name: { startsWith: 'P6 College' } } });

    const c1 = await prisma.college.create({ data: { name: 'P6 College' } });
    
    // Use existing authority levels from DB seed
    let saAuth = await prisma.authorityLevel.findUnique({ where: { name: 'SYSTEM_ADMIN' } });
    if (!saAuth) saAuth = await prisma.authorityLevel.create({ data: { name: 'SYSTEM_ADMIN' } });
    
    let pAuth = await prisma.authorityLevel.findUnique({ where: { name: 'PRINCIPAL' } });
    if (!pAuth) pAuth = await prisma.authorityLevel.create({ data: { name: 'PRINCIPAL' } });

    const s1 = await prisma.user.create({
      data: {  email: 'p6s1@test.com', name: 'S1', role: 'Student', accountStatus: 'ACTIVE', collegeId: c1.id, emailVerified: true   }
    });
    const p1 = await prisma.user.create({
      data: {  email: 'p6p1@test.com', name: 'P1', role: 'Admin', accountStatus: 'ACTIVE', collegeId: c1.id, authorityId: pAuth.id, emailVerified: true   }
    });
    
    // Find existing SYSTEM_ADMIN because DB trigger enforces singularity (only 1 allowed)
    let sa = await prisma.user.findFirst({ where: { authorityId: saAuth.id } });
    if (!sa) {
      sa = await prisma.user.create({
        data: { email: 'p6sa@test.com', name: '001', role: 'SystemAdmin', accountStatus: 'ACTIVE', authorityId: saAuth.id }
      });
    }

    student1 = s1.id;
    principal1 = p1.id;
    admin001 = sa.id;

    EmailService.getMockProvider().clearSentEmails();
    EmailService.forceMock = true;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.emailDeliveryLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.requestAssignment.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.evidence.deleteMany();
    await prisma.notification.deleteMany(); await prisma.request.deleteMany();
    await prisma.consentRecord.deleteMany();
    await prisma.policy.deleteMany();
    await prisma.user.deleteMany({ where: { email: { startsWith: 'p6' } } });
    await prisma.college.deleteMany({ where: { name: { startsWith: 'P6 College' } } });
  });

  // =========================================================
  // 1. CONSENT BOUNDARIES
  // =========================================================
  describe('Consent & Authorization', () => {
    it('does not send operational email if no consent is granted (even if verified)', async () => {
      await prisma.user.update({ where: { id: student1 }, data: { emailVerified: true } });

      await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Maintenance', description: 'Test', requesterId: student1
      });

      const logs = await prisma.emailDeliveryLog.findMany();
      expect(logs).toHaveLength(0); // Blocked by consent
    });

    it('sends REQUEST updates if EMAIL_REQUEST_NOTIFICATIONS is granted', async () => {
      await ConsentLedgerService.grantConsent({
        userId: student1, purpose: 'EMAIL_REQUEST_NOTIFICATIONS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, student1);

      await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Maintenance', description: 'Test', requesterId: student1
      });

      // No email for CREATED right now (based on RequestEngine not generating REQUEST_ASSIGNED/etc for unassigned)
      // Let's trigger a resolution
      const reqs = await prisma.request.findMany({ where: { requesterId: student1 }});
      
      await RequestEngine.transitionStatus({
        requestId: reqs[0].id, newStatus: 'RESOLVED', actorId: principal1
      });

      const logs = await prisma.emailDeliveryLog.findMany({ where: { recipientId: student1 } });
      expect(logs).toHaveLength(1);
      expect(logs[0].subject).toMatch(/DORMDESK.*Request [Rr]esolved/);
    });

    it('does NOT send REQUEST updates if only CAMPUS_ANNOUNCEMENTS is granted', async () => {
      await ConsentLedgerService.grantConsent({
        userId: student1, purpose: 'EMAIL_CAMPUS_ANNOUNCEMENTS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, student1);

      
        await prisma.policy.create({
          data: {
            name: 'P6 Test Policy ' + crypto.randomUUID(),
            version: 1,
            category: 'Maintenance',
            slaHours: 24,
            escalationPolicy: '{"escalateToRole":"Admin","sendSms":true}'
          }
        });
        const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Maintenance', description: 'Test', requesterId: student1
      });
      await RequestEngine.transitionStatus({
        requestId: req.id, newStatus: 'RESOLVED', actorId: principal1
      });

      const logs = await prisma.emailDeliveryLog.findMany();
      expect(logs).toHaveLength(0);
    });
  });

  // =========================================================
  // 2. IDEMPOTENCY & CONCURRENCY
  // =========================================================
  describe('Idempotency & Failures', () => {
    it('processes SLA Warning only once (idempotency key)', async () => {
      await ConsentLedgerService.grantConsent({
        userId: principal1, purpose: 'EMAIL_SLA_NOTIFICATIONS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, principal1);

      
        await prisma.policy.create({
          data: {
            name: 'P6 Test Policy ' + crypto.randomUUID(),
            version: 1,
            category: 'Maintenance',
            slaHours: 24,
            escalationPolicy: '{"escalateToRole":"Admin","sendSms":true}'
          }
        });
        const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Maintenance', description: 'Test', requesterId: student1
      });
      await RequestEngine.assignRequest({ requestId: req.id, assigneeId: principal1, actorId: 'system-router', department: 'General' });

      // Simulate approaching SLA
      await prisma.request.update({
        where: { id: req.id },
        data: { SLA: 24, dueAt: null, createdAt: new Date(Date.now() - 23.5 * 3600 * 1000) } // 0.5 hours remaining
      });

      const dbReq = await prisma.request.findUnique({ where: { id: req.id } });

      // Run SLA engine concurrently
      await Promise.all([
        EscalationService.triggerEscalationIfRequired(dbReq!, new Date()),
        EscalationService.triggerEscalationIfRequired(dbReq!, new Date()),
        EscalationService.triggerEscalationIfRequired(dbReq!, new Date())
      ]);

      const logs = await prisma.emailDeliveryLog.findMany({ where: { recipientId: principal1, subject: { contains: 'SLA warning' } } });
      expect(logs).toHaveLength(1); // Sent exactly once
    });

    it('provider failure does NOT roll back request resolution', async () => {
      await ConsentLedgerService.grantConsent({
        userId: student1, purpose: 'EMAIL_REQUEST_NOTIFICATIONS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, student1);

      
        await prisma.policy.create({
          data: {
            name: 'P6 Test Policy ' + crypto.randomUUID(),
            version: 1,
            category: 'Maintenance',
            slaHours: 24,
            escalationPolicy: '{"escalateToRole":"Admin","sendSms":true}'
          }
        });
        const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Maintenance', description: 'Test', requesterId: student1
      });

      // Force provider to fail
      EmailService.getMockProvider().shouldFail = true;

      // Execute business action
      const result = await RequestEngine.transitionStatus({
        requestId: req.id, newStatus: 'RESOLVED', actorId: principal1
      }) as import('@prisma/client').Request;

      // Core action MUST succeed
      expect(result.status).toBe('RESOLVED');

      // Email log MUST reflect failure
      const logs = await prisma.emailDeliveryLog.findMany();
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe('FAILED');
    });
  });

  // =========================================================
  // 3. SECURITY & AUTHORITY BOUNDARIES
  // =========================================================
  describe('Security & Authority', () => {
    it('SYSTEM_ADMIN does not get routine escalation unless explicitly targeted', async () => {
      await ConsentLedgerService.grantConsent({
        userId: admin001, purpose: 'EMAIL_SLA_NOTIFICATIONS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, admin001);
      await ConsentLedgerService.grantConsent({
        userId: principal1, purpose: 'EMAIL_SLA_NOTIFICATIONS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, principal1);

      
        await prisma.policy.create({
          data: {
            name: 'P6 Test Policy ' + crypto.randomUUID(),
            version: 1,
            category: 'Maintenance',
            slaHours: 24,
            escalationPolicy: '{"escalateToRole":"Admin","sendSms":true}'
          }
        });
        const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Maintenance', description: 'Test', requesterId: student1
      });

      await prisma.request.update({
        where: { id: req.id },
        data: { SLA: 24, dueAt: null, createdAt: new Date(Date.now() - 25 * 3600 * 1000) } // Breached!
      });
      const dbReq = await prisma.request.findUnique({ where: { id: req.id } });

      await EscalationService.triggerEscalationIfRequired(dbReq!, new Date());

      const logs = await prisma.emailDeliveryLog.findMany();
      // Should escalate to PRINCIPAL of the college, NOT to 001
      const principalLogs = logs.filter(l => l.recipientId === principal1);
      const sysAdminLogs = logs.filter(l => l.recipientId === admin001);

      expect(principalLogs.length).toBeGreaterThan(0); // Principal got it
      expect(sysAdminLogs.length).toBe(0); // System admin did NOT get it
    });
    it('cross-college recipient cannot be selected for escalation', async () => {
      const c2 = await prisma.college.create({ data: { name: 'P6 College 2' } });
      const pAuth = await prisma.authorityLevel.findUnique({ where: { name: 'PRINCIPAL' } });
      const p2 = await prisma.user.create({
        data: {  email: 'p6p2@test.com', name: 'P2', role: 'Admin', accountStatus: 'ACTIVE', collegeId: c2.id, authorityId: pAuth!.id   }
      });

      await ConsentLedgerService.grantConsent({
        userId: p2.id, purpose: 'EMAIL_SLA_NOTIFICATIONS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, p2.id);
      await ConsentLedgerService.grantConsent({
        userId: principal1, purpose: 'EMAIL_SLA_NOTIFICATIONS', consentVersion: '1.0', consentText: 'Yes', method: 'WEB', source: 'student-portal'
      }, principal1);

      // S1 belongs to C1
      
        await prisma.policy.create({
          data: {
            name: 'P6 Test Policy ' + crypto.randomUUID(),
            version: 1,
            category: 'Maintenance',
            slaHours: 24,
            escalationPolicy: '{"escalateToRole":"Admin","sendSms":true}'
          }
        });
        const req = await RequestEngine.createRequest({
        requestType: 'COMPLAINT', category: 'Maintenance', description: 'Test', requesterId: student1
      });

      await prisma.request.update({
        where: { id: req.id },
        data: { SLA: 24, dueAt: null, createdAt: new Date(Date.now() - 25 * 3600 * 1000) } // Breached!
      });
      const dbReq = await prisma.request.findUnique({ where: { id: req.id } });

      await EscalationService.triggerEscalationIfRequired(dbReq!, new Date());

      const logs = await prisma.emailDeliveryLog.findMany();
      const p1Logs = logs.filter(l => l.recipientId === principal1);
      const p2Logs = logs.filter(l => l.recipientId === p2.id);

      expect(p1Logs.length).toBeGreaterThan(0); // P1 got it
      expect(p2Logs.length).toBe(0); // P2 did NOT get it
    });
  });
});
