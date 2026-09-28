import { NextRequest, NextResponse } from 'next/server';
import { RequestEngine } from '@/lib/services/request-engine';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await requireAuth();

    const requests = await prisma.request.findMany({
      where: { requesterId: user.id },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error: unknown) {
    console.error('Fetch Requests Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { requestType, category, description, location, priority, metadata } = body;

    const request = await RequestEngine.createRequest({
      requestType,
      category,
      requesterId: user.id,
      description,
      location,
      priority,
      metadata
    });

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create Request Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
