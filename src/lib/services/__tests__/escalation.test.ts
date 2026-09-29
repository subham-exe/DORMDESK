import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscalationService } from '../escalation';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    escalation: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    }
  }
}));

vi.mock('../policy', () => ({
  PolicyService: {
    resolvePolicyForRequest: vi.fn(),
  }
}));

vi.mock('../notification', () => ({
  NotificationService: {
    create: vi.fn(),
  },
  NotificationType: {
    SLA_WARNING: 'SLA_WARNING',
    SLA_BREACH: 'SLA_BREACH',
    ESCALATION: 'ESCALATION',
  }
}));

vi.mock('../audit', () => ({
  AuditService: {
    log: vi.fn(),
  }
}));

vi.mock('../sms', () => ({
  SmsService: {
    simulateSendSms: vi.fn(),
  }
}));

describe('EscalationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles SLA warning correctly', async () => {
    const { PolicyService } = await import('../policy');
    const { NotificationService } = await import('../notification');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: any = {
      id: 'req-1',
      ticketNumber: 'REQ-123',
      requestType: 'MAINTENANCE',
      SLA: 24,
      createdAt: new Date(Date.now() - 23 * 3600000), // 23 hours ago, 1h remaining
      assignedAuthorityId: 'staff-1',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(PolicyService.resolvePolicyForRequest).mockResolvedValue({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.escalation.create).mockResolvedValue({} as any);

    await EscalationService.triggerEscalationIfRequired(request, new Date());

    expect(prisma.escalation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { requestId: 'req-1', level: 0 }
    }));
    expect(NotificationService.create).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: 'staff-1',
      type: 'SLA_WARNING',
    }));
  });

  it('handles SLA breach correctly and deduplicates', async () => {
    const { PolicyService } = await import('../policy');
    const { NotificationService } = await import('../notification');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: any = {
      id: 'req-2',
      ticketNumber: 'REQ-456',
      requestType: 'COMPLAINT',
      SLA: 24,
      createdAt: new Date(Date.now() - 25 * 3600000), // 25 hours ago, breached
      assignedAuthorityId: 'staff-2',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(PolicyService.resolvePolicyForRequest).mockResolvedValue({
      escalationPolicy: { escalateToRole: 'Admin', sendSms: true }
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'admin-1', role: 'Admin', phone: '1234567890' }
    ] as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.escalation.create).mockResolvedValue({} as any);

    await EscalationService.triggerEscalationIfRequired(request, new Date());

    expect(prisma.escalation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { requestId: 'req-2', level: 1 }
    }));
    
    // Simulate concurrent check where db throws P2002
    vi.mocked(prisma.escalation.create).mockRejectedValueOnce({ code: 'P2002' });
    const createSpy = vi.mocked(NotificationService.create);
    createSpy.mockClear();

    await EscalationService.triggerEscalationIfRequired(request, new Date());
    
    // NotificationService should NOT be called again because P2002 was caught and it returned early
    expect(createSpy).not.toHaveBeenCalled();
  });
});
