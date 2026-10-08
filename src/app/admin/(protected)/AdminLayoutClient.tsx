"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./components/admin-sidebar";
import { AdminMobileNav } from "./components/admin-mobile-nav";
import { AdminHeader } from "./components/admin-header";

import { WardenSidebar } from "@/app/warden/components/warden-sidebar";

export default function AdminLayoutClient({ children, role = "SYSTEM_ADMIN" }: { children: React.ReactNode, role?: string }) {
  const pathname = usePathname();

  // If we are on the login page, do not render the shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-surface-muted md:flex-row">
      {/* Sidebar for Desktop */}
      {role === "SYSTEM_ADMIN" ? <AdminSidebar /> : <WardenSidebar />}

      {/* Main Content */}
      <main id="main" tabIndex={-1} className="focus:outline-none flex-1 overflow-y-auto pb-16 md:pb-0">
        <AdminHeader />
        
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile nav could also be made role-aware if needed, but keeping simple for now */}
      <AdminMobileNav />
    </div>
  );
}
