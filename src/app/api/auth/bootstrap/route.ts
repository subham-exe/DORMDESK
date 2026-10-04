import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, bootstrapToken, name } = await req.json();

    if (!process.env.OWNER_BOOTSTRAP_TOKEN) {
      return NextResponse.json({ error: "Bootstrap is disabled" }, { status: 403 });
    }
    if (bootstrapToken !== process.env.OWNER_BOOTSTRAP_TOKEN) {
      return NextResponse.json({ error: "Invalid bootstrap token" }, { status: 403 });
    }

    const ownerAuthority = await prisma.authorityLevel.findUnique({ where: { name: "SYSTEM_ADMIN" } });
    if (!ownerAuthority) {
      return NextResponse.json({ error: "System uninitialized" }, { status: 500 });
    }

    const existingOwner = await prisma.user.findFirst({ where: { authorityId: ownerAuthority.id } });
    if (existingOwner) {
      return NextResponse.json({ error: "Owner already exists" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || "System Owner",
        role: "SYSTEM_ADMIN", // Legacy fallback if checked
        password: hashedPassword,
        isResident: false,
        authorityId: ownerAuthority.id,
        accountStatus: "ACTIVE",
      }
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
