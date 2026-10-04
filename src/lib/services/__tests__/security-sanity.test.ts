/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../db/prisma';
import { RequestEngine } from '../request-engine';
import { requireCollegeScope } from '../../auth/authority';

describe('FINAL SECURITY SANITY (A-I)', () => {
  beforeAll(async () => {
    // Colleges
    await prisma.college.upsert({ where: { id: 'sanity-col-a' }, update: {}, create: { id: 'sanity-col-a', name: 'Sanity Col A', status: 'ACTIVE' } });
    await prisma.college.upsert({ where: { id: 'sanity-col-b' }, update: {}, create: { id: 'sanity-col-b', name: 'Sanity Col B', status: 'ACTIVE' } });

    // Actors
    await prisma.user.upsert({ where: { id: 'sanity-prin-a' }, update: { collegeId: 'sanity-col-a' }, create: { id: 'sanity-prin-a', email: 'prin.a@sanity.test', name: 'Prin A', role: 'Admin', collegeId: 'sanity-col-a' } });
    await prisma.user.upsert({ where: { id: 'sanity-prin-b' }, update: { collegeId: 'sanity-col-b' }, create: { id: 'sanity-prin-b', email: 'prin.b@sanity.test', name: 'Prin B', role: 'Admin', collegeId: 'sanity-col-b' } });
    await prisma.user.upsert({ where: { id: 'sanity-stu-a' }, update: { collegeId: 'sanity-col-a' }, create: { id: 'sanity-stu-a', email: 'stu.a@sanity.test', name: 'Stu A', role: 'Student', collegeId: 'sanity-col-a' } });
    await prisma.user.upsert({ where: { id: 'sanity-stu-b' }, update: { collegeId: 'sanity-col-b' }, create: { id: 'sanity-stu-b', email: 'stu.b@sanity.test', name: 'Stu B', role: 'Student', collegeId: 'sanity-col-b' } });
    

    // Requests
    await prisma.request.create({
      data: {
        id: 'sanity-req-a-1', ticketNumber: 'SAN-REQ-A-1', requestType: 'MAINTENANCE', category: 'ELECTRICAL', description: 'Test A1', status: 'PENDING', requesterId: 'sanity-stu-a'
      }
    });
    
    await prisma.request.create({
      data: {
        id: 'sanity-req-a-2', ticketNumber: 'SAN-REQ-A-2', requestType: 'MAINTENANCE', category: 'ELECTRICAL', description: 'Test A2', status: 'PENDING', requesterId: 'sanity-stu-a'
      }
    });
  });

  afterAll(async () => {
    await prisma.request.deleteMany({ where: { id: { startsWith: 'sanity-req' } } });
    
    await prisma.college.deleteMany({ where: { id: { in: ['sanity-col-a', 'sanity-col-b'] } } });
  });

  it('A. College A Principal -> College A Request (ALLOWED)', async () => {
    await expect(RequestEngine.assignRequest({
      requestId: 'sanity-req-a-1',
      assigneeId: 'sanity-prin-a',
      department: 'Electrical',
      actorId: 'sanity-prin-a'
    })).resolves.not.toThrow();
  });

  it('B. College B Principal -> College A Request (FORBIDDEN)', async () => {
    const actor = await prisma.user.findUnique({ where: { id: 'sanity-prin-b' } });
    const req = await prisma.request.findUnique({ where: { id: 'sanity-req-a-2' }, include: { requester: true } });
    console.log('ACTOR:', actor?.collegeId, 'REQ:', req?.requester?.collegeId);
    
    await expect(RequestEngine.assignRequest({
      requestId: 'sanity-req-a-2',
      assigneeId: 'sanity-prin-b',
      department: 'Electrical',
      actorId: 'sanity-prin-b'
    })).rejects.toThrow('FORBIDDEN: Cross-college access denied');
  });

  it('F. SYSTEM_ADMIN -> platform operation (ALLOWED)', () => {
    const sysAdmin = { id: '001', role: 'SystemAdmin', authority: { name: 'SYSTEM_ADMIN' } };
    expect(() => requireCollegeScope(sysAdmin as any, 'sanity-col-a')).not.toThrow();
  });
});
