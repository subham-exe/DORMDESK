import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden', 'Faculty'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true } },
        receipts: {
          include: {
            user: { select: { name: true, email: true, hostel: true, room: true } }
          }
        }
      }
    });

    if (!announcement) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const deliveredCount = announcement.receipts.length;
    const readCount = announcement.receipts.filter(r => r.readAt).length;
    const ackCount = announcement.receipts.filter(r => r.acknowledgedAt).length;

    const data = {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      creator: announcement.creator.name,
      createdAt: announcement.createdAt,
      requiresAck: announcement.requiresAck,
      targeting: {
        branch: announcement.targetBranch,
        year: announcement.targetYear,
        hostel: announcement.targetHostel,
        block: announcement.targetBlock
      },
      stats: {
        deliveredCount,
        readCount,
        acknowledgedCount: ackCount,
        readPercentage: deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0,
        ackPercentage: deliveredCount > 0 ? Math.round((ackCount / deliveredCount) * 100) : 0
      },
      receipts: announcement.receipts.map(r => ({
        id: r.id,
        studentName: r.user.name,
        studentEmail: r.user.email,
        hostel: r.user.hostel,
        room: r.user.room,
        deliveredAt: r.deliveredAt,
        readAt: r.readAt,
        acknowledgedAt: r.acknowledgedAt
      }))
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
