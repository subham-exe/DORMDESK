import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolicyService } from '../policy';

// Mock dependencies
const mockFindMany = vi.fn();
vi.mock('../../db/prisma', () => ({
  prisma: {
    policy: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    }
  }
}));

describe('PolicyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Policy Resolution & Precedence', () => {
    it('returns default fallback when no policies match', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await PolicyService.resolvePolicyForRequest({ requestType: 'UNKNOWN', category: 'UNKNOWN' });
      expect(result.explanation).toContain('falling back to system defaults');
      expect(result.approvalRequired).toBe(true);
    });

    it('selects specific requestType + category over just requestType', async () => {
      mockFindMany.mockResolvedValue([
        { id: '1', name: 'Leave Policy', requestType: 'LEAVE', category: null, approvalRequired: true, isActive: true },
        { id: '2', name: 'Emergency Leave', requestType: 'LEAVE', category: 'Emergency', approvalRequired: false, isActive: true },
      ]);
      const result = await PolicyService.resolvePolicyForRequest({ requestType: 'LEAVE', category: 'Emergency' });
      expect(result.policyId).toBe('2');
      expect(result.policyName).toBe('Emergency Leave');
      expect(result.explanation).toContain('specific request-type and category policy');
    });

    it('selects requestType over global default', async () => {
      mockFindMany.mockResolvedValue([
        { id: '1', name: 'Global', requestType: null, category: null, approvalRequired: true, isActive: true },
        { id: '2', name: 'Leave Policy', requestType: 'LEAVE', category: null, approvalRequired: false, isActive: true },
      ]);
      const result = await PolicyService.resolvePolicyForRequest({ requestType: 'LEAVE', category: 'Normal' });
      expect(result.policyId).toBe('2');
    });

    it('selects category over global default', async () => {
      mockFindMany.mockResolvedValue([
        { id: '1', name: 'Global', requestType: null, category: null, approvalRequired: true, isActive: true },
        { id: '2', name: 'Plumbing Policy', requestType: null, category: 'Plumbing', approvalRequired: false, isActive: true },
      ]);
      const result = await PolicyService.resolvePolicyForRequest({ requestType: 'COMPLAINT', category: 'Plumbing' });
      expect(result.policyId).toBe('2');
      expect(result.explanation).toContain('specific category policy');
    });

    it('handles conflicting policy selection via explicit precedence', async () => {
      // If we have category match and requestType match, which wins?
      // Our logic: categoryRequestTypeMatch > categoryMatch > requestTypeMatch > domainMatch
      mockFindMany.mockResolvedValue([
        { id: 'cat', name: 'Category Match', requestType: null, category: 'Plumbing', isActive: true },
        { id: 'req', name: 'Request Type Match', requestType: 'COMPLAINT', category: null, isActive: true },
      ]);
      const result = await PolicyService.resolvePolicyForRequest({ requestType: 'COMPLAINT', category: 'Plumbing' });
      expect(result.policyId).toBe('cat'); // Category takes precedence over requestType in our implementation
    });
  });

  describe('Leave Auto-Approval Logic', () => {
    const leavePolicy = {
      id: 'leave1',
      name: 'Leave Policy',
      requestType: 'LEAVE',
      approvalRequired: true,
      autoApproveCondition: JSON.stringify({ type: 'LEAVE_DAYS_LESS_THAN_OR_EQUAL', days: 2 }),
      isActive: true,
    };

    it('auto-approves leave <= 2 days', async () => {
      mockFindMany.mockResolvedValue([leavePolicy]);
      const result = await PolicyService.resolvePolicyForRequest(
        { requestType: 'LEAVE', category: 'Normal' },
        { request: { metadata: JSON.stringify({ leaveDays: 2 }) } }
      );
      expect(result.autoApproveAllowed).toBe(true);
      expect(result.explanation).toContain('Auto-approved because leave duration is 2 days or less');
    });

    it('requires approval for leave > 2 days', async () => {
      mockFindMany.mockResolvedValue([leavePolicy]);
      const result = await PolicyService.resolvePolicyForRequest(
        { requestType: 'LEAVE', category: 'Normal' },
        { request: { metadata: JSON.stringify({ leaveDays: 3 }) } }
      );
      expect(result.autoApproveAllowed).toBe(false);
      expect(result.approvalRequired).toBe(true);
      expect(result.explanation).toContain('Not auto-approved because leave duration is invalid or greater than 2 days');
    });
  });

  describe('SLA Target Resolution', () => {
    it('resolves SLA hours from policy', async () => {
      mockFindMany.mockResolvedValue([
        { id: '1', name: 'Complaint Policy', requestType: 'COMPLAINT', slaHours: 24, isActive: true },
      ]);
      const result = await PolicyService.resolvePolicyForRequest({ requestType: 'COMPLAINT', category: 'Plumbing' });
      expect(result.slaHours).toBe(24);
      expect(result.explanation).toContain('SLA target is 24 hours');
    });
  });

  describe('Transition Authorization', () => {
    it('allows valid transition based on policy', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: '1', name: 'Test Policy', isActive: true,
          allowedTransitions: JSON.stringify({ 'Student': ['CANCELLED'] })
        },
      ]);
      const result = await PolicyService.validateTransition(
        { requestType: 'COMPLAINT', category: 'Test' } as unknown as import('@prisma/client').Request,
        'CANCELLED',
        { id: 'u1', role: 'Student' }
      );
      expect(result.valid).toBe(true);
    });

    it('rejects unauthorized transition based on policy', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: '1', name: 'Test Policy', isActive: true,
          allowedTransitions: JSON.stringify({ 'Student': ['CANCELLED'] })
        },
      ]);
      const result = await PolicyService.validateTransition(
        { requestType: 'COMPLAINT', category: 'Test' } as unknown as import('@prisma/client').Request,
        'RESOLVED',
        { id: 'u1', role: 'Student' }
      );
      expect(result.valid).toBe(false);
      expect(result.explanation).toContain('Transition rejected');
    });
  });
});
