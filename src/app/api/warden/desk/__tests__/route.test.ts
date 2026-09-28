import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    request: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    incident: {
      findMany: vi.fn(),
    }
  }
}));

describe('Warden Desk API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies Student', async () => {
    (requireAuth as unknown as import('vitest').Mock).mockResolvedValue({ id: 's1', role: 'Student' });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns snapshot for Warden', async () => {
    (requireAuth as unknown as import('vitest').Mock).mockResolvedValue({ id: 'w1', role: 'Warden', hostel: 'H1' });
    (prisma.request.findMany as unknown as import('vitest').Mock).mockResolvedValue([]);
    (prisma.request.count as unknown as import('vitest').Mock).mockResolvedValue(0);
    (prisma.incident.findMany as unknown as import('vitest').Mock).mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scope).toBe('H1');
    expect(data.snapshot.totalOpen).toBe(0);
  });
});
