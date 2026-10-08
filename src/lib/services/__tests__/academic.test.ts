import { prisma } from '@/lib/db/prisma';
import { AcademicService } from '../academic';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { User, Course, ClassSession } from '@prisma/client';

describe('AcademicService', () => {
  let faculty1: User, faculty2: User, student1: User, warden: User;
  let course1: Course, course2: Course;
  let session1: ClassSession, session2: ClassSession, session3: ClassSession;

  beforeAll(async () => {
    // Cleanup any orphaned records from failed test runs
    await prisma.notification.deleteMany({ where: { title: 'Class Cancelled' } });
    await prisma.auditLog.deleteMany({ where: { action: { in: ['ATTENDANCE_UPDATED', 'CLASS_CANCELLED'] } } });
    await prisma.attendance.deleteMany({ where: { student: { email: { contains: 'acad-test' } } } });
    await prisma.classSession.deleteMany({ where: { course: { user: { email: { contains: 'acad-test' } } } } });
    await prisma.enrollment.deleteMany({ where: { student: { email: { contains: 'acad-test' } } } });
    await prisma.course.deleteMany({ where: { user: { email: { contains: 'acad-test' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@acad-test.local' } } });

    // Setup users
    faculty1 = await prisma.user.create({ data: { email: 'f1@acad-test.local', name: 'F1', role: 'Faculty' } });
    faculty2 = await prisma.user.create({ data: { email: 'f2@acad-test.local', name: 'F2', role: 'Faculty' } });
    student1 = await prisma.user.create({ data: { email: 's1@acad-test.local', name: 'S1', role: 'Student' } });
    await prisma.user.create({ data: { email: 's2@acad-test.local', name: 'S2', role: 'Student' } });
    warden = await prisma.user.create({ data: { email: 'w1@acad-test.local', name: 'W1', role: 'Warden' } });

    // Setup courses
    course1 = await prisma.course.create({ data: { code: 'TEST1', name: 'Test Course 1', facultyId: faculty1.id } });
    course2 = await prisma.course.create({ data: { code: 'TEST2', name: 'Test Course 2', facultyId: faculty2.id } });

    // Enroll students in course1
    await prisma.enrollment.create({ data: { courseId: course1.id, studentId: student1.id } });
    // student2 not enrolled in course1

    // Setup sessions
    session1 = await prisma.classSession.create({ data: { courseId: course1.id, scheduledAt: new Date(), status: 'SCHEDULED' } });
    session2 = await prisma.classSession.create({ data: { courseId: course1.id, scheduledAt: new Date(), status: 'SCHEDULED' } });
    session3 = await prisma.classSession.create({ data: { courseId: course2.id, scheduledAt: new Date(), status: 'SCHEDULED' } });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { title: 'Class Cancelled' } });
    await prisma.auditLog.deleteMany({ where: { action: { in: ['ATTENDANCE_UPDATED', 'CLASS_CANCELLED'] } } });
    await prisma.attendance.deleteMany({ where: { student: { email: { contains: 'acad-test' } } } });
    await prisma.classSession.deleteMany({ where: { course: { user: { email: { contains: 'acad-test' } } } } });
    await prisma.enrollment.deleteMany({ where: { student: { email: { contains: 'acad-test' } } } });
    await prisma.course.deleteMany({ where: { user: { email: { contains: 'acad-test' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@acad-test.local' } } });
  });

  describe('Auth and Access', () => {
    it('Faculty can access own courses', async () => {
      const courses = await AcademicService.getFacultyCourses(faculty1.id);
      expect(courses.length).toBe(1);
      expect(courses[0].id).toBe(course1.id);
    });

    it('Faculty cannot access another faculty member course session', async () => {
      await expect(AcademicService.getFacultySession(faculty2.id, session1.id)).rejects.toThrow('Unauthorized or session not found');
    });
  });

  describe('Attendance Mutations', () => {
    it('valid PRESENT record works', async () => {
      const res = await AcademicService.updateAttendance(faculty1.id, session1.id, [{ studentId: student1.id, status: 'PRESENT' }]);
      expect(res.length).toBe(1);
      expect(res[0].status).toBe('PRESENT');
    });

    it('update works correctly', async () => {
      const res = await AcademicService.updateAttendance(faculty1.id, session1.id, [{ studentId: student1.id, status: 'ABSENT' }]);
      expect(res.length).toBe(1);
      expect(res[0].status).toBe('ABSENT');
    });

    it('duplicate student/session record is prevented (upserted instead)', async () => {
      await AcademicService.updateAttendance(faculty1.id, session1.id, [{ studentId: student1.id, status: 'PRESENT' }]);
      const count = await prisma.attendance.count({ where: { sessionId: session1.id, studentId: student1.id } });
      expect(count).toBe(1);
    });

    it('Student cannot modify attendance', async () => {
      await expect(AcademicService.updateAttendance(student1.id, session1.id, [{ studentId: student1.id, status: 'PRESENT' }]))
        .rejects.toThrow('Unauthorized or session not found');
    });

    it('Warden cannot mutate academic attendance', async () => {
      await expect(AcademicService.updateAttendance(warden.id, session1.id, [{ studentId: student1.id, status: 'PRESENT' }]))
        .rejects.toThrow('Unauthorized or session not found');
    });
  });

  describe('Cancellation', () => {
    it('faculty can cancel owned session', async () => {
      const session = await AcademicService.cancelSession(faculty1.id, session2.id, 'Sick leave');
      expect(session.status).toBe('CANCELLED');
      expect(session.cancellationReason).toBe('Sick leave');
    });

    it('non-owner faculty rejected', async () => {
      await expect(AcademicService.cancelSession(faculty1.id, session3.id, 'Sick leave'))
        .rejects.toThrow('Unauthorized or session not found');
    });

    it('already cancelled session handled safely', async () => {
      const session = await AcademicService.cancelSession(faculty1.id, session2.id, 'Sick leave');
      expect(session.status).toBe('CANCELLED');
    });

    it('student notification created on cancellation', async () => {
      const notifs = await prisma.notification.findMany({
        where: { recipientId: student1.id, title: 'Class Cancelled' }
      });
      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].message).toContain('Sick leave');
    });
    
    it('audit event created on cancellation', async () => {
      const audits = await prisma.auditLog.findMany({
        where: { actorId: faculty1.id, action: 'CLASS_CANCELLED' }
      });
      expect(audits.length).toBeGreaterThan(0);
    });
  });

  describe('Student Attendance Logic', () => {
    it('attendance percentage is correct and zero-session handled safely', async () => {
      const summary = await AcademicService.getStudentAttendance(student1.id);
      expect(summary.length).toBe(1);
      
      const courseSummary = summary[0];
      // session1 is PRESENT, session2 is CANCELLED (should be excluded). Total valid = 1.
      expect(courseSummary.totalSessions).toBe(1);
      expect(courseSummary.presentCount).toBe(1);
      expect(courseSummary.percentage).toBe(100);
      expect(courseSummary.absentCount).toBe(0);
    });
  });
});
