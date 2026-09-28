import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== 'Student') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const receipts = await prisma.announcementReceipt.findMany({
      where: { userId: user.id },
      include: {
        announcement: {
          select: {
            id: true,
            title: true,
            body: true,
            createdAt: true,
            requiresAck: true,
            priority: true
          }
        }
      },
      orderBy: { deliveredAt: 'desc' }
    });

    const data = receipts.map(r => ({
      id: r.announcement.id, // using announcement id for frontend logic
      receiptId: r.id,
      title: r.announcement.title,
      body: r.announcement.body,
      createdAt: r.announcement.createdAt,
      requiresAck: r.announcement.requiresAck,
      priority: r.announcement.priority,
      readAt: r.readAt,
      acknowledgedAt: r.acknowledgedAt
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Fetch Announcements Error:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
