import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { requireAuth } from '@/lib/auth/session';
import { MessService } from '@/lib/services/mess';

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/services/mess', () => ({
  MessService: {
    submitFeedback: vi.fn(),
  }
}));

describe('Mess Feedback Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('denies access to non-students', async () => {
    (requireAuth as unknown as import("vitest").Mock).mockResolvedValue({ role: 'Admin', id: 'admin-1' });
    const req = new Request('http://localhost/api/mess/m1/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating: 5 })
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(response.status).toBe(403);
  });

  it('allows access for students', async () => {
    (requireAuth as unknown as import("vitest").Mock).mockResolvedValue({ role: 'Student', id: 'student-1' });
    (MessService.submitFeedback as unknown as import("vitest").Mock).mockResolvedValue({ id: 'f1' });
    
    const req = new Request('http://localhost/api/mess/m1/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating: 4 })
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(response.status).toBe(200);
    expect(MessService.submitFeedback).toHaveBeenCalledWith('m1', 'student-1', 4, undefined);
  });
});
