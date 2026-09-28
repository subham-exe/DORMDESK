"use client";

import { useEffect, useState } from "react";
import { Bell, Megaphone } from "lucide-react";
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

interface Announcement {
  id: string;
  receiptId: string;
  title: string;
  body: string;
  createdAt: string;
  requiresAck: boolean;
  priority: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  isExpanded?: boolean;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/notifications').then(res => res.json()),
      fetch('/api/announcements').then(res => res.json())
    ]).then(([noticesData, announcementsData]) => {
      if (noticesData.success) setNotices(noticesData.data);
      if (announcementsData.success) setAnnouncements(announcementsData.data);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, []);

  const handleRead = async (id: string, index: number) => {
    const ann = announcements[index];
    if (ann.isExpanded) {
      setAnnouncements(prev => prev.map((item, i) => i === index ? { ...item, isExpanded: false } : item));
      return;
    }

    setAnnouncements(prev => prev.map((item, i) => i === index ? { ...item, isExpanded: true } : item));

    if (!ann.readAt) {
      try {
        const res = await fetch(`/api/announcements/${id}/read`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setAnnouncements(prev => prev.map((item, i) => i === index ? { ...item, readAt: new Date().toISOString() } : item));
        }
      } catch (e) {
        console.error('Failed to mark read', e);
      }
    }
  };

  const handleAck = async (id: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/announcements/${id}/ack`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(prev => prev.map((item, i) => i === index ? { 
          ...item, 
          acknowledgedAt: new Date().toISOString(),
          readAt: item.readAt || new Date().toISOString()
        } : item));
      }
    } catch (err) {
      console.error('Failed to ack', err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Notices & Announcements</h1>
        <p className="text-text-secondary">Important updates and personal notifications.</p>
      </div>

      {loading ? (
        <LoadingState text="Loading..." />
      ) : error ? (
        <ErrorState title="Failed to load" description="We couldn't load your notices right now." />
      ) : (
        <>
          {announcements.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Campus Announcements
              </h2>
              {announcements.map((ann, idx) => (
                <Card 
                  key={ann.id} 
                  className={`cursor-pointer transition-colors ${!ann.readAt ? 'border-l-4 border-l-primary bg-surface' : ''}`}
                  onClick={() => handleRead(ann.id, idx)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 w-full">
                        <h3 className="font-medium text-text-primary flex items-center gap-2">
                          {ann.title}
                          {!ann.readAt && <Badge variant="default" className="h-5 px-1.5 text-[10px]">UNREAD</Badge>}
                          {ann.priority === 'HIGH' && <Badge variant="error" className="h-5 px-1.5 text-[10px]">HIGH</Badge>}
                        </h3>
                        {ann.isExpanded ? (
                          <div className="mt-3 text-sm text-text-secondary whitespace-pre-wrap border-t pt-3">
                            {ann.body}
                            
                            {ann.requiresAck && (
                              <div className="mt-4 pt-4 flex items-center gap-4">
                                {ann.acknowledgedAt ? (
                                  <div className="text-sm font-medium text-success">
                                    ✓ Acknowledged on {new Date(ann.acknowledgedAt).toLocaleDateString()}
                                  </div>
                                ) : (
                                  <button 
                                    onClick={(e) => handleAck(ann.id, idx, e)}
                                    className="bg-primary text-white text-sm font-medium px-4 py-2 rounded"
                                  >
                                    Acknowledge Receipt
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-text-secondary line-clamp-1">{ann.body}</p>
                        )}
                      </div>
                      <div className="text-xs text-text-muted whitespace-nowrap">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 pt-4">
              <Bell className="w-5 h-5 text-text-secondary" /> Personal Notifications
            </h2>
            {notices.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-6 w-6" />}
                title="No new notices"
                description="You're all caught up! Check back later for updates."
              />
            ) : (
              notices.map((notice) => (
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
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

