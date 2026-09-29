import { getOfflineRequests, deleteOfflineRequest, updateOfflineRequest } from './offline-store';

let isSyncing = false;

export const syncOfflineRequests = async (onStatusUpdate?: (status: string) => void) => {
  if (isSyncing) return;
  if (!navigator.onLine) return;
  
  try {
    isSyncing = true;
    const requests = await getOfflineRequests();
    
    // Filter only those pending or network error, ignore permanent failures
    const pendingRequests = requests.filter(r => r._status === "PENDING_SYNC" || r._status === "SYNC_ERROR");
    
    if (pendingRequests.length === 0) {
      isSyncing = false;
      return;
    }

    if (onStatusUpdate) onStatusUpdate('SYNCING');

    for (const req of pendingRequests) {
      try {
        const { localId, _status, _timestamp, ...payload } = req;
        
        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // Sync successful
          await deleteOfflineRequest(localId);
        } else {
          const errorData = await response.json();
          // If 401 Unauthorized, maybe session expired
          if (response.status === 401 || response.status === 403) {
            await updateOfflineRequest(localId, { _status: "AUTH_REQUIRED" });
          } else if (response.status >= 400 && response.status < 500) {
            // Permanent failure (e.g., bad payload)
            await updateOfflineRequest(localId, { _status: "FAILED_PERMANENTLY", _error: errorData.error });
          } else {
            // Transient server error, keep it in queue
            await updateOfflineRequest(localId, { _status: "SYNC_ERROR" });
          }
        }
      } catch (err) {
        // Network error during sync
        await updateOfflineRequest(req.localId, { _status: "SYNC_ERROR" });
      }
    }
    
    if (onStatusUpdate) {
      const remaining = await getOfflineRequests();
      const hasErrors = remaining.some(r => r._status === "FAILED_PERMANENTLY" || r._status === "AUTH_REQUIRED" || r._status === "SYNC_ERROR");
      if (remaining.length === 0) {
        onStatusUpdate('ONLINE');
      } else if (hasErrors) {
        onStatusUpdate('SYNC_ERROR');
      } else {
        onStatusUpdate('PENDING_SYNC');
      }
    }

  } finally {
    isSyncing = false;
  }
};
