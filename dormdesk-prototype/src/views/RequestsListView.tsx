import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Wifi, 
  Wrench, 
  Droplets, 
  FileText, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { CampusTicket, RequestDomain } from '../types';

interface RequestsListViewProps {
  tickets: CampusTicket[];
  onSelectTicket: (id: string) => void;
  onCreateClick: () => void;
  onQuickVerify: (id: string) => void;
  onQuickReportNotFixed: (id: string) => void;
}

export const RequestsListView: React.FC<RequestsListViewProps> = ({
  tickets,
  onSelectTicket,
  onCreateClick,
  onQuickVerify,
  onQuickReportNotFixed,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'sla'>('newest');
  const [isSimulatingLowBandwidth, setIsSimulatingLowBandwidth] = useState(false);
  const [isSimulatingEmpty, setIsSimulatingEmpty] = useState(false);

  // Counts
  const actionNeededCount = tickets.filter((t) => t.status === 'RESOLVED').length;
  const inProgressCount = tickets.filter((t) => ['PROCESSING', 'ACKNOWLEDGED', 'ROUTED'].includes(t.status)).length;
  const assignedCount = tickets.filter((t) => t.status === 'ASSIGNED').length;
  const closedCount = tickets.filter((t) => t.status === 'CLOSED').length;

  // Filtered List
  const filteredTickets = isSimulatingEmpty
    ? []
    : tickets.filter((ticket) => {
        // Query match
        const matchesQuery =
          ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.location.toLowerCase().includes(searchQuery.toLowerCase());

        // Domain match
        const matchesDomain =
          selectedDomain === 'all' || ticket.domain === selectedDomain;

        // Status match
        let matchesStatus = true;
        if (statusFilter === 'action_required') {
          matchesStatus = ticket.status === 'RESOLVED';
        } else if (statusFilter === 'in_progress') {
          matchesStatus = ['PROCESSING', 'ACKNOWLEDGED', 'ROUTED'].includes(ticket.status);
        } else if (statusFilter === 'assigned') {
          matchesStatus = ticket.status === 'ASSIGNED';
        } else if (statusFilter === 'closed') {
          matchesStatus = ticket.status === 'CLOSED';
        }

        return matchesQuery && matchesDomain && matchesStatus;
      });

  // Sort
  filteredTickets.sort((a, b) => {
    if (sortBy === 'sla') {
      return a.slaTargetHours - b.slaTargetHours;
    }
    // Default newest
    return a.id.localeCompare(b.id) * (sortBy === 'oldest' ? 1 : -1);
  });

  const exportRecords = () => {
    const dataStr = JSON.stringify(tickets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dormdesk_student_tickets_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Electrical')) return <Wrench className="w-4 h-4 text-amber-600" />;
    if (category.includes('Wi-Fi') || category.includes('Network')) return <Wifi className="w-4 h-4 text-blue-600" />;
    if (category.includes('Plumbing')) return <Droplets className="w-4 h-4 text-cyan-600" />;
    return <FileText className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Campus Operations Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, verify, and monitor institutional tickets across campus operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportRecords}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download JSON/CSV export of all requests"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export Records</span>
          </button>

          <button
            type="button"
            onClick={onCreateClick}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* Top Metric Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active in SLA
          </div>
          <div className="text-xl font-bold font-mono-code text-slate-900 mt-1">
            06
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            Within scheduled resolution window
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Action Needed
          </div>
          <div className="text-xl font-bold font-mono-code text-amber-700 mt-1">
            {actionNeededCount.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
            Awaiting resident verification
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Avg Resolution Time
          </div>
          <div className="text-xl font-bold font-mono-code text-slate-900 mt-1">
            4.2h
          </div>
          <div className="text-[10px] text-slate-900 font-medium mt-0.5">
            Over last 30 days
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Historical Total
          </div>
          <div className="text-xl font-bold font-mono-code text-slate-900 mt-1">
            38
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Lifetime campus tickets
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search query"
              placeholder="Search by ticket #, description, room, technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Domain Dropdown */}
          <div className="w-full sm:w-48">
            <select
              aria-label="Filter by domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Domains</option>
              <option value="maintenance">Maintenance</option>
              <option value="leave_pass">Leave & Gate Pass</option>
              <option value="certificates">Certificates</option>
              <option value="campus_ops">Campus Ops</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-44">
            <select
              aria-label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="sla">SLA Target Time</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Requests ({tickets.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('action_required')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'action_required'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Action Required ({actionNeededCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              In Progress ({inProgressCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('assigned')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'assigned'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Assigned ({assignedCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'closed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Closed & Verified ({closedCount})
            </button>
          </div>

          {/* Low Bandwidth & Diagnostic Simulation Controls */}
          <div className="flex items-center gap-3 text-[11px] font-mono-code text-slate-500">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isSimulatingLowBandwidth}
                onChange={(e) => setIsSimulatingLowBandwidth(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>2G Skeleton Mode</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isSimulatingEmpty}
                onChange={(e) => setIsSimulatingEmpty(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Empty State</span>
            </label>
          </div>
        </div>
      </div>

      {/* Skeleton Loading State (When Low-Bandwidth Mode is active) */}
      {isSimulatingLowBandwidth ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-4 bg-slate-200 rounded w-24" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No matching operational requests
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no campus tickets matching your active filters. Try resetting the search query or domain category.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('all');
                setStatusFilter('all');
                setIsSimulatingEmpty(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={onCreateClick}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              + Create New Request
            </button>
          </div>
        </div>
      ) : (
        /* Ticket Cards Grid */
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isResolvedPending = ticket.status === 'RESOLVED';

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-2xl border transition-all p-4 md:p-5 shadow-xs ${
                  isResolvedPending
                    ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Metadata & Title */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getCategoryIcon(ticket.category)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-code text-xs font-bold text-slate-900">
                          #{ticket.id}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-600">
                          {ticket.category}
                        </span>
                        {ticket.incident && (
                          <span className="bg-blue-100 text-slate-900 text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded">
                            Cluster: {ticket.incident.id}
                          </span>
                        )}
                        {ticket.priority === 'urgent' && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded">
                            URGENT
                          </span>
                        )}
                      </div>

                      <h2 
                        onClick={() => onSelectTicket(ticket.id)}
                        className="text-sm md:text-base font-bold text-slate-900 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        {ticket.title}
                      </h2>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {ticket.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="font-medium text-slate-700">{ticket.location}</span>
                        <span>•</span>
                        <span>Filed: {ticket.createdAt}</span>
                        <span>•</span>
                        <span className="font-mono-code font-medium">SLA: {ticket.slaRemainingText}</span>
                        {ticket.assignedTo && (
                          <>
                            <span>•</span>
                            <span>Assigned: {ticket.assignedTo.name} ({ticket.assignedTo.role})</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-2.5 pt-3 md:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Status Badge */}
                    {ticket.status === 'RESOLVED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Awaiting Verification
                      </span>
                    ) : ticket.status === 'CLOSED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified & Closed
                      </span>
                    ) : ticket.status === 'PROCESSING' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-slate-900 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {ticket.humanStatus}
                      </span>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isResolvedPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onQuickReportNotFixed(ticket.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
                          >
                            Not Fixed
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectTicket(ticket.id)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify Now</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectTicket(ticket.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Case File</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
