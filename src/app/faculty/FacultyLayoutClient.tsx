"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Attendance", href: "/faculty/attendance", icon: Calendar },
  ];

  return (
    <div className="flex flex-col h-screen bg-surface-muted md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-primary">DormDesk</h1>
          <p className="text-sm text-text-secondary">Faculty Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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
      <main id="main" className="flex-1 overflow-y-auto pb-16 md:pb-0 flex flex-col">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-end items-center p-4 border-b border-border bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <div className="w-8 h-8 bg-info-bg text-info rounded-full flex items-center justify-center font-bold text-sm">
              FA
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-surface border-b border-border p-4 sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-lg font-bold text-primary">Faculty Portal</h1>
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <div className="w-8 h-8 bg-info-bg text-info rounded-full flex items-center justify-center font-bold text-sm">
              FA
            </div>
          </div>
        </header>
        
        <div className="p-4 md:p-6 lg:p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t border-border flex justify-around items-center h-16 pb-safe z-10">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
