import { describe, it, expect, beforeAll, vi } from 'vitest';
import { prisma } from '../../db/prisma';
import { POST as PostAttendance } from '../../../app/api/faculty/sessions/[id]/attendance/route';
import { GET as GetAttendance } from '../../../app/api/student/attendance/route';
import { GET as GetFees, POST as PostFee } from '../../../app/api/admin/fees/route';
import { PATCH as PatchFee } from '../../../app/api/admin/fees/[id]/route';
import { NextRequest } from 'next/server';
import { requireAuth } from '../../auth/session';

vi.mock('../../auth/session', () => ({
  requireAuth: vi.fn()
}));

describe('P2 - Academic & Fees Integration', () => {
  let faculty: any, student: any, otherStudent: any, admin: any, otherAdmin: any;
  let college1: any, college2: any;
  let course: any, session: any;

  beforeAll(async () => {
    vi.clearAllMocks();
    
    await prisma.auditLog.deleteMany();
    await prisma.attendance.deleteMany({ where: { student: { email: { contains: 'testacad' } } } });
    await prisma.feeDue.deleteMany({ where: { student: { email: { contains: 'testacad' } } } });
    await prisma.classSession.deleteMany({ where: { course: { user: { email: { contains: 'testacad' } } } } });
    await prisma.enrollment.deleteMany({ where: { student: { email: { contains: 'testacad' } } } });
    await prisma.course.deleteMany({ where: { user: { email: { contains: 'testacad' } } } });
    await prisma.department.deleteMany();
    await prisma.feeDue.deleteMany({ where: { student: { email: { contains: 'testacad' } } } }); await prisma.attendance.deleteMany({ where: { student: { email: { contains: 'testacad' } } } }); await prisma.enrollment.deleteMany({ where: { student: { email: { contains: 'testacad' } } } }); await prisma.course.deleteMany({ where: { user: { email: { contains: 'testacad' } } } }); await prisma.user.deleteMany({ where: { email: { contains: 'testacad' } } });
    await prisma.college.deleteMany({ where: { name: { contains: 'TestAcadCollege' } } });

    college1 = await prisma.college.create({ data: { name: 'TestAcadCollege 1' } });
    college2 = await prisma.college.create({ data: { name: 'TestAcadCollege 2' } });

    faculty = await prisma.user.create({ data: { email: 'f1@testacad.local', name: 'F1', role: 'Faculty', collegeId: college1.id, password: 'hash' } });
    student = await prisma.user.create({ data: { email: 's1@testacad.local', name: 'S1', role: 'Student', collegeId: college1.id, password: 'hash' } });
    otherStudent = await prisma.user.create({ data: { email: 's2@testacad.local', name: 'S2', role: 'Student', collegeId: college2.id, password: 'hash' } });
    admin = await prisma.user.create({ data: { email: 'a1@testacad.local', name: 'A1', role: 'SYSTEM_ADMIN', collegeId: college1.id, password: 'hash' } });
    otherAdmin = await prisma.user.create({ data: { email: 'a2@testacad.local', name: 'A2', role: 'SYSTEM_ADMIN', collegeId: college2.id, password: 'hash' } });

    course = await prisma.course.create({ data: { code: 'CS101-TEST', name: 'Test Course', facultyId: faculty.id } });
    await prisma.enrollment.create({ data: { courseId: course.id, studentId: student.id } });
    session = await prisma.classSession.create({ data: { courseId: course.id, scheduledAt: new Date(), status: 'COMPLETED' } });
  });

  describe('ATTENDANCE API', () => {
    it('1. authorized faculty can create/update attendance and 9. audit event generated', async () => {
      vi.mocked(requireAuth).mockResolvedValue(faculty as any);
      
      const req = new NextRequest(`http://localhost/api/faculty/sessions/${session.id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ attendanceData: [{ studentId: student.id, status: 'PRESENT' }] })
      });
      const res = await PostAttendance(req, { params: Promise.resolve({ id: session.id }) });
      expect(res.status).toBe(200);

      const att = await prisma.attendance.findFirst({ where: { sessionId: session.id, studentId: student.id } });
      expect(att?.status).toBe('PRESENT');

      const audit = await prisma.auditLog.findFirst({ where: { action: 'ATTENDANCE_UPDATED', entityId: session.id } });
      expect(audit).not.toBeNull();
    });

    it('4. unauthorized role cannot mutate attendance (student)', async () => {
      vi.mocked(requireAuth).mockResolvedValue(student as any);
      const req = new NextRequest(`http://localhost/api/faculty/sessions/${session.id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ attendanceData: [{ studentId: student.id, status: 'PRESENT' }] })
      });
      const res = await PostAttendance(req, { params: Promise.resolve({ id: session.id }) });
      expect(res.status).toBe(403);
    });

    it('5. cross-faculty mutation is rejected (unauthorized course ownership)', async () => {
      const otherFaculty = await prisma.user.create({ data: { email: 'f2@testacad.local', name: 'F2', role: 'Faculty', collegeId: college1.id, password: 'hash' } });
      vi.mocked(requireAuth).mockResolvedValue(otherFaculty as any);
      
      const req = new NextRequest(`http://localhost/api/faculty/sessions/${session.id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ attendanceData: [{ studentId: student.id, status: 'PRESENT' }] })
      });
      const res = await PostAttendance(req, { params: Promise.resolve({ id: session.id }) });
      expect(res.status).toBe(500); // Throws Error('Unauthorized or session not found')
    });

    it('6. student can read own attendance & 8. percentage derives from persisted records', async () => {
      // Setup some attendance
      await prisma.attendance.upsert({ where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } }, update: { status: 'PRESENT' }, create: { sessionId: session.id, studentId: student.id, status: 'PRESENT' } });
      
      vi.mocked(requireAuth).mockResolvedValue(student as any);
      const req = new NextRequest('http://localhost/api/student/attendance');
      const res = await GetAttendance();
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.attendance[0].courseCode).toBe('CS101-TEST');
      expect(data.attendance[0].presentCount).toBe(1);
      expect(data.attendance[0].percentage).toBe(100);
    });
  });

  describe('FEES API', () => {
    it('10. authorized authority can create FeeDue & 17. generates audit', async () => {
      vi.mocked(requireAuth).mockResolvedValue(admin as any);
      const req = new NextRequest('http://localhost/api/admin/fees', {
        method: 'POST',
        body: JSON.stringify({ studentId: student.id, amount: 500, description: 'Test Fee', dueDate: new Date().toISOString() })
      });
      const res = await PostFee(req);
      expect(res.status).toBe(201);

      const fee = await prisma.feeDue.findFirst({ where: { studentId: student.id } });
      expect(fee?.amount).toBe(500);
      expect(fee?.status).toBe('PENDING');

      const audit = await prisma.auditLog.findFirst({ where: { action: 'FEE_CREATED', entityId: fee!.id } });
      expect(audit).not.toBeNull();
    });

    it('12. authorized authority can mark fee paid', async () => {
      const fee = await prisma.feeDue.create({ data: { studentId: student.id, amount: 100, description: 'Dues', dueDate: new Date() } });
      
      vi.mocked(requireAuth).mockResolvedValue(admin as any);
      const req = new NextRequest(`http://localhost/api/admin/fees/${fee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAID' })
      });
      const res = await PatchFee(req, { params: Promise.resolve({ id: fee.id }) });
      expect(res.status).toBe(200);

      const updated = await prisma.feeDue.findUnique({ where: { id: fee.id } });
      expect(updated?.status).toBe('PAID');
    });

    it('15. student cannot create or mutate dues', async () => {
      vi.mocked(requireAuth).mockResolvedValue(student as any);
      const req = new NextRequest('http://localhost/api/admin/fees', {
        method: 'POST',
        body: JSON.stringify({ studentId: student.id, amount: 500, description: 'Test', dueDate: new Date().toISOString() })
      });
      const res = await PostFee(req);
      expect(res.status).toBe(403);
    });

    it('16. cross-college fee mutation is rejected', async () => {
      const fee = await prisma.feeDue.create({ data: { studentId: student.id, amount: 100, description: 'Dues', dueDate: new Date() } });
      
      // otherAdmin belongs to college2, trying to patch college1 student's fee
      vi.mocked(requireAuth).mockResolvedValue(otherAdmin as any);
      const req = new NextRequest(`http://localhost/api/admin/fees/${fee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAID' })
      });
      const res = await PatchFee(req, { params: Promise.resolve({ id: fee.id }) });
      expect(res.status).toBe(403);
    });
  });
});
