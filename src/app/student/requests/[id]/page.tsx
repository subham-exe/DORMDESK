/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import { 
  ArrowLeft, Clock, CheckCircle, AlertTriangle, User, 
  MapPin, Calendar, FileText, Check, X, ShieldAlert,
  QrCode, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getOfflineRequest } from "@/lib/services/offline-store";

const LIFECYCLE = [
  { status: "PENDING", label: "Submitted" },
  { status: "ASSIGNED", label: "Assigned" },
  { status: "ACKNOWLEDGED", label: "Acknowledged" },
  { status: "PROCESSING", label: "In Progress" },
  { status: "RESOLVED", label: "Resolved" },
  { status: "VERIFIED", label: "Verified" },
  { status: "CLOSED", label: "Closed" }
];
const EXCEPTIONS = ["REJECTED", "CANCELLED", "ESCALATED"];

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const fetchData = async () => {
    try {
      const idStr = Array.isArray(id) ? id[0] : id;
      if (idStr?.startsWith("offline-")) {
        const localId = parseInt(idStr.replace("offline-", ""), 10);
        const offReq = await getOfflineRequest(localId);
        if (offReq) {
          setRequest({
            ...offReq,
            id: idStr,
            ticketNumber: `OFFLINE-${localId}`,
            status: "PENDING_SYNC",
            createdAt: new Date(offReq._timestamp).toISOString(),
            updatedAt: new Date(offReq._timestamp).toISOString(),
          });
          setAuditLogs([]);
          return;
        } else {
          throw new Error("Offline request not found.");
        }
      }

      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) throw new Error("Failed to load request details");
      
      const resData = await res.json();
      if (resData.success && resData.data) {
        const reqData = resData.data;
        if (typeof reqData.metadata === 'string') {
          try { reqData.metadata = JSON.parse(reqData.metadata); } catch (e) {}
        }
        if (reqData.auditLogs) {
          reqData.auditLogs.forEach((log: any) => {
            if (typeof log.metadata === 'string') {
              try { log.metadata = JSON.parse(log.metadata); } catch (e) {}
            }
          });
        }
        setRequest(reqData);
        setAuditLogs(reqData.auditLogs || []);
      } else {
        throw new Error(resData.error || "Failed to load request details");
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
    setActionError(null);
    try {
      let newStatus = payload.newStatus;
      const notes = payload.reason;

      if (action === 'VERIFY') {
        newStatus = 'VERIFIED';
      } else if (action === 'REOPEN') {
        newStatus = 'PROCESSING';
      }

      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: 'TRANSITION', 
          newStatus, 
          notes 
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to transition request`);
      }
      
      // Refresh data
      setShowReopen(false);
      setShowCancelConfirm(false);
      setActionError(null);
      await fetchData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getTimelineSteps = () => {
    if (!request) return [];
    
    const isException = EXCEPTIONS.includes(request.status);
    const reachedStates = new Set<string>();
    const stateTimestamps: Record<string, string> = {};
    
    // Add PENDING natively as created
    reachedStates.add("PENDING");
    stateTimestamps["PENDING"] = request.createdAt;
    
    // Check audit logs for transitions
    auditLogs.forEach(log => {
      if (log.action === "STATUS_CHANGED" && log.metadata?.newStatus) {
        reachedStates.add(log.metadata.newStatus);
        stateTimestamps[log.metadata.newStatus] = log.timestamp;
      }
      if (log.action === "CREATED") {
         stateTimestamps["PENDING"] = log.timestamp;
      }
    });

    reachedStates.add(request.status);

    const steps = [];
    let currentIdx = LIFECYCLE.findIndex(s => s.status === request.status);
    
    if (currentIdx === -1) {
       for (let i = LIFECYCLE.length - 1; i >= 0; i--) {
         if (reachedStates.has(LIFECYCLE[i].status)) {
           currentIdx = i;
           break;
         }
       }
    }

    // Auto-approve leaves might skip directly to APPROVED (which maps to CLOSED ideally, but it's an exception if not in LIFECYCLE)
    // Wait, RequestEngine has APPROVED -> CLOSED. APPROVED is an exception state? Let's check `VALID_TRANSITIONS` in RequestEngine.
    // Actually, let's just make APPROVED an exception for the student view (meaning it branches off PENDING).
    // Or we map APPROVED to CLOSED directly.
    
    for (let i = 0; i < LIFECYCLE.length; i++) {
      const step = LIFECYCLE[i];
      const isCompleted = isException ? (i <= currentIdx) : (i < currentIdx);
      const isCurrent = i === currentIdx && !isException;
      
      steps.push({
        ...step,
        state: isCurrent ? 'CURRENT' : (isCompleted ? 'COMPLETED' : 'UPCOMING'),
        timestamp: stateTimestamps[step.status]
      });
      
      if (i === currentIdx && isException) {
         steps.push({
           status: request.status,
           label: request.status === "REJECTED" ? "Rejected" : 
                  request.status === "CANCELLED" ? "Cancelled" : 
                  request.status === "APPROVED" ? "Approved" :
                  request.status === "ESCALATED" ? "Escalated" : request.status,
           state: 'EXCEPTION',
           timestamp: stateTimestamps[request.status] || new Date().toISOString()
         });
      }
    }
    
    // Handle case where request is APPROVED right away and currentIdx is 0 (PENDING)
    if (request.status === "APPROVED" && currentIdx === 0 && !isException) {
      // If APPROVED wasn't in EXCEPTIONS, let's make sure it shows
      const hasApproved = steps.some(s => s.status === "APPROVED");
      if (!hasApproved) {
        steps.splice(1, 0, {
          status: "APPROVED",
          label: "Approved",
          state: "COMPLETED",
          timestamp: stateTimestamps["APPROVED"] || new Date().toISOString()
        });
      }
    }
    
    return steps;
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
      case "ASSIGNED":
      case "PENDING":
        return <Badge variant="info">{status}</Badge>;
      case "ASSIGNED":
      case "ACKNOWLEDGED":
      case "PROCESSING":
        return <Badge variant="warning">{status}</Badge>;
      case "RESOLVED":
      case "VERIFIED":
      case "CLOSED":
      case "APPROVED":
        return <Badge variant="success">{status}</Badge>;
      case "ESCALATED":
      case "REJECTED":
        return <Badge variant="error">{status}</Badge>;
      case "CANCELLED":
        return <Badge variant="default">CANCELLED</Badge>;
      case "PENDING_SYNC":
        return <Badge variant="secondary" className="bg-surface-muted text-text-secondary border-dashed">Pending Sync</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const canCancel = ["PENDING", "ASSIGNED", "ACKNOWLEDGED", "PROCESSING"].includes(request.status);
  const isResolved = request.status === "RESOLVED";
  const isGatePassValid = request.requestType === "LEAVE" && (request.status === "APPROVED" || request.status === "CLOSED");
  const isCertificateValid = request.requestType === "CERTIFICATE" && (request.status === "APPROVED" || request.status === "CLOSED");

  // Generate QR payload for Gate Pass
  const qrPayload = isGatePassValid ? JSON.stringify({
    ticket: request.ticketNumber,
    type: "GATE_PASS",
    status: request.status,
    student: request.requesterId
  }) : "";

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

      {/* Digital Gate Pass */}
      {isGatePassValid && (
        <Card className="border-info shadow-sm overflow-hidden">
          <div className="bg-info-bg border-b border-info px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-info" />
              <h2 className="font-bold text-info text-lg">Digital Gate Pass</h2>
            </div>
            {getStatusBadge(request.status)}
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start justify-between">
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Request Type</p>
                    <p className="font-semibold">{request.requestType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Category</p>
                    <p className="font-semibold">{request.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Leave Days</p>
                    <p className="font-semibold">{request.metadata?.leaveDays || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Student ID</p>
                    <p className="font-semibold">{request.requesterId}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-text-secondary">Reason / Destination</p>
                  <p className="text-sm mt-1">{request.description}</p>
                </div>
                
                <div className="bg-info-bg/50 p-3 rounded text-sm text-info font-medium">
                  Show this QR code at the gate for verification.
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-border">
                <QRCode 
                  value={qrPayload}
                  size={150}
                  level="Q"
                />
                <p className="text-center text-xs text-text-secondary mt-2 font-mono">
                  {request.ticketNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digital Certificate */}
      {isCertificateValid && (
        <Card className="border-success shadow-sm overflow-hidden">
          <div className="bg-success-bg border-b border-success px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-success" />
              <h2 className="font-bold text-success text-lg">Digital Certificate</h2>
            </div>
            {getStatusBadge(request.status)}
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-between">
              <div className="flex-1 space-y-4 w-full">
                <div className="bg-surface-muted p-4 rounded border border-border">
                  <h3 className="font-semibold text-text-primary text-lg mb-1">{request.category.replace(/_/g, ' ')}</h3>
                  <p className="text-sm text-text-secondary mb-3">Issued to: <span className="font-medium text-text-primary">{request.requesterId}</span></p>
                  <p className="text-sm text-text-primary">
                    This document has been verified and digitally approved by the administrative authority.
                  </p>
                </div>
                
                <div className="bg-success-bg/50 p-3 rounded text-sm text-success font-medium">
                  Your certificate is ready. Click download to save a digital copy or print it.
                </div>
              </div>
              
              <div className="flex flex-col gap-3 min-w-[150px]">
                <Button 
                  className="w-full bg-success hover:bg-success/90 text-white"
                  onClick={() => setActionError("Certificate generation is not yet available in this environment.")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    " {request.resolutionNotes} "
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
              
              {request.metadata && Object.keys(request.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-1">Additional Information</h4>
                  <div className="bg-surface-muted p-4 rounded-md border border-border text-sm">
                    {Object.entries(request.metadata).map(([key, val]) => (
                      <div key={key} className="flex mb-1 last:mb-0">
                        <span className="font-medium text-text-secondary w-32 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-text-primary">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="relative ml-2 space-y-6">
                {getTimelineSteps().map((step, index, arr) => {
                  const isLast = index === arr.length - 1;
                  
                  // Connective line logic
                  let lineClass = "bg-border";
                  if (step.state === 'COMPLETED' || step.state === 'CURRENT') {
                     // Next step determines if the line should be colored
                     const nextStep = arr[index + 1];
                     if (nextStep && (nextStep.state === 'COMPLETED' || nextStep.state === 'CURRENT' || nextStep.state === 'EXCEPTION')) {
                        lineClass = "bg-info";
                        // If exception is next, make line error colored
                        if (nextStep.state === 'EXCEPTION') lineClass = "bg-error";
                     }
                  }
                  
                  // Node style logic
                  let nodeClass = "bg-surface border-border";
                  let icon = null;
                  
                  if (step.state === 'COMPLETED') {
                    nodeClass = "bg-info border-info";
                    icon = <Check className="w-3 h-3 text-white" />;
                  } else if (step.state === 'CURRENT') {
                    nodeClass = "bg-surface border-info border-[3px]";
                  } else if (step.state === 'EXCEPTION') {
                    nodeClass = "bg-error border-error";
                    icon = <X className="w-3 h-3 text-white" />;
                  }

                  return (
                    <div key={step.status} className="relative flex gap-4">
                      {!isLast && (
                        <div className={`absolute left-[11px] top-7 bottom-[-24px] w-[2px] ${lineClass}`}></div>
                      )}
                      
                      <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${nodeClass}`}>
                        {icon}
                      </div>
                      
                      <div className="flex flex-col pb-2">
                        <span className={`text-sm font-medium ${
                          step.state === 'EXCEPTION' ? 'text-error' :
                          (step.state === 'UPCOMING' ? 'text-text-secondary' : 'text-text-primary')
                        }`}>
                          {step.label}
                        </span>
                        {step.timestamp && step.state !== 'UPCOMING' && (
                          <span className="text-xs text-text-secondary mt-0.5">
                            {new Date(step.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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

              {request.dueAt && !["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED", "APPROVED"].includes(request.status) && (
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
                {actionError && <div className="text-error text-sm mb-3 bg-error-bg p-2 rounded">{actionError}</div>}
                {!showCancelConfirm ? (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Request
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-error">Are you sure you want to cancel?</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        disabled={actionLoading}
                        onClick={() => handleAction('TRANSITION', { newStatus: 'CANCELLED' })}
                      >
                        Yes, Cancel
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled={actionLoading}
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        No, Keep
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
