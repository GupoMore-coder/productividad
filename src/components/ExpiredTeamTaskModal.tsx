import React, { useState, useEffect } from 'react';
import type { Task } from '../context/TaskContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Calendar, X, CheckCircle2, History } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ExpiredTeamTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (taskId: string, reason: string, decision: 'reprogramar' | 'terminar' | 'completar', newDate?: string) => void;
}

export default function ExpiredTeamTaskModal({ isOpen, task, onClose, onSubmit }: ExpiredTeamTaskModalProps) {
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState<'reprogramar' | 'terminar' | 'completar' | null>(null);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDecision(null);
      setNewDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !decision) return;
    
    triggerHaptic('error');
    onSubmit(task!.id, reason, decision, decision === 'reprogramar' ? newDate : undefined);
    onClose();
  };

  const handleDecision = (d: 'reprogramar' | 'terminar' | 'completar') => {
    triggerHaptic(d === 'terminar' ? 'error' : 'light');
    setDecision(d);
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#1a1622] border border-red-500/30 rounded-[32px] overflow-hidden shadow-2xl shadow-red-500/10"
          >
            {/* Header / Accent */}
            <div className="h-2 bg-red-500/50 w-full" />

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20">
                  <AlertTriangle size={40} className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                  Incumplimiento de Plazo
                </h2>
                <p className="text-sm text-slate-400 font-medium">
                  La tarea grupal <span className="text-white font-bold italic">"{task.title}"</span> ha vencido sin resolución.
                </p>
              </div>

              {/* Original Date Info */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500">
                  <History size={20} />
                </div>
                <div>
                  <p className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black">Vencimiento Original</p>
                  <p className="text-sm font-bold text-white">
                    {format(new Date(`${task.date}T${task.time}`), "EEEE, d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Justification */}
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-black ml-1 flex items-center gap-2">
                    Justificación Obligatoria <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={reason} 
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ej. El cliente aplazó la reunión, falta de insumos..." 
                    required 
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none placeholder:text-slate-700 font-medium disabled:opacity-30"
                    disabled={decision === 'completar'}
                  />
                  {decision === 'completar' && (
                    <p className="text-[0.6rem] text-emerald-500 font-bold px-2">✨ No requiere justificación para esta opción.</p>
                  )}
                </div>

                {/* Decision Buttons */}
                <div className="space-y-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-black ml-1">
                    Acción Correctiva <span className="text-[0.5rem] opacity-50 block mt-1">(Selecciona una respuesta para continuar)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      type="button" 
                      onClick={() => handleDecision('reprogramar')}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95
                        ${decision === 'reprogramar' 
                          ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}
                      `}
                    >
                      <Calendar size={18} />
                      <span className="text-[0.55rem] font-black uppercase tracking-widest text-center">Reprogramar</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDecision('terminar')}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95
                        ${decision === 'terminar' 
                          ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}
                      `}
                    >
                      <X size={18} />
                      <span className="text-[0.55rem] font-black uppercase tracking-widest text-center">Dar por Terminada</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDecision('completar')}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95
                        ${decision === 'completar' 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}
                      `}
                    >
                      <CheckCircle2 size={18} />
                      <span className="text-[0.55rem] font-black uppercase tracking-widest text-center">Dar por Cumplida</span>
                    </button>
                  </div>
                </div>

                {/* Reprogram Date */}
                <AnimatePresence>
                  {decision === 'reprogramar' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">
                        Nueva Fecha Sugerida
                      </label>
                      <input 
                        type="date" 
                        required 
                        value={newDate} 
                        onChange={e => setNewDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Action */}
                <button 
                  type="submit" 
                  disabled={decision !== 'completar' && (!reason.trim() || !decision)}
                  className={`
                    w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl
                    ${(decision !== 'completar' && (!reason.trim() || !decision))
                      ? 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed' 
                      : decision === 'completar' 
                        ? 'bg-emerald-500 text-slate-950 hover:brightness-110 shadow-emerald-500/20'
                        : 'bg-red-500 text-white hover:brightness-110 shadow-red-500/20'}
                  `}
                >
                  <CheckCircle2 size={16} />
                  {decision === 'completar' ? 'Completar Tarea' : 'Registrar Incumplimiento'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
