import { NextRequest, NextResponse } from 'next/server';
import { MentorService } from '@/lib/services/mentor';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'Faculty' && user.role !== 'HOD')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await MentorService.getMentorDashboard(user.id);
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}




