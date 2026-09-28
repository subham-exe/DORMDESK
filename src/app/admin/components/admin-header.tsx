"use client";

import { usePathname } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();

  // Simple title mapping
  let title = "Command Center";
  if (pathname.startsWith("/admin/requests")) title = "Requests";
  if (pathname.startsWith("/admin/incidents")) title = "Incidents";
  if (pathname.startsWith("/admin/analytics")) title = "Analytics";
  if (pathname.startsWith("/admin/scholarships")) title = "Scholarships";

  return (
    <header className="bg-surface border-b border-border p-4 sticky top-0 z-10 flex justify-between items-center h-16">
      <h1 className="text-lg font-bold text-text-primary md:text-xl truncate pr-4">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Placeholder for Notifications / Settings / Profile */}
        <div className="w-8 h-8 shrink-0 bg-info-bg text-info rounded-full flex items-center justify-center font-bold text-sm" aria-label="Admin Profile">
          AD
        </div>
      </div>
    </header>
  );
}
