import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const req = await db.request.findUnique({
      where: { id },
      include: { requester: true, assignedAuthority: true, incident: true }
    });
    
    if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(req);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
