import { NextRequest, NextResponse } from "next/server";
import { FeeService } from "@/lib/services/fee";
import { requireAuth } from "@/lib/auth/session";


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== "SYSTEM_ADMIN" && user.role !== "Warden" && user.role !== "Principal") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const collegeId = user.collegeId;
if (!collegeId) return NextResponse.json({ success: false, error: 'No college scope' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const { prisma } = await import("@/lib/db/prisma");
    const fee = await prisma.feeDue.findUnique({ where: { id }, include: { student: true } });
    
    if (!fee) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (fee.student.collegeId !== collegeId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.status || !["PENDING", "PAID", "OVERDUE"].includes(body.status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const updated = await FeeService.updateFeeStatus(user.id, id, body.status);
    return NextResponse.json({ success: true, fee: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
