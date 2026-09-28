import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { MessService } from '@/lib/services/mess';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Student') {
      return NextResponse.json({ error: 'Only students can submit mess feedback' }, { status: 403 });
    }

    const body = await req.json();
    
    const feedback = await MessService.submitFeedback(
      (await params).id,
      user.id,
      body.rating,
      body.comment
    );

    return NextResponse.json(feedback);
  } catch (error: unknown) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
