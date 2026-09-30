import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

describe('Persistence: Seed & Integration Verification (Q2.9)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    execSync('node prisma/seed.js', { stdio: 'ignore' });
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('verifies the full seeded relationship graph for the Plumbing breached request', async () => {
    const student = await prisma.user.findUnique({ where: { id: 'usr-student' } });
    expect(student).toBeDefined();

    const request = await prisma.request.findFirst({
      where: { requesterId: student!.id, category: 'Plumbing', status: 'PENDING' },
      include: {
        policy: true,
        requestSla: true,
        escalations: true,
        statusHistory: true
      }
    });

    expect(request).toBeDefined();
    expect(request!.ticketNumber).toMatch(/^PLM-\d{4}$/);
    
    expect(request!.requestSla).toBeDefined();
    expect(request!.requestSla!.targetHours).toBe(12);

    expect(request!.escalations.length).toBeGreaterThan(0);
    expect(request!.escalations[0].level).toBe(1);

    const notifs = await prisma.notification.findMany({
      where: { recipientId: 'usr-warden', type: 'ESCALATION' }
    });
    expect(notifs.length).toBeGreaterThan(0);
    
    const sms = await prisma.smsOutbox.findFirst({
      where: { recipientId: 'usr-warden', referenceId: request!.id }
    });
    expect(sms).toBeDefined();
    expect(sms!.status).toBe('SIMULATED_SENT');
  });

  it('verifies the auto-clustered incident data state (Q2.4 integration)', async () => {
    const peers = await prisma.user.findMany({
      where: { id: { startsWith: 'usr-peer-' } }
    });
    
    expect(peers.length).toBeGreaterThanOrEqual(2);

    const pendingRequests = await prisma.request.findMany({
      where: { category: 'Plumbing', status: 'ASSIGNED', assignedAuthorityId: 'usr-staff' }
    });
    
    expect(pendingRequests.length).toBeGreaterThanOrEqual(2);
    expect(pendingRequests[0].incidentId).toBeNull();
  });
});
