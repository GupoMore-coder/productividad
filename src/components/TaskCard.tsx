import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Bell, 
  Users, 
  CheckCircle2, 
  Circle, 
  Clock
} from 'lucide-react';
import CalendarExportMenu from './CalendarExportMenu';
import { triggerHaptic } from '../utils/haptics';

export interface Task {
  id: string;
  title: string;
  description?: string;
  time: string;
  date: string; // ISO date yyyy-MM-dd
  priority: 'alta' | 'media' | 'baja';
  completed?: boolean;
  isShared?: boolean;
  groupId?: string;
  userId?: string;
  createdBy?: string;
  status?: 'pending_acceptance' | 'accepted' | 'completed' | 'expired' | 'cancelled_with_reason' | 'declined';
  failureReason?: string;
  imageUrl?: string;
}

interface TaskCardProps {
  task: Task;
  onToggleComplete?: (id: string, val: boolean) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  isReadOnly?: boolean;
  onSelect?: (task: Task) => void;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onAccept,
  onDecline,
  isReadOnly,
  onSelect
}: TaskCardProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const getPriorityColors = () => {
    switch (task.priority) {
      case 'alta':  return { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500/5' };
      case 'media': return { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500/5' };
      case 'baja':  return { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/5' };
      default:      return { border: 'border-slate-500/50', text: 'text-slate-400', bg: 'bg-slate-500/5' };
    }
  };

  const colors = getPriorityColors();
  const isCompleted = task.completed || task.status === 'completed';
  const isPending   = task.status === 'pending_acceptance';
  const isAccepted  = task.status === 'accepted' || (!task.status && !isPending);
  const showActions = !isPending && !isReadOnly && isAccepted && !isCompleted;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isCompleted && !isPending ? 0.5 : 1, y: 0 }}
        onClick={() => onSelect?.(task)}
        className={`group relative overflow-hidden rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md mb-3 transition-all duration-300 hover:border-purple-500/30 shadow-lg cursor-pointer ${isPending ? 'ring-1 ring-amber-500/30' : ''}`}
      >
        {/* Priority Side Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bg.replace('bg-', 'bg-opacity-100 bg-')}`} />

        <div className="p-4 flex gap-4">
          {/* Checkbox Icon */}
          {!isPending && !isReadOnly && (
            <button 
              onClick={() => {
                triggerHaptic(isCompleted ? 'light' : 'success');
                onToggleComplete?.(task.id, !isCompleted);
              }}
              className="mt-1 shrink-0 transition-transform active:scale-90"
            >
              {isCompleted ? (
                <CheckCircle2 size={22} className="text-purple-400" />
              ) : (
                <Circle size={22} className="text-slate-600 hover:text-purple-500/50 transition-colors" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            {/* Title & Shared Icon */}
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-sm font-bold transition-all ${isCompleted && !isPending ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {task.title}
              </h4>
              {task.isShared && (
                <Users size={14} className="text-purple-400 shrink-0 mt-0.5" />
              )}
            </div>

            {task.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Evidence Image */}
            {task.imageUrl && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="mt-3 w-20 h-20 rounded-xl overflow-hidden border border-white/10 cursor-zoom-in group/img"
                onClick={(e) => {
                  e.stopPropagation();
                  (window as any).dispatchEvent(new CustomEvent('zoom-image', { detail: task.imageUrl }));
                }}
              >
                <img src={task.imageUrl} alt="evidencia" className="w-full h-full object-cover group-hover/img:opacity-80 transition-opacity" />
              </motion.div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-slate-500 bg-black/20 px-2 py-1 rounded-lg border border-white/5 uppercase tracking-tight">
                <Clock size={10} className="text-purple-500/70" />
                {task.time}
              </div>
              <div className={`text-[0.65rem] font-black uppercase tracking-widest ${colors.text}`}>
                {task.priority}
              </div>
              {task.isShared && task.createdBy && (
                <div className="text-[0.65rem] text-purple-400 font-medium ml-auto">
                   @{task.createdBy.split('@')[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Action Row */}
        {showActions && (
          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 font-medium">
              <Bell size={12} className={colors.text} />
              <span>{task.priority === 'alta' ? '6' : task.priority === 'media' ? '3' : '2'} alertas activas</span>
            </div>
            <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-1.5 text-[0.68rem] font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl border border-purple-500/20 transition-all active:scale-95"
            >
              <CalendarIcon size={12} />
              Agendar
            </button>
          </div>
        )}

        {/* Acceptance Actions */}
        {isPending && !isReadOnly && (
          <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex gap-2">
            <button
              onClick={() => {
                triggerHaptic('success');
                onAccept?.(task.id);
              }}
              className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all active:scale-95"
            >
              Aceptar
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onDecline?.(task.id);
              }}
              className="flex-1 bg-slate-800/50 text-slate-400 border border-white/5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
            >
              Rechazar
            </button>
          </div>
        )}
      </motion.div>

      {showCalendar && (
        <CalendarExportMenu task={task} onClose={() => setShowCalendar(false)} />
      )}
    </>
  );
}
