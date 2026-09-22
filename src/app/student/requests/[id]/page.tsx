/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Clock, CheckCircle, AlertTriangle, User, 
  MapPin, Calendar, FileText, Check, X, ShieldAlert 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export default function RequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [request, setRequest] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // For Reopen action
  const [showReopen, setShowReopen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const fetchData = async () => {
    try {
      const [reqRes, auditRes] = await Promise.all([
        fetch(`/api/requests/${id}`),
        fetch(`/api/requests/${id}/audit`)
      ]);
      
      if (!reqRes.ok) throw new Error("Failed to load request details");
      const reqData = await reqRes.json();
      setRequest(reqData);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload: { ...payload, mockRole: "STUDENT" } })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${action.toLowerCase()}`);
      }
      
      // Refresh data
      setShowReopen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-error-bg text-error rounded-md border border-error">
          {error || "Request not found."}
        </div>
        <Link href="/student/requests" className="mt-4 inline-block text-info hover:underline">
          &larr; Back to Requests
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
      case "SUBMITTED":
      case "CLASSIFIED":
      case "ROUTED":
        return <Badge variant="info">{status}</Badge>;
      case "ASSIGNED":
      case "ACKNOWLEDGED":
      case "PROCESSING":
        return <Badge variant="warning">{status}</Badge>;
      case "RESOLVED":
      case "VERIFIED":
      case "CLOSED":
        return <Badge variant="success">{status}</Badge>;
      case "ESCALATED":
      case "REJECTED":
        return <Badge variant="error">{status}</Badge>;
      case "CANCELLED":
        return <Badge variant="default">CANCELLED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const canCancel = ["CREATE", "CLASSIFY", "ROUTED"].includes(request.status);
  const isResolved = request.status === "RESOLVED";

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/requests" passHref>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{request.ticketNumber}</h1>
            {getStatusBadge(request.status)}
          </div>
        </div>
      </div>

      {/* Verification Banner */}
      {isResolved && (
        <Card className="border-success bg-success-bg shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="font-bold text-success flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Resolution Ready for Verification
                </h3>
                <p className="text-success text-sm mt-1">
                  Staff has marked this request as resolved. Please verify if the issue is fixed to close it, or reopen it if the problem persists.
                </p>
                {request.resolutionNotes && (
                  <div className="mt-3 p-3 bg-surface rounded-md border border-success text-sm text-success italic">
                    &quot; {request.resolutionNotes} &quot;
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Button 
                  onClick={() => handleAction('VERIFY')}
                  disabled={actionLoading}
                  className="w-full bg-success hover:bg-success/90 text-text-inverse"
                >
                  <Check className="w-4 h-4 mr-2" /> Verify & Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowReopen(!showReopen)}
                  disabled={actionLoading}
                  className="w-full border-success text-success hover:bg-success-bg"
                >
                  <X className="w-4 h-4 mr-2" /> Not Fixed
                </Button>
              </div>
            </div>

            {/* Reopen Form */}
            {showReopen && (
              <div className="mt-4 pt-4 border-t border-success">
                <label htmlFor="reopenReason" className="block text-sm font-medium text-success mb-2">
                  Why are you reopening this request?
                </label>
                <Textarea 
                  id="reopenReason"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Please explain what is still broken..."
                  className="bg-surface border-success focus-visible:ring-success"
                  rows={3}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowReopen(false)} disabled={actionLoading}>Cancel</Button>
                  <Button 
                    onClick={() => handleAction('REOPEN', { reason: reopenReason })}
                    disabled={actionLoading || !reopenReason.trim()}
                    className="bg-success hover:bg-success/90 text-text-inverse"
                  >
                    Submit & Reopen
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1 text-text-primary">{request.requestType}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
                  <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {request.category}</span>
                  {request.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {request.location}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-1">Description</h4>
                <p className="text-text-primary whitespace-pre-wrap bg-surface-muted p-4 rounded-md border border-border text-sm">
                  {request.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Incident Intelligence */}
          {request.incident && (
            <Card className="border-info overflow-hidden">
              <div className="bg-info-bg border-b border-info px-4 py-3 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-info" />
                <h3 className="font-semibold text-info">Incident Intelligence</h3>
              </div>
              <CardContent className="p-4 bg-surface">
                <p className="text-sm text-text-secondary mb-3">
                  This request is part of a larger operational incident. Multiple related reports have been grouped together for faster resolution.
                </p>
                <div className="bg-surface-muted p-3 rounded-md border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-text-secondary">{request.incident.ticketNumber}</span>
                    <Badge variant="outline" className="text-xs">{request.incident.status}</Badge>
                  </div>
                  <h4 className="font-medium text-text-primary text-sm">{request.incident.title}</h4>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline / Audit */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {auditLogs.length > 0 ? (
                <div className="relative border-l-2 border-border ml-3 pl-5 space-y-6">
                  {auditLogs.map((log: any, index: number) => {
                    const isLast = index === auditLogs.length - 1;
                    return (
                      <div key={log.id} className="relative">
                        <div className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-surface ${isLast ? 'bg-info' : 'bg-border'}`}></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-text-primary">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleString()} 
                            {log.actor?.name && ` • by ${log.actor.name}`}
                          </span>
                          {log.metadata?.resolutionNotes && (
                            <div className="mt-2 text-sm text-text-secondary bg-surface-muted p-2 rounded border border-border">
                              Note: {log.metadata.resolutionNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-4">No timeline events recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status & SLA */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Status & SLA</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Current State</p>
                {getStatusBadge(request.status)}
              </div>
              
              {request.assignedAuthority && (
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-text-secondary" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{request.assignedAuthority.name}</span>
                  </div>
                </div>
              )}

              {request.dueAt && !["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED"].includes(request.status) && (
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">SLA Deadline</p>
                  {(() => {
                    const now = new Date();
                    const due = new Date(request.dueAt);
                    const isBreached = now > due;
                    return (
                      <div className={`flex items-center gap-2 text-sm font-medium ${isBreached ? 'text-error' : 'text-text-primary'}`}>
                        <Clock className={`w-4 h-4 ${isBreached ? 'text-error' : 'text-text-secondary'}`} />
                        {due.toLocaleString()}
                        {isBreached && <Badge variant="error" className="ml-2">Breached</Badge>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {canCancel && (
            <Card className="border-error bg-error-bg/30">
              <CardContent className="p-4">
                <p className="text-xs text-text-secondary mb-3">You can cancel this request because it has not been assigned or processed yet.</p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  disabled={actionLoading}
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this request?')) {
                      handleAction('CANCEL');
                    }
                  }}
                >
                  Cancel Request
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
