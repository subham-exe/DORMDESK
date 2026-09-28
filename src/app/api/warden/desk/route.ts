import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== 'Warden') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Determine scope. 
    // Limitation: Currently Mess/Requests are global, but if Warden is assigned to a specific hostel we filter.
    // The current architecture treats Warden as a global role (no strict multi-hostel tenancy implemented yet), 
    // but if the user has a hostel defined, we might optionally filter by it. For now, we will return global requests 
    // or requests mapped to their hostel if present.
    const hostelScope = user.hostel ? { requester: { hostel: user.hostel } } : {};

    const [
      pendingRequests,
      urgentRequests,
      breachedRequests,
      recentlyResolved,
      totalOpen,
      recentIncidents
    ] = await Promise.all([
      prisma.request.findMany({
        where: { status: 'PENDING', ...hostelScope },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { requester: { select: { name: true, room: true } } }
      }),
      prisma.request.count({
        where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }, priority: 'HIGH', ...hostelScope }
      }),
      prisma.request.findMany({
        where: { 
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }, 
          dueAt: { lt: new Date() },
          ...hostelScope
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: { requester: { select: { name: true, room: true } } }
      }),
      prisma.request.findMany({
        where: { status: { in: ['RESOLVED', 'CLOSED'] }, ...hostelScope },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { requester: { select: { name: true, room: true } } }
      }),
      prisma.request.count({
        where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }, ...hostelScope }
      }),
      prisma.incident.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return NextResponse.json({
      scope: user.hostel || 'GLOBAL',
      snapshot: {
        totalOpen,
        urgentRequests,
        breachedCount: breachedRequests.length
      },
      pendingRequests,
      breachedRequests,
      recentlyResolved,
      recentIncidents
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: (error as Error).message === 'FORBIDDEN' ? 403 : 500 });
  }
}
