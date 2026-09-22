import React, { useState, useEffect } from 'react';
import { 
  CampusTicket, 
  CampusNotice, 
  StudentProfile, 
  ToastMessage 
} from './types';
import { 
  initialTickets, 
  mockNotices, 
  mockStudentProfile, 
  mockIncident 
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { Toast } from './components/Toast';
import { CancelModal } from './components/CancelModal';
import { SearchModal } from './components/SearchModal';
import { DashboardView } from './views/DashboardView';
import { RequestsListView } from './views/RequestsListView';
import { CreateRequestView } from './views/CreateRequestView';
import { RequestDetailView } from './views/RequestDetailView';
import { NoticesView } from './views/NoticesView';
import { ProfileView } from './views/ProfileView';
import { CommandCenterView } from './views/CommandCenterView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, ArrowRight, Activity } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<CampusTicket[]>(initialTickets);
  const [notices, setNotices] = useState<CampusNotice[]>(mockNotices);
  const [profile, setProfile] = useState<StudentProfile>(mockStudentProfile);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [createdTicketModal, setCreatedTicketModal] = useState<CampusTicket | null>(null);
  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    ticketId: string;
    title: string;
  }>({
    isOpen: false,
    ticketId: '',
    title: '',
  });

  // Global Shortcut for Command-K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

let toastIdCounter = 0;

  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    toastIdCounter += 1;
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${toastIdCounter}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    setCurrentView('request_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVerifyTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id === ticketId) {
          const verifiedEvent = {
            id: `tl-v-${Date.now()}`,
            action: 'Resident Verified & Closed',
            stage: 'CLOSED',
            humanStatus: 'Verified & Closed',
            timestamp: 'Just now',
            actor: profile.name,
            actorRole: 'Student Resident Sign-off',
            description: `Quality sign-off completed by ${profile.name}. Ticket marked resolved and permanently archived in institutional registry.`,
            badgeType: 'success' as const,
          };
          return {
            ...ticket,
            status: 'CLOSED' as const,
            humanStatus: 'Verified & Closed',
            verifiedAt: 'Just now',
            slaStatus: 'met' as const,
            slaRemainingText: 'Archived',
            timeline: [...ticket.timeline, verifiedEvent],
          };
        }
        return ticket;
      })
    );

    showToast(
      'Accountability Verification Complete',
      `Request #${ticketId} signed off successfully. Ticket is officially closed.`,
      'success'
    );
  };

  const handleReopenTicket = (ticketId: string, reason: string) => {
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id === ticketId) {
          const reopenEvent = {
            id: `tl-ro-${Date.now()}`,
            action: 'Reported Inadequate & Reopened',
            stage: 'ESCALATED',
            humanStatus: 'Reopened & Escalated',
            timestamp: 'Just now',
            actor: profile.name,
            actorRole: 'Student Resident Sign-off',
            description: `Student indicated issue is not resolved. Reason: "${reason}". Elevated priority back to Warden and Estate Dispatch.`,
            badgeType: 'warning' as const,
          };
          return {
            ...ticket,
            status: 'ESCALATED' as const,
            humanStatus: 'Reopened & Escalated',
            priority: 'urgent' as const,
            slaRemainingText: '4h remaining (Escalated)',
            reopenNotes: reason,
            timeline: [...ticket.timeline, reopenEvent],
          };
        }
        return ticket;
      })
    );

    showToast(
      'Ticket Escalated & Reopened',
      `Request #${ticketId} returned to dispatch console with elevated priority.`,
      'warning'
    );
  };

  const handleConfirmCancel = (reason: string) => {
    const { ticketId } = cancelModalState;
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id === ticketId) {
          const cancelEvent = {
            id: `tl-c-${Date.now()}`,
            action: 'Cancelled by Resident',
            stage: 'CANCELLED',
            humanStatus: 'Cancelled',
            timestamp: 'Just now',
            actor: profile.name,
            actorRole: 'Student Resident',
            description: `Cancelled by resident with reason: "${reason}". De-allocated from technician queue.`,
            badgeType: 'error' as const,
          };
          return {
            ...ticket,
            status: 'CANCELLED' as const,
            humanStatus: 'Cancelled',
            slaRemainingText: 'Cancelled',
            timeline: [...ticket.timeline, cancelEvent],
          };
        }
        return ticket;
      })
    );

    setCancelModalState({ isOpen: false, ticketId: '', title: '' });
    showToast('Request Cancelled', `Ticket #${ticketId} cancelled. Queue slot released.`, 'info');
  };

  const handleCreateSubmitSuccess = (newTicket: CampusTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setCreatedTicketModal(newTicket);
    showToast(
      'Operational Ticket Created',
      `Assigned identifier #${newTicket.id}. Routed to Campus Request Engine.`,
      'success'
    );
  };

  const handleMarkNoticeRead = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const pendingVerificationCount = tickets.filter(
    (t) => t.status === 'RESOLVED'
  ).length;

  const unreadNoticesCount = notices.filter((n) => !n.read).length;

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-slate-100 selection:text-slate-900">
      <OfflineIndicator />
      {/* Desktop Persistent Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingVerificationCount={pendingVerificationCount}
        unreadNoticesCount={unreadNoticesCount}
        profile={profile}
        onCreateClick={() => {
          setCurrentView('create_request');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Global Header */}
      <Header
        profile={profile}
        notices={notices}
        onOpenSearch={() => setIsSearchOpen(true)}
        onCreateClick={() => {
          setCurrentView('create_request');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-[260px] pt-20 md:pt-22 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        {currentView === 'command_center' && (
          <CommandCenterView
            tickets={tickets}
            incidents={[mockIncident]}
            onSelectTicket={handleSelectTicket}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            tickets={tickets}
            notices={notices}
            profile={profile}
            incident={mockIncident}
            onSelectTicket={handleSelectTicket}
            onCreateClick={() => setCurrentView('create_request')}
            onNavigate={(view) => setCurrentView(view)}
            onQuickVerify={handleVerifyTicket}
            onQuickReportNotFixed={(id) => {
              handleSelectTicket(id);
            }}
          />
        )}

        {currentView === 'requests' && (
          <RequestsListView
            tickets={tickets}
            onSelectTicket={handleSelectTicket}
            onCreateClick={() => setCurrentView('create_request')}
            onQuickVerify={handleVerifyTicket}
            onQuickReportNotFixed={(id) => {
              handleSelectTicket(id);
            }}
          />
        )}

        {currentView === 'create_request' && (
          <CreateRequestView
            profile={profile}
            onBack={() => setCurrentView('dashboard')}
            onSubmitSuccess={(newTicket) => {
              handleCreateSubmitSuccess(newTicket);
            }}
            onSaveDraftToast={() => {
              showToast('Draft Saved', 'Draft parameters saved to your browser session.', 'info');
            }}
          />
        )}

        {currentView === 'request_detail' && selectedTicket && (
          <RequestDetailView
            ticket={selectedTicket}
            profile={profile}
            onBack={() => setCurrentView('requests')}
            onVerify={handleVerifyTicket}
            onReopen={handleReopenTicket}
            onOpenCancelModal={(id, title) => {
              setCancelModalState({ isOpen: true, ticketId: id, title });
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'notices' && (
          <NoticesView
            notices={notices}
            onMarkNoticeRead={handleMarkNoticeRead}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            profile={profile}
            onSavePreferences={() => {
              showToast('Configuration Updated', 'Residential notification telemetry updated.', 'success');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Fixed Nav */}
      <MobileNav
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingVerificationCount={pendingVerificationCount}
        unreadNoticesCount={unreadNoticesCount}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Search Modal (⌘K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tickets={tickets}
        notices={notices}
        onSelectTicket={handleSelectTicket}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onCreateClick={() => {
          setCurrentView('create_request');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Cancel Request Confirmation Modal */}
      <CancelModal
        isOpen={cancelModalState.isOpen}
        ticketId={cancelModalState.ticketId}
        ticketTitle={cancelModalState.title}
        onClose={() => setCancelModalState({ isOpen: false, ticketId: '', title: '' })}
        onConfirm={handleConfirmCancel}
      />

      {/* Created Ticket Confirmation Modal */}
      {createdTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Logged in Universal Request Engine
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                Request Registered: <span className="font-mono-code text-slate-900">#{createdTicketModal.id}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                "{createdTicketModal.title}"
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-left text-xs space-y-1.5 font-mono-code">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="text-slate-800">{createdTicketModal.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SLA Window:</span>
                <span className="text-emerald-700 font-bold">{createdTicketModal.slaRemainingText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Routing Status:</span>
                <span className="text-slate-900 font-bold">Dispatched to Estate Works</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreatedTicketModal(null);
                  setCurrentView('dashboard');
                }}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = createdTicketModal.id;
                  setCreatedTicketModal(null);
                  handleSelectTicket(id);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>View Case File</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
