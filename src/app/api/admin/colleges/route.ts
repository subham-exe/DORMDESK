import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  try {
    const actor = await requireAuth();
    if (actor.role !== "Admin" || actor.authority?.name !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const colleges = await prisma.college.findMany({
      include: {
        _count: { select: { users: true } }
      }
    });

    return NextResponse.json(colleges, { status: 200 });
  } catch (error) {
    if (((error as Error)?.message || 'Unknown error') === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth();
    if (actor.role !== "Admin" || actor.authority?.name !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Missing college name" }, { status: 400 });
    }

    const college = await prisma.college.create({
      data: { name, status: "ACTIVE" }
    });

    await prisma.auditLog.create({
      data: {
        action: "COLLEGE_CREATED",
        actorId: actor.id,
        entity: "College",
        entityId: college.id,
        metadata: JSON.stringify({ name })
      }
    });

    return NextResponse.json(college, { status: 201 });
  } catch (error) {
    if (((error as Error)?.message || 'Unknown error') === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: ((error as Error)?.message || 'Unknown error') }, { status: 400 });
  }
}
