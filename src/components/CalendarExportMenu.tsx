import { useState } from 'react';
import type { Task } from '../context/TaskContext';
import {
  getGoogleCalendarUrl,
  getOutlookWebUrl,
  downloadICSFile,
} from '../services/CalendarService';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

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
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
  };

  const openLink = (url: string, label: string) => {
    triggerHaptic('light');
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setFeedback(`✓ Abriendo ${label}…`);
    setTimeout(handleClose, 1200);
  };

  const handleICS = () => {
    triggerHaptic('light');
    downloadICSFile(task);
    setFeedback('✓ Descargando archivo .ics…');
    setTimeout(handleClose, 1200);
  };

  const priorityEmoji =
    task.priority === 'alta' ? '🔴' : task.priority === 'media' ? '🟡' : '🟢';
  const priorityLabel =
    task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja';
  const priorityColorClass =
    task.priority === 'alta'
      ? 'text-red-400'
      : task.priority === 'media'
      ? 'text-amber-400'
      : 'text-emerald-400';

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
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Bottom Sheet / Modal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-[#1a1622] rounded-t-[32px] sm:rounded-3xl border-t border-white/10 sm:border shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,16px)]"
        >
          {/* Drag handle (Mobile only) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-white/10 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5">
            <div className="flex justify-between items-start mb-1">
               <p className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black">
                Sincronización de Agenda
              </p>
              <button 
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-white/5 text-slate-500 transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-xl">
                {priorityEmoji}
              </div>
              <div>
                <h3 className="text-white font-bold tracking-tight line-clamp-1">
                  {task.title}
                </h3>
                <p className={`text-[0.7rem] font-bold uppercase tracking-tight ${priorityColorClass}`}>
                  Prioridad {priorityLabel} · {task.time} · {task.date}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-2 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2"
              >
                <Check size={14} />
                {feedback}
              </motion.div>
            )}

            <div className="space-y-1">
              {options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.action}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/10 hover:bg-white/[0.05] transition-all group active:scale-[0.98]"
                  aria-label={`Exportar a ${opt.label}`}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                    style={{ 
                      backgroundColor: `${opt.color}15`,
                      borderColor: `${opt.color}30`
                    }}
                  >
                    {opt.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-white tracking-tight">{opt.label}</div>
                    <div className="text-[0.7rem] text-slate-500 font-medium">{opt.sublabel}</div>
                  </div>
                  <ChevronRight size={18} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 bg-black/20">
            <button
              onClick={handleClose}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-[0.7rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
            >
              Cerrar Menú
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
