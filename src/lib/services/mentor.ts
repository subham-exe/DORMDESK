import { prisma } from '@/lib/db/prisma';

export class MentorService {
  static async assignMentor(hodId: string, mentorId: string, studentId: string) {
    // Transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      const hod = await tx.user.findUnique({ where: { id: hodId } });
      const mentor = await tx.user.findUnique({ where: { id: mentorId } });
      const student = await tx.user.findUnique({ where: { id: studentId } });
      
      if (!hod || !mentor || !student) throw new Error('Invalid users');
      if (hod.role !== 'HOD') throw new Error('Only HOD can assign mentors');
      
      if (hod.collegeId !== mentor.collegeId || hod.departmentRefId !== mentor.departmentRefId) {
        throw new Error('Mentor must be in the exact same department and college as the HOD');
      }
      if (hod.collegeId !== student.collegeId || hod.departmentRefId !== student.departmentRefId) {
        throw new Error('Student must be in the exact same department and college as the HOD');
      }
      
      // Deactivate any existing active mentor for this student
      await tx.mentorAssignment.updateMany({
        where: { studentId, active: true, mentorId: { not: mentorId } },
        data: { active: false }
      });

      // Create or update
      const assignment = await tx.mentorAssignment.upsert({
        where: { mentorId_studentId: { mentorId, studentId } },
        update: { active: true },
        create: { mentorId, studentId }
      });

      await tx.auditLog.create({
        data: {
          actorId: hodId,
          action: 'ASSIGN_MENTOR',
          entity: 'MentorAssignment',
          entityId: assignment.id,
          metadata: JSON.stringify({ mentorId, studentId })
        }
      });

      return assignment;
    });
  }

  static async getMenteeDashboard(studentId: string) {
    return prisma.mentorAssignment.findFirst({
      where: { studentId, active: true },
      include: {
        mentor: { select: { id: true, name: true, email: true, department: true } }
      }
    });
  }

  static async getMentorDashboard(mentorId: string) {
    return prisma.mentorAssignment.findMany({
      where: { mentorId, active: true },
      include: {
        student: { select: { id: true, name: true, email: true, year: true, branch: true } }
      }
    });
  }
}
