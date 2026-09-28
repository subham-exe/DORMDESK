import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { AnnouncementService } from '@/lib/services/announcement';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden', 'Faculty'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetBranch = searchParams.get('targetBranch') || undefined;
    const targetYear = searchParams.get('targetYear') ? parseInt(searchParams.get('targetYear')!) : undefined;
    const targetHostel = searchParams.get('targetHostel') || undefined;
    const targetBlock = searchParams.get('targetBlock') || undefined;

    const count = await AnnouncementService.getPreviewCount({
      targetBranch,
      targetYear: isNaN(targetYear as number) ? undefined : targetYear,
      targetHostel,
      targetBlock
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error: unknown) {
    console.error('Preview Announcements Error:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
