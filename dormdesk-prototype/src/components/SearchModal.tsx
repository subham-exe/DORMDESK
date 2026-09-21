import React, { useState, useEffect } from 'react';
import { Search, X, ClipboardList, Bell, Plus, ArrowRight } from 'lucide-react';
import { CampusTicket, CampusNotice } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: CampusTicket[];
  notices: CampusNotice[];
  onSelectTicket: (ticketId: string) => void;
  onNavigate: (view: string) => void;
  onCreateClick: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  tickets,
  notices,
  onSelectTicket,
  onNavigate,
  onCreateClick,
}) => {
  const [query, setQuery] = useState('');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle handled by parent or opened
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(query.toLowerCase()) ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase()) ||
      t.location.toLowerCase().includes(query.toLowerCase())
  );

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95"
        role="dialog"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            aria-label="Search query"
            placeholder="Search tickets by #ID, category, keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 text-sm bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block font-mono-code text-[11px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Quick Suggestions & Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {/* Quick Actions if query is empty */}
          {!query && (
            <div className="p-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Quick Actions
              </span>
              <button
                onClick={() => {
                  onClose();
                  onCreateClick();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Create New Campus Request</div>
                    <div className="text-[11px] text-slate-500">Maintenance, Leave Pass, Certificates</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate('notices');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left group transition-colors mt-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-slate-900 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">View Campus Bulletins & Advisories</div>
                    <div className="text-[11px] text-slate-500">Scheduled maintenance, wardens notices</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}

          {/* Ticket Results */}
          {filteredTickets.length > 0 && (
            <div className="p-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Operational Requests ({filteredTickets.length})
              </span>
              <div className="flex flex-col gap-1">
                {filteredTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onClose();
                      onSelectTicket(t.id);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-xs text-slate-900">#{t.id}</span>
                          <span className="text-xs font-semibold text-slate-900 truncate">{t.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {t.category} • {t.location} • <span className="font-medium text-slate-700">{t.humanStatus}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notice Results */}
          {filteredNotices.length > 0 && (
            <div className="p-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Campus Notices ({filteredNotices.length})
              </span>
              <div className="flex flex-col gap-1">
                {filteredNotices.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onClose();
                      onNavigate('notices');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{n.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {n.category} • {n.date} • {n.issuer}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredTickets.length === 0 && filteredNotices.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              <p className="text-xs font-medium">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">Try checking ticket number or keyword</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
