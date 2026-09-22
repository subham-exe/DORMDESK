"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, AlertTriangle, BarChart, GraduationCap } from "lucide-react";

export function AdminMobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Requests", href: "/admin/requests", icon: ListTodo },
    { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart },
    { label: "Scholarships", href: "/admin/scholarships", icon: GraduationCap },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t border-border flex justify-around items-center h-16 pb-safe z-10">
      {navItems.slice(0, 5).map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
              isActive ? "text-info" : "text-text-secondary"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
