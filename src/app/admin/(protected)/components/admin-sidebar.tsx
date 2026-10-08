"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DollarSign, LayoutDashboard, Utensils, ListTodo, AlertTriangle, BarChart, GraduationCap, Megaphone, Shield } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Command Center", href: "/admin/command-center", icon: LayoutDashboard },
    { label: "Requests", href: "/admin/requests", icon: ListTodo },
    // { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle }, // P0: Hide until implemented
    // { label: "Announcements", href: "/admin/announcements", icon: Megaphone }, // 404 gap removed
    // { label: "Policies", href: "/admin/policies", icon: Shield }, // 404 gap removed
    // { label: "Analytics", href: "/admin/analytics", icon: BarChart }, // 404 gap removed
    // { label: "Scholarships", href: "/admin/scholarships", icon: GraduationCap }, // 404 gap removed
    { label: "Fees & Dues", href: "/admin/fees", icon: DollarSign },
    // { label: "Mess Menu", href: "/admin/mess", icon: Utensils }, // 404 gap removed
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border shrink-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">DormDesk Admin</h1>
        <p className="text-sm text-text-secondary">Operations Dashboard</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive ? "bg-info-bg text-info font-medium" : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
