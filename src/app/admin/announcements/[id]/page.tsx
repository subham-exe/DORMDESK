"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";

interface Receipt {
  id: string;
  studentName: string;
  studentEmail: string;
  hostel: string | null;
  room: string | null;
  deliveredAt: string;
  readAt: string | null;
  acknowledgedAt: string | null;
}

interface DetailData {
  title: string;
  body: string;
  priority: string;
  requiresAck: boolean;
  targeting: { branch?: string; year?: number; hostel?: string; block?: string };
  stats: {
    deliveredCount: number;
    readCount: number;
    readPercentage: number;
    acknowledgedCount: number;
    ackPercentage: number;
  };
  receipts: Receipt[];
}

export default function AdminAnnouncementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/announcements/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingState text="Loading details..." />;
  if (!data) return <div>Announcement not found</div>;

  const filteredReceipts = filterUnread ? data.receipts.filter((r) => !r.readAt) : data.receipts;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Message Content</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{data.body}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-text-secondary">
              <Badge variant="outline">Priority: {data.priority || 'LOW'}</Badge>
              {data.requiresAck && <Badge variant="outline">Requires Ack</Badge>}
              <Badge variant="outline">Branch: {data.targeting.branch || 'All'}</Badge>
              <Badge variant="outline">Year: {data.targeting.year || 'All'}</Badge>
              <Badge variant="outline">Hostel: {data.targeting.hostel || 'All'}</Badge>
              <Badge variant="outline">Block: {data.targeting.block || 'All'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Delivered</span>
              <span className="font-bold">{data.stats.deliveredCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Read</span>
              <span className="font-bold">{data.stats.readCount} ({data.stats.readPercentage}%)</span>
            </div>
            {data.requiresAck && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Acknowledged</span>
                <span className="font-bold">{data.stats.acknowledgedCount} ({data.stats.ackPercentage}%)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recipient Status</CardTitle>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="unread" checked={filterUnread} onChange={e => setFilterUnread(e.target.checked)} />
            <label htmlFor="unread" className="text-sm">Unread only</label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-surface">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Delivered</th>
                  <th className="px-4 py-3">Read</th>
                  {data.requiresAck && <th className="px-4 py-3">Acknowledged</th>}
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{r.studentName} <br/><span className="text-xs text-text-muted">{r.studentEmail}</span></td>
                    <td className="px-4 py-3">{r.hostel} {r.room}</td>
                    <td className="px-4 py-3">{new Date(r.deliveredAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{r.readAt ? new Date(r.readAt).toLocaleString() : <Badge variant="default">Unread</Badge>}</td>
                    {data.requiresAck && (
                      <td className="px-4 py-3">{r.acknowledgedAt ? new Date(r.acknowledgedAt).toLocaleString() : <Badge variant="outline">Pending</Badge>}</td>
                    )}
                  </tr>
                ))}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-text-muted">No recipients found matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
