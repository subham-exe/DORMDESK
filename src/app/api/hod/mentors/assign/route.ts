import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { MentorService } from "@/lib/services/mentor";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "HOD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { mentorId, studentId } = body;

    if (!mentorId || !studentId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const assignment = await MentorService.assignMentor(user.id, mentorId, studentId);
    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.message.includes('Unauthorized') || error.message.includes('exact same') ? 403 : 500 });
  }
}
