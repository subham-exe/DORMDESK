import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { AnnouncementService } from '@/lib/services/announcement';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Student') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;
    const result = await AnnouncementService.markAcknowledged(id, user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      if (error.message.startsWith('BAD_REQUEST')) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
