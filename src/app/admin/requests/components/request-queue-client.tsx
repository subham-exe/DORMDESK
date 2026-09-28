"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Search, AlertCircle, Clock, Link as LinkIcon, FilterX } from "lucide-react";
import { AdminRequest } from "@/lib/admin/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RequestStatus } from "@/lib/types/request";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";

export function RequestQueueClient({ initialRequests }: { initialRequests: AdminRequest[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [slaFilter, setSlaFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [isGrouping, setIsGrouping] = useState(false);
  const [groupError, setGroupError] = useState("");

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const filteredRequests = useMemo(() => {
    return initialRequests.filter((req) => {
      const matchesSearch = search === "" || 
        req.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        req.requesterName.toLowerCase().includes(search.toLowerCase()) ||
        req.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "" || req.status === statusFilter;
      const matchesPriority = priorityFilter === "" || req.priority === priorityFilter;
      const matchesType = typeFilter === "" || req.requestType === typeFilter;
      const matchesSla = slaFilter === "" || req.slaStatus === slaFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesSla;
    });
  }, [initialRequests, search, statusFilter, priorityFilter, typeFilter, slaFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setSlaFilter("");
  };

  const handleGroup = async () => {
    if (selectedIds.length === 0 || !incidentTitle.trim()) return;
    setIsGrouping(true);
    setGroupError("");
    try {
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: incidentTitle, requestIds: selectedIds })
      });
      if (!res.ok) throw new Error("Failed to group requests");
      
      await res.json();
      setIsGroupModalOpen(false);
      setSelectedIds([]);
      setIncidentTitle("");
      toast({ title: "Incident Created", description: "Selected requests were grouped into a new incident.", variant: "success" });
      router.refresh();
      // Optional: router.push(`/admin/incidents/${data.incidentId}`)
    } catch (err: unknown) {
      if (err instanceof Error) setGroupError(err.message);
      else setGroupError("An unknown error occurred.");
    } finally {
      setIsGrouping(false);
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

  const getSlaIndicator = (req: AdminRequest) => {
    if (req.slaStatus === "BREACHED") {
      return (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant="error" className="text-[10px] leading-none py-1">BREACHED</Badge>
          <span className="flex items-center text-error text-xs font-medium">
            <AlertCircle className="w-3 h-3 mr-1" />
            Age: {req.ageingHours}h
          </span>
        </div>
      );
    }
    if (req.slaStatus === "WARNING") {
      return (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant="warning" className="text-[10px] leading-none py-1">WARNING</Badge>
          <span className="flex items-center text-warning text-xs font-medium">
            <Clock className="w-3 h-3 mr-1" />
            Age: {req.ageingHours}h
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge variant="outline" className="text-[10px] leading-none py-1 opacity-70">ON TRACK</Badge>
        <span className="flex items-center text-text-secondary text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Age: {req.ageingHours}h
        </span>
      </div>
    );
  };

  const hasActiveFilters = search || statusFilter || priorityFilter || typeFilter;

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search ticket, name, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search requests"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:w-auto">
              <Select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by Type"
              >
                <option value="">All Types</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="LEAVE">Leave</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="OTHER">Other</option>
              </Select>
              
              <Select 
                value={slaFilter} 
                onChange={(e) => setSlaFilter(e.target.value)}
                aria-label="Filter by SLA"
              >
                <option value="">All SLA States</option>
                <option value="ON_TRACK">On Track</option>
                <option value="WARNING">Warning</option>
                <option value="BREACHED">Breached</option>
              </Select>

              <Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by Status"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="PROCESSING">Processing</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </Select>

              <Select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by Priority"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters} aria-label="Clear filters" className="shrink-0" title="Clear Filters">
                  <FilterX className="w-4 h-4 mr-2 hidden sm:inline" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {initialRequests.length === 0 ? (
        <EmptyState
          title="No Requests"
          description="There are currently no active requests in the system."
        />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No matches found"
          description="Try adjusting your filters to find what you're looking for."
          action={<Button onClick={resetFilters}>Clear Filters</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {/* Desktop Table View */}
          <div className="hidden md:block space-y-3">
            
            {/* Grouping Action Bar */}
            {selectedIds.length > 0 && (
              <div className="bg-surface border border-border p-3 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium text-text-primary">
                  {selectedIds.length} request{selectedIds.length !== 1 ? 's' : ''} selected
                </span>
                <Button size="sm" onClick={() => setIsGroupModalOpen(true)}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Group into Incident
                </Button>
              </div>
            )}

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Type/Category</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Ageing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id} className="cursor-pointer hover:bg-surface-muted transition-colors relative group">
                      <TableCell className="relative z-20">
                        <input aria-label="Select request" type="checkbox" 
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          checked={selectedIds.includes(req.id)}
                          onChange={(e) => handleSelect(req.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/admin/requests/${req.id}`} className="absolute inset-0" aria-label={`View request ${req.ticketNumber}`}></Link>
                        <div className="flex flex-col gap-1 items-start">
                          {req.ticketNumber}
                          {req.incidentId && (
                            <Badge variant="info" className="text-[10px] py-0 leading-tight">INCIDENT</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{req.requestType}</div>
                        <div className="text-xs text-text-secondary">{req.category}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{req.requesterName}</div>
                        <div className="text-xs text-text-secondary">{req.location || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status as import("@/lib/types/request").RequestStatus} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(req.priority)}>{req.priority.charAt(0) + req.priority.slice(1).toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        {getSlaIndicator(req)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {/* Mobile Grouping Action Bar */}
            {selectedIds.length > 0 && (
              <div className="bg-surface border border-border p-3 rounded-lg flex flex-col gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium text-text-primary">
                  {selectedIds.length} request{selectedIds.length !== 1 ? 's' : ''} selected
                </span>
                <Button size="sm" onClick={() => setIsGroupModalOpen(true)} className="w-full">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Group into Incident
                </Button>
              </div>
            )}
            {filteredRequests.map((req) => (
              <Card key={req.id} className="relative transition-colors hover:border-primary/50">
                <Link href={`/admin/requests/${req.id}`} className="absolute inset-0 z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus-visible:outline-none rounded-lg" aria-label={`View request ${req.ticketNumber}`}></Link>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative z-20 h-5 flex items-center">
                        <input aria-label="Select request" type="checkbox" 
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          checked={selectedIds.includes(req.id)}
                          onChange={(e) => handleSelect(req.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="font-semibold text-sm flex flex-col items-start gap-1">`n                        {req.ticketNumber}`n                        <StatusBadge status={req.status as RequestStatus} />
                        {req.incidentId && (
                          <Badge variant="info" className="text-[10px] py-0 leading-tight">INCIDENT</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1 border-t border-border pt-3">
                    <Badge variant={getPriorityBadgeVariant(req.priority)}>{req.priority.charAt(0) + req.priority.slice(1).toLowerCase()}</Badge>
                    {getSlaIndicator(req)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Grouping Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => {
          if (!isGrouping) setIsGroupModalOpen(false);
        }}
        title="Group Requests into Incident"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)} disabled={isGrouping}>Cancel</Button>
            <Button onClick={handleGroup} disabled={isGrouping || !incidentTitle.trim()}>
              {isGrouping ? "Creating..." : "Create Incident"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-text-secondary">
            You are about to group <strong>{selectedIds.length}</strong> requests into a new incident.
          </p>
          <div className="space-y-2">
            <label htmlFor="incidentTitle" className="text-sm font-medium text-text-primary">Incident Title</label>
            <Input id="incidentTitle" 
              placeholder="e.g. Block A Wi-Fi Outage" 
              value={incidentTitle}
              onChange={(e) => setIncidentTitle(e.target.value)}
              disabled={isGrouping}
              autoFocus
            />
          </div>
          {groupError && <p className="text-sm text-error">{groupError}</p>}
        </div>
      </Modal>
    </div>
  );
}








