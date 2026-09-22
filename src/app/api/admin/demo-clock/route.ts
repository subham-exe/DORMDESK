import { NextResponse } from "next/server";
import { AdminAPI } from "@/lib/admin/api";

export async function GET() {
  return NextResponse.json({ offsetHours: AdminAPI.getDemoClockOffset() / (1000 * 60 * 60) });
}

export async function POST(req: Request) {
  try {
    const { action, hours } = await req.json();

    if (action === "RESET") {
      AdminAPI.resetDemoClock();
    } else if (action === "ADVANCE" && typeof hours === "number") {
      AdminAPI.advanceDemoClock(hours);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      offsetHours: AdminAPI.getDemoClockOffset() / (1000 * 60 * 60) 
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
