import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Currently there is no Announcement model in Prisma.
    // Returning empty array to avoid presenting mock data as real data.
    return NextResponse.json({ success: true, data: [] });
  } catch (error: unknown) {
    console.error('Fetch Announcements Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
