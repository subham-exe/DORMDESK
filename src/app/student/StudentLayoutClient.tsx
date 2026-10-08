"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ListTodo, 
  Bell, 
  User, 
  GraduationCap, 
  Utensils, 
  Calendar, 
  LogOut, 
  Clock, 
  BookOpen, 
  CreditCard,
  Menu,
  X
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { clearOfflineDB } from "@/lib/services/offline-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { syncOfflineMutations } from "@/lib/services/sync-engine-client";
import { useToast } from "@/components/ui/use-toast";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOnline = async () => {
      const userId = localStorage.getItem("dormdesk_user_id");
      if (userId) {
        // toast({ title: "Online", description: "Connection restored. Syncing...", variant: "default" });
        await syncOfflineMutations(userId, (status) => {
          if (status === "ONLINE") {
            toast({ title: "Sync Complete", description: "Offline actions synchronized.", variant: "success" });
          } else if (status === "AUTH_REQUIRED") {
            toast({ title: "Sync Failed", description: "Authentication required to sync. Please login again.", variant: "default" });
          } else if (status === "SYNC_ERROR") {
            toast({ title: "Sync Failed", description: "Some actions failed to sync.", variant: "default" });
          }
        });
      }
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine) {
       handleOnline();
    }
    return () => window.removeEventListener("online", handleOnline);
  }, [toast]);

  const handleLogout = async () => {
    await clearOfflineDB().catch(console.error);
    localStorage.removeItem("dormdesk_user_id");
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navGroups = [
    {
      title: "Overview",
      items: [
        { label: t("nav.home") || "Home", href: "/student", icon: Home },
      ]
    },
    {
      title: "Academics",
      items: [
        { label: "Timetable", href: "/student/academics/timetable", icon: Clock },
        { label: t("nav.attendance") || "Attendance", href: "/student/attendance", icon: Calendar },
        { label: "Assignments", href: "/student/resources/assignments", icon: BookOpen },
      ]
    },
    {
      title: "Campus",
      items: [
        { label: t("nav.notices") || "Notices", href: "/student/notices", icon: Bell },
        { label: t("nav.mess") || "Mess Menu", href: "/student/mess", icon: Utensils },
        { label: "Fees & Dues", href: "/student/campus/fees", icon: CreditCard },
      ]
    },
    {
      title: "Support",
      items: [
        { label: t("nav.requests") || "Requests", href: "/student/requests", icon: ListTodo },
        { label: t("nav.scholarships") || "Scholarships", href: "/student/scholarship", icon: GraduationCap },
      ]
    },
    {
      title: "Account",
      items: [
        { label: t("nav.profile") || "Profile", href: "/student/profile", icon: User },
      ]
    }
  ];

  const mobileNavItems = [
    { label: "Home", href: "/student", icon: Home },
    { label: "Timetable", href: "/student/academics/timetable", icon: Clock },
    { label: "Requests", href: "/student/requests", icon: ListTodo },
    { label: "Notices", href: "/student/notices", icon: Bell },
  ];

  return (
    <div className="flex flex-col h-screen bg-surface-muted md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-full">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-primary">DormDesk</h1>
          <p className="text-sm text-text-secondary">Student Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((group, i) => (
            <div key={i} className="space-y-1">
              <h2 className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                {group.title}
              </h2>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        isActive ? "bg-info-bg text-info font-medium" : "text-text-secondary hover:bg-surface hover:text-text-primary"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors text-error hover:bg-error-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main" tabIndex={-1} className="focus:outline-none flex-1 overflow-y-auto pb-16 md:pb-0 flex flex-col relative z-0">
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
          </div>
        </header>
        
        <div className="p-4 md:p-6 lg:p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t border-border flex justify-around items-center h-16 pb-safe z-20">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
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
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="More"
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>

      {/* Fullscreen Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-surface flex flex-col h-[100dvh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-lg font-bold text-primary">Menu</h1>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {navGroups.map((group, i) => (
              <div key={i} className="space-y-1">
                <h2 className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  {group.title}
                </h2>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          isActive ? "bg-info-bg text-info font-medium" : "text-text-secondary hover:bg-surface hover:text-text-primary"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <button 
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-3 px-3 py-3 rounded-md transition-colors text-error bg-error-bg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
