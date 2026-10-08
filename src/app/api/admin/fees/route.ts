import { NextRequest, NextResponse } from "next/server";
import { FeeService } from "@/lib/services/fee";
import { requireAuth } from "@/lib/auth/session";


export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "SYSTEM_ADMIN" && user.role !== "Warden" && user.role !== "Principal") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const collegeId = user.collegeId;
if (!collegeId) return NextResponse.json({ success: false, error: 'No college scope' }, { status: 403 });

    const fees = await FeeService.getFeesForCollege(collegeId);
    return NextResponse.json({ success: true, fees });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "SYSTEM_ADMIN" && user.role !== "Warden" && user.role !== "Principal") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const collegeId = user.collegeId;
if (!collegeId) return NextResponse.json({ success: false, error: 'No college scope' }, { status: 403 });

    const body = await req.json();
    const { studentId, amount, description, dueDate } = body;

    // Optional: Verify the student belongs to the admin's college
    // The query can be just checking Prisma directly
    const { prisma } = await import("@/lib/db/prisma");
    const student = await prisma.user.findFirst({ where: { id: studentId, collegeId: collegeId, role: "Student" } });
    if (!student) {
      return NextResponse.json({ success: false, error: "Invalid student or unauthorized scope" }, { status: 403 });
    }

    const fee = await FeeService.createFeeDue(user.id, studentId, { amount, description, dueDate: new Date(dueDate) });
    return NextResponse.json({ success: true, fee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
