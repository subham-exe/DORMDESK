import { NextResponse } from "next/server";
import { AdminAPI, verifyAdminAuthority } from "@/lib/admin/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuthority();
    const { id } = await params;
    const body = await req.json();
    const { notes } = body;

    const success = await AdminAPI.resolveIncident(id, notes || "Resolved via incident cascade");

    if (!success) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
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
