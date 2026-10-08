import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "Student") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const schedules = await prisma.classSchedule.findMany({
      where: { course: { enrollments: { some: { studentId: user.id } } } },
      include: { course: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    });
    return NextResponse.json({ success: true, schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
