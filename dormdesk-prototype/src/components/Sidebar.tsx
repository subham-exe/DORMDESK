import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Bell, 
  UserCheck, 
  Plus, 
  LogOut,
  Wifi,
  ShieldCheck
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { StudentProfile } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  pendingVerificationCount: number;
  unreadNoticesCount: number;
  profile: StudentProfile;
  onCreateClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  pendingVerificationCount,
  unreadNoticesCount,
  profile,
  onCreateClick,
}) => {
  const navItems = [
    {
      id: 'command_center',
      label: 'Command Center',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'dashboard',
      label: 'Student Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'requests',
      label: 'My Requests',
      icon: ClipboardList,
      badge: pendingVerificationCount > 0 ? (
        <span className="bg-[#dc2626] text-white text-[11px] font-mono-code font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
          {pendingVerificationCount}
        </span>
      ) : null,
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: Bell,
      badge: unreadNoticesCount > 0 ? (
        <span className="w-2 h-2 rounded-full bg-slate-900" />
      ) : null,
    },
    {
      id: 'profile',
      label: 'Profile & Settings',
      icon: UserCheck,
      badge: null,
    },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[260px] bg-white z-50 flex-col justify-between border-r border-slate-200/80 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <BrandLogo size="md" onClick={() => onNavigate('dashboard')} />
        </div>

        {/* Primary Action Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onCreateClick}
            className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99] flex items-center justify-center gap-2 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Request</span>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex flex-col gap-1 px-2.5 mt-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
                className={`h-11 w-full flex items-center justify-between px-3.5 rounded-xl transition-all text-left text-sm font-medium cursor-pointer ${
                  isActive
                    ? 'bg-slate-200 text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry & Student Identity Card */}
      <div className="flex flex-col bg-white border-t border-slate-100">
        {/* Network & SLA Telemetry Widget */}
        <div className="mx-3 my-2.5 p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono-code text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse flex-shrink-0" />
            <span className="truncate font-medium">Campus Network: Operational</span>
          </div>
          <div className="text-[10px] font-mono-code text-slate-500 mt-0.5 pl-4 truncate">
            SLA Engine Active • Tier 1
          </div>
        </div>

        {/* Student Profile Snapshot */}
        <div className="p-3 pt-1 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer flex-1"
          >
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center font-semibold text-xs border border-slate-700">
              AS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] text-slate-900 font-semibold truncate leading-tight">
                {profile.name}
              </span>
              <span className="font-mono-code text-[11px] text-slate-500 truncate leading-tight">
                {profile.studentId}
              </span>
              <span className="text-[10px] text-slate-400 truncate leading-tight">
                Hostel B • Room 314
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
            title="Profile & Settings"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>
    </aside>
  );
};
