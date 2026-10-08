import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/lib/services/course";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "Faculty" && user.role !== "HOD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const assignments = await prisma.academicAssignment.findMany({
      where: { course: { facultyId: user.id } },
      include: { course: true, _count: { select: { submissions: true } } },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "Faculty" && user.role !== "HOD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, title, description, dueDate } = body;
    if (!courseId || !title || !description || !dueDate) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const assignment = await CourseService.createAssignment(courseId, user.id, {
      title, description, dueDate: new Date(dueDate)
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
