import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth/session';
import { ScholarshipService, ScholarshipState } from '@/lib/services/scholarship';
import { prisma } from '@/lib/db/prisma';
import { Permission } from '@/lib/auth/policies';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { from, to } = body;
    
    if (!from || !to) {
      return NextResponse.json({ error: 'Missing from/to state' }, { status: 400 });
    }

    const user = await requireAuth();
    const scholarship = await prisma.scholarship.findUnique({ where: { id } });
    if (!scholarship) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let requiredPerm: Permission = 'Update';
    if (to === 'APPROVED' || to === 'REJECTED') {
      requiredPerm = 'Verify';
    } else if (to === 'SANCTIONED' || to === 'DISBURSED' || to === 'CANCELLED') {
      requiredPerm = 'Approve';
    }

    await requirePermission('Scholarship', requiredPerm, scholarship);

    const updated = await ScholarshipService.transitionState(
      id,
      from as ScholarshipState,
      to as ScholarshipState,
      user.id,
      user.role
    );
    
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 400 });
  }
}
