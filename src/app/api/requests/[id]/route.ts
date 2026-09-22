import { NextRequest, NextResponse } from 'next/server';
import { RequestEngine } from '@/lib/services/request-engine';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const request = await prisma.request.findUnique({
      where: { id: resolvedParams.id },
      include: {
        requester: true,
        assignedAuthority: true,
        incident: true
      }
    });

    if (!request) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const auditLogs = await prisma.auditLog.findMany({
      where: { entity: 'Request', entityId: resolvedParams.id },
      orderBy: { timestamp: 'desc' },
      include: { actor: true }
    });

    return NextResponse.json({ success: true, data: { ...request, auditLogs } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const body = await req.json();
    const { action, assigneeId, department, actorId, newStatus, notes } = body;

    let request;
    if (action === 'ASSIGN') {
      request = await RequestEngine.assignRequest({
        requestId: resolvedParams.id,
        assigneeId,
        department,
        actorId
      });
    } else if (action === 'TRANSITION') {
      request = await RequestEngine.transitionStatus({
        requestId: resolvedParams.id,
        newStatus,
        actorId,
        notes
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
