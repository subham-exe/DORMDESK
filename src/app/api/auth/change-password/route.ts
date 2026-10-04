import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const actor = await requireAuth();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: actor.id } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        mustChangePassword: false
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "PASSWORD_CHANGED",
        actorId: user.id,
        entity: "User",
        entityId: user.id,
        metadata: JSON.stringify({ forced: user.mustChangePassword })
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
    if (((error as Error)?.message || 'Unknown error') === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
