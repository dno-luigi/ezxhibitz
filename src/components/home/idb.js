// Tiny IndexedDB store for the files of the current draft (kept on this device only).
const DB = "epb-files";
const STORE = "files";

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no-idb"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export const put = (key, value) => tx("readwrite", (s) => s.put(value, key));
export const get = (key) => tx("readonly", (s) => s.get(key));
export const del = (key) => tx("readwrite", (s) => s.delete(key));
export const keys = () => tx("readonly", (s) => s.getAllKeys());
export const clear = () => tx("readwrite", (s) => s.clear());
