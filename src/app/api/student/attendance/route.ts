import { NextResponse } from 'next/server';
import { AcademicService } from '@/lib/services/academic';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== 'Student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const attendance = await AcademicService.getStudentAttendance(user.id);
    return NextResponse.json({ success: true, attendance });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
