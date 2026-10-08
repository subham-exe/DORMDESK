import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== "Faculty" && user.role !== "HOD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const assignment = await prisma.academicAssignment.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!assignment) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (assignment.course.facultyId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: id },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: "desc" }
    });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
