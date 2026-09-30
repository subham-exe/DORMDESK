import { getOfflineMutations, deleteOfflineMutation, saveOfflineMutation } from './offline-store';

let isSyncing = false;

export const syncOfflineMutations = async (userId: string, onStatusUpdate?: (status: string) => void) => {
  if (isSyncing) return;
  if (!navigator.onLine) return;
  
  try {
    isSyncing = true;
    const mutations = await getOfflineMutations(userId);
    
    // Filter pending and transient errors
    const pending = mutations.filter(m => m.status === "PENDING_SYNC" || m.status === "SYNC_ERROR");
    
    if (pending.length === 0) {
      isSyncing = false;
      return;
    }

    if (onStatusUpdate) onStatusUpdate('SYNCING');

    for (const mutation of pending) {
      try {
        let endpoint = '';
        let method = 'POST';

        if (mutation.type === 'CREATE_REQUEST') {
          endpoint = '/api/requests';
        } else if (mutation.type === 'TRANSITION_REQUEST') {
          endpoint = `/api/requests/${mutation.payload.requestId}/status`; // example
          method = 'PUT';
        } else {
          continue; // unknown type
        }

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.payload)
        });

        if (response.ok) {
          // Success
          await deleteOfflineMutation(mutation.idempotencyKey);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
          
          if (response.status === 401 || response.status === 403) {
            mutation.status = "AUTH_REQUIRED";
            mutation.error = "Authentication required";
            await saveOfflineMutation(mutation);
          } else if (response.status >= 400 && response.status < 500) {
            // Permanent validation/business rule failure or uniqueness conflict!
            // Wait, what if it's a 409 because of idempotency? The server should actually return 200/201 and resolve the original request if idempotency key matches.
            // If the server returns a 4xx, it's a real failure.
            mutation.status = "FAILED_PERMANENTLY";
            mutation.error = errorData.error;
            await saveOfflineMutation(mutation);
          } else {
            mutation.status = "SYNC_ERROR";
            await saveOfflineMutation(mutation);
          }
        }
      } catch {
        // Network drop during sync
        mutation.status = "SYNC_ERROR";
        await saveOfflineMutation(mutation);
      }
    }
    
    if (onStatusUpdate) {
      const remaining = await getOfflineMutations(userId);
      const hasAuthError = remaining.some(m => m.status === "AUTH_REQUIRED");
      const hasErrors = remaining.some(m => m.status === "FAILED_PERMANENTLY" || m.status === "SYNC_ERROR");
      
      if (remaining.length === 0) {
        onStatusUpdate('ONLINE');
      } else if (hasAuthError) {
        onStatusUpdate('AUTH_REQUIRED');
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
