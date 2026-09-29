import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { NotificationService } from '@/lib/services/notification';

export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await NotificationService.list(user.id);
    
    // Map to Zoya's expected structure
    const data = notifications.map(n => {
      let link;
      try {
        if (n.metadata) {
          const parsed = JSON.parse(n.metadata);
          if (parsed.requestId) {
            link = `/student/requests/${parsed.requestId}`;
          }
        }
      } catch {
        // ignore JSON parse error
      }
      
      return {
        ...n,
        isRead: !!n.readAt,
        timestamp: n.createdAt,
        link
      };
    });

    return NextResponse.json({ success: true, data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
