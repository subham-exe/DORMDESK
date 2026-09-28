import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, User, FileText, Calendar, AlertCircle } from "lucide-react";
import { AdminAPI } from "@/lib/admin/api";
import { RequestActionsClient } from "./components/request-actions-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "PENDING": return "info";
    case "ASSIGNED": return "warning";
    case "ACKNOWLEDGED": return "warning";
    case "PROCESSING": return "warning";
    case "RESOLVED": return "success";
    case "VERIFIED": return "success";
    case "CLOSED": return "default";
    case "REJECTED": return "error";
    case "APPROVED": return "success";
    default: return "secondary";
  }
};

const getPriorityBadgeVariant = (priority: string): BadgeVariant => {
  switch (priority) {
    case "LOW": return "secondary";
    case "MEDIUM": return "info";
    case "HIGH": return "warning";
    case "CRITICAL": return "error";
    default: return "default";
  }
};

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const request = await AdminAPI.getRequestDetail(resolvedParams.id);
  const staffList = await AdminAPI.listStaffDirectory();

  if (!request) {
    return notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Requests", href: "/admin/requests" }, { label: request?.ticketNumber || "Request Details" }]} />
      {/* Back Navigation */}
      <div>
        <Link 
          href="/admin/requests" 
          className="md:hidden inline-flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Requests
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">{request.ticketNumber}</h1>
            <StatusBadge status={request.status as import("@/lib/types/request").RequestStatus} />
            <Badge variant={getPriorityBadgeVariant(request.priority)}>{request.priority}</Badge>
          </div>
          <p className="text-text-secondary text-sm font-medium">{request.requestType} - {request.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Summary & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Incident Callout */}
          {request.incidentId && (() => {
            // Need to fetch incident asynchronously in Server Component
            // Or better yet, I can just render a link if I just want the ID.
            return (
              <div className="bg-info-bg border border-info/20 p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h4 className="font-semibold text-sm text-info-text flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Part of an Incident
                  </h4>
                  <p className="text-xs text-info-text/80 mt-1">This request is grouped into a larger operational incident.</p>
                </div>
                <Link 
                  href={`/admin/incidents/${request.incidentId}`}
                  className="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-info hover:bg-info/90 text-white h-9 px-4 py-2"
                >
                  View Incident
                </Link>
              </div>
            );
          })()}

          {/* Request Summary */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-1">Requester</h4>
                  <div className="flex items-center gap-2 text-text-primary text-sm">
                    <User className="w-4 h-4 text-text-secondary" />
                    <span className="font-medium">{request.requesterName}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-1">Location</h4>
                  <div className="flex items-center gap-2 text-text-primary text-sm">
                    <MapPin className="w-4 h-4 text-text-secondary" />
                    <span>{request.location || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-1">Created At</h4>
                  <div className="flex items-center gap-2 text-text-primary text-sm">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <span>{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-1">Category</h4>
                  <div className="flex items-center gap-2 text-text-primary text-sm">
                    <FileText className="w-4 h-4 text-text-secondary" />
                    <span>{request.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium text-text-secondary mb-2">Description</h4>
                <div className="bg-surface-muted border border-border rounded-md p-4 text-sm text-text-primary whitespace-pre-wrap">
                  {request.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {request.events && request.events.length > 0 ? (
                <div className="relative border-l-2 border-border ml-3 pl-6 space-y-8">
                  {request.events.map((event, index) => {
                    const isLast = index === request.events.length - 1;
                    return (
                      <div key={event.id} className="relative">
                        <div className={`absolute -left-[33px] w-4 h-4 rounded-full border-4 border-surface ${isLast ? 'bg-primary' : 'bg-border'}`}></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-text-primary">
                            {event.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.timestamp).toLocaleString()} 
                            {event.actor?.name && ` • by ${event.actor.name}`}
                          </span>
                          {!!event.metadata?.resolutionNotes && (
                            <div className="mt-3 text-sm text-text-secondary bg-surface-muted p-3 rounded-md border border-border italic">
                              &quot;{String(event.metadata.resolutionNotes)}&quot;
                            </div>
                          )}
                          {!!event.metadata?.assignedTo && (
                            <div className="mt-2 text-sm font-medium text-info">
                              Assigned to: {String(event.metadata.assignedTo)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary text-center py-4">No timeline events recorded.</p>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Operational Metadata & SLA */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg text-text-primary">Operational Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1.5">Assignment</p>
                {request.assignedAuthorityName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0 border border-border">
                      <User className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{request.assignedAuthorityName}</div>
                      <div className="text-xs text-text-secondary">{request.assignedDepartment || "Staff"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-secondary italic">Unassigned</div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-text-secondary mb-2">SLA & Ageing</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Current Age</span>
                    <span className="font-medium text-text-primary">{request.ageingHours}h</span>
                  </div>
                  
                  {request.dueAt && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">SLA Target</span>
                        <span className="font-medium text-text-primary">{new Date(request.dueAt).toLocaleString()}</span>
                      </div>
                      
                      {(() => {
                        const isFrozen = ["RESOLVED", "VERIFIED", "CLOSED", "REJECTED", "CANCELLED"].includes(request.status);
                        if (isFrozen) return null;

                        const simulatedNow = new Date(request.createdAt).getTime() + request.ageingHours * 3600000;
                        const dueMs = new Date(request.dueAt).getTime();
                        const remainingHours = Math.abs(Math.round(((dueMs - simulatedNow) / 3600000) * 10) / 10);
                        const isOverdue = simulatedNow > dueMs;

                        return (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary">Remaining</span>
                            <span className={`font-medium ${isOverdue ? 'text-error' : 'text-text-primary'}`}>
                              {isOverdue ? `-${remainingHours}h (Overdue)` : `${remainingHours}h`}
                            </span>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  <div className="flex justify-between items-center text-sm pt-2 border-t border-border border-dashed">
                    <span className="text-text-secondary">SLA Status</span>
                    {request.slaStatus === "BREACHED" ? (
                      <span className="flex items-center text-error font-bold">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        BREACHED
                      </span>
                    ) : request.slaStatus === "WARNING" ? (
                      <span className="flex items-center text-warning font-bold">
                        <Clock className="w-4 h-4 mr-1" />
                        WARNING
                      </span>
                    ) : (
                      <span className="flex items-center text-success font-medium">
                        <Clock className="w-4 h-4 mr-1" />
                        ON TRACK
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
          
          <RequestActionsClient request={request} staffList={staffList} />
        </div>

      </div>
    </div>
  );
}
