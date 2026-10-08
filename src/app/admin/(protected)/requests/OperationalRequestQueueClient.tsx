"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Search, Filter } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

type RequestType = any; // We'll rely on the Prisma type shape passed down

export default function OperationalRequestQueueClient({ initialRequests }: { initialRequests: RequestType[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const now = new Date().getTime();

  // Helper to determine SLA status
  const getSLAState = (req: RequestType) => {
    if (!req.dueAt) return { label: "No SLA", variant: "default", icon: null, sortValue: 4 };
    if (["RESOLVED", "VERIFIED", "CLOSED", "CANCELLED", "REJECTED"].includes(req.status)) {
      return { label: "Resolved", variant: "success", icon: <CheckCircle2 className="w-3 h-3 mr-1" />, sortValue: 3 };
    }
    const dueTime = new Date(req.dueAt).getTime();
    if (dueTime < now) {
      return { label: "Breached", variant: "error", icon: <AlertCircle className="w-3 h-3 mr-1" />, sortValue: 0 };
    }
    const hoursLeft = (dueTime - now) / 3600000;
    if (hoursLeft <= 4) {
      return { label: "At Risk", variant: "warning", icon: <AlertTriangle className="w-3 h-3 mr-1" />, sortValue: 1 };
    }
    return { label: "Healthy", variant: "default", icon: <Clock className="w-3 h-3 mr-1 text-primary" />, sortValue: 2 };
  };

  // Filter and Sort requests
  const filteredRequests = initialRequests
    .filter(req => {
      const matchSearch = req.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || req.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || req.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      // Primary sort: Breached SLA first, then At Risk, then Healthy
      const aSla = getSLAState(a).sortValue;
      const bSla = getSLAState(b).sortValue;
      if (aSla !== bSla) return aSla - bSla;
      // Secondary sort: Priority
      const pMap: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aP = pMap[a.priority] || 0;
      const bP = pMap[b.priority] || 0;
      if (aP !== bP) return bP - aP;
      // Tertiary sort: oldest first if pending, newest first if resolved
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Requests</h1>
        <p className="text-sm text-text-secondary mt-1">Manage operational workflow and SLA accountability.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <Input 
            placeholder="Search ticket, title, or student..." 
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[140px]">
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PROCESSING">Processing</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
          
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-[140px]">
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState 
              icon={<CheckCircle2 className="w-12 h-12 text-success" />} 
              title="All caught up" 
              description={initialRequests.length > 0 ? "No requests match your current filters." : "Your operational queue is empty."} 
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border border-border rounded-lg bg-surface overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-muted text-text-secondary text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">ID / Priority</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Category / Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">SLA State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map(req => {
                  const sla = getSLAState(req);
                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-surface-hover cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/requests/${req.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-primary">{req.ticketNumber || req.id.substring(0,8)}</div>
                        <div className={`text-xs font-semibold mt-1 ${req.priority === 'CRITICAL' || req.priority === 'HIGH' ? 'text-error' : 'text-text-secondary'}`}>
                          {req.priority}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{req.requester?.name || "Unknown"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{req.category}</div>
                        <div className="text-xs text-text-secondary">{req.location || "No Location"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        {req.assignedAuthority ? (
                          <span className="text-text">{req.assignedAuthority.name}</span>
                        ) : (
                          <Badge variant="warning" className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">Unassigned</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sla.icon !== null ? (
                          <Badge variant={sla.variant as any} className="flex w-fit items-center text-[10px]">
                            {sla.icon} {sla.label}
                          </Badge>
                        ) : <span className="text-text-muted">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-3">
            {filteredRequests.map(req => {
              const sla = getSLAState(req);
              return (
                <div 
                  key={req.id} 
                  className="bg-surface border border-border rounded-lg p-4 active:bg-surface-hover transition-colors shadow-sm"
                  onClick={() => router.push(`/admin/requests/${req.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-primary text-sm">{req.ticketNumber || req.id.substring(0,8)}</div>
                    {sla.icon !== null && (
                      <Badge variant={sla.variant as any} className="flex items-center text-[10px]">
                        {sla.icon} {sla.label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="font-semibold text-text mb-2 line-clamp-2 leading-tight">
                    {req.title || req.description}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <StatusBadge status={req.status} />
                    <Badge variant="outline" className={`text-[10px] ${req.priority === 'CRITICAL' || req.priority === 'HIGH' ? 'border-error text-error' : ''}`}>
                      {req.priority}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-text-secondary space-y-1">
                    <div className="flex justify-between">
                      <span>Requester:</span>
                      <span className="font-medium text-text">{req.requester?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-medium text-text">{req.location || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Assignee:</span>
                      {req.assignedAuthority ? (
                        <span className="font-medium text-text">{req.assignedAuthority.name}</span>
                      ) : (
                        <Badge variant="warning" className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 text-[10px] py-0 h-4">Unassigned</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
