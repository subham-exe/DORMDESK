import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!['Faculty', 'HOD'].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const schedules = await prisma.classSchedule.findMany({
      where: { course: { facultyId: user.id } },
      include: { course: true }
    });
    return NextResponse.json({ success: true, schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!['Faculty', 'HOD'].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, dayOfWeek, startTime, endTime, room } = body;
    if (!courseId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    return await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: courseId } });
      if (!course || course.facultyId !== user.id) throw new Error('Unauthorized');

      // Detect duplicates
      const existing = await tx.classSchedule.findFirst({
        where: { courseId, dayOfWeek, startTime, endTime }
      });
      if (existing) {
        throw new Error('Duplicate schedule entry');
      }

      const schedule = await tx.classSchedule.create({
        data: { courseId, dayOfWeek, startTime, endTime, room }
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'CREATE_CLASS_SCHEDULE',
          entity: 'ClassSchedule',
          entityId: schedule.id,
          metadata: JSON.stringify({ courseId })
        }
      });

      return NextResponse.json({ success: true, schedule }, { status: 201 });
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === 'Unauthorized' ? 403 : error.message.includes('Duplicate') ? 409 : 500 });
  }
}
