"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window !== "undefined") {
      return !navigator.onLine;
    }
    return false;
  });
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered.", reg.scope))
        .catch((err) => console.error("Service Worker registration failed.", err));
    }

    // Network status detection
    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000); // Hide after 3s
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowBackOnline(false);
    };

    // Initial state is handled by lazy initializer

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 w-full bg-slate-700 text-white" aria-live="polite" role="status px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0">
          <WifiOff className="w-4 h-4 mr-2" />
          You&apos;re offline. Some features may be unavailable.
        </div>
      )}
      
      {/* Back Online Banner */}
      {showBackOnline && !isOffline && (
        <div className="fixed top-0 left-0 w-full bg-success text-white" aria-live="polite" role="status px-4 py-2 text-sm font-medium flex items-center justify-center z-[100] shadow-md transition-all duration-300 transform translate-y-0">
          You&apos;re back online
        </div>
      )}

      {/* Main Content */}
      <div className={`${isOffline || showBackOnline ? 'mt-9' : ''} transition-all duration-300 h-full flex flex-col`}>
        {children}
      </div>
    </>
  );
}

