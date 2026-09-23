import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || 'mock-user-123';
    
    const scholarship = await prisma.scholarship.findUnique({
      where: { studentId }
    });
    
    return NextResponse.json({ success: true, data: scholarship });
  } catch (error: unknown) {
    console.error('Fetch Scholarship Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
