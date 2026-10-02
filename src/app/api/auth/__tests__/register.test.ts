import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../register/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    authorityLevel: {
      findUnique: vi.fn().mockResolvedValue({ id: 'auth_student_id', name: 'STUDENT', levelNumber: 10 }),
    }
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  }
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = (body: unknown) => {
    return {
      json: async () => body,
    } as Request;
  };

  it('registers a valid student successfully', async () => {
    (prisma.user.findUnique as import('vitest').Mock).mockResolvedValue(null);
    (prisma.user.create as import('vitest').Mock).mockResolvedValue({
      id: '123',
      email: 'test@student.com',
      password: 'hashed_password',
      name: 'Test Student',
      role: 'Student',
    });

    const res = await POST(mockRequest({
      email: 'test@student.com',
      password: 'password123',
      name: 'Test Student'
    }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.email).toBe('test@student.com');
    expect(data.role).toBe('Student');
    expect(data.password).toBeUndefined();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
  });

  it('rejects attempted privileged-role registration', async () => {
    const res = await POST(mockRequest({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Test Admin',
      role: 'Admin'
    }));

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/privileged role/i);
  });

  it('rejects invalid email', async () => {
    const res = await POST(mockRequest({
      email: 'invalid-email',
      password: 'password123',
      name: 'Test Student'
    }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid email format/i);
  });

  it('rejects short password', async () => {
    const res = await POST(mockRequest({
      email: 'test@student.com',
      password: 'short',
      name: 'Test Student'
    }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Password must be at least 8 characters/i);
  });

  it('rejects invalid/missing required fields', async () => {
    const res = await POST(mockRequest({
      email: 'test@student.com',
      password: 'password123',
    }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Email, password, and name are required/i);
  });
});
