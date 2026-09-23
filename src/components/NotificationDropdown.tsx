"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("dormdesk_read_notifications");
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch { }
    }
    return new Set();
  });
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications?studentId=mock-user-123");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setNotifications(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("dormdesk_read_notifications", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      localStorage.setItem("dormdesk_read_notifications", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-info"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white border border-border shadow-lg rounded-lg overflow-hidden flex flex-col z-50">
          <div className="p-3 border-b border-border flex justify-between items-center bg-surface-muted">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-info hover:underline font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-text-secondary">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-text-secondary">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {notifications.map((n: any) => {
                  const isRead = readIds.has(n.id);
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 cursor-pointer hover:bg-surface transition-colors flex gap-3 ${!isRead ? 'bg-info-bg/30' : ''}`}
                    >
                      <div className="shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isRead ? 'bg-info-bg text-info' : 'bg-surface-muted text-text-secondary'}`}>
                          <Info className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-0.5 truncate ${!isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                          {n.title}
                        </p>
                        <p className={`text-xs truncate ${!isRead ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-1">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!isRead && (
                        <div className="shrink-0 self-center">
                          <div className="w-2 h-2 rounded-full bg-info"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border bg-surface-muted text-center">
            <Link 
              href="/student/notices" 
              onClick={() => setOpen(false)}
              className="text-xs text-info font-medium hover:underline inline-block p-1"
            >
              View all notices
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
