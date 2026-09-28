import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { MessService } from '@/lib/services/mess';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const menu = await MessService.updateMenu((await params).id, {
      items: body.items,
      notes: body.notes
    }, user.id);

    return NextResponse.json(menu);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    await MessService.deleteMenu((await params).id, user.id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
