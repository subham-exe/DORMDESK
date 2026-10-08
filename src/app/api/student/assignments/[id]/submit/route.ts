import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { CourseService } from "@/lib/services/course";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== "Student") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    if (!body.content) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    const submission = await CourseService.submitAssignment(id, user.id, body.content);
    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message === 'Unauthorized' ? 403 : 500 });
  }
}
