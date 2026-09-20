import { NextRequest, NextResponse } from 'next/server';
import { RequestEngine } from '@/lib/services/request-engine';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const request = await prisma.request.findUnique({
      where: { id: params.id },
      include: {
        requester: true,
        assignedAuthority: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' }
        },
        incident: true
      }
    });

    if (!request) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action, assigneeId, department, actorId, newStatus, notes } = body;

    let request;
    if (action === 'ASSIGN') {
      request = await RequestEngine.assignRequest({
        requestId: params.id,
        assigneeId,
        department,
        actorId
      });
    } else if (action === 'TRANSITION') {
      request = await RequestEngine.transitionStatus({
        requestId: params.id,
        newStatus,
        actorId,
        notes
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
