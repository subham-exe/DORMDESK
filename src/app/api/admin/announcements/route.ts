import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { AnnouncementService } from '@/lib/services/announcement';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden', 'Faculty'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true } },
        _count: {
          select: { receipts: true }
        }
      }
    });

    // Also get read and ack counts (since Prisma _count on relations with filters is tricky without nested select or multiple queries, we can group or do custom counts)
    // To keep it simple, we'll fetch aggregated stats for these announcements
    const announcementIds = announcements.map(a => a.id);
    const stats = await prisma.announcementReceipt.groupBy({
      by: ['announcementId'],
      where: { announcementId: { in: announcementIds } },
      _count: {
        readAt: true,
        acknowledgedAt: true
      }
    });

    const statsMap = new Map(stats.map(s => [s.announcementId, s._count]));

    const result = announcements.map(a => {
      const deliveredCount = a._count.receipts;
      const readCount = statsMap.get(a.id)?.readAt || 0;
      const ackCount = statsMap.get(a.id)?.acknowledgedAt || 0;
      
      return {
        id: a.id,
        title: a.title,
        creator: a.creator.name,
        createdAt: a.createdAt,
        requiresAck: a.requiresAck,
        targeting: {
          branch: a.targetBranch,
          year: a.targetYear,
          hostel: a.targetHostel,
          block: a.targetBlock
        },
        deliveredCount,
        readCount,
        acknowledgedCount: ackCount,
        readPercentage: deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0,
        ackPercentage: deliveredCount > 0 ? Math.round((ackCount / deliveredCount) * 100) : 0
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden', 'Faculty'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const { title, body: announcementBody, targetBranch, targetYear, targetHostel, targetBlock, requiresAck, priority } = body;

    if (typeof title !== 'string' || title.length < 3 || title.length > 200) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }
    if (typeof announcementBody !== 'string' || announcementBody.length < 10) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const result = await AnnouncementService.create({
      title,
      body: announcementBody,
      createdById: user.id,
      targetBranch: targetBranch || null,
      targetYear: targetYear ? parseInt(targetYear) : null,
      targetHostel: targetHostel || null,
      targetBlock: targetBlock || null,
      requiresAck: !!requiresAck,
      priority: priority || 'LOW'
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Create Announcement Error:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
