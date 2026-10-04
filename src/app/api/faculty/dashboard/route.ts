import { NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/course';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Faculty') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await CourseService.getFacultyDashboard(user.id);
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}



