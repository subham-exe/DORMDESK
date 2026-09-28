"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notice {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  link?: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotices(data.data);
        }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notices</h1>
        <p className="text-text-secondary">Important updates and announcements.</p>
      </div>

      {loading ? (
        <LoadingState text="Loading notices..." />
      ) : error ? (
        <ErrorState title="Failed to load notices" description="We couldn't load your notices right now." />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No new notices"
          description="You're all caught up! Check back later for updates."
        />
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className={!notice.isRead ? "border-l-4 border-l-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium text-text-primary flex items-center gap-2">
                      {notice.title}
                      {!notice.isRead && <Badge variant="default" className="h-5 px-1.5 text-[10px]">NEW</Badge>}
                    </h3>
                    <p className="text-sm text-text-secondary">{notice.message}</p>
                    {notice.link && (
                      <Link href={notice.link} className="text-sm text-primary hover:underline mt-2 inline-block">
                        View Details
                      </Link>
                    )}
                  </div>
                  <div className="text-xs text-text-muted whitespace-nowrap">
                    {new Date(notice.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

