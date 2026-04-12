// ============================================================
// sw.ts — Custom Service Worker for Productividad GrupoMore PWA.
// Built by vite-plugin-pwa (injectManifest strategy).
// Handles: precaching, background sync, alarm checks, notification clicks.
// ============================================================
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Take control immediately on update
self.skipWaiting();
clientsClaim();

// Precache all assets from the Vite build
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Background Sync ──────────────────────────────────────────
// Retries failed Supabase requests (POST/PATCH/DELETE) when connection returns
// This ensures that updates made while offline are eventually synced to the server.

const bgSyncPlugin = new BackgroundSyncPlugin('supabase-queue', {
  maxRetentionTime: 24 * 60, // Retry for max 24 hours
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PATCH'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'DELETE'
);

// ── Inline IndexedDB helpers ─────────────────────────────────
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

let isCheckingAlarms = false;

async function checkAndFireAlarms(): Promise<void> {
  if (isCheckingAlarms) return;
  isCheckingAlarms = true;
  
  try {
    const db = await openAlarmDB();
    const alarms = await getAllAlarms(db);
    const now = Date.now();
    const dueAlarms = alarms.filter((a: any) => !a.fired && a.fireAt <= now);

    if (dueAlarms.length > 0) {
      const clients = await (self as any).clients.matchAll();

      for (const alarm of dueAlarms) {
        // Respect mute if stored in the alarm data or fetched
        const isMuted = !!alarm.isMuted;
        
        await (self as any).registration.showNotification(alarm.taskTitle, {
          body: alarm.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: isMuted ? [] : [100, 50, 100],
          data: { taskId: alarm.taskId },
          silent: isMuted,
          requireInteraction: true,
          tag: alarm.id
        });

        // Mark as fired in the DB
        await markFiredInDB(db, alarm);
      }
      
      // Notify clients to refresh UI
      clients.forEach((client: any) => {
        client.postMessage({ type: 'ALARMS_UPDATED' });
      });
    }
  } catch (err) {
    console.error('[SW] checkAndFireAlarms error:', err);
  } finally {
    isCheckingAlarms = false;
  }
}

// ── Service Worker event listeners ───────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(checkAndFireAlarms());
});

self.addEventListener('message', (event) => {
  if ((event as MessageEvent).data?.type === 'CHECK_ALARMS') {
    checkAndFireAlarms();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url: string = (event.notification.data?.url as string) ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return (client as WindowClient).focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});

// ── Generic Push API Listener ────────────────────────────────
// Handles incoming push messages even when the app is closed.
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const isMuted = !!data.silent || !!data.isMuted;

    const options = {
      body: data.body || 'Nuevo aviso de Antigravity',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: isMuted ? [] : [100, 50, 100],
      silent: isMuted,
      data: { url: data.url || '/' },
      actions: isMuted ? [] : [
        { action: 'open', title: 'Ver ahora' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Productividad Grupo More', options)
    );
  } catch (err) {
    console.error('[SW] Push error:', err);
    // Fallback if not JSON
    event.waitUntil(
      self.registration.showNotification('Antigravity', {
        body: event.data.text(),
        icon: '/pwa-192x192.png'
      })
    );
  }
});
