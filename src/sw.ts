// ============================================================
// sw.ts — Custom Service Worker for FamiliaAgenda PWA.
// Built by vite-plugin-pwa (injectManifest strategy).
// Handles: precaching, background alarm checks, notification clicks.
// ============================================================
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Take control immediately on update
self.skipWaiting();
clientsClaim();

// Precache all assets from the Vite build
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Inline IndexedDB helpers ─────────────────────────────────
// (Cannot tree-shake / import modules inside a SW in all browsers,
//  so we replicate the minimal DB logic inline.)

interface Alarm {
  id: string;
  taskId: string;
  taskTitle: string;
  priority: 'alta' | 'media' | 'baja';
  fireAt: number;
  body: string;
  fired: boolean;
}

const DB_NAME = 'familia-agenda-db';
const STORE_NAME = 'alarms';

function openAlarmDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = self.indexedDB.open(DB_NAME, 1);
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

async function getAllAlarms(db: IDBDatabase): Promise<Alarm[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function markFiredInDB(db: IDBDatabase, alarm: Alarm): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...alarm, fired: true });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Core: check & fire due alarms ────────────────────────────

async function checkAndFireAlarms(): Promise<void> {
  try {
    const db = await openAlarmDB();
    const alarms = await getAllAlarms(db);
    const now = Date.now();

    for (const alarm of alarms) {
      if (alarm.fired || alarm.fireAt > now) continue;

      const emoji =
        alarm.priority === 'alta' ? '🔴' :
        alarm.priority === 'media' ? '🟡' : '🟢';

      await self.registration.showNotification(`${emoji} ${alarm.taskTitle}`, {
        body: alarm.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: alarm.id,
        requireInteraction: true,
        silent: false,
        data: { url: '/', taskId: alarm.taskId },
      } as NotificationOptions);

      await markFiredInDB(db, alarm);
    }
  } catch (err) {
    console.error('[SW] checkAndFireAlarms error:', err);
  }
}

// ── Service Worker event listeners ───────────────────────────

/** Check alarms every time the SW becomes active (browser-triggered) */
self.addEventListener('activate', (event) => {
  event.waitUntil(checkAndFireAlarms());
});

/** Main app can ping the SW to check alarms via postMessage */
self.addEventListener('message', (event) => {
  if ((event as MessageEvent).data?.type === 'CHECK_ALARMS') {
    checkAndFireAlarms();
  }
});

/** Opening the PWA when tapping a notification */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url: string = (event.notification.data?.url as string) ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an already-open window
        for (const client of clientList) {
          if ('focus' in client) return (client as WindowClient).focus();
        }
        // Open a new window
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});
