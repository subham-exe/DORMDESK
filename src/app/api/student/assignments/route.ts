import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "Student") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const assignments = await prisma.academicAssignment.findMany({
      where: { course: { enrollments: { some: { studentId: user.id } } } },
      include: { course: true, submissions: { where: { studentId: user.id } } },
      orderBy: { dueDate: "asc" }
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
