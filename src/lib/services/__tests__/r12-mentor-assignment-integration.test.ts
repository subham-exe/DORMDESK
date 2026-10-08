import { describe, it, expect, beforeAll, vi } from 'vitest';
import { prisma } from '../../db/prisma';
import { GET as GetHodMentors } from '../../../app/api/hod/mentors/route';
import { POST as AssignMentor } from '../../../app/api/hod/mentors/assign/route';
import { GET as GetStudentMentor } from '../../../app/api/student/mentor/route';
import { NextRequest } from 'next/server';
import { requireAuth, getCurrentUser } from '../../auth/session';

vi.mock('../../auth/session', () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn()
}));

describe('P2 - Mentor Assignment Integration', () => {
  let hod: any, otherHod: any, faculty: any, otherFaculty: any, student: any, otherStudent: any;
  let college1: any, college2: any;
  let dept1: any, dept2: any;

  beforeAll(async () => {
    const ts = Date.now();
    const e = (prefix: string) => prefix + '-' + ts + '@testmentor.local';

    vi.clearAllMocks();
    
    
    
    
    
    

    college1 = await prisma.college.create({ data: { name: `TestMentorCollege 1 - ${ts}` } });
    college2 = await prisma.college.create({ data: { name: `TestMentorCollege 2 - ${ts}` } });

    dept1 = await prisma.department.create({ data: { name: `TestMentor Dept 1 - ${ts}`, collegeId: college1.id } });
    dept2 = await prisma.department.create({ data: { name: `TestMentor Dept 2 - ${ts}`, collegeId: college2.id } });

    hod = await prisma.user.create({ data: { email: e('h1'), name: 'HOD 1', role: 'HOD', collegeId: college1.id, departmentRefId: dept1.id, password: 'hash' } });
    faculty = await prisma.user.create({ data: { email: e('f1'), name: 'Fac 1', role: 'Faculty', collegeId: college1.id, departmentRefId: dept1.id, password: 'hash' } });
    student = await prisma.user.create({ data: { email: e('s1'), name: 'Stu 1', role: 'Student', collegeId: college1.id, departmentRefId: dept1.id, password: 'hash' } });

    otherHod = await prisma.user.create({ data: { email: e('h2'), name: 'HOD 2', role: 'HOD', collegeId: college2.id, departmentRefId: dept2.id, password: 'hash' } });
    otherFaculty = await prisma.user.create({ data: { email: e('f2'), name: 'Fac 2', role: 'Faculty', collegeId: college2.id, departmentRefId: dept2.id, password: 'hash' } });
    otherStudent = await prisma.user.create({ data: { email: e('s2'), name: 'Stu 2', role: 'Student', collegeId: college2.id, departmentRefId: dept2.id, password: 'hash' } });
  });

  describe('HOD MENTOR ASSIGNMENT', () => {
    it('1. authorized HOD can assign a mentor & 10. produces audit event', async () => {
      vi.mocked(requireAuth).mockResolvedValue(hod as any);
      
      const req = new NextRequest('http://localhost/api/hod/mentors/assign', {
        method: 'POST',
        body: JSON.stringify({ mentorId: faculty.id, studentId: student.id })
      });
      const res = await AssignMentor(req);
      expect(res.status).toBe(201);
      
      const sub = await prisma.mentorAssignment.findFirst({ where: { studentId: student.id, mentorId: faculty.id, active: true } });
      expect(sub).not.toBeNull();

      const audit = await prisma.auditLog.findFirst({ where: { action: 'ASSIGN_MENTOR', entityId: sub!.id } });
      expect(audit).not.toBeNull();
    });

    it('2. authorized HOD can view assignments in scope', async () => {
      vi.mocked(requireAuth).mockResolvedValue(hod as any);
      const req = new NextRequest('http://localhost/api/hod/mentors');
      const res = await GetHodMentors(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assignments.some((a: any) => a.student.id === student.id && a.mentor.id === faculty.id)).toBe(true);
    });

    it('3. authorized HOD can reassign & 9. duplicate behavior matches semantics', async () => {
      vi.mocked(requireAuth).mockResolvedValue(hod as any);
      
      // We will reassign the same student to HOD as mentor
      const req = new NextRequest('http://localhost/api/hod/mentors/assign', {
        method: 'POST',
        body: JSON.stringify({ mentorId: hod.id, studentId: student.id })
      });
      const res = await AssignMentor(req);
      expect(res.status).toBe(201);

      // Verify old assignment is deactivated, new is active
      const oldAssignment = await prisma.mentorAssignment.findFirst({ where: { mentorId: faculty.id, studentId: student.id } });
      expect(oldAssignment?.active).toBe(false);

      const newAssignment = await prisma.mentorAssignment.findFirst({ where: { mentorId: hod.id, studentId: student.id } });
      expect(newAssignment?.active).toBe(true);
    });

    it('4. unauthorized role cannot assign mentor', async () => {
      vi.mocked(requireAuth).mockResolvedValue(faculty as any); // faculty is not HOD
      const req = new NextRequest('http://localhost/api/hod/mentors/assign', {
        method: 'POST',
        body: JSON.stringify({ mentorId: faculty.id, studentId: student.id })
      });
      const res = await AssignMentor(req);
      expect(res.status).toBe(403);
    });

    it('5. cross-college student assignment is rejected', async () => {
      vi.mocked(requireAuth).mockResolvedValue(hod as any);
      const req = new NextRequest('http://localhost/api/hod/mentors/assign', {
        method: 'POST',
        body: JSON.stringify({ mentorId: faculty.id, studentId: otherStudent.id })
      });
      const res = await AssignMentor(req);
      expect(res.status).toBe(403);
    });

    it('6. cross-college mentor assignment is rejected', async () => {
      vi.mocked(requireAuth).mockResolvedValue(hod as any);
      const req = new NextRequest('http://localhost/api/hod/mentors/assign', {
        method: 'POST',
        body: JSON.stringify({ mentorId: otherFaculty.id, studentId: student.id })
      });
      const res = await AssignMentor(req);
      expect(res.status).toBe(403);
    });
  });

  describe('STUDENT MENTOR VIEW', () => {
    it('7. student can retrieve their own mentor', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(student as any); // Student endpoint uses getCurrentUser directly
      const req = new NextRequest('http://localhost/api/student/mentor');
      const res = await GetStudentMentor();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.mentor.id).toBe(hod.id); // Reassigned in test 3
    });
    
    it('8. student cannot retrieve another students mentor', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(otherStudent as any);
      const req = new NextRequest('http://localhost/api/student/mentor');
      const res = await GetStudentMentor();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeNull(); // Because otherStudent has no mentor
    });
  });
});
