// ============================================================
// sw.ts — Custom Service Worker for Productividad GrupoMore PWA.
// Built by vite-plugin-pwa (injectManifest strategy).
// Handles: precaching, background sync, alarm checks, notification clicks.
//
// Las alarmas se verifican periódicamente incluso con la pantalla bloqueada
// o la aplicación en segundo plano.
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

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Background Sync ──────────────────────────────────────────
const bgSyncPlugin = new BackgroundSyncPlugin('supabase-queue', {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'PATCH'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/rest/v1/'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
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
  isMuted?: boolean;
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

async function markFiredInDBByAlarmId(alarmId: string): Promise<void> {
  try {
    const db = await openAlarmDB();
    const alarms = await getAllAlarms(db);
    const alarm = alarms.find(a => a.id === alarmId);
    if (alarm) await markFiredInDB(db, alarm);
  } catch (err) {
    console.error('[SW] markFiredInDBByAlarmId error:', err);
  }
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
    const dueAlarms = alarms.filter(a => !a.fired && a.fireAt <= now);

    if (dueAlarms.length > 0) {
      for (const alarm of dueAlarms) {
        const isMuted = !!alarm.isMuted;

        await self.registration.showNotification(alarm.taskTitle, {
          body: alarm.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: isMuted ? [] : [300, 100, 300],
          silent: isMuted,
          requireInteraction: true,
          tag: alarm.id,
          data: { taskId: alarm.taskId },
        });

        await markFiredInDB(db, alarm);
      }

      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'ALARMS_UPDATED' });
      });
    }
  } catch (err) {
    console.error('[SW] checkAndFireAlarms error:', err);
  } finally {
    isCheckingAlarms = false;
  }
}

// ── Periodic alarm checker (cada 15 segundos) ─────────────────
// Se ejecuta mientras el SW esté vivo: cubre background y screen locked.
// El navegador mantiene el SW activo mientras tenga timers pendientes
// y notificaciones visibles.
const ALARM_CHECK_INTERVAL = 15_000;

let alarmIntervalId: ReturnType<typeof setInterval> | null = null;

function startPeriodicAlarmCheck(): void {
  if (alarmIntervalId !== null) return;
  checkAndFireAlarms();
  alarmIntervalId = setInterval(checkAndFireAlarms, ALARM_CHECK_INTERVAL);
}

function stopPeriodicAlarmCheck(): void {
  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

// ── Service Worker event listeners ───────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await checkAndFireAlarms();
    startPeriodicAlarmCheck();
  })());
});

self.addEventListener('message', (event) => {
  const msg = (event as MessageEvent).data;
  if (msg?.type === 'CHECK_ALARMS') {
    checkAndFireAlarms();
    startPeriodicAlarmCheck();
  } else if (msg?.type === 'STOP_ALARM_CHECK') {
    stopPeriodicAlarmCheck();
  }
});

// Mantener el SW vivo cuando se recibe un sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-alarms') {
    event.waitUntil(checkAndFireAlarms());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const alarmId = event.notification.tag;
  if (alarmId) {
    markFiredInDBByAlarmId(alarmId);
  }

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
    event.waitUntil(
      self.registration.showNotification('Antigravity', {
        body: event.data.text(),
        icon: '/pwa-192x192.png'
      })
    );
  }
});
