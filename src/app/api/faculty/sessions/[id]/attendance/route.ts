import { NextRequest, NextResponse } from 'next/server';
import { AcademicService } from '@/lib/services/academic';
import { requireAuth } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== 'Faculty') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { attendanceData } = await request.json();
    if (!attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ success: false, error: 'Invalid attendance data' }, { status: 400 });
    }

    const results = await AcademicService.updateAttendance(user.id, (await params).id, attendanceData);
    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
