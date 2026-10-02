import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { canManageTarget } from "@/lib/auth/hierarchy";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const targetUser = await prisma.user.findUnique({ where: { id }, include: { authority: true } });
    if (!targetUser || !targetUser.authority) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Owner protection
    if (targetUser.authority.name === "OWNER_001") {
      return NextResponse.json({ error: "Owner cannot be modified through this API" }, { status: 403 });
    }

    // Must be able to manage the existing authority/scope
    const canManageExisting = await canManageTarget(actor.id, targetUser.authority.name, targetUser.collegeId, targetUser.departmentRefId, targetUser.hostelRefId);
    if (!canManageExisting) {
      return NextResponse.json({ error: "FORBIDDEN: Cannot manage this user" }, { status: 403 });
    }

    // If changing role or scope, verify new authority/scope is also allowed
    const newRoleName = body.roleName || targetUser.authority.name;
    const newCollegeId = body.collegeId !== undefined ? body.collegeId : targetUser.collegeId;
    const newDepartmentRefId = body.departmentRefId !== undefined ? body.departmentRefId : targetUser.departmentRefId;
    const newHostelRefId = body.hostelRefId !== undefined ? body.hostelRefId : targetUser.hostelRefId;

    if (newRoleName === "OWNER_001") {
      return NextResponse.json({ error: "Cannot assign OWNER_001 role" }, { status: 403 });
    }

    if (newRoleName !== targetUser.authority.name || newCollegeId !== targetUser.collegeId || newDepartmentRefId !== targetUser.departmentRefId || newHostelRefId !== targetUser.hostelRefId) {
      const canManageNew = await canManageTarget(actor.id, newRoleName, newCollegeId, newDepartmentRefId, newHostelRefId);
      if (!canManageNew) {
        return NextResponse.json({ error: "FORBIDDEN: Cannot promote to this authority or scope" }, { status: 403 });
      }
    }

    const newAuth = await prisma.authorityLevel.findUnique({ where: { name: newRoleName } });
    if (!newAuth) return NextResponse.json({ error: "Invalid authority" }, { status: 400 });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        authorityId: newAuth.id,
        collegeId: newCollegeId,
        departmentRefId: newDepartmentRefId,
        hostelRefId: newHostelRefId,
        accountStatus: body.accountStatus || targetUser.accountStatus
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_MODIFIED",
        actorId: actor.id,
        entity: "User", entityId: updatedUser.id, metadata: JSON.stringify(body)
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
