import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { PolicyService } from '@/lib/services/policy';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const result = await PolicyService.resolvePolicyForRequest(
      {
        requestType: body.requestType,
        category: body.category,
        domain: body.domain
      },
      { request: body.context }
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
