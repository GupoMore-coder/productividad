import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../context/TaskContext';
import { 
  Calendar as CalendarIcon, 
  Bell, 
  BellOff,
  Users, 
  CheckCircle2, 
  Circle, 
  Clock,
  Volume2,
  VolumeX,
  Share2,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import CalendarExportMenu from './CalendarExportMenu';
import { triggerHaptic } from '../utils/haptics';
import { subHours, format } from 'date-fns';


interface TaskCardProps {
  task: Task;
  onToggleComplete?: (id: string, val: boolean) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  isReadOnly?: boolean;
  onSelect?: (task: Task) => void;
}

const TaskCard = memo(function TaskCard({
  task,
  onToggleComplete,
  onAccept,
  onDecline,
  onUpdate,
  isReadOnly,
  onSelect
}: TaskCardProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showOffsets, setShowOffsets] = useState(false);

  const getPriorityColors = () => {
    switch (task.priority) {
      case 'alta':  return { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-500/5' };
      case 'media': return { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500/5' };
      case 'baja':  return { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/5' };
      default:      return { border: 'border-slate-500/50', text: 'text-slate-400', bg: 'bg-slate-500/5' };
    }
  };

  const getBirthdayColors = () => ({
    border: 'border-amber-400/50',
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    accent: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600'
  });

  const getAlertOffsets = () => {
    try {
      // Robust parsing of time (handle HH:mm:ss if present)
      const cleanTime = task.time.split(':').slice(0, 2).join(':');
      const taskTime = new Date(`${task.date}T${cleanTime}:00`);
      
      if (isNaN(taskTime.getTime())) return [];

      const offsets = {
        alta:  [72, 48, 24, 12, 6, 3],
        media: [48, 24, 12],
        baja:  [12, 6]
      }[task.priority] || [];

      return offsets.map(h => {
        const d = subHours(taskTime, h);
        let label = '';
        if (h >= 24) label = `${Math.round(h/24)}d antes (${h}h)`;
        else if (h >= 1) label = `${h}h antes`;
        else label = `${Math.round(h * 60)} min antes`;

        return {
          label,
          time: format(d, 'HH:mm'),
          date: format(d, 'd MMM'),
          full: format(d, 'd MMM, HH:mm')
        };
      });
    } catch (e) {
      console.error("Error calculating alerts:", e);
      return [];
    }
  };

  const bdayColors = getBirthdayColors();
  const reminderColors = { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-500', accent: 'bg-amber-500' };
  const isReminder = task.type === 'reminder';
  const colors = task.isBirthday ? bdayColors : getPriorityColors();
  const isCompleted = task.completed || task.status === 'completed';
  const isPending   = task.status === 'pending_acceptance';
  const isAccepted  = task.status === 'accepted' || (!task.status && !isPending);
  const showActions = !isPending && !isReadOnly && isAccepted && !isCompleted;
  const isMuted = !!task.is_muted;
  const alerts = getAlertOffsets();

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onUpdate?.(task.id, { is_muted: !isMuted, muted_alarms: !isMuted ? [] : task.muted_alarms });
  };

  const toggleAlarmMute = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const currentMuted = task.muted_alarms || [];
    const newMuted = currentMuted.includes(idx) 
      ? currentMuted.filter(i => i !== idx)
      : [...currentMuted, idx];
    onUpdate?.(task.id, { muted_alarms: newMuted });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isCompleted && !isPending && !task.isBirthday ? 0.5 : 1, y: 0 }}
        onClick={() => !task.isBirthday && onSelect?.(task)}
        className={`group relative overflow-hidden rounded-2xl border backdrop-blur-md mb-3 transition-all duration-300 shadow-lg cursor-pointer ${
          task.isBirthday 
            ? 'bg-amber-500/5 border-amber-500/30 hover:shadow-amber-500/10' 
            : 'bg-slate-900/40 border-white/10 hover:border-purple-500/30'
        } ${isPending ? 'ring-1 ring-amber-500/30' : ''}`}
      >
        {/* Priority Side Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.isBirthday ? bdayColors.accent : isReminder ? reminderColors.accent : colors.bg.replace('bg-', 'bg-opacity-100 bg-')}`} />

        <div className="p-4 flex gap-4">
          {/* Checkbox Icon */}
          {!isPending && !isReadOnly && !task.isBirthday && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
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

          {task.isBirthday && (
            <div className="mt-1 shrink-0 text-amber-500 animate-bounce">
              🎂
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Title & Shared Icon */}
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-sm font-bold transition-all ${isCompleted && !isPending ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                {task.isShared && (
                  <Users size={14} className="text-purple-400 shrink-0 mt-0.5" />
                )}
                {isMuted && (
                  <BellOff size={14} className="text-slate-500 shrink-0" />
                )}
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Evidence Image Gallery Preview */}
            {task.imageUrls && task.imageUrls.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 cursor-zoom-in group/img shadow-2xl"
                onClick={(e) => {
                  e.stopPropagation();
                  (window as any).dispatchEvent(new CustomEvent('zoom-image', { 
                    detail: { photos: task.imageUrls, index: 0 } 
                  }));
                }}
              >
                <img src={task.imageUrls[0]} alt="evidencia" className="w-full h-full object-cover group-hover/img:opacity-80 transition-opacity" />
                
                {task.imageUrls.length > 1 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none group-hover/img:bg-black/20 transition-colors">
                    <span className="text-white text-sm font-black tracking-widest drop-shadow-md">
                      +{task.imageUrls.length - 1}
                    </span>
                  </div>
                )}
                
                <div className="absolute top-1 right-1 p-1 bg-purple-500 rounded-lg shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <Maximize2 size={10} className="text-white" />
                </div>
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
              {task.isOfflinePending && (
                <div className="text-[0.55rem] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse ml-auto">
                   Sincronizando...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Action Row */}
        {showActions && !task.isBirthday && (
          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                setShowOffsets(!showOffsets);
              }}
              className="flex items-center gap-2 text-[0.65rem] text-slate-500 font-medium hover:text-slate-300 transition-colors"
            >
              {isMuted ? <BellOff size={12} className="text-slate-500" /> : <Bell size={12} className={colors.text} />}
              <span>{alerts.length} alertas {isMuted ? 'silenciadas' : 'activas'}</span>
            </button>
            <div className="flex gap-2">
              {isReminder && (
                <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    onSelect?.(task); // Opens edit/share modal
                  }}
                  className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10 hover:bg-purple-500/20 transition-all active:scale-95"
                  title="Compartir Recordatorio"
                >
                  <Share2 size={12} />
                </button>
                {task.recurrence && task.recurrence !== 'none' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      // Logic to extend series would happen here or in modal
                      onSelect?.(task); 
                    }}
                    className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/10 hover:bg-amber-500/20 transition-all active:scale-95"
                    title="Prorrogar Serie"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
                </>
              )}
              {task.isShared && (
               <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  onSelect?.(task); 
                }}
                className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 hover:bg-emerald-500/20 transition-all active:scale-95"
                title="Recordatorio WhatsApp"
              >
                <div className="flex items-center gap-1.5 text-[0.6rem] font-black uppercase">
                   WA
                </div>
              </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendar(true);
                }}
                className="flex items-center gap-1.5 text-[0.68rem] font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl border border-purple-500/20 transition-all active:scale-95"
              >
                <CalendarIcon size={12} />
                Agendar
              </button>
            </div>
          </div>
        )}

        {/* Acceptance Actions */}
        {isPending && !isReadOnly && (
          <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('success');
                onAccept?.(task.id);
              }}
              className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all active:scale-95"
            >
              Aceptar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onDecline?.(task.id);
              }}
              className="flex-1 bg-slate-800/50 text-slate-400 border border-white/5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
            >
              Rechazar
            </button>
          </div>
        )}

        {/* Offsets Popover */}
        <AnimatePresence>
          {showOffsets && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black/20 border-t border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black">Cronograma de Alertas</span>
                  <button onClick={handleToggleMute} className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${isMuted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                    {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    <span className="text-[0.6rem] font-bold uppercase">{isMuted ? 'Silenciado' : 'Sonoro'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {alerts.map((offset, i) => {
                    const isAlarmMuted = isMuted || (task.muted_alarms || []).includes(i);
                    return (
                      <div key={i} className={`flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3 px-4 transition-all ${isAlarmMuted ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex flex-col">
                           <div className="text-[0.5rem] text-slate-500 font-bold uppercase tracking-widest">{offset.label}</div>
                           <div className="text-[0.8rem] text-white font-black">{offset.full}</div>
                        </div>
                        <button 
                          onClick={(e) => toggleAlarmMute(i, e)}
                          className={`p-2 rounded-xl border transition-all ${isAlarmMuted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}
                        >
                          {isAlarmMuted ? <BellOff size={14} /> : <Bell size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showCalendar && (
        <CalendarExportMenu task={task} onClose={() => setShowCalendar(false)} />
      )}
    </>
  );
});

export default TaskCard;
