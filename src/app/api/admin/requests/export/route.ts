import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const user = await requireAuth();
    if (!['Admin', 'Warden', 'Faculty'].includes(user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (user.role === 'Warden' && user.hostel) {
      where.location = { contains: user.hostel };
    } else if (user.role === 'Faculty' && user.department) {
      where.assignedDepartment = user.department;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        assignedAuthority: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'Request ID',
      'Ticket Number',
      'Type',
      'Category',
      'Priority',
      'Status',
      'Assigned Staff',
      'Created At',
      'Resolved At',
      'Resolution Duration (Hours)',
      'Location'
    ];

    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = requests.map(r => {
      let duration = '';
      if (["RESOLVED", "VERIFIED", "CLOSED", "APPROVED"].includes(r.status) && r.resolvedAt) {
        const hours = (r.resolvedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
        if (hours >= 0) duration = hours.toFixed(2);
      }

      return [
        r.id,
        r.ticketNumber,
        r.requestType,
        r.category,
        r.priority,
        r.status,
        r.assignedAuthority?.name || '',
        r.createdAt.toISOString(),
        r.resolvedAt ? r.resolvedAt.toISOString() : '',
        duration,
        r.location || ''
      ].map(escapeCsv).join(',');
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dormdesk_requests_export.csv"'
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
