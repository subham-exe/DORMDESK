import { NextResponse } from "next/server";
import { AdminAPI } from "@/lib/admin/api";
import { requireAuth } from "@/lib/auth/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { assigneeId, department } = body;

    if (!assigneeId) {
      return NextResponse.json({ error: "Missing assigneeId" }, { status: 400 });
    }

    const success = await AdminAPI.assignRequest(id, assigneeId, department || "General");

    if (!success) {
      return NextResponse.json({ error: "Request not found or invalid assignment" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes('UNAUTHORIZED') || err.message.includes('Unauthorized') || err.message === 'FORBIDDEN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
