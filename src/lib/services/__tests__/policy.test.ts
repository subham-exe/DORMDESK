import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PolicyService } from '../policy';
import { PolicyValidator } from '../policy-validator';

const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockFindUnique = vi.fn();
const mockCount = vi.fn();

vi.mock('../audit', () => ({
  AuditService: {
    log: vi.fn(),
  }
}));

vi.mock('../../db/prisma', () => ({
  prisma: {
    policy: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      count: (...args: unknown[]) => mockCount(...args),
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
      mockFindMany.mockResolvedValue([
        { id: 'cat', name: 'Category Match', requestType: null, category: 'Plumbing', isActive: true },
        { id: 'req', name: 'Request Type Match', requestType: 'COMPLAINT', category: null, isActive: true },
      ]);
      const result = await PolicyService.resolvePolicyForRequest({ requestType: 'COMPLAINT', category: 'Plumbing' });
      expect(result.policyId).toBe('cat'); 
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

  describe('Policy CRUD', () => {
    it('creates a policy after validation', async () => {
      mockCreate.mockResolvedValue({ id: 'p1', name: 'Test' });
      
      const created = await PolicyService.createPolicy({
        name: 'Test',
        slaHours: 24
      }, 'admin-1');

      expect(created.id).toBe('p1');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('rejects invalid SLA on creation', async () => {
      await expect(PolicyService.createPolicy({
        name: 'Test',
        slaHours: -5
      }, 'admin-1')).rejects.toThrow('SLA hours must be a non-negative number');
    });

    it('updates a policy safely with version check', async () => {
      mockFindUnique.mockResolvedValue({ id: 'p1', name: 'Existing', version: 2, isActive: true });
      mockUpdate.mockResolvedValue({ id: 'p1', name: 'Updated', version: 3 });
      
      const updated = await PolicyService.updatePolicy('p1', {
        name: 'Updated',
        version: 2
      }, 'admin-1');

      expect(updated.version).toBe(3);
    });

    it('rejects update on stale version', async () => {
      mockFindUnique.mockResolvedValue({ id: 'p1', name: 'Existing', version: 3, isActive: true });
      
      await expect(PolicyService.updatePolicy('p1', {
        name: 'Updated',
        version: 2 // stale
      }, 'admin-1')).rejects.toThrow('CONCURRENCY_CONFLICT');
    });

    it('rejects deactivating the last fallback', async () => {
      mockFindUnique.mockResolvedValue({ id: 'p1', requestType: null, category: null, domain: null, isActive: true });
      mockCount.mockResolvedValue(1); // only 1 fallback
      
      await expect(PolicyService.updatePolicy('p1', {
        name: 'Fallback',
        isActive: false // trying to deactivate
      }, 'admin-1')).rejects.toThrow('SAFETY_VIOLATION');
    });
  });

  describe('PolicyValidator', () => {
    it('validates escalation JSON structure', async () => {
      expect(() => PolicyValidator.validate({
        name: 'Test',
        escalationPolicy: JSON.stringify({ escalateToRole: 'Warden' })
      })).not.toThrow();

      expect(() => PolicyValidator.validate({
        name: 'Test',
        escalationPolicy: JSON.stringify({ escalateToRole: 'InvalidRole' })
      })).toThrow('must be one of');
    });

    it('validates allowedTransitions JSON structure', async () => {
      expect(() => PolicyValidator.validate({
        name: 'Test',
        allowedTransitions: JSON.stringify({ 'Staff': ['RESOLVED'] })
      })).not.toThrow();

      expect(() => PolicyValidator.validate({
        name: 'Test',
        allowedTransitions: JSON.stringify({ 'Student': ['INVALID_STATUS'] })
      })).toThrow('Invalid status in allowedTransitions for role Student: INVALID_STATUS');
    });
  });
});
