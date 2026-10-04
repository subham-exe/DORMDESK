import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth();
    if (actor.role !== "Admin" || actor.authority?.name !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;

    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } }
      }
    });

    if (!college) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(college, { status: 200 });
  } catch (error) {
    if (((error as any)?.message || 'Unknown error') === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth();
    if (actor.role !== "Admin" || actor.authority?.name !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const { status, name } = await req.json();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;

    const college = await prisma.college.update({
      where: { id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        action: "COLLEGE_UPDATED",
        actorId: actor.id,
        entity: "College",
        entityId: college.id,
        metadata: JSON.stringify(updateData)
      }
    });

    return NextResponse.json(college, { status: 200 });
  } catch (error) {
    if (((error as any)?.message || 'Unknown error') === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: ((error as any)?.message || 'Unknown error') }, { status: 400 });
  }
}
