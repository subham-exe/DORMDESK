"use client";

import { useEffect, useState, useCallback } from "react";
import { WifiOff, CloudOff, CloudDrizzle, CloudSun, AlertTriangle, Key } from "lucide-react";
import { syncOfflineRequests } from "@/lib/services/sync-engine-client";
import { getOfflineRequests } from "@/lib/services/offline-store";

export type SyncState = "ONLINE" | "OFFLINE" | "SYNCING" | "PENDING_SYNC" | "SYNC_ERROR" | "AUTH_REQUIRED";

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>(() => {
    if (typeof window !== "undefined") {
      return !navigator.onLine ? "OFFLINE" : "ONLINE";
    }
    return "ONLINE";
  });
  
  const [showBackOnline, setShowBackOnline] = useState(false);

  const checkQueue = useCallback(async () => {
    if (syncState === "OFFLINE" || syncState === "SYNCING") return;
    try {
      // Sync local userId
      let currentUserId = localStorage.getItem("dormdesk_user_id");
      if (navigator.onLine) {
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            currentUserId = data.id;
            localStorage.setItem("dormdesk_user_id", data.id);
          } else {
            localStorage.removeItem("dormdesk_user_id");
          }
        } catch (_e) {}
      }

      const requests = await getOfflineRequests();
      if (requests.length > 0) {
        // Enforce user isolation: if any request belongs to a different user, flag as AUTH_REQUIRED
        const hasCrossUser = requests.some(r => r._requesterId && r._requesterId !== currentUserId);
        const hasAuthError = requests.some(r => r._status === "AUTH_REQUIRED") || hasCrossUser;
        const hasPermError = requests.some(r => r._status === "FAILED_PERMANENTLY");
        const hasSyncError = requests.some(r => r._status === "SYNC_ERROR");
        
        if (hasAuthError) setSyncState("AUTH_REQUIRED");
        else if (hasPermError || hasSyncError) setSyncState("SYNC_ERROR");
        else setSyncState("PENDING_SYNC");
        
        // Attempt sync if we have pending stuff and we are not in an auth error state (force user intervention)
        if (!hasAuthError && navigator.onLine) {
           await syncOfflineRequests((status) => {
             setSyncState(status as SyncState);
           }, currentUserId || undefined);
        }
      } else {
        setSyncState(navigator.onLine ? "ONLINE" : "OFFLINE");
      }
    } catch (err) {
      console.error("Error checking offline queue:", err);
    }
  }, [syncState]);

  useEffect(() => {
    // Initial check
    setTimeout(checkQueue, 0);
    // Also set an interval to periodically check and retry
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkQueue();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [checkQueue]);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered.", reg.scope))
        .catch((err) => console.error("Service Worker registration failed.", err));
    }

    // Network status detection
    const handleOnline = async () => {
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
      setSyncState("ONLINE");
      await checkQueue();
    };
    const handleOffline = () => {
      setSyncState("OFFLINE");
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkQueue]);

  const renderBanner = () => {
    if (syncState === "OFFLINE") {
      return (
        <div className="fixed top-0 left-0 w-full bg-slate-700 text-white px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0" aria-live="polite" role="status">
          <WifiOff className="w-4 h-4 mr-2" />
          You&apos;re offline. Actions will be saved locally.
        </div>
      );
    }
    if (syncState === "SYNCING") {
      return (
        <div className="fixed top-0 left-0 w-full bg-blue-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0" aria-live="polite" role="status">
          <CloudDrizzle className="w-4 h-4 mr-2 animate-pulse" />
          Syncing offline requests...
        </div>
      );
    }
    if (syncState === "PENDING_SYNC") {
      return (
        <div className="fixed top-0 left-0 w-full bg-yellow-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0" aria-live="polite" role="status">
          <CloudOff className="w-4 h-4 mr-2" />
          Waiting to sync requests.
        </div>
      );
    }
    if (syncState === "SYNC_ERROR") {
      return (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0" aria-live="polite" role="status">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Sync failed. Some requests could not be sent.
        </div>
      );
    }
    if (syncState === "AUTH_REQUIRED") {
      return (
        <div className="fixed top-0 left-0 w-full bg-red-700 text-white px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0" aria-live="assertive" role="alert">
          <Key className="w-4 h-4 mr-2" />
          Session expired. Please log in to sync your offline requests.
        </div>
      );
    }
    if (showBackOnline) {
      return (
        <div className="fixed top-0 left-0 w-full bg-green-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0" aria-live="polite" role="status">
          <CloudSun className="w-4 h-4 mr-2" />
          You&apos;re back online.
        </div>
      );
    }
    return null;
  };

  const hasBanner = syncState !== "ONLINE" || showBackOnline;

  return (
    <>
      {renderBanner()}
      {/* Main Content */}
      <div className={`${hasBanner ? 'mt-9' : ''} transition-all duration-300 h-full flex flex-col`}>
        {children}
      </div>
    </>
  );
}

