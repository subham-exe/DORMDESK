import { describe, it, expect, beforeAll, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';
import { POST as PostMaterial } from '@/app/api/faculty/materials/route';
import { GET as GetStudentMaterials } from '@/app/api/student/materials/route';
import { POST as PostSchedule } from '@/app/api/faculty/schedules/route';
import { GET as GetStudentSchedules } from '@/app/api/student/schedules/route';
import * as sessionModule from '@/lib/auth/session';

describe('P4 - Course Materials and Schedule Integration', () => {
  const ts = Date.now();
  const e = (prefix: string) => `${prefix}-${ts}@testp4.local`;

  let faculty1: any, faculty2: any, student1: any, student2: any;
  let college1: any, college2: any;
  let dept1: any, dept2: any;
  let course1: any, course2: any;

  beforeAll(async () => {
    vi.clearAllMocks();

    college1 = await prisma.college.create({ data: { name: `College1-${ts}`,  } });
    college2 = await prisma.college.create({ data: { name: `College2-${ts}`,  } });

    dept1 = await prisma.department.create({ data: { name: `Dept1-${ts}`, collegeId: college1.id } });
    dept2 = await prisma.department.create({ data: { name: `Dept2-${ts}`, collegeId: college2.id } });

    faculty1 = await prisma.user.create({ data: { email: e('f1'), name: 'F1', role: 'Faculty', collegeId: college1.id, departmentRefId: dept1.id } });
    faculty2 = await prisma.user.create({ data: { email: e('f2'), name: 'F2', role: 'Faculty', collegeId: college2.id, departmentRefId: dept2.id } });

    student1 = await prisma.user.create({ data: { email: e('s1'), name: 'S1', role: 'Student', collegeId: college1.id, departmentRefId: dept1.id } });
    student2 = await prisma.user.create({ data: { email: e('s2'), name: 'S2', role: 'Student', collegeId: college2.id, departmentRefId: dept2.id } });

    course1 = await prisma.course.create({ data: { code: `CS101-${ts}`, name: 'Course 1', facultyId: faculty1.id } });
    course2 = await prisma.course.create({ data: { code: `CS102-${ts}`, name: 'Course 2', facultyId: faculty2.id } });

    await prisma.enrollment.create({ data: { courseId: course1.id, studentId: student1.id } });
    await prisma.enrollment.create({ data: { courseId: course2.id, studentId: student2.id } });
  });

  const mockAuth = (user: any) => {
    vi.spyOn(sessionModule, 'requireAuth').mockResolvedValue(user as any);
  };

  it('1 & 6. authorized faculty can create material for owned course & produces audit event', async () => {
    mockAuth(faculty1);
    const req = new NextRequest('http://localhost/api/faculty/materials', {
      method: 'POST',
      body: JSON.stringify({ courseId: course1.id, title: 'Lecture 1', type: 'DOCUMENT', fileUrl: 'http://example.com' })
    });
    const res = await PostMaterial(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CREATE_MATERIAL', entityId: data.material.id }
    });
    expect(audit).not.toBeNull();
    expect(audit?.actorId).toBe(faculty1.id);
  });

  it('2. unauthorized faculty cannot create material for another faculty\'s course', async () => {
    mockAuth(faculty1);
    // faculty1 tries to create material for course2 (owned by faculty2)
    const req = new NextRequest('http://localhost/api/faculty/materials', {
      method: 'POST',
      body: JSON.stringify({ courseId: course2.id, title: 'Hack', type: 'DOCUMENT' })
    });
    const res = await PostMaterial(req);
    expect(res.status).toBe(403);
  });

  it('3. cross-college material creation is rejected', async () => {
    // implicitly tested by the unauthorized faculty test since course2 is in college2, but let's be explicit
    mockAuth(faculty1);
    const req = new NextRequest('http://localhost/api/faculty/materials', {
      method: 'POST',
      body: JSON.stringify({ courseId: course2.id, title: 'Hack', type: 'DOCUMENT' })
    });
    const res = await PostMaterial(req);
    expect(res.status).toBe(403);
  });

  it('4. student can retrieve materials for enrolled course', async () => {
    mockAuth(student1);
    const req = new NextRequest('http://localhost/api/student/materials');
    const res = await GetStudentMaterials(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.materials.some((m: any) => m.title === 'Lecture 1')).toBe(true);
  });

  it('5. student cannot retrieve materials for unrelated course', async () => {
    mockAuth(student2);
    const req = new NextRequest('http://localhost/api/student/materials');
    const res = await GetStudentMaterials(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    // student2 should not see course1's materials
    expect(data.materials.some((m: any) => m.title === 'Lecture 1')).toBe(false);
  });

  it('7 & 13. authorized faculty can create schedule entry for owned course & produces audit', async () => {
    mockAuth(faculty1);
    const req = new NextRequest('http://localhost/api/faculty/schedules', {
      method: 'POST',
      body: JSON.stringify({ courseId: course1.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '101' })
    });
    const res = await PostSchedule(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'CREATE_CLASS_SCHEDULE', entityId: data.schedule.id }
    });
    expect(audit).not.toBeNull();
    expect(audit?.actorId).toBe(faculty1.id);
  });

  it('8 & 9. unauthorized / cross-college faculty cannot mutate another faculty\'s schedule', async () => {
    mockAuth(faculty1);
    const req = new NextRequest('http://localhost/api/faculty/schedules', {
      method: 'POST',
      body: JSON.stringify({ courseId: course2.id, dayOfWeek: 1, startTime: '10:00', endTime: '11:00' })
    });
    const res = await PostSchedule(req);
    expect(res.status).toBe(403);
  });

  it('10. student can retrieve schedule for enrolled course', async () => {
    mockAuth(student1);
    const req = new NextRequest('http://localhost/api/student/schedules');
    const res = await GetStudentSchedules(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.schedules.some((s: any) => s.startTime === '09:00')).toBe(true);
  });

  it('11. student cannot mutate schedule', async () => {
    mockAuth(student1);
    const req = new NextRequest('http://localhost/api/faculty/schedules', {
      method: 'POST',
      body: JSON.stringify({ courseId: course1.id, dayOfWeek: 2, startTime: '10:00', endTime: '11:00' })
    });
    const res = await PostSchedule(req);
    // Because the API itself is faculty-only
    expect(res.status).toBe(403);
  });

  it('12. duplicate schedule behavior matches schema semantics', async () => {
    mockAuth(faculty1);
    // Insert exact same schedule again
    const req = new NextRequest('http://localhost/api/faculty/schedules', {
      method: 'POST',
      body: JSON.stringify({ courseId: course1.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '101' })
    });
    const res = await PostSchedule(req);
    // Our API throws a 409 Conflict for exact duplicates
    expect(res.status).toBe(409);
  });
});
