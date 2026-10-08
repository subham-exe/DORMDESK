import { NextRequest, NextResponse } from 'next/server';
import { RequestEngine } from '@/lib/services/request-engine';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const user = await requireAuth();
    const request = await prisma.request.findUnique({
      where: { id: resolvedParams.id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, department: true, hostel: true } },
        assignedAuthority: { select: { id: true, name: true, email: true, role: true, department: true, hostel: true } },
        incident: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' }
        },
        evidences: { orderBy: { createdAt: 'desc' } },
        assignmentHistory: {
          orderBy: { assignedAt: 'asc' },
          include: {
            assignee: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!request) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (user.role === 'Student' && request.requesterId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { entity: 'Request', entityId: resolvedParams.id },
      orderBy: { timestamp: 'desc' },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } }
    });

    return NextResponse.json({ success: true, data: { ...request, auditLogs } });
  } catch (error: unknown) {
    console.error("API ROUTE ERROR:", error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'UNAUTHORIZED' || msg === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { action, assigneeId, department, newStatus, notes, evidence } = body;
    const actorId = user.id;

    const existingReq = await prisma.request.findUnique({ where: { id: resolvedParams.id } });
    if (!existingReq) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (user.role === 'Student') {
      if (existingReq.requesterId !== user.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
      if (action === 'ASSIGN') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
      if (action === 'TRANSITION' && !['CANCELLED', 'VERIFIED', 'PROCESSING'].includes(newStatus)) {
        return NextResponse.json({ success: false, error: 'Unauthorized transition' }, { status: 403 });
      }
    }

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
        notes,
        evidence
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    console.error("API ROUTE ERROR:", error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'UNAUTHORIZED' || msg === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
