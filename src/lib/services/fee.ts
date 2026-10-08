import { prisma } from "@/lib/db/prisma";
import { AuditService } from "./audit";

export class FeeService {
  static async getStudentFees(studentId: string) {
    return prisma.feeDue.findMany({
      where: { studentId },
      orderBy: { dueDate: "asc" }
    });
  }

  static async getFeesForCollege(collegeId: string) {
    return prisma.feeDue.findMany({
      where: { student: { collegeId } },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { dueDate: "asc" }
    });
  }

  static async createFeeDue(
    actorId: string, 
    studentId: string, 
    data: { amount: number; description: string; dueDate: Date }
  ) {
    const fee = await prisma.feeDue.create({
      data: {
        studentId,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        status: "PENDING"
      }
    });

    await AuditService.log({ actorId, action: "FEE_CREATED", domain: "FeeDue", targetId: fee.id, metadata: { amount: fee.amount, studentId } });

    return fee;
  }

  static async updateFeeStatus(actorId: string, feeId: string, status: string) {
    const fee = await prisma.feeDue.update({
      where: { id: feeId },
      data: { status }
    });

    await AuditService.log({ actorId, action: "FEE_STATUS_UPDATED", domain: "FeeDue", targetId: fee.id, metadata: { newStatus: status } });

    return fee;
  }
}
