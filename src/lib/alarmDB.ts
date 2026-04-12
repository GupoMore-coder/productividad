// ============================================================
// alarmDB.ts — Shared IndexedDB helpers for scheduled alarms.
// Used by both the main app and the Service Worker (sw.ts).
// ============================================================

export interface Alarm {
  id: string;           // `${taskId}-${hoursOffset}h`
  taskId: string;
  taskTitle: string;
  priority: 'alta' | 'media' | 'baja';
  fireAt: number;       // epoch ms — when to fire this notification
  body: string;         // notification body text
  fired: boolean;
  isMuted?: boolean;
}

const DB_NAME = 'familia-agenda-db';
const STORE_NAME = 'alarms';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAlarm(alarm: Alarm): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(alarm);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAlarms(): Promise<Alarm[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAlarmsByTaskId(taskId: string): Promise<void> {
  const alarms = await getAlarms();
  const toDelete = alarms.filter((a) => a.taskId === taskId);
  if (toDelete.length === 0) return;

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    toDelete.forEach((a) => store.delete(a.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function markAlarmFired(alarmId: string): Promise<void> {
  const alarms = await getAlarms();
  const alarm = alarms.find((a) => a.id === alarmId);
  if (!alarm) return;

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...alarm, fired: true });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Remove alarms that are already fired or more than 24h old */
export async function cleanFiredAlarms(): Promise<void> {
  const alarms = await getAlarms();
  const cutoff = Date.now() - 86_400_000; // 24h ago
  const toDelete = alarms.filter((a) => a.fired || a.fireAt < cutoff);
  if (toDelete.length === 0) return;

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    toDelete.forEach((a) => store.delete(a.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
