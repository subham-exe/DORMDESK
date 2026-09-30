export interface QueuedMutation {
  idempotencyKey: string;
  userId: string;
  type: 'CREATE_REQUEST' | 'TRANSITION_REQUEST';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  status: 'PENDING_SYNC' | 'SYNC_ERROR' | 'AUTH_REQUIRED' | 'FAILED_PERMANENTLY';
  error?: string;
  timestamp: number;
}

export interface CachedRequest {
  id: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
}

export interface CachedNotification {
  id: string;
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
}

const DB_NAME = "DormDeskOfflineDB";
const DB_VERSION = 2; // Incremented for new schema

export const openOfflineDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("IndexedDB not available in SSR"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Delete old v1 store if it exists
      if (db.objectStoreNames.contains("requests")) {
        db.deleteObjectStore("requests");
      }
      
      if (!db.objectStoreNames.contains("mutations")) {
        const store = db.createObjectStore("mutations", { keyPath: "idempotencyKey" });
        store.createIndex("userId", "userId", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("cached_requests")) {
        const store = db.createObjectStore("cached_requests", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }

      if (!db.objectStoreNames.contains("cached_notifications")) {
        const store = db.createObjectStore("cached_notifications", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
    };
    
    request.onsuccess = (event: Event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event: Event) => reject((event.target as IDBRequest).error);
  });
};

export const clearOfflineDB = async () => {
  const db = await openOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["mutations", "cached_requests", "cached_notifications"], "readwrite");
    tx.objectStore("mutations").clear();
    tx.objectStore("cached_requests").clear();
    tx.objectStore("cached_notifications").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveOfflineMutation = async (mutation: QueuedMutation) => {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations", "readwrite");
    const store = tx.objectStore("mutations");
    const req = store.put(mutation); // use put to update if exists
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const getOfflineMutations = async (userId: string) => {
  const db = await openOfflineDB();
  return new Promise<QueuedMutation[]>((resolve, reject) => {
    const tx = db.transaction("mutations", "readonly");
    const store = tx.objectStore("mutations");
    const index = store.index("userId");
    const req = index.getAll(userId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const deleteOfflineMutation = async (idempotencyKey: string) => {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("mutations", "readwrite");
    const store = tx.objectStore("mutations");
    const req = store.delete(idempotencyKey);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
};

export const cacheRequests = async (userId: string, // eslint-disable-next-line @typescript-eslint/no-explicit-any
requests: any[]) => {
  const db = await openOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("cached_requests", "readwrite");
    const store = tx.objectStore("cached_requests");
    const timestamp = Date.now();
    requests.forEach(req => {
      store.put({ id: req.id, userId, data: req, timestamp });
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedRequests = async (userId: string) => {
  const db = await openOfflineDB();
  return new Promise<unknown[]>((resolve, reject) => {
    const tx = db.transaction("cached_requests", "readonly");
    const store = tx.objectStore("cached_requests");
    const index = store.index("userId");
    const req = index.getAll(userId);
    req.onsuccess = () => {
      const results = req.result.map((r: { data: unknown }) => r.data);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
};

export const cacheNotifications = async (userId: string, // eslint-disable-next-line @typescript-eslint/no-explicit-any
notifications: any[]) => {
  const db = await openOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("cached_notifications", "readwrite");
    const store = tx.objectStore("cached_notifications");
    const timestamp = Date.now();
    notifications.forEach(notif => {
      store.put({ id: notif.id, userId, data: notif, timestamp });
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedNotifications = async (userId: string) => {
  const db = await openOfflineDB();
  return new Promise<unknown[]>((resolve, reject) => {
    const tx = db.transaction("cached_notifications", "readonly");
    const store = tx.objectStore("cached_notifications");
    const index = store.index("userId");
    const req = index.getAll(userId);
    req.onsuccess = () => {
      const results = req.result.map((r: { data: unknown }) => r.data);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
};


