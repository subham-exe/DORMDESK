import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "Student") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const materials = await prisma.courseMaterial.findMany({
      where: { course: { enrollments: { some: { studentId: user.id } } } },
      include: { course: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
