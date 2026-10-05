"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Check, UserPlus, ArrowLeft, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AuthorityRequestDetail({ request }: { request: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleAction = async (action: string, newStatus?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, newStatus, notes })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process request");
      }
      toast({ title: "Success", description: "Request updated.", variant: "success" });
      router.refresh();
    } catch (error: any) {
      console.error("TRANSITION ERROR:", error.message);
      alert("TRANSITION ERROR: " + error.message);
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const isResolved = ["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED"].includes(request.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
        <StatusBadge status={request.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Request {request.ticketNumber}: {request.category}</CardTitle>
          <p className="text-sm text-text-secondary">From: {request.requester.name} ({request.requester.email})</p>
          {request.dueAt && <p className="text-sm text-warning flex items-center mt-2"><Clock className="w-4 h-4 mr-1"/> SLA Deadline: {new Date(request.dueAt).toLocaleString()}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Description</h3>
            <p className="whitespace-pre-wrap text-sm border p-3 rounded-md bg-surface-muted">{request.description}</p>
          </div>
          
          {!isResolved && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="font-semibold">Take Action</h3>
              <Textarea 
                placeholder="Resolution notes (optional)" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
              <div className="flex gap-3 flex-wrap">
                {request.status === "PENDING" && (
                  <Button onClick={() => handleAction("TRANSITION", "PROCESSING")} disabled={loading} variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" /> Acknowledge / Process
                  </Button>
                )}
                <Button onClick={() => handleAction("TRANSITION", "RESOLVED")} disabled={loading} className="bg-success hover:bg-success/90 text-white">
                  <Check className="w-4 h-4 mr-2" /> Mark as Resolved
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {request.auditLogs && request.auditLogs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.auditLogs.map((log: any) => (
                <div key={log.id} className="text-sm border-l-2 border-border pl-3 py-1">
                  <p className="font-medium">Moved to {log.toStatus}</p>
                  <p className="text-text-secondary text-xs">{new Date(log.createdAt).toLocaleString()}</p>
                  {log.notes && <p className="text-xs text-text-secondary mt-1">{log.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
