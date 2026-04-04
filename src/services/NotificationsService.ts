// ============================================================
// NotificationsService.ts — Manages push-notification scheduling.
//
// Priority intervals (hours before task deadline):
//   Alta  → 72, 48, 24, 12, 6, 3
//   Media → 48, 24, 12
//   Baja  → 12, 6
// ============================================================

import {
  saveAlarm,
  getAlarms,
  deleteAlarmsByTaskId,
  markAlarmFired,
  cleanFiredAlarms,
} from '../lib/alarmDB';
import type { Task } from '../components/TaskCard';

// ── Config ───────────────────────────────────────────────────

const OFFSETS_BY_PRIORITY: Record<Task['priority'], number[]> = {
  alta:  [72, 48, 24, 12, 6, 3],
  media: [48, 24, 12],
  baja:  [12, 6],
};

function formatOffset(hours: number): string {
  if (hours >= 24) {
    const d = hours / 24;
    return `${d} día${d > 1 ? 's' : ''}`;
  }
  return `${hours} hora${hours > 1 ? 's' : ''}`;
}

// ── Permission ───────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function hasNotificationPermission(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

export function getNotificationPermissionStatus(): 'default' | 'granted' | 'denied' | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission as 'default' | 'granted' | 'denied';
}

// ── Schedule / Cancel ────────────────────────────────────────

/**
 * Persists alarm entries in IndexedDB for all future reminder slots
 * defined by the task's priority level.
 */
export async function scheduleTaskNotifications(task: Task): Promise<void> {
  if (!hasNotificationPermission()) return;

  // Remove stale alarms for this task before re-scheduling
  await deleteAlarmsByTaskId(task.id);

  const taskDateTime = new Date(`${task.date}T${task.time}:00`).getTime();
  const offsets = OFFSETS_BY_PRIORITY[task.priority];
  const now = Date.now();

  for (const hours of offsets) {
    const fireAt = taskDateTime - hours * 3_600_000;
    if (fireAt <= now) continue; // Skip past reminders

    await saveAlarm({
      id: `${task.id}-${hours}h`,
      taskId: task.id,
      taskTitle: task.title,
      priority: task.priority,
      fireAt,
      body: `⏰ Faltan ${formatOffset(hours)} para: "${task.title}"`,
      fired: false,
    });
  }
}

/** Remove all scheduled alarms for a task (e.g. when completed or deleted) */
export async function cancelTaskNotifications(taskId: string): Promise<void> {
  await deleteAlarmsByTaskId(taskId);
}

// ── Alarm Checker (runs in main thread) ──────────────────────

/**
 * Checks IndexedDB for due alarms and fires notifications.
 * Called periodically via setInterval AND by the SW via message.
 */
export async function checkAndFireDueAlarms(): Promise<void> {
  if (!hasNotificationPermission()) return;

  const alarms = await getAlarms();
  const now = Date.now();

  for (const alarm of alarms) {
    if (alarm.fired || alarm.fireAt > now) continue;

    const emoji =
      alarm.priority === 'alta' ? '🔴' :
      alarm.priority === 'media' ? '🟡' : '🟢';

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use SW's showNotification for better OS-level persistence
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(`${emoji} ${alarm.taskTitle}`, {
          body: alarm.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: alarm.id,
          requireInteraction: true,
          data: { taskId: alarm.taskId },
        } as NotificationOptions);
      } else {
        // Fallback — window Notification API
        new Notification(`${emoji} ${alarm.taskTitle}`, {
          body: alarm.body,
          icon: '/pwa-192x192.png',
          tag: alarm.id,
          requireInteraction: true,
        });
      }

      await markAlarmFired(alarm.id);
    } catch (err) {
      console.error('[Notifications] Error firing alarm:', alarm.id, err);
    }
  }

  await cleanFiredAlarms();

  // Ping the Service Worker so it can also check (covers background cases)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CHECK_ALARMS' });
  }
}

// ── Init ─────────────────────────────────────────────────────

let _alarmCheckInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the periodic alarm checker. Call on app mount.
 * Returns a cleanup function to call on unmount.
 * Check interval: every 90 seconds when app is open.
 */
export function initAlarmChecker(): () => void {
  // Immediate check on startup
  checkAndFireDueAlarms();

  if (_alarmCheckInterval) clearInterval(_alarmCheckInterval);
  _alarmCheckInterval = setInterval(checkAndFireDueAlarms, 90_000); // 90 s

  return () => {
    if (_alarmCheckInterval) {
      clearInterval(_alarmCheckInterval);
      _alarmCheckInterval = null;
    }
  };
}

// ── (Legacy shim — kept for backwards compat) ────────────────
export const scheduleLocalNotification = (
  title: string,
  options?: NotificationOptions
) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      requireInteraction: true,
      ...options,
    });
  }
};

// ── Service Orders Notifications ─────────────────────────────
import { ServiceOrder } from '../context/OrderContext';
import { differenceInHours, subHours } from 'date-fns';

/**
 * Schedules -24h and -12h alarms for a given ServiceOrder based on its deliveryDate.
 */
export async function scheduleOrderNotifications(order: ServiceOrder) {
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const delivery = new Date(order.deliveryDate);

  // No asustar al usuario si está inactiva
  if (order.status === 'completada' || order.status === 'cancelada') return;

  if (delivery < now) return; // Ya se entregó o la hora ya pasó

  const hoursDiff = differenceInHours(delivery, now);

  const prefix = `order_${order.id}`;

  try {
    // 24 hours before
    if (hoursDiff > 24) {
      const time24 = subHours(delivery, 24).getTime();
      await saveAlarm({
        id: `${prefix}_24h`,
        taskId: prefix,
        taskTitle: `⏳ Entrega en 24h: ${order.id}`,
        priority: 'alta',
        body: `Cliente: ${order.customerName}\nServicios: ${order.services.join(', ')}`,
        fireAt: time24,
        fired: false,
      });
    }

    // 12 hours before
    if (hoursDiff > 12) {
      const time12 = subHours(delivery, 12).getTime();
      await saveAlarm({
        id: `${prefix}_12h`,
        taskId: prefix,
        taskTitle: `🚨 Entrega hoy en 12h: ${order.id}`,
        priority: 'alta',
        body: `Cliente: ${order.customerName}\nResponsable: ${order.responsible}`,
        fireAt: time12,
        fired: false,
      });
    }
  } catch (err) {
    console.error('Failed to schedule order notifications', err);
  }
}

/**
 * Borra las alarmas vigentes de una orden una vez que se completa o cancela
 */
export async function cancelOrderNotifications(orderId: string) {
  try {
    await deleteAlarmsByTaskId(`order_${orderId}`);
  } catch (err) {
    console.error('Failed to cancel order notifications', err);
  }
}
