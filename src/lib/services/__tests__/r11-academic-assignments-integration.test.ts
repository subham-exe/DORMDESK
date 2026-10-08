import { describe, it, expect, beforeAll, vi } from 'vitest';
import { prisma } from '../../db/prisma';
import { POST as PostAssignment, GET as GetFacultyAssignments } from '../../../app/api/faculty/assignments/route';
import { GET as GetFacultySubmissions } from '../../../app/api/faculty/assignments/[id]/submissions/route';
import { GET as GetStudentAssignments } from '../../../app/api/student/assignments/route';
import { POST as SubmitAssignment } from '../../../app/api/student/assignments/[id]/submit/route';
import { NextRequest } from 'next/server';
import { requireAuth } from '../../auth/session';

vi.mock('../../auth/session', () => ({
  requireAuth: vi.fn()
}));

describe('P2 - Assignments & Submissions Integration', () => {
  let faculty: any, otherFaculty: any, student: any, otherStudent: any;
  let college1: any, college2: any;
  let course: any, otherCourse: any, assignment: any;

  beforeAll(async () => {
    vi.clearAllMocks();
    
    await prisma.auditLog.deleteMany();
    await prisma.assignmentSubmission.deleteMany({ where: { student: { email: { contains: 'testassign' } } } });
    await prisma.academicAssignment.deleteMany({ where: { course: { user: { email: { contains: 'testassign' } } } } });
    await prisma.enrollment.deleteMany({ where: { student: { email: { contains: 'testassign' } } } });
    await prisma.course.deleteMany({ where: { user: { email: { contains: 'testassign' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'testassign' } } });
    await prisma.college.deleteMany({ where: { name: { contains: 'TestAssignCollege' } } });

    college1 = await prisma.college.create({ data: { name: 'TestAssignCollege 1' } });
    college2 = await prisma.college.create({ data: { name: 'TestAssignCollege 2' } });

    faculty = await prisma.user.create({ data: { email: 'f1@testassign.local', name: 'F1', role: 'Faculty', collegeId: college1.id, password: 'hash' } });
    otherFaculty = await prisma.user.create({ data: { email: 'f2@testassign.local', name: 'F2', role: 'Faculty', collegeId: college2.id, password: 'hash' } });
    student = await prisma.user.create({ data: { email: 's1@testassign.local', name: 'S1', role: 'Student', collegeId: college1.id, password: 'hash' } });
    otherStudent = await prisma.user.create({ data: { email: 's2@testassign.local', name: 'S2', role: 'Student', collegeId: college2.id, password: 'hash' } });

    course = await prisma.course.create({ data: { code: 'CS-ASSIGN', name: 'Test Course', facultyId: faculty.id } });
    otherCourse = await prisma.course.create({ data: { code: 'CS-OTHER', name: 'Other Course', facultyId: otherFaculty.id } });
    
    await prisma.enrollment.create({ data: { courseId: course.id, studentId: student.id } });
  });

  describe('ASSIGNMENT CREATION', () => {
    it('1. authorized faculty can create assignment & 13. produces audit event', async () => {
      vi.mocked(requireAuth).mockResolvedValue(faculty as any);
      
      const req = new NextRequest('http://localhost/api/faculty/assignments', {
        method: 'POST',
        body: JSON.stringify({ courseId: course.id, title: 'HW1', description: 'Do it', dueDate: new Date().toISOString() })
      });
      const res = await PostAssignment(req);
      expect(res.status).toBe(201);
      
      const data = await res.json();
      assignment = data.assignment;
      expect(assignment.title).toBe('HW1');

      const audit = await prisma.auditLog.findFirst({ where: { action: 'CREATE_ASSIGNMENT', entityId: assignment.id } });
      expect(audit).not.toBeNull();
    });

    it('2. unauthorized faculty cannot create assignment for another faculty course', async () => {
      vi.mocked(requireAuth).mockResolvedValue(otherFaculty as any);
      
      const req = new NextRequest('http://localhost/api/faculty/assignments', {
        method: 'POST',
        body: JSON.stringify({ courseId: course.id, title: 'HW-Hack', description: 'Hack', dueDate: new Date().toISOString() })
      });
      const res = await PostAssignment(req);
      expect(res.status).toBe(500); // Throws Error('Unauthorized') inside CourseService
    });
  });

  describe('STUDENT ASSIGNMENT VIEW & SUBMISSION', () => {
    it('4. student can see assignments for enrolled courses', async () => {
      vi.mocked(requireAuth).mockResolvedValue(student as any);
      const res = await GetStudentAssignments();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assignments.some((a: any) => a.id === assignment.id)).toBe(true);
    });

    it('5. student cannot access unrelated course assignments', async () => {
      vi.mocked(requireAuth).mockResolvedValue(otherStudent as any);
      const res = await GetStudentAssignments();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assignments.some((a: any) => a.id === assignment.id)).toBe(false);
    });

    it('6. student can submit their own assignment & 14. produces audit event', async () => {
      vi.mocked(requireAuth).mockResolvedValue(student as any);
      const req = new NextRequest(`http://localhost/api/student/assignments/${assignment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: 'My homework answers' })
      });
      const res = await SubmitAssignment(req, { params: Promise.resolve({ id: assignment.id }) });
      expect(res.status).toBe(201);
      
      const sub = await prisma.assignmentSubmission.findFirst({ where: { assignmentId: assignment.id, studentId: student.id } });
      expect(sub?.content).toBe('My homework answers');

      const audit = await prisma.auditLog.findFirst({ where: { action: 'SUBMIT_ASSIGNMENT', entityId: sub!.id } });
      expect(audit).not.toBeNull();
    });

    it('8. student cannot submit to an unrelated course', async () => {
      vi.mocked(requireAuth).mockResolvedValue(otherStudent as any); // Not enrolled
      const req = new NextRequest(`http://localhost/api/student/assignments/${assignment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Hacked submission' })
      });
      const res = await SubmitAssignment(req, { params: Promise.resolve({ id: assignment.id }) });
      expect(res.status).toBe(403);
    });

    it('9. duplicate submission behavior matches existing schema semantics (upsert)', async () => {
      vi.mocked(requireAuth).mockResolvedValue(student as any);
      const req = new NextRequest(`http://localhost/api/student/assignments/${assignment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Updated homework answers' })
      });
      const res = await SubmitAssignment(req, { params: Promise.resolve({ id: assignment.id }) });
      expect(res.status).toBe(201);

      // Verify no duplicate exists
      const subs = await prisma.assignmentSubmission.findMany({ where: { assignmentId: assignment.id, studentId: student.id } });
      expect(subs.length).toBe(1);
      expect(subs[0].content).toBe('Updated homework answers');
    });
  });

  describe('FACULTY SUBMISSION VIEW', () => {
    it('10. faculty can view submissions for their own assignment', async () => {
      vi.mocked(requireAuth).mockResolvedValue(faculty as any);
      const req = new NextRequest(`http://localhost/api/faculty/assignments/${assignment.id}/submissions`);
      const res = await GetFacultySubmissions(req, { params: Promise.resolve({ id: assignment.id }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.submissions.length).toBe(1);
      expect(data.submissions[0].content).toBe('Updated homework answers');
    });

    it('11. faculty cannot view submissions for another facultys assignment', async () => {
      vi.mocked(requireAuth).mockResolvedValue(otherFaculty as any);
      const req = new NextRequest(`http://localhost/api/faculty/assignments/${assignment.id}/submissions`);
      const res = await GetFacultySubmissions(req, { params: Promise.resolve({ id: assignment.id }) });
      expect(res.status).toBe(403);
    });
  });
});
