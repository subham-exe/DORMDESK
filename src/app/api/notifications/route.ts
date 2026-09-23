import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || 'mock-user-123';

    // Get all requests for the student
    const requests = await prisma.request.findMany({
      where: { requesterId: studentId },
      select: { id: true, ticketNumber: true, requestType: true }
    });

    const requestIds = requests.map(r => r.id);

    // Get audit logs for these requests (acting as notifications)
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: 'Request',
        entityId: { in: requestIds },
        OR: [
          { actorId: { not: studentId } },
          { action: 'AUTO_APPROVED' }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    const notifications = logs.map(log => {
      const req = requests.find(r => r.id === log.entityId);
      let title = `Update on ${req?.ticketNumber || 'Request'}`;
      let message = `An action was taken: ${log.action}`;
      
      if (log.action === 'STATUS_CHANGED') {
        try {
          const meta = JSON.parse(log.metadata || '{}');
          title = `Status Updated: ${req?.ticketNumber}`;
          message = `Your ${req?.requestType} is now ${meta.newStatus}.`;
        } catch { }
      } else if (log.action === 'AUTO_APPROVED') {
        title = `Auto-Approved: ${req?.ticketNumber}`;
        message = `Your leave request was automatically approved.`;
      } else if (log.action === 'ASSIGNED') {
        title = `Assigned: ${req?.ticketNumber}`;
        message = `Your request has been assigned for processing.`;
      }

      return {
        id: log.id,
        title,
        message,
        type: 'UPDATE',
        timestamp: log.timestamp,
        link: `/student/requests/${log.entityId}`
      };
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: unknown) {
    console.error('Fetch Notifications Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
