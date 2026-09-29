"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications");
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

  const unreadCount = notifications.filter(n => !(n.readAt as string) && !readIds.has(n.id as string)).length;

  const markAsRead = async (id: string) => {
    setReadIds(prev => new Set(prev).add(id));
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !(n.readAt as string) && !readIds.has(n.id as string));
    setReadIds(prev => {
      const next = new Set(prev);
      unread.forEach(n => next.add(n.id as string));
      return next;
    });
    await Promise.all(
      unread.map(n => fetch(`/api/notifications/${n.id as string}/read`, { method: "PATCH" }).catch(() => {}))
    );
  };

  const handleNotificationClick = (n: Record<string, unknown>) => {
    markAsRead(n.id as string);
    setOpen(false);
    if (n.link as string) {
      router.push(n.link as string);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-info"
        aria-label="Notifications"
        aria-expanded={open}
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
                className="text-xs text-info hover:underline font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-info rounded"
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
                {notifications.map((n) => {
                  const isRead = !!(n.readAt as string) || readIds.has(n.id as string);
                  return (
                    <button 
                      key={n.id as string} 
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-3 cursor-pointer hover:bg-surface transition-colors flex gap-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-info ${!isRead ? 'bg-info-bg/30' : ''}`}
                    >
                      <div className="shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isRead ? 'bg-info-bg text-info' : 'bg-surface-muted text-text-secondary'}`}>
                          <Info className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-0.5 truncate ${!isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                          {n.title as string}
                        </p>
                        <p className={`text-xs truncate ${!isRead ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {n.message as string}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-1">
                          {new Date(n.timestamp as string).toLocaleString()}
                        </p>
                      </div>
                      {!isRead && (
                        <div className="shrink-0 self-center">
                          <div className="w-2 h-2 rounded-full bg-info"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border bg-surface-muted text-center">
            <Link 
              href="/student/notices" 
              onClick={() => setOpen(false)}
              className="text-xs text-info font-medium hover:underline inline-block p-1 focus:outline-none focus:ring-2 focus:ring-info rounded"
            >
              View all notices
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
