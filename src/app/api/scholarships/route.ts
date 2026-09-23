import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await requireAuth();
    
    const scholarship = await prisma.scholarship.findUnique({
      where: { studentId: user.id }
    });
    
    return NextResponse.json({ success: true, data: scholarship });
  } catch (error: unknown) {
    console.error('Fetch Scholarship Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
