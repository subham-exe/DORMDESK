import { NextResponse } from "next/server";
import { AdminAPI, ScholarshipStatus } from "@/lib/admin/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const success = await AdminAPI.updateScholarshipStatus(id, status as ScholarshipStatus, notes);

    if (!success) {
      return NextResponse.json({ error: "Scholarship not found or invalid transition" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
