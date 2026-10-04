import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { MentorService } from '../mentor';
import { CourseService } from '../course';
import { randomUUID } from 'crypto';

describe('Daily Campus Core - Scope and Security', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let hod: any, mentor1: any, mentor2: any, student1: any, student2: any, college: any, dept1: any, dept2: any, course: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

  beforeAll(async () => {
    await prisma.college.upsert({ where: { id: 'test-college' }, update: {}, create: { id: 'test-college', name: 'Test College', status: 'ACTIVE' } });
    // await prisma.user.updateMany({ data: { collegeId: 'test-college' } }); /* Removed global pollution */
    await prisma.college.upsert({ where: { id: 'test-college' }, update: {}, create: { id: 'test-college', name: 'Test College', status: 'ACTIVE' } });
    college = await prisma.college.create({ data: { name: 'Test College ' + randomUUID() } });
    dept1 = await prisma.department.create({ data: { name: 'Dept1', collegeId: college.id } });
    dept2 = await prisma.department.create({ data: { name: 'Dept2', collegeId: college.id } });

    hod = await prisma.user.create({ data: { email: 'hod@' + randomUUID(), name: 'HOD', role: 'HOD', departmentRefId: dept1.id , collegeId: 'test-college' } });
    mentor1 = await prisma.user.create({ data: {  email: 'm1@' + randomUUID(), name: 'M1', role: 'Faculty', departmentRefId: dept1.id  , collegeId: 'test-college' } });
    mentor2 = await prisma.user.create({ data: {  email: 'm2@' + randomUUID(), name: 'M2', role: 'Faculty', departmentRefId: dept2.id  , collegeId: 'test-college' } });
    student1 = await prisma.user.create({ data: {  email: 's1@' + randomUUID(), name: 'S1', role: 'Student', departmentRefId: dept1.id, collegeId: 'test-college' } });
    student2 = await prisma.user.create({ data: {  email: 's2@' + randomUUID(), name: 'S2', role: 'Student', departmentRefId: dept1.id, collegeId: 'test-college' } });

    course = await prisma.course.create({ data: { code: 'CS' + randomUUID(), name: 'CS101', facultyId: mentor1.id } });
    await prisma.enrollment.create({ data: { courseId: course.id, studentId: student1.id } });
  });

  afterAll(async () => {
    // clean up or use transactions in real scenario
  });

  it('HOD can assign mentor in same department', async () => {
    const assignment = await MentorService.assignMentor(hod.id, mentor1.id, student1.id);
    expect(assignment.mentorId).toBe(mentor1.id);
    expect(assignment.studentId).toBe(student1.id);
  });

  it('HOD cannot assign mentor in different department', async () => {
    await expect(MentorService.assignMentor(hod.id, mentor2.id, student1.id)).rejects.toThrow('Mentor must be in the exact same department and college as the HOD');
  });

  it('Student sees their mentor in dashboard', async () => {
    const dashboard = await MentorService.getMenteeDashboard(student1.id);
    expect(dashboard?.mentor.id).toBe(mentor1.id);
  });

  it('Mentor cannot access another mentor students', async () => {
    const dash1 = await MentorService.getMentorDashboard(mentor1.id);
    const dash2 = await MentorService.getMentorDashboard(mentor2.id);
    expect(dash1.length).toBe(1);
    expect(dash2.length).toBe(0);
  });

  it('Faculty can create assignment for own course', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const assignment = await CourseService.createAssignment(course.id, mentor1.id, { title: 'HW1', description: 'Do it', dueDate: futureDate });
    expect(assignment.courseId).toBe(course.id);
  });

  it('Faculty cannot create assignment for another faculty course', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    await expect(CourseService.createAssignment(course.id, mentor2.id, { title: 'HW2', description: 'No', dueDate: futureDate })).rejects.toThrow('Unauthorized');
  });

  it('Student can see assignment in dashboard', async () => {
    const dashboard = await CourseService.getStudentDashboard(student1.id);
    expect(dashboard.assignments.length).toBeGreaterThan(0);
    expect(dashboard.assignments[0].title).toBe('HW1');
  });

  it('Unenrolled student cannot see materials', async () => {
    await expect(CourseService.getCourseMaterials(course.id, student2.id)).rejects.toThrow('Unauthorized');
  });
});
