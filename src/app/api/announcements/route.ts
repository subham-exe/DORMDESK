import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Currently there is no Announcement model in Prisma.
    // For ZOY-09, we return a mock array to demonstrate the Banner UI.
    const mockAnnouncements = [
      {
        id: "annc-1",
        title: "Welcome to DormDesk",
        message: "The new student portal is now live. Please verify your profile details and submit any pending gate pass requests through the universal request engine.",
        date: new Date().toISOString(),
        type: "INFO"
      }
    ];
    return NextResponse.json({ success: true, data: mockAnnouncements });
  } catch (error: unknown) {
    console.error('Fetch Announcements Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
