import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { SLAScheduler } from '@/lib/services/scheduler';
import { SystemClock } from '@/lib/services/clock';

export async function POST() {
  try {
    const user = await requireAuth();
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const clock = new SystemClock();
    const result = await SLAScheduler.tick(clock);

    return NextResponse.json({ 
      success: true, 
      message: 'SLA check executed successfully',
      result 
    });
  } catch (error: unknown) {
    console.error('SLA check error:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
