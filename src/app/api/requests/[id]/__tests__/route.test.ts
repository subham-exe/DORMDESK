import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { PATCH } from '../route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

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

describe('PATCH /api/requests/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return new NextRequest('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  };

  it('rejects STUDENT attempting to ASSIGN', async () => {
    const mockRequireAuth = requireAuth as unknown as MockedFunction<typeof requireAuth>;
    mockRequireAuth.mockResolvedValue({ id: 'student-1', role: 'Student', name: 'Student', email: 's@local', isResident: true } as unknown as Awaited<ReturnType<typeof requireAuth>>);
    
    const mockFindUnique = prisma.request.findUnique as unknown as MockedFunction<typeof prisma.request.findUnique>;
    mockFindUnique.mockResolvedValue({ id: 'req-1', requesterId: 'student-1' } as unknown as Awaited<ReturnType<typeof prisma.request.findUnique>>);

    const req = createMockRequest({ action: 'ASSIGN', assigneeId: 'staff-1', department: 'Plumbing' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();
    
    expect(res.status).toBe(403);
    expect(json.error).toBe('Unauthorized');
  });

  it('rejects STUDENT attempting forbidden TRANSITION (e.g. RESOLVED)', async () => {
    const mockRequireAuth = requireAuth as unknown as MockedFunction<typeof requireAuth>;
    mockRequireAuth.mockResolvedValue({ id: 'student-1', role: 'Student', name: 'Student', email: 's@local', isResident: true } as unknown as Awaited<ReturnType<typeof requireAuth>>);
    
    const mockFindUnique = prisma.request.findUnique as unknown as MockedFunction<typeof prisma.request.findUnique>;
    mockFindUnique.mockResolvedValue({ id: 'req-1', requesterId: 'student-1' } as unknown as Awaited<ReturnType<typeof prisma.request.findUnique>>);

    const req = createMockRequest({ action: 'TRANSITION', newStatus: 'RESOLVED' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();
    
    expect(res.status).toBe(403);
    expect(json.error).toBe('Unauthorized transition');
  });

  it('rejects STUDENT attempting to transition another user request', async () => {
    const mockRequireAuth = requireAuth as unknown as MockedFunction<typeof requireAuth>;
    mockRequireAuth.mockResolvedValue({ id: 'student-1', role: 'Student', name: 'Student', email: 's@local', isResident: true } as unknown as Awaited<ReturnType<typeof requireAuth>>);
    
    const mockFindUnique = prisma.request.findUnique as unknown as MockedFunction<typeof prisma.request.findUnique>;
    mockFindUnique.mockResolvedValue({ id: 'req-1', requesterId: 'student-2' } as unknown as Awaited<ReturnType<typeof prisma.request.findUnique>>);

    const req = createMockRequest({ action: 'TRANSITION', newStatus: 'CANCELLED' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();
    
    expect(res.status).toBe(403);
    expect(json.error).toBe('Unauthorized');
  });
});
