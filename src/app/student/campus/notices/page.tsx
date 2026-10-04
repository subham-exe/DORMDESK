import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, AlertCircle } from 'lucide-react';

export default async function NoticesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'Student') redirect('/login');

  const receipts = await prisma.announcementReceipt.findMany({
    where: { userId: user.id },
    include: { announcement: { include: { creator: { select: { name: true, role: true } } } } },
    orderBy: { deliveredAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Notice Board</h1>
        <p className="text-sm text-text-secondary">Important updates and announcements</p>
      </div>

      <div className="space-y-4">
        {receipts.length === 0 ? (
          <div className="p-4 md:p-8 text-center text-text-secondary bg-surface rounded-lg border border-border">
            No notices found.
          </div>
        ) : (
          receipts.map(r => {
            const isHigh = r.announcement.priority === 'HIGH';
            return (
              <Card key={r.id} className={`hover:border-info transition-colors ${!r.readAt ? 'bg-surface border-l-4 border-l-info' : 'bg-surface-muted opacity-80'}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isHigh ? 'bg-error-bg text-error' : 'bg-info-bg text-info'}`}>
                      {isHigh ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h2 className="font-bold text-lg">{r.announcement.title}</h2>
                        <span className="text-xs text-text-secondary whitespace-nowrap ml-4">
                          {new Date(r.deliveredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-text-secondary mb-3">
                        From: {r.announcement.creator.name} ({r.announcement.creator.role})
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{r.announcement.body}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

