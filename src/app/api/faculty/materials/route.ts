import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { CourseService } from "@/lib/services/course";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!['Faculty', 'HOD'].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, title, description, type, fileUrl } = body;
    if (!courseId || !title || !type) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const material = await CourseService.createMaterial(courseId, user.id, { title, description, type, fileUrl });
    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === 'Unauthorized' ? 403 : 500 });
  }
}
