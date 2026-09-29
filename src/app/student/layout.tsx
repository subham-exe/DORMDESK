"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Bell, User, GraduationCap, Utensils, Calendar } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav.home"), href: "/student", icon: Home },
    { label: t("nav.requests"), href: "/student/requests", icon: ListTodo },
    { label: t("nav.notices"), href: "/student/notices", icon: Bell },
    { label: t("nav.scholarships"), href: "/student/scholarship", icon: GraduationCap },
    { label: t("nav.mess"), href: "/student/mess", icon: Utensils },
    { label: t("nav.attendance"), href: "/student/attendance", icon: Calendar },
    { label: t("nav.profile"), href: "/student/profile", icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-surface-muted md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-primary">DormDesk</h1>
          <p className="text-sm text-text-secondary">Student Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? "bg-info-bg text-info font-medium" : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main id="main" tabIndex={-1} className="focus:outline-none flex-1 overflow-y-auto pb-16 md:pb-0 flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-end items-center p-4 border-b border-border bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <NotificationDropdown />
            <div className="w-8 h-8 bg-info-bg text-info rounded-full flex items-center justify-center font-bold text-sm">
              ST
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-surface border-b border-border p-4 sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-lg font-bold text-primary">DormDesk</h1>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <NotificationDropdown />
            <div className="w-8 h-8 bg-info-bg text-info rounded-full flex items-center justify-center font-bold text-sm">
              ST
            </div>
          </div>
        </header>
        
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t border-border flex justify-around items-center h-16 pb-safe z-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive ? "text-info" : "text-text-secondary"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
