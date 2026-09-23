import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const user = await requireAuth();
    
    if (user.role !== 'Student') {
      return NextResponse.json({ error: 'Only students can check their scholarship status' }, { status: 403 });
    }

    const scholarship = await prisma.scholarship.findUnique({
      where: { studentId: user.id }
    });

    if (!scholarship) {
      return NextResponse.json({ status: 'NOT_APPLIED' });
    }

    return NextResponse.json(scholarship);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
