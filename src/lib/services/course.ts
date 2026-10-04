import { prisma } from '@/lib/db/prisma';

export class CourseService {
  static async getStudentDashboard(studentId: string) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6

    const schedules = await prisma.classSchedule.findMany({
      where: {
        dayOfWeek,
        course: { enrollments: { some: { studentId } } }
      },
      include: { course: true },
      orderBy: { startTime: 'asc' }
    });

    const attendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId },
      _count: true
    });

    const assignments = await prisma.academicAssignment.findMany({
      where: {
        course: { enrollments: { some: { studentId } } },
        dueDate: { gte: today }
      },
      include: {
        course: true,
        submissions: { where: { studentId } }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    const notices = await prisma.announcementReceipt.findMany({
      where: { userId: studentId },
      include: { announcement: true },
      orderBy: { deliveredAt: 'desc' },
      take: 5
    });

    const mentor = await prisma.mentorAssignment.findFirst({
      where: { studentId, active: true },
      include: { mentor: { select: { name: true, email: true, id: true } } }
    });

    return { schedules, attendance, assignments, notices, mentor };
  }

  static async getFacultyDashboard(facultyId: string) {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const schedules = await prisma.classSchedule.findMany({
      where: { dayOfWeek, course: { facultyId } },
      include: { course: true },
      orderBy: { startTime: 'asc' }
    });

    const courses = await prisma.course.findMany({
      where: { facultyId },
      include: { _count: { select: { enrollments: true, assignments: true, materials: true } } }
    });

    return { schedules, courses };
  }

  static async createMaterial(courseId: string, facultyId: string, payload: { title: string; description?: string; fileUrl?: string; type: string }) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course || course.facultyId !== facultyId) throw new Error('Unauthorized');
      
      const material = await tx.courseMaterial.create({
        data: { courseId, ...payload }
      });

      await tx.auditLog.create({
        data: {
          actorId: facultyId,
          action: 'CREATE_MATERIAL',
          entity: 'CourseMaterial',
          entityId: material.id,
          metadata: JSON.stringify({ courseId })
        }
      });
      return material;
    });
  }

  static async createAssignment(courseId: string, facultyId: string, payload: { title: string; description: string; dueDate: Date }) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course || course.facultyId !== facultyId) throw new Error('Unauthorized');
      
      const assignment = await tx.academicAssignment.create({
        data: { courseId, ...payload }
      });

      await tx.auditLog.create({
        data: {
          actorId: facultyId,
          action: 'CREATE_ASSIGNMENT',
          entity: 'AcademicAssignment',
          entityId: assignment.id,
          metadata: JSON.stringify({ courseId })
        }
      });
      return assignment;
    });
  }

  static async submitAssignment(assignmentId: string, studentId: string, content: string) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.academicAssignment.findUnique({ 
        where: { id: assignmentId },
        include: { course: true }
      });
      if (!assignment) throw new Error('Assignment not found');

      const isEnrolled = await tx.enrollment.findUnique({ 
        where: { courseId_studentId: { courseId: assignment.courseId, studentId } } 
      });
      if (!isEnrolled) throw new Error('Unauthorized');

      const submission = await tx.assignmentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        update: { content, status: 'SUBMITTED', submittedAt: new Date() },
        create: { assignmentId, studentId, content }
      });

      // Avoid auditing every submission to avoid log flood, or do audit if required.
      // Usually submissions are a core transaction, so we'll audit.
      await tx.auditLog.create({
        data: {
          actorId: studentId,
          action: 'SUBMIT_ASSIGNMENT',
          entity: 'AssignmentSubmission',
          entityId: submission.id,
          metadata: JSON.stringify({ assignmentId })
        }
      });

      return submission;
    });
  }

  static async getCourseMaterials(courseId: string, studentId: string) {
    const isEnrolled = await prisma.enrollment.findUnique({ where: { courseId_studentId: { courseId, studentId } } });
    if (!isEnrolled) throw new Error('Unauthorized');
    return prisma.courseMaterial.findMany({ where: { courseId }, orderBy: { createdAt: 'desc' } });
  }
}
