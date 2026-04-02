import { useState } from 'react';
import CalendarExportMenu from './CalendarExportMenu';

export interface Task {
  id: string;
  title: string;
  description?: string;
  time: string;
  date: string; // ISO date yyyy-MM-dd
  priority: 'alta' | 'media' | 'baja';
  completed?: boolean;

  // Collaborative fields
  isShared?: boolean;
  groupId?: string;
  userId?: string;
  createdBy?: string;
  status?: 'pending_acceptance' | 'accepted' | 'completed' | 'expired' | 'cancelled_with_reason' | 'declined';
  failureReason?: string;
}

interface TaskCardProps {
  task: Task;
  onToggleComplete?: (id: string, val: boolean) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  isReadOnly?: boolean;
}

// Calendar icon
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Bell icon
const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function TaskCard({
  task,
  onToggleComplete,
  onAccept,
  onDecline,
  isReadOnly,
}: TaskCardProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'alta':  return 'var(--danger-color)';
      case 'media': return 'var(--warning-color)';
      case 'baja':  return 'var(--success-color)';
      default:      return 'var(--text-secondary)';
    }
  };

  const isCompleted = task.completed || task.status === 'completed';
  const isPending   = task.status === 'pending_acceptance';
  const isAccepted  = task.status === 'accepted' || (!task.status && !isPending);

  // Whether the "Schedule" action row should be shown
  const showActions = !isPending && !isReadOnly && isAccepted && !isCompleted;

  return (
    <>
      <div
        className="glass-panel animate-fade-in"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '12px',
          opacity: isCompleted && !isPending ? 0.6 : 1,
          transition: 'var(--transition-fast)',
          border: isPending
            ? '1px solid var(--warning-color)'
            : '1px solid var(--glass-border)',
        }}
      >
        {/* Priority side-bar */}
        <div
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: '4px',
            backgroundColor: getPriorityColor(),
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {/* Checkbox */}
          {!isPending && !isReadOnly && (
            <div style={{ marginRight: '16px', paddingTop: '4px' }}>
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToggleComplete?.(task.id, e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
            </div>
          )}

          <div style={{ flex: 1 }}>
            {/* Title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{
                margin: 0,
                fontSize: '1rem',
                textDecoration: isCompleted && !isPending ? 'line-through' : 'none',
                color: isCompleted && !isPending ? 'var(--text-secondary)' : 'var(--text-primary)',
              }}>
                {task.title}
              </h4>

              {/* Shared task icon */}
              {task.isShared && (
                <span title="Tarea de Equipo" style={{ color: 'var(--accent-color)', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
              )}
            </div>

            {task.description && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {task.description}
              </p>
            )}

            {/* Creator label */}
            {task.isShared && task.createdBy && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '4px', fontStyle: 'italic' }}>
                Asignada por: @{task.createdBy}
              </div>
            )}

            {/* Meta row: time + priority */}
            <div style={{
              display: 'flex', alignItems: 'center',
              marginTop: '12px', gap: '8px',
              fontSize: '0.8rem', color: 'var(--text-secondary)',
            }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '4px 8px', borderRadius: '4px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {task.time}
              </span>
              <span style={{ textTransform: 'capitalize', color: getPriorityColor(), fontWeight: 600 }}>
                {task.priority}
              </span>
              {isReadOnly && isCompleted && (
                <span style={{ color: 'var(--success-color)', marginLeft: 'auto', fontWeight: 600 }}>
                  Completada
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Action buttons: Schedule + Calendar ── */}
        {showActions && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            {/* Notification badge — shows active scheduling */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              flex: 1,
            }}>
              <BellIcon />
              <span style={{ color: getPriorityColor(), fontWeight: 600 }}>
                {task.priority === 'alta' ? '6' : task.priority === 'media' ? '3' : '2'} recordatorios
              </span>
              &nbsp;programados
            </div>

            {/* Add to calendar button */}
            <button
              id={`calendar-btn-${task.id}`}
              onClick={() => setShowCalendar(true)}
              title="Agregar al calendario"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(88, 166, 255, 0.1)',
                border: '1px solid rgba(88, 166, 255, 0.25)',
                color: 'var(--accent-color)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(88, 166, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(88,166,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(88, 166, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <CalendarIcon />
              Agendar
            </button>
          </div>
        )}

        {/* ── Invitation buttons (if pending_acceptance) ── */}
        {isPending && !isReadOnly && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
            <button
              onClick={() => onAccept?.(task.id)}
              style={{ flex: 1, backgroundColor: 'var(--success-color)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Aceptar
            </button>
            <button
              onClick={() => onDecline?.(task.id)}
              style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Rechazar
            </button>
          </div>
        )}
      </div>

      {/* Calendar export bottom sheet */}
      {showCalendar && (
        <CalendarExportMenu task={task} onClose={() => setShowCalendar(false)} />
      )}
    </>
  );
}
