import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { RequestEngine } from '@/lib/server/request-engine';
import { getMockUser } from '@/lib/server/mock-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requesterId');
    const status = searchParams.get('status');

    const where: Record<string, string> = {};
    if (requesterId) where.requesterId = requesterId;
    if (status) where.status = status;

    const requests = await db.request.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(requests);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const user = getMockUser('STUDENT'); // Simulate logged-in student

    const req = await RequestEngine.createRequest(user, {
      requestType: data.requestType,
      category: data.category,
      description: data.description,
      location: data.location,
      priority: data.priority,
      slaDurationHours: data.slaDurationHours,
    });

    return NextResponse.json(req, { status: 201 });
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
