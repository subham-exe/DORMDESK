/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';
import { requireAuth } from '../../../../../lib/auth/session';
import { AnnouncementService } from '../../../../../lib/services/announcement';

vi.mock('../../../../../lib/auth/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('../../../../../lib/services/announcement', () => ({
  AnnouncementService: { create: vi.fn() },
}));

describe('POST /api/admin/announcements', () => {
  it('rejects Student role', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'u1', role: 'Student' });
    const req = { json: async () => ({ title: 'Test', body: 'Body' }) } as Request;
    
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('accepts Admin role', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'u1', role: 'Admin' });
    (AnnouncementService.create as any).mockResolvedValue({ id: 'a1' });
    const req = { json: async () => ({ title: 'TestTitle', body: 'TestBodyWithLength' }) } as Request;
    
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});