import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestEngine } from '../request-engine';

// Mock dependencies
const mockUpdate = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();

vi.mock('../../db/prisma', () => ({
  prisma: {
    request: {
      update: (...args: unknown[]) => mockUpdate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    incident: {
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'admin1', role: 'Admin' })
    },
    policy: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}));

vi.mock('../audit', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../notification', () => ({
  NotificationService: {
    create: vi.fn().mockResolvedValue(true)
  }
}));

describe('RequestEngine', () => {
  let mockDb: Record<string, unknown> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {};
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Mocking internal prisma structures
    mockFindUnique.mockImplementation(({ where }) => {
      // If asking for a user
      if (where.id === 'admin1' || where.id === 'student1') {
        return Promise.resolve({ id: where.id, role: where.id.includes('admin') ? 'Admin' : 'Student' });
      }
      return Promise.resolve(mockDb[where.id] || null);
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Mocking internal prisma structures
    mockUpdate.mockImplementation(({ where, data }) => {
      if (mockDb[where.id]) {
        mockDb[where.id] = { ...(mockDb[where.id] as Record<string, unknown>), ...data };
      }
      return Promise.resolve(mockDb[where.id]);
    });
  });

  const setupRequest = (status: string) => {
    mockDb['req1'] = { id: 'req1', status, requesterId: 'student1' };
  };

  describe('Valid Transitions', () => {
    const validScenarios = [
      { from: 'PENDING', to: 'ASSIGNED' },
      { from: 'PENDING', to: 'APPROVED' },
      { from: 'PENDING', to: 'REJECTED' },
      { from: 'ASSIGNED', to: 'ACKNOWLEDGED' },
      { from: 'ASSIGNED', to: 'RESOLVED' },
      { from: 'ACKNOWLEDGED', to: 'PROCESSING' },
      { from: 'PROCESSING', to: 'RESOLVED' },
      { from: 'RESOLVED', to: 'VERIFIED' },
      { from: 'VERIFIED', to: 'CLOSED' },
    ];

    validScenarios.forEach(({ from, to }) => {
      it(`allows transition from ${from} to ${to}`, async () => {
        setupRequest(from);
        await RequestEngine.transitionStatus({
          requestId: 'req1',
          newStatus: to as 'CLOSED', // Using a valid status type cast to satisfy TS
          actorId: 'admin1',
        });
        
        // Note: VERIFIED auto-transitions to CLOSED, so the final status might be CLOSED
        if (from === 'RESOLVED' && to === 'VERIFIED') {
          expect(mockUpdate).toHaveBeenCalledTimes(2);
        } else {
          expect(mockUpdate).toHaveBeenCalledTimes(1);
          expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: to })
          }));
        }
      });
    });
  });

  describe('Invalid Transitions', () => {
    const invalidScenarios = [
      { from: 'PENDING', to: 'CLOSED' },
      { from: 'PENDING', to: 'VERIFIED' },
      { from: 'CLOSED', to: 'PROCESSING' },
      { from: 'REJECTED', to: 'PROCESSING' },
    ];

    invalidScenarios.forEach(({ from, to }) => {
      it(`rejects transition from ${from} to ${to}`, async () => {
        setupRequest(from);
        await expect(RequestEngine.transitionStatus({
          requestId: 'req1',
          newStatus: to as 'CLOSED',
          actorId: 'admin1',
        })).rejects.toThrow(/Invalid transition/);
        
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Incident Cascade (P1 #2 fix validation)', () => {
    it('successfully cascades ASSIGNED to RESOLVED', async () => {
      setupRequest('ASSIGNED');
      
      await RequestEngine.transitionStatus({
        requestId: 'req1',
        newStatus: 'RESOLVED',
        actorId: 'admin1',
      });
      
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'RESOLVED' })
      }));
    });
  });

  describe('Cancellation', () => {
    it('allows cancelling a PENDING request', async () => {
      setupRequest('PENDING');
      await RequestEngine.transitionStatus({
        requestId: 'req1',
        newStatus: 'CANCELLED',
        actorId: 'student1',
      });
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED' })
      }));
    });

    it('rejects cancelling a RESOLVED request', async () => {
      setupRequest('RESOLVED');
      await expect(RequestEngine.transitionStatus({
        requestId: 'req1',
        newStatus: 'CANCELLED',
        actorId: 'student1',
      })).rejects.toThrow(/Invalid transition/);
    });
  });

  describe('Verification / Terminal behavior', () => {
    it('automatically closes a request when verified', async () => {
      setupRequest('RESOLVED');

      await RequestEngine.transitionStatus({
        requestId: 'req1',
        newStatus: 'VERIFIED',
        actorId: 'student1',
      });

      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockUpdate.mock.calls[0][0].data.status).toBe('VERIFIED');
      expect(mockUpdate.mock.calls[1][0].data.status).toBe('CLOSED');
      expect((mockDb['req1'] as Record<string, unknown>).status).toBe('CLOSED');
    });

    it('sets resolvedAt when moving to terminal state', async () => {
      setupRequest('PROCESSING');
      await RequestEngine.transitionStatus({
        requestId: 'req1',
        newStatus: 'RESOLVED',
        actorId: 'admin1',
      });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ 
          status: 'RESOLVED',
          resolvedAt: expect.any(Date)
        })
      }));
    });

    it('clears resolvedAt when reopening (RESOLVED -> PROCESSING)', async () => {
      setupRequest('RESOLVED');
      await RequestEngine.transitionStatus({
        requestId: 'req1',
        newStatus: 'PROCESSING',
        actorId: 'admin1',
      });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ 
          status: 'PROCESSING',
          resolvedAt: null
        })
      }));
    });
  });
});
