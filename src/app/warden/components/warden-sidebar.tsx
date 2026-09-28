"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, AlertTriangle, ListTodo, LogOut } from "lucide-react";

export function WardenSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Warden Desk", href: "/warden", icon: LayoutDashboard },
    { label: "Manage Requests", href: "/admin/requests", icon: ListTodo },
    { label: "Manage Incidents", href: "/admin/incidents", icon: AlertTriangle },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border shrink-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">DormDesk</h1>
        <p className="text-sm text-text-secondary">Warden Operations</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/warden" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-text hover:bg-surface-hover"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/api/auth/logout"
          className="flex items-center space-x-3 px-3 py-2 text-error hover:bg-error/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
