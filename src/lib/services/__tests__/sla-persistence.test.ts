import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { RequestEngine } from '../request-engine';
import { SLAService } from '../sla';
import { PolicyService } from '../policy';

describe('SLA Persistence (Q2.4)', () => {
  beforeEach(async () => {
    await prisma.requestAssignment.deleteMany();
    await prisma.requestStatusHistory.deleteMany();
    await prisma.requestSLA.deleteMany();
    await prisma.request.deleteMany();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('synchronizes Request dueAt and RequestSLA dueAt on creation based on policy', async () => {
    const student = await prisma.user.create({
      data: { id: 'student-sla-' + Math.random(), name: 'Student', email: 'sla1-' + Math.random() + '@demo', role: 'Student' }
    });

    // Create policy targeting 48 hours
    await PolicyService.createPolicy({
      name: 'Maintenance Policy ' + Math.random(),
      domain: 'Hostel',
      category: 'PLUMBING',
      requestType: 'COMPLAINT',
      slaHours: 48,
      escalationPolicy: JSON.stringify({ escalateToRole: 'Warden', sendSms: false })
    }, student.id);

    const start = new Date();
    vi.setSystemTime(start);

    
    await PolicyService.createPolicy({
      name: 'Maintenance Policy ' + Math.random(),
      domain: 'Hostel',
      category: 'OTHER',
      requestType: 'COMPLAINT',
      slaHours: 10,
      escalationPolicy: JSON.stringify({ escalateToRole: 'Warden', sendSms: false })
    }, student.id);

const request = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'PLUMBING',
      requesterId: student.id,
      description: 'Test',
      location: 'Test'
    });

    const requestSla = await prisma.requestSLA.findUnique({ where: { requestId: request.id } });
    expect(requestSla).toBeDefined();
    expect(requestSla!.targetHours).toBe(48);
    expect(requestSla!.dueAt.getTime()).toBe(request.dueAt!.getTime()); // Sync check
    expect(requestSla!.status).toBe('ACTIVE');
  });

  it('updates RequestSLA status to WARNING and BREACHED deterministically', async () => {
    const student = await prisma.user.create({
      data: { id: 'student-sla2-' + Math.random(), name: 'Student', email: 'sla2-' + Math.random() + '@demo', role: 'Student' }
    });

    const request = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'OTHER',
      requesterId: student.id,
      description: 'No Policy test' // Explicit 10h SLA
    });

    let requestSla = await prisma.requestSLA.findUnique({ where: { requestId: request.id } });
    expect(requestSla!.status).toBe('ACTIVE');

    // Advance time to 9.5 hours (WARNING state, < 1 hr remaining)
    const warningTime = new Date(request.createdAt.getTime() + 9.5 * 3600000);
    const evalWarning = await SLAService.evaluate(request, warningTime);
    
    expect(evalWarning!.slaStatus).toBe('WARNING');
    expect(evalWarning!.isBreached).toBe(false);

    requestSla = await prisma.requestSLA.findUnique({ where: { requestId: request.id } });
    expect(requestSla!.status).toBe('WARNING');
    expect(requestSla!.warningAt).toBeDefined();
    
    // Advance to 11 hours (BREACHED state)
    const breachTime = new Date(request.createdAt.getTime() + 11 * 3600000);
    const evalBreach = await SLAService.evaluate(request, breachTime);
    
    expect(evalBreach!.slaStatus).toBe('BREACHED');
    expect(evalBreach!.isBreached).toBe(true);

    requestSla = await prisma.requestSLA.findUnique({ where: { requestId: request.id } });
    expect(requestSla!.status).toBe('BREACHED');
    expect(requestSla!.breachedAt).toBeDefined();
    
    // Test idempotency: evaluating again at 12 hours doesn't overwrite breachedAt
    const breachTime2 = new Date(request.createdAt.getTime() + 12 * 3600000);
    await SLAService.evaluate(request, breachTime2);
    
    const requestSlaFinal = await prisma.requestSLA.findUnique({ where: { requestId: request.id } });
    expect(requestSlaFinal!.breachedAt!.getTime()).toBe(requestSla!.breachedAt!.getTime()); // Should not change
  });

  it('resolves RequestSLA when request is resolved', async () => {
    const student = await prisma.user.create({
      data: { id: 'student-sla3-' + Math.random(), name: 'Student', email: 'sla3-' + Math.random() + '@demo', role: 'Student' }
    });
    
    await PolicyService.createPolicy({
      name: 'Maintenance Policy ' + Math.random(),
      domain: 'Hostel',
      category: 'OTHER',
      requestType: 'COMPLAINT',
      slaHours: 10,
      escalationPolicy: JSON.stringify({ escalateToRole: 'Warden', sendSms: false })
    }, student.id);

const request = await RequestEngine.createRequest({
      requestType: 'COMPLAINT',
      category: 'OTHER',
      requesterId: student.id,
      description: 'Test'
    });

    const staff = await prisma.user.create({
      data: { id: 'staff-sla3-' + Math.random(), name: 'Staff', email: 'staffsla-' + Math.random() + '@demo', role: 'Staff' }
    });

    await RequestEngine.transitionStatus({
      requestId: request.id,
      newStatus: 'RESOLVED',
      actorId: staff.id
    });

    const resolvedReq = await prisma.request.findUnique({ where: { id: request.id } });
    const evalTerminal = await SLAService.evaluate(resolvedReq!, new Date());
    
    expect(evalTerminal).toBeNull(); // Terminal states return null
    
    const requestSla = await prisma.requestSLA.findUnique({ where: { requestId: request.id } });
    expect(requestSla!.status).toBe('RESOLVED');
    expect(requestSla!.resolvedAt).toBeDefined();
  });
});
