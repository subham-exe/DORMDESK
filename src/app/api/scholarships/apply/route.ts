import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth/session';
import { ScholarshipService } from '@/lib/services/scholarship';

export async function POST() {
  try {
    const user = await requireAuth();
    // Validate permission using RBAC
    // Creating a scholarship for oneself
    await requirePermission('Scholarship', 'Create', { studentId: user.id });

    if (user.role !== 'Student') {
      return NextResponse.json({ error: 'Only students can apply' }, { status: 403 });
    }

    const scholarship = await ScholarshipService.initialize(user.id);
    return NextResponse.json(scholarship);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    console.error(error);
    if (error instanceof Error && ('code' in error && error.code === 'P2002' || error.message.includes('Unique constraint'))) {
      return NextResponse.json({ error: 'Scholarship record already exists' }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('not eligible')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
