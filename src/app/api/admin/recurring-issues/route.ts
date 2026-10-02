import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role === 'Student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ACTIVE';

    const issues = await prisma.recurringIssue.findMany({
      where: status !== 'ALL' ? { status } : undefined,
      orderBy: { lastDetectedAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: issues });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 401 });
  }
}
