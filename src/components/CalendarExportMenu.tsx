import { useState, useEffect } from 'react';
import type { Task } from './TaskCard';
import {
  getGoogleCalendarUrl,
  getOutlookWebUrl,
  downloadICSFile,
} from '../services/CalendarService';

// ── Icons ────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
    <path
      d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
      fill="#FFC107"
    />
    <path
      d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.7 0-14.4 4.4-17.7 10.7l-.1 2z"
      fill="#FF3D00"
    />
    <path
      d="M24 46c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.7 37 27 38 24 38c-6.1 0-10.7-3.1-11.8-7.5l-7 5.4C8.3 42 15.6 46 24 46z"
      fill="#4CAF50"
    />
    <path
      d="M44.5 20H24v8.5h11.8c-.7 3.8-4.6 9.5-11.8 9.5l6.6 5.6C36.8 40.5 46 33 46 24c0-1.3-.2-2.7-.5-4z"
      fill="#1976D2"
    />
  </svg>
);

const OutlookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
    <rect x="2" y="10" width="28" height="28" rx="3" fill="#0078D4" />
    <rect x="18" y="6" width="28" height="28" rx="3" fill="#28A8E0" />
    <path d="M10 18a8 8 0 1 0 0 12V18z" fill="white" />
    <ellipse cx="10" cy="24" rx="5" ry="6" fill="#0078D4" />
  </svg>
);

const AppleCalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
    <rect x="2" y="8" width="44" height="38" rx="5" fill="white" stroke="#D0D0D0" strokeWidth="2" />
    <rect x="2" y="8" width="44" height="12" rx="5" fill="#FF3B30" />
    <rect x="2" y="17" width="44" height="3" fill="#FF3B30" />
    <circle cx="14" cy="5" r="3" fill="#333" />
    <circle cx="34" cy="5" r="3" fill="#333" />
    <rect x="12" y="3" width="4" height="6" rx="2" fill="#666" />
    <rect x="32" y="3" width="4" height="6" rx="2" fill="#666" />
    <text x="24" y="38" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1c1c1e">
      {new Date().getDate()}
    </text>
  </svg>
);

// ── Component ─────────────────────────────────────────────────

interface CalendarExportMenuProps {
  task: Task;
  onClose: () => void;
}

export default function CalendarExportMenu({ task, onClose }: CalendarExportMenuProps) {
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Slide-in animation on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const openLink = (url: string, label: string) => {
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setFeedback(`✓ Abriendo ${label}…`);
    setTimeout(handleClose, 1200);
  };

  const handleICS = () => {
    downloadICSFile(task);
    setFeedback('✓ Descargando archivo .ics…');
    setTimeout(handleClose, 1200);
  };

  const priorityEmoji =
    task.priority === 'alta' ? '🔴' : task.priority === 'media' ? '🟡' : '🟢';
  const priorityLabel =
    task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja';
  const priorityColor =
    task.priority === 'alta'
      ? 'var(--danger-color)'
      : task.priority === 'media'
      ? 'var(--warning-color)'
      : 'var(--success-color)';

  const options: Array<{
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    action: () => void;
    color: string;
  }> = [
    {
      icon: <GoogleIcon />,
      label: 'Google Calendar',
      sublabel: 'Añadir al calendario de Google',
      action: () => openLink(getGoogleCalendarUrl(task), 'Google Calendar'),
      color: '#4285F4',
    },
    {
      icon: <OutlookIcon />,
      label: 'Outlook Web',
      sublabel: 'Añadir al calendario de Outlook',
      action: () => openLink(getOutlookWebUrl(task), 'Outlook'),
      color: '#0078D4',
    },
    {
      icon: <AppleCalIcon />,
      label: 'Apple / iCal (.ics)',
      sublabel: 'Descargar para Apple Calendar, Thunderbird…',
      action: handleICS,
      color: '#FF3B30',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: 'linear-gradient(135deg, #1a2235 0%, #0f172a 100%)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px 20px 0 0',
          padding: '0 0 env(safe-area-inset-bottom, 16px)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agregar al calendario
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>{priorityEmoji}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {task.title}
              </h3>
              <span style={{ fontSize: '0.8rem', color: priorityColor, fontWeight: 600 }}>
                Prioridad {priorityLabel} · {task.time} · {task.date}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />

        {/* Feedback overlay */}
        {feedback && (
          <div style={{
            margin: '12px 20px',
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(46, 160, 67, 0.15)',
            border: '1px solid rgba(46, 160, 67, 0.3)',
            color: 'var(--success-color)',
            fontSize: '0.9rem',
            fontWeight: 500,
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease',
          }}>
            {feedback}
          </div>
        )}

        {/* Options list */}
        <div style={{ padding: '8px 12px 8px' }}>
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${opt.color}18`,
                border: `1px solid ${opt.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {opt.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{opt.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {opt.sublabel}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>›</div>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <div style={{ padding: '4px 20px 20px' }}>
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}
