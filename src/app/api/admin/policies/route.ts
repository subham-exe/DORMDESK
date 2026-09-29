import { NextResponse } from 'next/server';
import { verifyAdminAuthority } from '@/lib/admin/api';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    await verifyAdminAuthority();

    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ policies });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes('UNAUTHORIZED') || err.message.includes('Unauthorized') || err.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
