"use client";

import { usePathname } from "next/navigation";
import { WardenSidebar } from "./components/warden-sidebar";
import { AdminHeader } from "@/app/admin/components/admin-header";

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/warden/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-surface-muted md:flex-row">
      <WardenSidebar />
      <main id="main" className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <AdminHeader />
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
