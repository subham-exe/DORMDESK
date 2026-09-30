import { describe, it, expect, vi, afterEach } from 'vitest';
import { RoutingEngine } from '../routing-engine';
import { prisma } from '../../db/prisma';

vi.mock('../../db/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}));

describe('R2 - Smart Routing & Classification', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
  });

  describe('Classification & Routing', () => {
    it('classifies deterministic Complaint (Plumbing) to Facilities domain', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        { id: 'staff-1', name: 'Plumber Bob', role: 'Staff', department: 'Plumbing' } as unknown as import('@prisma/client').User
      ]);

      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        description: 'Pipe leaking'
      });

      expect(result.domain).toBe('Facilities');
      expect(result.department).toBe('Plumbing');
      expect(result.authorityRole).toBe('Staff');
      expect(result.authorityUserId).toBe('staff-1');
      expect(result.manualReviewRequired).toBe(false);
      expect(result.safeConfidence).toBe(true);
    });

    it('classifies ambiguous Complaint to manual review', async () => {
      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'COMPLAINT',
        category: 'AlienInvasion',
        description: 'Help'
      });

      expect(result.domain).toBe('System');
      expect(result.manualReviewRequired).toBe(true);
      expect(result.safeConfidence).toBe(false);
      expect(result.authorityUserId).toBeUndefined();
    });

    it('handles multiple authorities by keeping it unassigned', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
        { id: 'staff-1', name: 'Plumber Bob' } as unknown as import('@prisma/client').User,
        { id: 'staff-2', name: 'Plumber Alice' } as unknown as import('@prisma/client').User
      ]);

      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'COMPLAINT',
        category: 'Plumbing',
        description: 'Pipe leaking'
      });

      expect(result.domain).toBe('Facilities');
      expect(result.authorityUserId).toBeUndefined();
      expect(result.manualReviewRequired).toBe(false); // Can be picked up from pool
      expect(result.reason).toContain('Multiple authorities found');
    });

    it('flags for manual review if no authorities found', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'COMPLAINT',
        category: 'Electrical',
        description: 'Wire broke'
      });

      expect(result.domain).toBe('Facilities');
      expect(result.authorityUserId).toBeUndefined();
      expect(result.manualReviewRequired).toBe(true);
      expect(result.safeConfidence).toBe(false);
      expect(result.reason).toContain('No authority found');
    });

    it('classifies academic request as manual review for safe routing', async () => {
      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'CERTIFICATE',
        category: 'Bonafide',
        description: 'Need certificate'
      });

      expect(result.domain).toBe('Academic');
      expect(result.authorityRole).toBe('Faculty');
      expect(result.manualReviewRequired).toBe(true);
    });
    it('classifies fuzzy natural-language requests effectively', async () => {
      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'COMPLAINT',
        category: 'Other', 
        description: 'there is no water in block B' 
      });
      expect(result.classification).toBe('Plumbing');
      expect(result.domain).toBe('Facilities');
      expect(result.manualReviewRequired).toBe(true);
      expect(result.confidence).toBe('LOW');
    });

    it('classifies fuzzy natural-language requests effectively (MEDIUM confidence routes)', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([{ id: 'staff-1', name: 'Plumber Bob' } as unknown as import('@prisma/client').User]);
      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'COMPLAINT',
        category: 'Other', 
        description: 'water tap is broken in washroom' 
      });
      expect(result.classification).toBe('Plumbing');
      expect(result.domain).toBe('Facilities');
      expect(result.manualReviewRequired).toBe(true); 
      expect(result.confidence).toBe('MEDIUM');
    });
    it('prevents false-positive keyword matches using word boundaries', async () => {
      // 'pass' is a signal for Gate Pass. 'passport' should NOT trigger it.
      const result = await RoutingEngine.classifyAndRoute({
        requestType: 'COMPLAINT',
        category: 'Other', 
        description: 'my passport is lost' 
      });
      expect(result.classification).toBe('Other');
      expect(result.score).toBe(0);
      expect(result.confidence).toBe('UNRESOLVED');
    });
  });
});









