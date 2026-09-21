import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  Share2, 
  XOctagon, 
  User, 
  MapPin, 
  Building2, 
  Calendar, 
  Star, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Check,
  RotateCcw
} from 'lucide-react';
import { CampusTicket, StudentProfile } from '../types';

interface RequestDetailViewProps {
  ticket: CampusTicket;
  profile: StudentProfile;
  onBack: () => void;
  onVerify: (ticketId: string) => void;
  onReopen: (ticketId: string, reason: string) => void;
  onOpenCancelModal: (ticketId: string, title: string) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning') => void;
}

export const RequestDetailView: React.FC<RequestDetailViewProps> = ({
  ticket,
  profile,
  onBack,
  onVerify,
  onReopen,
  onOpenCancelModal,
  onShowToast,
}) => {
  const [showReopenDrawer, setShowReopenDrawer] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenDetails, setReopenDetails] = useState('');
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const isAwaitingVerification = ticket.status === 'RESOLVED';
  const isClosed = ticket.status === 'CLOSED';
  const isCancelled = ticket.status === 'CANCELLED';

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    onShowToast('Link Copied', `Case link for #${ticket.id} copied to clipboard.`, 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  const submitReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim() && !reopenDetails.trim()) {
      onShowToast('Detail Required', 'Please describe what still requires repair.', 'warning');
      return;
    }
    const combinedReason = `${reopenReason}: ${reopenDetails}`;
    onReopen(ticket.id, combinedReason);
    setShowReopenDrawer(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={onBack}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="font-mono-code text-sm font-bold text-slate-900">
                #{ticket.id}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {ticket.category}
              </span>
              {ticket.incident && (
                <span className="bg-blue-100 text-slate-900 text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded">
                  Cluster {ticket.incident.id}
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Share ticket link"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Case File"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Case</span>
          </button>

          {!isClosed && !isCancelled && (
            <button
              type="button"
              onClick={() => onOpenCancelModal(ticket.id, ticket.title)}
              className="px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-red-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <XOctagon className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* CORE ACCOUNTABILITY WORKFLOW: RESIDENT QUALITY SIGN-OFF BANNER */}
      {isAwaitingVerification && (
        <section 
          aria-label="Resident Verification Module"
          className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-[#fffdf7] via-amber-50/50 to-[#fff8eb] p-5 md:p-6 shadow-sm space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Accountability Step 4 of 4
                  </span>
                  <span className="text-xs font-mono-code text-amber-800 font-medium">
                    Auto-closes in {ticket.autoCloseHoursRemaining || 47}h 14m
                  </span>
                </div>
                <h2 className="text-base md:text-lg font-bold text-slate-900">
                  Resolution Ready for Resident Verification
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Staff marked this request as resolved. Please verify that the ceiling fan / fixture is actually functioning properly before this ticket is permanently archived.
                </p>
              </div>
            </div>
          </div>

          {/* Technician Completion Memo */}
          <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200/70 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-mono-code text-[11px]">
              <span>Technician Sign-off Notes • {ticket.assignedTo?.name || 'Field Technician'}</span>
              <span>{ticket.resolvedAt || 'Today at 11:40 AM'}</span>
            </div>
            <p className="text-slate-900 font-medium leading-relaxed">
              "{ticket.resolutionNotes || 'All replacement components tested and verified operational. Supervisor inspection completed.'}"
            </p>
          </div>

          {/* Verification Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowReopenDrawer(!showReopenDrawer)}
              className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100/70 rounded-xl border border-red-300 bg-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Issue Not Fixed / Reopen</span>
            </button>

            <button
              type="button"
              onClick={() => onVerify(ticket.id)}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#059669] hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Verify & Close Request</span>
            </button>
          </div>

          {/* Reopen Interactive Drawer */}
          {showReopenDrawer && (
            <form onSubmit={submitReopen} className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3 mt-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-800">
                  Report Insufficient Repair & Reopen
                </h3>
                <span className="text-[10px] text-red-600 font-mono-code">Auto-escalates priority</span>
              </div>

              <div>
                <label htmlFor="reopen-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Issue Remaining
                </label>
                <select
                  id="reopen-reason"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select failure reason...</option>
                  <option value="Issue still occurs at speed 5">Issue still occurs at speed 5</option>
                  <option value="Noise or vibration remains unacceptable">Noise or vibration remains unacceptable</option>
                  <option value="New fault introduced during repair">New fault introduced during repair</option>
                  <option value="Technician arrived but left without completing">Technician arrived but left without completing</option>
                  <option value="Other functional defect">Other functional defect</option>
                </select>
              </div>

              <div>
                <label htmlFor="reopen-details" className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Details for Chief Warden Console
                </label>
                <textarea
                  id="reopen-details"
                  rows={2}
                  placeholder="Explain exactly what happens when you test the fixture..."
                  value={reopenDetails}
                  onChange={(e) => setReopenDetails(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReopenDrawer(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Reopen & Escalate
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Verified Banner if Closed */}
      {isClosed && (
        <section className="rounded-2xl border border-emerald-200 bg-[#ecfdf5] p-4 md:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-900">
                Verified & Officially Closed by Resident
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                Quality confirmed by {profile.name} ({profile.studentId}) • Archived in institutional audit trail.
              </p>
            </div>
          </div>
          <span className="font-mono-code text-xs text-emerald-800 bg-white/70 px-2.5 py-1 rounded-lg border border-emerald-200">
            SLA Met
          </span>
        </section>
      )}

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details, Photos, Accountability Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Issue Statement Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Case Parameters & Issue Statement
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Domain</span>
                <span className="font-semibold text-slate-800 capitalize">{ticket.domain.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-semibold text-slate-800">{ticket.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Priority</span>
                <span className={`font-semibold capitalize ${ticket.priority === 'urgent' ? 'text-red-600' : 'text-slate-800'}`}>
                  {ticket.priority} Dispatch
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Filed Date</span>
                <span className="font-mono-code font-semibold text-slate-800">{ticket.createdAt}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Description</span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {ticket.description}
              </p>
            </div>

            {ticket.assetAffected && (
              <div className="flex items-center gap-2 text-xs font-mono-code text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900">Asset Impacted:</span>
                <span>{ticket.assetAffected}</span>
              </div>
            )}
          </div>

          {/* Photo Proof / Work Evidence */}
          {ticket.photos && ticket.photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Field Inspection & Evidence Photography
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono-code">
                  {ticket.photos.length} timestamped records
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {ticket.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhotoModal(photo.url)}
                    className="group border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 transition-colors bg-slate-50"
                  >
                    <div className="h-40 w-full overflow-hidden relative">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white font-mono-code text-[10px] px-2 py-0.5 rounded">
                        {photo.timestamp}
                      </span>
                    </div>
                    <div className="p-2.5 text-xs">
                      <span className="font-semibold text-slate-900 block truncate">
                        {photo.title}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        Status: {photo.type} inspection
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accountability Audit Trail (Vertical Stepped Timeline) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Accountability Trail & Universal Engine Stages
              </h2>
              <span className="text-[11px] font-mono-code text-slate-400">
                Stage {ticket.timeline.length} of 6
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {ticket.timeline.map((event, idx) => {
                const isResolvedStage = event.stage === 'RESOLVED';
                const isPending = event.stage === 'PENDING';

                return (
                  <div key={event.id || idx} className="relative group">
                    {/* Stepped dot */}
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white ${
                      isResolvedStage
                        ? 'bg-amber-500 text-white'
                        : isPending
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-slate-900 text-white'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{event.action}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">{event.actor} ({event.actorRole})</span>
                        </div>
                        <span className="font-mono-code text-[11px] text-slate-400">
                          {event.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {event.description}
                      </p>

                      {event.notes && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 italic mt-1">
                          "{event.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: SLA Gauge, Specialist Card, Metadata (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* SLA Performance Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                SLA Performance
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono-code font-bold px-2 py-0.5 rounded">
                Tier-1 On-Track
              </span>
            </div>

            {/* Radial Metric / Visual Progress */}
            <div className="text-center py-2">
              <div className="text-3xl font-bold font-mono-code text-slate-900">
                2h 25m
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1">
                Resolved 21.5h ahead of target
              </div>
              <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden w-full">
                <div className="bg-emerald-500 h-2 rounded-full w-[12%]" />
              </div>
              <div className="flex justify-between text-[10px] font-mono-code text-slate-400 mt-1">
                <span>0h (Logged)</span>
                <span>24h Max SLA</span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Service Level Target:</span>
                <span className="font-mono-code font-semibold text-slate-800">24.0 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actual Turnaround:</span>
                <span className="font-mono-code font-semibold text-emerald-700">2h 25m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campus Benchmark:</span>
                <span className="font-mono-code text-slate-600">3.8h Avg</span>
              </div>
            </div>
          </div>

          {/* Assigned Field Specialist Card */}
          {ticket.assignedTo && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Assigned Specialist
                </span>
                <span className="font-mono-code text-[11px] text-slate-900 font-semibold">
                  {ticket.assignedTo.id}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  {ticket.assignedTo.avatarUrl ? (
                    <img
                      src={ticket.assignedTo.avatarUrl}
                      alt={ticket.assignedTo.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 text-xs">
                      {ticket.assignedTo.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    {ticket.assignedTo.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {ticket.assignedTo.role}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {ticket.assignedTo.department}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-amber-600 font-semibold font-mono-code">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{ticket.assignedTo.rating}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono-code">
                  {ticket.assignedTo.jobsCompleted} jobs completed
                </div>
              </div>
            </div>
          )}

          {/* Case Administration Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block border-b border-slate-100 pb-2">
              Case Administration
            </span>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Print Official Work Order</span>
                <Printer className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Copy Case Permanent Link</span>
                <Share2 className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {activePhotoModal && (
        <div 
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-3xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-slate-800">
            <img
              src={activePhotoModal}
              alt="Expanded preview"
              className="w-full h-auto max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
