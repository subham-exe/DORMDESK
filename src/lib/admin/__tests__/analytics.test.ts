import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAPI } from '../api';
import { prisma } from '../../db/prisma';

vi.mock('../../db/prisma', () => ({
  prisma: {
    request: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    }
  }
}));

describe('AdminAPI Analytics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getAnalytics', () => {
    it('calculates resolution metrics correctly including zero cases', async () => {
      const mockRequests = [
        {
          category: 'MAINTENANCE', status: 'RESOLVED', priority: 'HIGH',
          createdAt: new Date('2026-01-01T10:00:00Z'),
          resolvedAt: new Date('2026-01-01T12:00:00Z'), // 2 hours
          dueAt: new Date('2026-01-02T10:00:00Z'),
          updatedAt: new Date()
        },
        {
          category: 'CLEANING', status: 'CLOSED', priority: 'LOW',
          createdAt: new Date('2026-01-01T10:00:00Z'),
          resolvedAt: new Date('2026-01-01T14:00:00Z'), // 4 hours
          dueAt: null,
          updatedAt: new Date()
        },
        {
          category: 'IT', status: 'PENDING', priority: 'MEDIUM',
          createdAt: new Date('2026-01-01T10:00:00Z'),
          resolvedAt: null, // Unresolved
          dueAt: new Date('2026-01-02T10:00:00Z'),
          updatedAt: new Date()
        }
      ];

      (prisma.request.findMany as unknown as import("vitest").Mock).mockResolvedValue(mockRequests);

      const result = await AdminAPI.getAnalytics();
      
      expect(result.totalRequests).toBe(3);
      expect(result.resolvedRequests).toBe(2);
      expect(result.resolution.resolvedCount).toBe(2);
      expect(result.resolution.averageHours).toBe(3); // (2 + 4) / 2
      expect(result.resolution.medianHours).toBe(3);
    });

    it('handles no resolved requests gracefully', async () => {
      (prisma.request.findMany as unknown as import("vitest").Mock).mockResolvedValue([]);
      const result = await AdminAPI.getAnalytics();
      
      expect(result.resolution.resolvedCount).toBe(0);
      expect(result.resolution.averageHours).toBeNull();
      expect(result.resolution.medianHours).toBeNull();
    });
  });

  describe('getStaffWorkload', () => {
    it('aggregates workload correctly', async () => {
      const mockStaff = [
        {
          id: 'staff-1', name: 'John Warden', role: 'Warden',
          requestsAssigned: [
            { status: 'RESOLVED', createdAt: new Date('2026-01-01T10:00:00Z'), resolvedAt: new Date('2026-01-01T15:00:00Z') }, // 5 hrs
            { status: 'IN_PROGRESS', createdAt: new Date('2026-01-01T10:00:00Z'), resolvedAt: null },
            { status: 'PENDING', createdAt: new Date('2026-01-01T10:00:00Z'), resolvedAt: null },
          ]
        },
        {
          id: 'staff-2', name: 'Jane Faculty', role: 'Faculty',
          requestsAssigned: [] // Zero workload staff handled
        }
      ];

      (prisma.user.findMany as unknown as import("vitest").Mock).mockResolvedValue(mockStaff);

      const result = await AdminAPI.getStaffWorkload();
      
      expect(result).toHaveLength(2);
      
      // John
      const john = result.find(r => r.userId === 'staff-1');
      expect(john?.assignedCount).toBe(3);
      expect(john?.activeCount).toBe(2);
      expect(john?.resolvedCount).toBe(1);
      expect(john?.averageResolutionHours).toBe(5);
      
      // Jane
      const jane = result.find(r => r.userId === 'staff-2');
      expect(jane?.assignedCount).toBe(0);
      expect(jane?.activeCount).toBe(0);
      expect(jane?.resolvedCount).toBe(0);
      expect(jane?.averageResolutionHours).toBeNull();
    });
  });
});
