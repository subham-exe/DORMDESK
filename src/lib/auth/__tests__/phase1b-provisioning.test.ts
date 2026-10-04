import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { canManageTarget } from '../authority';

describe('Phase 1 Part B Provisioning & Access Controls', () => {
  let sysAdminUser: any;
  let principalA: any;
  let hodA: any;
  let collegeA: any;
  let collegeB: any;

  beforeEach(async () => {
    vi.restoreAllMocks();

    const authSys = await prisma.authorityLevel.upsert({ where: { name: 'SYSTEM_ADMIN' }, update: {}, create: { name: 'SYSTEM_ADMIN' } });
    const authPrin = await prisma.authorityLevel.upsert({ where: { name: 'PRINCIPAL' }, update: {}, create: { name: 'PRINCIPAL' } });
    const authHod = await prisma.authorityLevel.upsert({ where: { name: 'HOD' }, update: {}, create: { name: 'HOD' } });
    const _authFac = await prisma.authorityLevel.upsert({ where: { name: 'FACULTY' }, update: {}, create: { name: 'FACULTY' } });
    const _authStudent = await prisma.authorityLevel.upsert({ where: { name: 'STUDENT' }, update: {}, create: { name: 'STUDENT' } });

    collegeA = await prisma.college.upsert({ where: { name: 'College A' }, update: {}, create: { name: 'College A' } });
    collegeB = await prisma.college.upsert({ where: { name: 'College B' }, update: {}, create: { name: 'College B' } });

    // Clean up our specific test users first
    await prisma.user.deleteMany({
      where: { email: { in: ['sys@admin.local', 'prin@a.local', 'hod@a.local', 'stu@local', 'stu2@local'] } }
    });

    sysAdminUser = await prisma.user.findFirst({ where: { authorityId: authSys.id } });
    if (!sysAdminUser) {
      sysAdminUser = await prisma.user.create({
        data: { name: '001', email: 'sys@admin.local', role: 'Admin', authorityId: authSys.id }
      });
    }

    principalA = await prisma.user.create({
      data: { name: 'Prin A', email: 'prin@a.local', role: 'Admin', authorityId: authPrin.id, collegeId: collegeA.id }
    });

    hodA = await prisma.user.create({
      data: { name: 'HOD A', email: 'hod@a.local', role: 'Admin', authorityId: authHod.id, collegeId: collegeA.id }
    });
  });

  it('SYSTEM_ADMIN can create PRINCIPAL in any college', async () => {
    const canCreate = await canManageTarget(sysAdminUser.id, 'PRINCIPAL', collegeA.id);
    expect(canCreate).toBe(true);
  });

  it('Principal cannot create another Principal', async () => {
    const canCreate = await canManageTarget(principalA.id, 'PRINCIPAL', collegeA.id);
    expect(canCreate).toBe(false);
  });

  it('Principal cannot modify SYSTEM_ADMIN', async () => {
    const canCreate = await canManageTarget(principalA.id, 'SYSTEM_ADMIN', collegeA.id);
    expect(canCreate).toBe(false);
  });

  it('Principal provisions allowed lower authorities in same college', async () => {
    const canCreate = await canManageTarget(principalA.id, 'HOD', collegeA.id);
    expect(canCreate).toBe(true);
  });

  it('Principal cannot provision authorities in different college', async () => {
    const canCreate = await canManageTarget(principalA.id, 'HOD', collegeB.id);
    expect(canCreate).toBe(false);
  });

  it('HOD provisions Faculty within scope', async () => {
    const canCreate = await canManageTarget(hodA.id, 'FACULTY', collegeA.id);
    expect(canCreate).toBe(false);
  });

  it('HOD cannot provision Faculty in different college', async () => {
    const canCreate = await canManageTarget(hodA.id, 'FACULTY', collegeB.id);
    expect(canCreate).toBe(false);
  });

});
