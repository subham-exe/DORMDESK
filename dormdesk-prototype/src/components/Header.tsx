import React, { useState } from 'react';
import { 
  Building2, 
  Info, 
  Search, 
  Bell, 
  User, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { StudentProfile, CampusNotice } from '../types';

interface HeaderProps {
  profile: StudentProfile;
  notices: CampusNotice[];
  onOpenSearch: () => void;
  onCreateClick: () => void;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  notices,
  onOpenSearch,
  onCreateClick,
  onNavigate,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-[260px] right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] z-40 items-center justify-between px-6">
        {/* Left: Location Context & Operational Announcement */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>{profile.hostelBlock.split(' ')[0]} {profile.hostelBlock.split(' ')[1]}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-mono-code">Unit 314</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs">
            <Info className="w-3.5 h-3.5 text-slate-900 flex-shrink-0" />
            <span className="text-slate-700 font-medium">
              Hot water maintenance scheduled: 2:00 PM - 4:00 PM
            </span>
          </div>
        </div>

        {/* Right: Quick Search, Notifications, Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="relative flex items-center h-9 pl-9 pr-12 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200/60 text-xs text-slate-500 w-64 text-left transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <span className="truncate">Find ticket, room request...</span>
            <kbd className="absolute right-2 font-mono-code text-[10px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded shadow-xs">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 relative transition-colors cursor-pointer"
              title="Operational Notices"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#dc2626]" />
            </button>

            {/* Notifications Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs uppercase tracking-wider text-slate-900">
                      Campus Bulletins
                    </span>
                    <span className="bg-slate-50 text-slate-900 text-[10px] font-mono-code font-bold px-1.5 rounded">
                      {notices.length}
                    </span>
                  </div>
                  <button 
                    aria-label="Close notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {notices.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('notices');
                      }}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-mono-code font-semibold text-slate-900">{n.category}</span>
                        <span className="text-slate-400">{n.date}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-900 leading-snug line-clamp-2">
                        {n.title}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('notices');
                    }}
                    className="text-xs text-slate-900 font-semibold hover:underline"
                  >
                    View All Notices & Updates →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Quick View */}
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs border border-slate-700 hover:opacity-90 transition-opacity cursor-pointer"
            title={`${profile.name} (${profile.studentId})`}
          >
            AS
          </button>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)] z-40 flex items-center justify-between px-4">
        <BrandLogo size="sm" onClick={() => onNavigate('dashboard')} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateClick}
            className="h-9 px-3 bg-slate-900 text-white rounded-lg flex items-center gap-1 text-xs font-semibold tracking-wider uppercase shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('notices')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 relative hover:bg-slate-100 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#dc2626]" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold cursor-pointer"
          >
            AS
          </button>
        </div>
      </header>
    </>
  );
};
