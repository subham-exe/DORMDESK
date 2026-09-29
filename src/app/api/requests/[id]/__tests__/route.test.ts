import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '../route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Mock auth
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn()
}));

// Mock prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    request: {
      findUnique: vi.fn(),
    },
  },
}));

import { requireAuth } from '@/lib/auth/session';

describe('PATCH /api/requests/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  };

  it('rejects STUDENT attempting to ASSIGN', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'student-1', role: 'Student' });
    (prisma.request.findUnique as any).mockResolvedValue({ id: 'req-1', requesterId: 'student-1' });

    const req = createMockRequest({ action: 'ASSIGN', assigneeId: 'staff-1', department: 'Plumbing' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();
    
    expect(res.status).toBe(403);
    expect(json.error).toBe('Unauthorized');
  });

  it('rejects STUDENT attempting forbidden TRANSITION (e.g. RESOLVED)', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'student-1', role: 'Student' });
    (prisma.request.findUnique as any).mockResolvedValue({ id: 'req-1', requesterId: 'student-1' });

    const req = createMockRequest({ action: 'TRANSITION', newStatus: 'RESOLVED' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();
    
    expect(res.status).toBe(403);
    expect(json.error).toBe('Unauthorized transition');
  });

  it('rejects STUDENT attempting to transition another user request', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'student-1', role: 'Student' });
    (prisma.request.findUnique as any).mockResolvedValue({ id: 'req-1', requesterId: 'student-2' });

    const req = createMockRequest({ action: 'TRANSITION', newStatus: 'CANCELLED' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();
    
    expect(res.status).toBe(403);
    expect(json.error).toBe('Unauthorized');
  });
});
