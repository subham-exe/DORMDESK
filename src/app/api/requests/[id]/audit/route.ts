import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const logs = await db.auditLog.findMany({
      where: { entity: 'REQUEST', entityId: id },
      orderBy: { timestamp: 'asc' },
      include: { actor: { select: { id: true, name: true, role: true } } }
    });
    
    return NextResponse.json(logs);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
