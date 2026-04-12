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
import type { MissingItem } from '../context/InventoryContext';
import { triggerHaptic } from '../utils/haptics';

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
  
  // v2.2: Specific offsets for Reminders (24h, 12h, 2h)
  const isReminder = task.type === 'reminder';
  const offsets = isReminder ? [24, 12, 2] : OFFSETS_BY_PRIORITY[task.priority];
  
  const now = Date.now();

  for (const hours of offsets) {
    const fireAt = taskDateTime - hours * 3_600_000;
    if (fireAt <= now) continue; // Skip past reminders

    // Check if THIS specific offset is muted, or the whole task is muted
    const isSpecificMuted = (task.muted_alarms || []).includes(offsets.indexOf(hours));
    const isMuted = task.is_muted || isSpecificMuted;

    await saveAlarm({
      id: `${task.id}-${hours}h`,
      taskId: task.id,
      taskTitle: task.title,
      priority: task.priority,
      fireAt,
      body: `⏰ Faltan ${formatOffset(hours)} para: "${task.title}"`,
      fired: false,
      isMuted,
    });
  }
}

/** Remove all scheduled alarms for a task (e.g. when completed or deleted) */
export async function cancelTaskNotifications(taskId: string): Promise<void> {
  await deleteAlarmsByTaskId(taskId);
}

/**
 * Schedules mandatory birthday notifications for all users.
 * - Day before at 08:00
 * - Birthday day at 08:00
 */
export async function scheduleBirthdayNotifications(profiles: any[], currentUserId?: string) {
  if (!hasNotificationPermission()) return;

  const now = Date.now();

  for (const p of profiles) {
    if (p.id === currentUserId || !p.birth_date) continue;

    const bday = new Date(p.birth_date);
    const currentYear = new Date().getFullYear();
    
    // Check current year and next year to ensure there's always a future alarm
    const yearsToCheck = [currentYear, currentYear + 1];

    for (const year of yearsToCheck) {
      // Create date objects in local time
      const bdayThisYear = new Date(year, bday.getUTCMonth(), bday.getUTCDate(), 8, 0, 0);
      const dayBefore = new Date(year, bday.getUTCMonth(), bday.getUTCDate() - 1, 8, 0, 0);

      const milestones = [
        { date: dayBefore, label: 'Mañana es el cumpleaños de' },
        { date: bdayThisYear, label: '¡Hoy es el cumpleaños de!' }
      ];

      for (const m of milestones) {
        const fireAt = m.date.getTime();
        if (fireAt <= now) continue;

        const alarmId = `bday_${p.id}_${year}_${m.date.getDate()}`;
        
        await saveAlarm({
          id: alarmId,
          taskId: `bday_${p.id}`,
          taskTitle: `🎂 ${p.full_name || p.username}`,
          priority: 'alta', // Ensures critical alert sound
          fireAt,
          body: `${m.label} ${p.full_name || p.username}. ¡No olvides felicitarle! ✨`,
          fired: false,
        });
      }
    }
  }
}

// ── Alarm Checker (runs in main thread) ──────────────────────

// ── Critical Alerts (Audio / Visual / Haptic) ───────────────

/**
 * High-intensity alert for critical events (Master Admin alerts)
 */
export async function triggerCriticalAlert(title: string, body: string, isMuted = false) {
  // 1. Haptic (Vibration) - ONLY if not muted
  if (!isMuted) {
    triggerHaptic('critical');
  }

  // 2. Audio (requires user interaction first to play) - ONLY if not muted
  if (!isMuted) {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // If blocked, we can't reliably play here, but UnifiedAlarmModal handles resume on click
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
      
      const secondaryOsc = audioCtx.createOscillator();
      secondaryOsc.connect(gainNode);
      secondaryOsc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.2); 
      secondaryOsc.start(audioCtx.currentTime + 0.2);
      secondaryOsc.stop(audioCtx.currentTime + 0.6);

    } catch (e) {
      console.warn('[Notifications] Audio alert failed:', e);
    }
  }

  // 3. Visual (System Notification) - Always fires
  // NOTE: Per user request, system push notifications are NOT silenced by the app's "Mute" toggle.
  // This allows system defaults/user OS settings to prevail.
  if (hasNotificationPermission()) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [300, 100, 300, 100, 500],
        requireInteraction: true,
      } as NotificationOptions);
    } else {
      new Notification(title, { body, requireInteraction: true } as any);
    }
  }
}

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
      // Use local isMuted flag from the alarm (Auditoría: Eliminada N+1 query a Supabase)
      const isMuted = !!alarm.isMuted;

      if (alarm.priority === 'alta' || alarm.priority === 'media') {
        await triggerCriticalAlert(`${emoji} ${alarm.taskTitle}`, alarm.body, isMuted);
        window.dispatchEvent(new CustomEvent('app:show-unified-alarm', {
          detail: { id: alarm.id, type: 'critical', title: `${emoji} ${alarm.taskTitle}`, body: alarm.body, isMuted }
        }));
      } else {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(`${emoji} ${alarm.taskTitle}`, {
            body: alarm.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: alarm.id,
            requireInteraction: true,
            data: { taskId: alarm.taskId },
            vibrate: [100, 50, 100]
          } as NotificationOptions);
        } else {
          new Notification(`${emoji} ${alarm.taskTitle}`, {
            body: alarm.body,
            icon: '/pwa-192x192.png',
            tag: alarm.id,
            requireInteraction: true,
          } as any);
        }
        
        window.dispatchEvent(new CustomEvent('app:show-unified-alarm', {
          detail: { 
            id: alarm.id, 
            type: alarm.taskId.startsWith('order') ? 'order' : 'task', 
            title: `${emoji} ${alarm.taskTitle}`, 
            body: alarm.body,
            isMuted
          }
        }));
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
  _alarmCheckInterval = setInterval(checkAndFireDueAlarms, 30_000); // 30 s (High Precision)

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

// ── Inventory Reminders ──────────────────────────────────────

/**
 * Checks for missing items that need reminder today based on priority.
 * Baja: Mon (1)
 * Media: Mon (1), Thu (4)
 * Alta: Mon (1), Wed (3), Fri (5), Sun (0)
 */
export async function checkInventoryReminders(items: MissingItem[], userRole: string) {
  if (Notification.permission !== 'granted') return;
  
  // Restricted roles
  const authorized = ['Administrador maestro', 'Director General (CEO)', 'Gestor Administrativo'];
  if (!authorized.includes(userRole)) return;

  const now = new Date();
  const day = now.getDay(); // 0(Sun) - 6(Sat)
  
  const activeItems = items.filter(i => i.lifecycle_status === 'approved');
  if (activeItems.length === 0) return;

  const needsReminder = activeItems.filter(item => {
    if (item.priority === 'baja') return day === 1;
    if (item.priority === 'media') return day === 1 || day === 4;
    if (item.priority === 'alta') return [1, 3, 5, 0].includes(day);
    return false;
  });

  if (needsReminder.length > 0) {
    const title = `📦 Recordatorio de Faltantes (${needsReminder.length})`;
    const body = needsReminder.slice(0, 3).map(i => `• ${i.product_name}`).join('\n') + (needsReminder.length > 3 ? `\n... y ${needsReminder.length - 3} más` : '');
    
    await triggerCriticalAlert(title, body);
  }
}

/**
 * Notifies Supervisor of a new consultant request
 */
export async function notifySupervisorOfNewRequest(itemName: string) {
  if (Notification.permission !== 'granted') return;
  await triggerCriticalAlert('🚨 Nueva Solicitud de Faltante', `Consultora ha solicitado: "${itemName}". Requiere aprobación.`);
}

