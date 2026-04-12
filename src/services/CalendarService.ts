// ============================================================
// CalendarService.ts — Exports tasks to external calendars.
// No OAuth / API keys required — uses deep-link URLs and .ics.
// ============================================================

import type { Task } from '../context/TaskContext';

/** Format a Date to ICS/Google Calendar UTC string: YYYYMMDDTHHMMSSZ */
function toCalendarDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Parse task date+time into a Date object (local timezone) */
function taskToDate(task: Task): Date {
  // task.time is 'HH:mm', task.date is 'yyyy-MM-dd'
  return new Date(`${task.date}T${task.time}:00`);
}

// ── Google Calendar ──────────────────────────────────────────

/**
 * Generate a Google Calendar "Add Event" deep-link URL.
 * Defaults to a 1-hour event duration.
 */
export function getGoogleCalendarUrl(task: Task, durationMinutes = 60): string {
  const start = taskToDate(task);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const priorityLabel =
    task.priority === 'alta' ? '🔴 Alta' :
    task.priority === 'media' ? '🟡 Media' : '🟢 Baja';

  const details = [
    task.description ?? '',
    `Prioridad: ${priorityLabel}`,
    task.isShared ? `Asignada por: @${task.createdBy ?? 'equipo'}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title,
    details,
    dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Apple Calendar / Outlook (.ics) ─────────────────────────

/**
 * Build an RFC 5545 iCal string for a single task event.
 */
export function buildICSContent(task: Task, durationMinutes = 60): string {
  const start = taskToDate(task);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const now = new Date();

  const priorityLabel =
    task.priority === 'alta' ? 'Alta' :
    task.priority === 'media' ? 'Media' : 'Baja';

  const uid = `${task.id}-${now.getTime()}@familia-agenda`;
  const description = [
    task.description ?? '',
    `Prioridad: ${priorityLabel}`,
    task.isShared ? `Asignada por: @${task.createdBy ?? 'equipo'}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  // Escape commas and semicolons per RFC 5545
  const escape = (s: string) => s.replace(/,/g, '\\,').replace(/;/g, '\\;');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FamiliaAgenda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toCalendarDate(now)}`,
    `DTSTART:${toCalendarDate(start)}`,
    `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${escape(task.title)}`,
    `DESCRIPTION:${escape(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Recordatorio: ${escape(task.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Trigger a browser download of a .ics file for the given task.
 */
export function downloadICSFile(task: Task): void {
  const ics = buildICSContent(task);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${task.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Outlook Web ──────────────────────────────────────────────

export function getOutlookWebUrl(task: Task, durationMinutes = 60): string {
  const start = taskToDate(task);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: task.title,
    body: task.description ?? '',
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}
