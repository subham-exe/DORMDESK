import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth/session";
import { canManageTarget } from "@/lib/auth/hierarchy";
import { deriveLegacyRole } from "@/lib/auth/authority";

export async function POST(req: Request) {
  try {
    const actor = await requireAuth();
    const { email, password, name, roleName, collegeId, departmentRefId, hostelRefId } = await req.json();

    if (!email || !password || !name || !roleName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isAllowed = await canManageTarget(actor.id, roleName, collegeId, departmentRefId, hostelRefId);
    if (!isAllowed) {
      return NextResponse.json({ error: "FORBIDDEN: Cannot create user with this authority or scope" }, { status: 403 });
    }

    const targetAuth = await prisma.authorityLevel.findUnique({ where: { name: roleName } });
    if (!targetAuth) return NextResponse.json({ error: "Invalid authority" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const legacyRole = deriveLegacyRole(roleName);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: legacyRole,
        authorityId: targetAuth.id,
        collegeId,
        departmentRefId,
        hostelRefId,
        accountStatus: "ACTIVE"
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_CREATED",
        actorId: actor.id,
        entity: "User", entityId: user.id, metadata: JSON.stringify({ roleName, collegeId, departmentRefId, hostelRefId })
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
