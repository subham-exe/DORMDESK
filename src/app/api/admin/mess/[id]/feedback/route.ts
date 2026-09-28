import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { MessService } from '@/lib/services/mess';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const summary = await MessService.getFeedbackSummary((await params).id);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
