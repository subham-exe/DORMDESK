import { prisma } from '@/lib/db/prisma';

export class FeeService {
  static async getStudentFees(studentId: string) {
    return prisma.feeDue.findMany({
      where: { studentId },
      orderBy: { dueDate: 'asc' }
    });
  }
}
