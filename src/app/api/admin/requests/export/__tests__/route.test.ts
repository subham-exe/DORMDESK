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
    }
  }
}));

describe('Export Requests Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('denies access to non-admin roles', async () => {
    (requireAuth as unknown as import("vitest").Mock).mockResolvedValue({ role: 'Student' });
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it('allows access for admins and returns properly escaped CSV', async () => {
    (requireAuth as unknown as import("vitest").Mock).mockResolvedValue({ role: 'Admin' });
    
    (prisma.request.findMany as unknown as import("vitest").Mock).mockResolvedValue([
      {
        id: 'req-1',
        ticketNumber: 'TKT-1',
        requestType: 'ISSUE',
        category: 'MAINTENANCE',
        priority: 'HIGH',
        status: 'RESOLVED',
        assignedAuthority: { name: 'John "The Boss" Smith' }, // Tests quote escaping
        createdAt: new Date('2026-01-01T10:00:00Z'),
        resolvedAt: new Date('2026-01-01T12:30:00Z'), // 2.5 hours
        location: 'Room 101, Block A' // Tests comma escaping
      }
    ]);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    
    const text = await response.text();
    expect(text).toContain('"TKT-1"');
    expect(text).toContain('"John ""The Boss"" Smith"'); // Quoted and escaped
    expect(text).toContain('"Room 101, Block A"'); // Quoted and escaped
    expect(text).toContain('"2.50"'); // Duration formatted correctly
  });
});
