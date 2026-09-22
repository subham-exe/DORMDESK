import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Bell, 
  User,
  ShieldCheck
} from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  pendingVerificationCount: number;
  unreadNoticesCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onNavigate,
  pendingVerificationCount,
  unreadNoticesCount,
}) => {
  const tabs = [
    {
      id: 'command_center',
      label: 'Admin',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: ClipboardList,
      badge: pendingVerificationCount > 0 ? (
        <span className="absolute -top-1 -right-1 bg-[#dc2626] text-white text-[10px] font-mono-code font-bold px-1 rounded-full min-w-[16px] text-center leading-tight">
          {pendingVerificationCount}
        </span>
      ) : null,
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: Bell,
      badge: unreadNoticesCount > 0 ? (
        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-slate-900" />
      ) : null,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] z-50 flex items-center justify-around px-2 pb-safe"
      aria-label="Mobile Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors relative cursor-pointer ${
              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.badge}
            </div>
            <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
