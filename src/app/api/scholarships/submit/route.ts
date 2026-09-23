import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth/session';
import { ScholarshipService } from '@/lib/services/scholarship';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    const user = await requireAuth();
    const scholarship = await prisma.scholarship.findUnique({
      where: { studentId: user.id }
    });

    if (!scholarship) {
      return NextResponse.json({ error: 'Scholarship not initialized' }, { status: 404 });
    }

    // Verify ownership via RBAC policy
    await requirePermission('Scholarship', 'Update', scholarship);

    if (scholarship.status === 'ELIGIBLE') {
      await ScholarshipService.transitionState(scholarship.id, 'ELIGIBLE', 'APPLIED', user.id, user.role);
      const updated = await ScholarshipService.transitionState(scholarship.id, 'APPLIED', 'SUBMITTED', user.id, user.role);
      return NextResponse.json(updated);
    } else if (scholarship.status === 'APPLIED') {
      const updated = await ScholarshipService.transitionState(scholarship.id, 'APPLIED', 'SUBMITTED', user.id, user.role);
      return NextResponse.json(updated);
    } else {
      return NextResponse.json({ error: 'Cannot submit from current state' }, { status: 400 });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
