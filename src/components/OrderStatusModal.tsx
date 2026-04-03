import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { ServiceOrder } from '../context/OrderContext';

interface OrderStatusModalProps {
  order: ServiceOrder | null;
  targetStatus: 'completada' | 'cancelada' | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export default function OrderStatusModal({ isOpen, onClose, order, targetStatus, onConfirm }: OrderStatusModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen || !order || !targetStatus) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetStatus === 'cancelada' && !reason.trim()) return;
    onConfirm(reason);
  };

  const isCancel = targetStatus === 'cancelada';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden ${isCancel ? 'ring-1 ring-red-500/20' : 'ring-1 ring-emerald-500/20'}`}
          >
            {/* Background Decoration */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${isCancel ? 'bg-red-500' : 'bg-emerald-500'}`} />

            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isCancel ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {isCancel ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {isCancel ? '¿Confirmar Cancelación?' : '¿Marcar como Completada?'}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Estás a punto de mover la orden <span className="text-slate-200 font-bold">{order.id}</span> a un estado inactivo.
                Esta acción se notificará al equipo.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {isCancel && (
                  <div className="text-left space-y-2">
                    <label className="text-[0.65rem] uppercase tracking-widest text-red-400 font-black ml-1">Motivo Obligatorio</label>
                    <textarea 
                      value={reason} 
                      onChange={e => setReason(e.target.value)} 
                      required
                      placeholder="Ej. El cliente canceló el evento..." 
                      rows={3}
                      className="w-full bg-black/40 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 font-bold py-3 rounded-2xl border border-white/5 transition-all active:scale-95"
                  >
                    Volver
                  </button>
                  <button 
                    type="submit"
                    disabled={isCancel && !reason.trim()}
                    className={`flex-1 font-bold py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-black/20 ${isCancel ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
