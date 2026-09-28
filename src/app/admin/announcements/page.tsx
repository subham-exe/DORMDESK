/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";

interface Announcement {
  id: string;
  title: string;
  creator: string;
  createdAt: string;
  requiresAck: boolean;
  targeting: any;
  deliveredCount: number;
  readCount: number;
  acknowledgedCount: number;
  readPercentage: number;
  ackPercentage: number;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetBranch, setTargetBranch] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [targetHostel, setTargetHostel] = useState("");
  const [targetBlock, setTargetBlock] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [priority, setPriority] = useState("LOW");

  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const fetchPreview = async () => {
      setPreviewLoading(true);
      const query = new URLSearchParams();
      if (targetBranch) query.append("targetBranch", targetBranch);
      if (targetYear) query.append("targetYear", targetYear);
      if (targetHostel) query.append("targetHostel", targetHostel);
      if (targetBlock) query.append("targetBlock", targetBlock);

      try {
        const res = await fetch(`/api/admin/announcements/preview?${query.toString()}`);
        const data = await res.json();
        if (data.success) setPreviewCount(data.data.count);
      } catch {
        // ignore
      } finally {
        setPreviewLoading(false);
      }
    };
    
    const timer = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timer);
  }, [targetBranch, targetYear, targetHostel, targetBlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          targetBranch,
          targetYear,
          targetHostel,
          targetBlock,
          requiresAck,
          priority
        })
      });
      const data = await res.json();
      if (data.success) {
        // Reset form
        setTitle("");
        setBody("");
        setTargetBranch("");
        setTargetYear("");
        setTargetHostel("");
        setTargetBlock("");
        setRequiresAck(false);
        setPriority("LOW");
        fetchAnnouncements();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Announcements</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Compose Announcement</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} required minLength={3} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea value={body} onChange={e => setBody(e.target.value)} required minLength={10} className="w-full border rounded p-2 h-24" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Branch</label>
                    <input type="text" placeholder="e.g. CSE" value={targetBranch} onChange={e => setTargetBranch(e.target.value)} className="w-full border rounded p-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <input type="number" placeholder="e.g. 2" value={targetYear} onChange={e => setTargetYear(e.target.value)} className="w-full border rounded p-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hostel</label>
                    <input type="text" placeholder="e.g. A" value={targetHostel} onChange={e => setTargetHostel(e.target.value)} className="w-full border rounded p-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Block</label>
                    <input type="text" placeholder="e.g. North" value={targetBlock} onChange={e => setTargetBlock(e.target.value)} className="w-full border rounded p-1 text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="ack" checked={requiresAck} onChange={e => setRequiresAck(e.target.checked)} />
                  <label htmlFor="ack" className="text-sm font-medium">Requires Acknowledgement</label>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-primary text-white rounded p-2 font-medium">
                    Send to {previewLoading ? '...' : previewCount} Students
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingState text="Loading announcements..." /> : error ? <div className="text-error">Error loading announcements</div> : (
                <div className="space-y-4">
                  {announcements.map(ann => (
                    <div key={ann.id} className="border p-4 rounded flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <Link href={`/admin/announcements/${ann.id}`} className="font-semibold text-primary hover:underline">{ann.title}</Link>
                        <div className="text-sm text-text-secondary mt-1 flex flex-wrap gap-2">
                          <Badge variant="outline">Delivered: {ann.deliveredCount}</Badge>
                          <Badge variant="outline">Read: {ann.readCount} ({ann.readPercentage}%)</Badge>
                          {ann.requiresAck && (
                            <Badge variant="outline">Ack: {ann.acknowledgedCount} ({ann.ackPercentage}%)</Badge>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-2">
                          Sent by {ann.creator} on {new Date(ann.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && <div className="text-sm text-text-muted">No announcements yet.</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}