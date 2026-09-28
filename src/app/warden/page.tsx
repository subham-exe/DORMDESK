"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { AlertCircle, CheckCircle2, Clock, Send, Smartphone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";


type RequestItem = {
  id: string;
  title: string;
  requester: { name: string; room: string };
};

type DeskData = {
  scope: string;
  snapshot: { totalOpen: number; urgentRequests: number; breachedCount: number };
  pendingRequests: RequestItem[];
  breachedRequests: RequestItem[];
  recentlyResolved: RequestItem[];
};

type SmsOutbox = {
  id: string;
  phoneNumber: string;
  message: string;
  status: string;
  createdAt: string;
  recipient?: { name: string; room: string; hostel: string };
};

export default function WardenDeskPage() {
  const [data, setData] = useState<DeskData | null>(null);
  const [smsList, setSmsList] = useState<SmsOutbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/warden/desk").then(r => { if(!r.ok) throw new Error("Desk fetch failed"); return r.json(); }),
      fetch("/api/warden/sms").then(r => { if(!r.ok) throw new Error("SMS fetch failed"); return r.json(); })
    ]).then(([desk, sms]) => {
      if (mounted) {
        setData(desk);
        setSmsList(sms);
        setLoading(false);
      }
    }).catch(e => {
      if (mounted) {
        setError(e.message);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleSimulateSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone || !smsMessage) return alert("Required fields missing");
    setIsSending(true);
    try {
      const res = await fetch("/api/warden/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: smsPhone, message: smsMessage, type: "GENERAL" })
      });
      if (!res.ok) throw new Error(await res.text());
      const newSms = await res.json();
      setSmsList(prev => [newSms, ...prev]);
      setSmsPhone("");
      setSmsMessage("");
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <LoadingState text="Loading Warden Desk..." />;
  if (error) return <div className="p-4 text-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Warden Desk</h1>
          <p className="text-text-secondary mt-1">
            Operational Overview (Scope: {data.scope})
          </p>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-secondary">Open Requests</p>
                <h3 className="text-3xl font-bold text-text mt-2">{data.snapshot.totalOpen}</h3>
              </div>
              <Clock className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-secondary">Urgent Priority</p>
                <h3 className="text-3xl font-bold text-warning mt-2">{data.snapshot.urgentRequests}</h3>
              </div>
              <AlertCircle className="w-8 h-8 text-warning opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-error">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-secondary">SLA Breached</p>
                <h3 className="text-3xl font-bold text-error mt-2">{data.snapshot.breachedCount}</h3>
              </div>
              <AlertCircle className="w-8 h-8 text-error opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SLA Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-error" /> SLA Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.breachedRequests.length === 0 ? (
              <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="All Clear" description="No requests have breached SLA." />
            ) : (
              <div className="space-y-4">
                {data.breachedRequests.map(req => (
                  <div key={req.id} className="flex justify-between items-center p-3 bg-surface-muted rounded-lg border border-border">
                    <div>
                      <Link href={`/admin/requests/${req.id}`} className="font-medium text-primary hover:underline">
                        {req.title}
                      </Link>
                      <p className="text-sm text-text-secondary">
                        {req.requester.name} • {req.requester.room}
                      </p>
                    </div>
                    <Badge variant="error">Breached</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulated SMS Outbox */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-primary" /> Simulated SMS Outbox
              </span>
              <Badge variant="default" className="text-xs">DEMO</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSimulateSms} className="mb-6 flex gap-2">
              <input 
                type="text" 
                placeholder="+91-0000000000" 
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm"
                value={smsPhone}
                onChange={e => setSmsPhone(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Message (max 160)" 
                maxLength={160}
                className="flex-[2] bg-surface border border-border rounded-lg px-3 py-2 text-sm"
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={isSending}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center"
              >
                <Send className="w-4 h-4 mr-1" /> Send
              </button>
            </form>
            
            {smsList.length === 0 ? (
              <EmptyState icon={<Smartphone className="w-8 h-8" />} title="No SMS" description="Outbox is empty." />
            ) : (
              <div className="space-y-3">
                {smsList.map(sms => (
                  <div key={sms.id} className="p-3 bg-surface-muted rounded-lg border border-border text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-text">{sms.phoneNumber}</span>
                      <Badge variant="success" className="text-[10px]">{sms.status}</Badge>
                    </div>
                    <p className="text-text-secondary">{sms.message}</p>
                    <div className="text-xs text-text-muted mt-2">
                      {new Date(sms.createdAt).toLocaleString()} 
                      {sms.recipient && ` • ${sms.recipient.name} (${sms.recipient.room})`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
