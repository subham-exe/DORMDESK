import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  TrendingUp, 
  Wrench, 
  Wifi, 
  Droplets, 
  FileText, 
  PhoneCall, 
  Building, 
  Plus, 
  ChevronRight, 
  AlertTriangle,
  Flame
} from 'lucide-react';
import { CampusTicket, CampusNotice, StudentProfile, IncidentContext } from '../types';

interface DashboardViewProps {
  tickets: CampusTicket[];
  notices: CampusNotice[];
  profile: StudentProfile;
  incident: IncidentContext;
  onSelectTicket: (id: string) => void;
  onCreateClick: () => void;
  onNavigate: (view: string) => void;
  onQuickVerify: (ticketId: string) => void;
  onQuickReportNotFixed: (ticketId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  notices,
  profile,
  incident,
  onSelectTicket,
  onCreateClick,
  onNavigate,
  onQuickVerify,
  onQuickReportNotFixed,
}) => {
  const pendingVerificationTickets = tickets.filter(
    (t) => t.status === 'RESOLVED'
  );
  const activeTickets = tickets.filter(
    (t) => !['CLOSED', 'CANCELLED'].includes(t.status)
  );

  const getStatusBadge = (ticket: CampusTicket) => {
    switch (ticket.status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Awaiting Verification
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-slate-900 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            In Progress
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Assigned
          </span>
        );
      case 'ACKNOWLEDGED':
      case 'ROUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {ticket.humanStatus}
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified & Closed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {ticket.humanStatus}
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Electrical')) return <Wrench className="w-4 h-4 text-amber-600" />;
    if (category.includes('Wi-Fi') || category.includes('Network')) return <Wifi className="w-4 h-4 text-blue-600" />;
    if (category.includes('Plumbing')) return <Droplets className="w-4 h-4 text-cyan-600" />;
    return <FileText className="w-4 h-4 text-slate-600" />;
  };

  const primaryPending = pendingVerificationTickets[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Context & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono-code font-semibold uppercase tracking-wider text-slate-500">
              Residential Desk Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {profile.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's what needs your attention today. {profile.hostelBlock} • {profile.room}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('requests')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            All Tickets ({tickets.length})
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#ecfdf5] border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>99.4% SLA On-Track</span>
          </div>
          <button
            onClick={onCreateClick}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      {/* LEVEL 1: Verification Needed (Critical Hero Card) */}
      {primaryPending && (
        <section 
          aria-label="Pending Verification Alert"
          className="rounded-2xl border-2 border-amber-300/90 bg-gradient-to-br from-[#fffdf7] via-amber-50/40 to-[#fff8eb] p-5 md:p-6 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                    Action Required
                  </span>
                  <span className="text-xs font-mono-code text-amber-800 font-medium">
                    Auto-closes in {primaryPending.autoCloseHoursRemaining || 47}h
                  </span>
                </div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 mt-1">
                  {pendingVerificationTickets.length} request{pendingVerificationTickets.length > 1 ? 's' : ''} marked resolved by campus staff {pendingVerificationTickets.length > 1 ? 'are' : 'is'} waiting for your confirmation.
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  The DORMDESK universal accountability loop requires resident verification before tickets are permanently closed. If the repair is inadequate, reporting it now prevents auto-closure and escalates back to estate dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Primary Action Ticket Preview */}
          <div className="mt-4 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 p-3.5 rounded-xl border border-amber-200/50">
            <div className="flex items-start gap-3 min-w-0">
              <span className="font-mono-code text-xs font-bold text-slate-900 mt-0.5 flex-shrink-0">
                #{primaryPending.id}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {primaryPending.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Resolved by {primaryPending.assignedTo?.name || 'Campus Maintenance'} • {primaryPending.updatedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => onQuickReportNotFixed(primaryPending.id)}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
              >
                Report Not Fixed
              </button>
              <button
                type="button"
                onClick={() => onSelectTicket(primaryPending.id)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-emerald-700 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Review & Verify</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* LEVEL 2: Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Active Requests */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active In Queue</span>
            <Clock className="w-4 h-4 text-slate-900" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            {activeTickets.length.toString().padStart(2, '0')}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-slate-900 h-1.5 rounded-full w-2/3" />
            </div>
            <span className="font-mono-code text-[10px] text-slate-600">66%</span>
          </div>
        </div>

        {/* Verification Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Action Needed</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-amber-700">
            {pendingVerificationTickets.length.toString().padStart(2, '0')}
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-medium truncate">
            {pendingVerificationTickets.length > 0 ? 'Resident sign-off required' : 'All confirmed'}
          </div>
        </div>

        {/* Total Lifetime */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Historical Total</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            {tickets.length.toString().padStart(2, '0')}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {tickets.filter(t => t.status === 'CLOSED').length} verified & closed
          </div>
        </div>

        {/* Average Resolution Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Resolution</span>
            <TrendingUp className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-2xl font-bold font-mono-code text-slate-900">
            4.2h
          </div>
          <div className="mt-2 text-[11px] text-[#059669] font-medium">
            +18% faster than SLA target
          </div>
        </div>
      </div>

      {/* Incident Intelligence Alert Banner */}
      <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-xs font-bold text-slate-900">
                {incident.id}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {incident.title}
              </span>
              <span className="hidden sm:inline-block bg-slate-200 text-slate-800 text-[10px] font-mono-code px-2 py-0.5 rounded-full font-semibold">
                {incident.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              {incident.description} Your request <span className="font-mono-code font-bold text-slate-900">#REQ-1048</span> is auto-linked under this cluster. Splicing crew is on-site.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectTicket('REQ-1048')}
          className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-colors self-start md:self-auto cursor-pointer"
        >
          <span>Linked Case File</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Operational Tickets (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Operational Tickets
              </h2>
              <p className="text-xs text-slate-500">
                Universal request engine status & accountability trail
              </p>
            </div>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({tickets.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ticket Items */}
          <div className="divide-y divide-slate-100">
            {tickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getCategoryIcon(ticket.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-mono-code text-xs font-bold text-slate-900">
                        #{ticket.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {ticket.category}
                      </span>
                      {ticket.priority === 'urgent' && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-slate-900 group-hover:text-slate-900 transition-colors truncate">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>{ticket.location}</span>
                      <span>•</span>
                      <span>SLA: {ticket.slaRemainingText}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                  {getStatusBadge(ticket)}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Browse Complete Institutional Pipeline →
            </button>
          </div>
        </div>

        {/* Right Column: Notices & Hostel B Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Campus Bulletins */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Campus Notice Board
              </span>
              <button
                onClick={() => onNavigate('notices')}
                className="text-xs font-semibold text-slate-900 hover:underline"
              >
                All Bulletins
              </button>
            </div>

            {notices.slice(0, 2).map((notice) => (
              <div 
                key={notice.id}
                onClick={() => onNavigate('notices')}
                className="mb-3 last:mb-0 p-3 rounded-xl bg-slate-50 hover:bg-slate-50 border border-slate-200/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-900 bg-blue-100/70 px-1.5 py-0.5 rounded">
                    {notice.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-code">
                    {notice.date}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {notice.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {notice.summary}
                </p>
                {notice.window && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono-code text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{notice.window}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hostel B Residential Desk Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Hostel B Operations Registry
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Residential Block:</span>
                <span className="font-semibold text-slate-900">{profile.hostelBlock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Room Assignment:</span>
                <span className="font-mono-code font-semibold text-slate-900">{profile.room} ({profile.wing})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Wing Steward:</span>
                <span className="font-semibold text-slate-900">{profile.wingSteward}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Steward Contact:</span>
                <span className="font-mono-code text-slate-700">{profile.wingStewardPhone}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Emergency Speed Dials
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <div className="text-slate-500 font-medium">Warden Office</div>
                  <div className="font-mono-code font-bold text-slate-900">{profile.wardenExt}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <div className="text-slate-500 font-medium">Medical Unit</div>
                  <div className="font-mono-code font-bold text-red-600">Ext. 108</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Telemetry Footer */}
      <footer className="pt-6 pb-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono-code text-slate-400">
        <div>
          DORMDESK v2.4 • Universal Request Engine • Zero-Downtime Verification SLA
        </div>
        <div>
          Apex Institute Campus Operations Network
        </div>
      </footer>
    </div>
  );
};
