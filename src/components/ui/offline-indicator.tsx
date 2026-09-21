import React from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator({ isOffline = false }: { isOffline?: boolean }) {
  if (!isOffline) return null;
  
  return (
    <div className="fixed top-0 left-0 w-full bg-offline text-text-inverse py-2 px-4 flex items-center justify-center gap-2 z-50 text-sm font-medium animate-in slide-in-from-top">
      <WifiOff className="h-4 w-4" />
      <span>You are offline. Requests will be queued locally.</span>
    </div>
  );
}
