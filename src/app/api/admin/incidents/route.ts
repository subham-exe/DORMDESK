import { NextResponse } from "next/server";
import { AdminAPI, verifyAdminAuthority } from "@/lib/admin/api";

export async function POST(req: Request) {
  try {
    await verifyAdminAuthority();
    const body = await req.json();
    const { title, requestIds, incidentId } = body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ error: "No requests selected" }, { status: 400 });
    }

    if (!title && !incidentId) {
      return NextResponse.json({ error: "Missing incident title" }, { status: 400 });
    }

    const createdIncidentId = await AdminAPI.groupRequestsIntoIncident(incidentId || null, title || "Grouped Incident", requestIds);

    if (!createdIncidentId) {
      return NextResponse.json({ error: "Failed to group requests" }, { status: 500 });
    }

    return NextResponse.json({ success: true, incidentId: createdIncidentId });
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
