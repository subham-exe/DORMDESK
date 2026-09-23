import { NextResponse } from 'next/server';
import { SLAScheduler } from '@/lib/services/scheduler';
import { SystemClock } from '@/lib/services/clock';

export async function GET(req: Request) {
  // Check CRON_SECRET is configured to avoid accidentally allowing unauthenticated access if missing
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET is not configured');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Inject the real system clock for production execution
    const clock = new SystemClock();
    const result = await SLAScheduler.tick(clock);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron] SLA Tick failed critically', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
