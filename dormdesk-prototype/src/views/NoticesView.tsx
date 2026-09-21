import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  Building, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Filter,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CampusNotice } from '../types';

interface NoticesViewProps {
  notices: CampusNotice[];
  onMarkNoticeRead: (id: string) => void;
}

export const NoticesView: React.FC<NoticesViewProps> = ({
  notices,
  onMarkNoticeRead,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  const categories = ['All', 'Maintenance', 'Hostel', 'General'];

  const filteredNotices = notices.filter(
    (n) => selectedCategory === 'All' || n.category === selectedCategory
  );

  const toggleExpand = (id: string) => {
    setExpandedNoticeId(expandedNoticeId === id ? null : id);
    onMarkNoticeRead(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-slate-900" />
          <span className="text-[11px] font-mono-code font-semibold uppercase tracking-wider text-slate-500">
            Official Institutional Dispatch
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Campus Bulletins & Notices
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Official announcements from Chief Warden Office, Estate Works, and Campus Administration.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat} {cat === 'All' ? `(${notices.length})` : ''}
          </button>
        ))}
      </div>

      {/* Notice List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => {
          const isExpanded = expandedNoticeId === notice.id;

          return (
            <article
              key={notice.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                notice.priority === 'High'
                  ? 'border-amber-300 bg-amber-50/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-code text-[11px] font-bold text-slate-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                    {notice.id}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {notice.category}
                  </span>
                  {notice.priority === 'High' && (
                    <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      High Priority
                    </span>
                  )}
                  {notice.actionRequired && (
                    <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      Action Required
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono-code text-slate-400">
                  <span>{notice.date}</span>
                  {!notice.read && (
                    <span className="w-2 h-2 rounded-full bg-slate-900" title="Unread" />
                  )}
                </div>
              </div>

              <h2 
                onClick={() => toggleExpand(notice.id)}
                className="text-sm md:text-base font-bold text-slate-900 mt-1 cursor-pointer hover:text-slate-900 transition-colors"
              >
                {notice.title}
              </h2>

              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {notice.summary}
              </p>

              {notice.window && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono-code text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 inline-flex">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Scheduled Outage / Window: <strong>{notice.window}</strong></span>
                </div>
              )}

              {/* Expandable Comprehensive Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in">
                  <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
                    <p className="font-semibold text-slate-900 mb-1">Administrative Guidance:</p>
                    {notice.content}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Issued by: <strong className="text-slate-700">{notice.issuer}</strong></span>
                    <button
                      type="button"
                      onClick={() => onMarkNoticeRead(notice.id)}
                      className="text-slate-900 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Issuer: {notice.issuer}
                </span>

                <button
                  type="button"
                  onClick={() => toggleExpand(notice.id)}
                  className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? 'Collapse Memo' : 'Read Full Announcement'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
