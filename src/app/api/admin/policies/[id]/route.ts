import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { PolicyService } from '@/lib/services/policy';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const { id } = await params;
    const policy = await PolicyService.getPolicy(id);
    return NextResponse.json({ success: true, data: policy });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const updated = await PolicyService.updatePolicy(id, body, user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      if (error.message === 'CONCURRENCY_CONFLICT') return NextResponse.json({ error: 'Conflict: Stale version' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const { id } = await params;
    const deleted = await PolicyService.deletePolicy(id, user.id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
