import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const user = await requireAuth();
    if (user.role === 'Student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const issue = await prisma.recurringIssue.findUnique({
      where: { id: resolvedParams.id },
      include: {
        incidents: true,
        requests: true
      }
    });

    if (!issue) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: issue });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 401 });
  }
}
