import { NextResponse } from "next/server";
import { verifyAdminAuthority } from "@/lib/admin/api";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuthority();
    const { id } = await params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        requests: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            priority: true,
            category: true,
            location: true,
            createdAt: true,
            requester: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userIds = new Set(incident.requests.map(r => r.requester.id));

    return NextResponse.json({
      ...incident,
      userCount: userIds.size,
      requestCount: incident.requests.length,
    });
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
