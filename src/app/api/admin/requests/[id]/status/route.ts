import { NextResponse } from "next/server";
import { AdminAPI, verifyAdminAuthority } from "@/lib/admin/api";
import { RequestStatus } from "@/lib/types/request";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuthority();
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const success = await AdminAPI.updateRequestStatus(id, status as RequestStatus, notes);

    if (!success) {
      return NextResponse.json({ error: "Invalid transition or request not found" }, { status: 400 });
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
