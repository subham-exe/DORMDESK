import { NextResponse } from "next/server";
import { verifyAdminAuthority } from "@/lib/admin/api";
import { CommandCenterService } from "@/lib/services/command-center";

export async function GET() {
  try {
    await verifyAdminAuthority();
    const data = await CommandCenterService.getDashboard();
    return NextResponse.json(data);
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
