export const openOfflineDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("IndexedDB not available in SSR"));
    }
    const request = indexedDB.open("DormDeskOfflineDB", 1);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("requests")) {
        db.createObjectStore("requests", { keyPath: "localId", autoIncrement: true });
      }
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveOfflineRequest = async (payload: any) => {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("requests", "readwrite");
    const store = tx.objectStore("requests");
    const record = { ...payload, _status: "PENDING_SYNC", _timestamp: Date.now() };
    const req = store.add(record);
    
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const getOfflineRequests = async () => {
  const db = await openOfflineDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction("requests", "readonly");
    const store = tx.objectStore("requests");
    const req = store.getAll();
    
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const getOfflineRequest = async (id: number) => {
  const db = await openOfflineDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction("requests", "readonly");
    const store = tx.objectStore("requests");
    const req = store.get(id);
    
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const deleteOfflineRequest = async (id: number) => {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("requests", "readwrite");
    const store = tx.objectStore("requests");
    const req = store.delete(id);
    
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
};
