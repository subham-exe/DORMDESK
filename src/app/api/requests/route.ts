import { NextRequest, NextResponse } from 'next/server';
import { RequestEngine } from '@/lib/services/request-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestType, category, requesterId, description, location, priority, metadata } = body;

    const request = await RequestEngine.createRequest({
      requestType,
      category,
      requesterId,
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
