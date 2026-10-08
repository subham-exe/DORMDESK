import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "HOD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = user.departmentRefId;
    const collegeId = user.collegeId;

    if (!departmentId || !collegeId) {
      return NextResponse.json({ success: false, error: "HOD lacks proper scope" }, { status: 403 });
    }

    const assignments = await prisma.mentorAssignment.findMany({
      where: {
        active: true,
        student: { departmentRefId: departmentId, collegeId }
      },
      include: { 
        student: { select: { id: true, name: true, branch: true, year: true } }, 
        mentor: { select: { id: true, name: true } } 
      },
      orderBy: { assignedAt: "desc" }
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
