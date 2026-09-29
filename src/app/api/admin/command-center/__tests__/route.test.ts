import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

// Mock dependencies
vi.mock('@/lib/admin/api', () => ({
  verifyAdminAuthority: vi.fn().mockRejectedValue(new Error('Unauthorized'))
}));

describe('GET /api/admin/command-center', () => {
  it('should reject non-admin access', async () => {
    const response = await GET();

    expect(response.status).toBe(401);
  });
});
