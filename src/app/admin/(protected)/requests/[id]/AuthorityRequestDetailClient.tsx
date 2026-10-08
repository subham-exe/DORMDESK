"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Check, UserPlus, ArrowLeft, Clock, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

export default function AuthorityRequestDetail({ request, assignableStaff, currentUserId }: { request: any, assignableStaff?: any[], currentUserId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>(request.assignedAuthorityId || "");

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
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (overrideId?: string) => {
    const targetAssignee = overrideId || selectedAssignee;
    if (!targetAssignee) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ASSIGN", assigneeId: targetAssignee })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to assign request");
      }
      toast({ title: "Success", description: "Request assigned.", variant: "success" });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const isResolved = ["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED"].includes(request.status);

  // Helper for SLA State
  const getSLAState = () => {
    if (!request.dueAt) return { label: "No SLA", icon: null, color: "text-text-muted" };
    const now = new Date().getTime();
    const dueTime = new Date(request.dueAt).getTime();
    
    if (isResolved) return { label: "Resolved", icon: <Check className="w-4 h-4 mr-1" />, color: "text-success" };
    
    if (dueTime < now) {
      return { label: "Breached", icon: <AlertCircle className="w-4 h-4 mr-1" />, color: "text-error font-bold" };
    }
    const hoursLeft = (dueTime - now) / 3600000;
    if (hoursLeft <= 4) {
      return { label: `At Risk (${Math.floor(hoursLeft)}h left)`, icon: <AlertTriangle className="w-4 h-4 mr-1" />, color: "text-warning font-semibold" };
    }
    return { label: `Healthy (${Math.floor(hoursLeft)}h left)`, icon: <Clock className="w-4 h-4 mr-1" />, color: "text-primary" };
  };

  const sla = getSLAState();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-surface-muted border-b border-border p-6 rounded-t-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="font-mono text-sm text-text-secondary">{request.ticketNumber || request.id.substring(0,8)}</div>
                <StatusBadge status={request.status} />
              </div>
              <CardTitle className="text-2xl font-bold">{request.title || request.category}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="flex gap-4 border-b border-border pb-6 flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Priority</p>
                  <Badge variant="outline" className={`${request.priority === 'CRITICAL' || request.priority === 'HIGH' ? 'border-error text-error' : ''}`}>
                    {request.priority}
                  </Badge>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Category</p>
                  <p className="text-sm font-medium">{request.category}</p>
                </div>
                <div className="flex-[2] min-w-[200px]">
                  <p className="text-xs text-text-secondary uppercase font-semibold mb-1">SLA</p>
                  <div className={`flex items-center text-base font-bold ${sla.color}`}>
                    {sla.icon} {sla.label} 
                    {request.dueAt && <span className="text-text-muted ml-2 font-normal text-sm">({new Date(request.dueAt).toLocaleString()})</span>}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-text mb-2">Description</h3>
                <div className="bg-surface-muted rounded-lg p-4 text-sm border border-border whitespace-pre-wrap">
                  {request.description}
                </div>
              </div>

              {!isResolved && (
                <div className="bg-surface border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-text mb-3">Next Action</h3>
                  
                  <Textarea 
                    placeholder="Resolution notes (optional)" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                    className="mb-4"
                  />
                  <div className="flex gap-3 flex-wrap">
                    {request.status === "PENDING" && (
                      <Button onClick={() => handleAction("TRANSITION", "PROCESSING")} disabled={loading} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" /> Acknowledge / Process
                      </Button>
                    )}
                    {(request.status === "ASSIGNED" || request.status === "ACKNOWLEDGED") && (
                      <Button onClick={() => handleAction("TRANSITION", "PROCESSING")} disabled={loading} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" /> Start Processing
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
              <CardHeader><CardTitle className="text-lg">Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {request.auditLogs.map((log: any, idx: number) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        <Check className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-border bg-surface shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-text text-sm">{log.toStatus ? `Moved to ${log.toStatus}` : "Updated"}</span>
                          <span className="text-[10px] text-text-muted">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        {log.notes && <p className="text-xs text-text-secondary mt-1">{log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-surface-muted p-4 border-b border-border"><CardTitle className="text-sm font-semibold uppercase text-text-secondary">Ownership</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Current Assignee</p>
                {request.assignedAuthority ? (
                  <div className="flex items-center font-medium text-text bg-info-bg text-info p-2 rounded border border-info-border">
                    <Check className="w-4 h-4 mr-2" />
                    {request.assignedAuthority.name}
                  </div>
                ) : (
                  <div className="flex items-center font-medium text-warning bg-warning/10 p-2 rounded border border-warning/20">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Unassigned
                  </div>
                )}
              </div>

              {!isResolved && assignableStaff && assignableStaff.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-text-secondary uppercase font-semibold mb-2">
                    {request.assignedAuthority ? "Reassign" : "Assign Request"}
                  </p>
                  
                  {!request.assignedAuthorityId && currentUserId && assignableStaff.some(s => s.id === currentUserId) && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <Button onClick={() => handleAssign(currentUserId)} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <UserPlus className="w-4 h-4 mr-2" /> Take Ownership
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 flex-col">
                    <Select value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)}>
                      <option value="" disabled>Select Staff...</option>
                      {assignableStaff.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </option>
                      ))}
                    </Select>
                    <Button onClick={() => handleAssign()} disabled={loading || !selectedAssignee || selectedAssignee === request.assignedAuthorityId} className="w-full" variant="outline">
                      {request.assignedAuthority ? "Reassign" : "Assign to Selected"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-surface-muted p-4 border-b border-border"><CardTitle className="text-sm font-semibold uppercase text-text-secondary">Requester Info</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <div>
                <p className="text-text-muted text-xs">Name</p>
                <p className="font-medium">{request.requester.name}</p>
              </div>
              {request.location && (
                <div>
                  <p className="text-text-muted text-xs">Location</p>
                  <p className="font-medium">{request.location}</p>
                </div>
              )}
              {request.requester.room && (
                <div>
                  <p className="text-text-muted text-xs">Room / Hostel</p>
                  <p className="font-medium">{request.requester.hostel} - {request.requester.room}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
