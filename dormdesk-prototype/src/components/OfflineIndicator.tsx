import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsSyncing(true);
      setTimeout(() => {
        setIsOffline(false);
        setIsSyncing(false);
      }, 1500); // Simulate sync delay
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !isSyncing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none animate-in slide-in-from-top-2">
      <div className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono-code font-bold shadow-md border ${
        isSyncing 
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-slate-800 text-white border-slate-700'
      }`}>
        {isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing Queue...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode: Changes Queued Locally</span>
          </>
        )}
      </div>
    </div>
  );
};
