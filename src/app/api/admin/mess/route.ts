import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { MessService } from '@/lib/services/mess';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 7));
    const endDate = end ? new Date(end) : new Date(new Date().setDate(new Date().getDate() + 14));

    const menus = await MessService.getOperationalFeedbackSummary(startDate, endDate);
    return NextResponse.json(menus);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message === 'FORBIDDEN' ? 403 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const menu = await MessService.createMenu({
      date: new Date(body.date),
      mealType: body.mealType,
      items: body.items,
      notes: body.notes
    }, user.id);

    return NextResponse.json(menu);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Menu already exists for this date and meal slot' }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
