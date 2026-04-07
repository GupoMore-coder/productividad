import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { ServiceOrder } from '../context/OrderContext';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  quote: ServiceOrder;
  onConvert: (id: string) => Promise<void>;
  onExtend: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDismiss: () => void;
  isAutoExpired?: boolean; // true = ya pasaron 15 días (extendida), no hay opción de extender
}

export function QuoteExpirationAlert({ quote, onConvert, onExtend, onArchive, onDismiss, isAutoExpired = false }: Props) {
  const [loading, setLoading] = useState<'convert' | 'extend' | 'archive' | null>(null);

  const totalDays = (quote.quoteExtendedDays || 0) >= 5 ? 15 : 10;
  const alreadyExtended = (quote.quoteExtendedDays || 0) >= 5;
  const canExtend = !alreadyExtended && !isAutoExpired;

  const handle = async (action: 'convert' | 'extend' | 'archive') => {
    setLoading(action);
    triggerHaptic('medium');
    try {
      if (action === 'convert') await onConvert(quote.id);
      else if (action === 'extend') await onExtend(quote.id);
      else await onArchive(quote.id);
      onDismiss();
    } catch (err: any) {
      alert(err?.message || 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative w-full max-w-md bg-[#12101a] border border-amber-500/30 rounded-[32px] shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden"
        >
          {/* Amber glow top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

          <div className="p-8">
            {/* Header Icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={28} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {isAutoExpired ? 'Cotización Eliminada' : 'Cotización Vencida'}
                </h2>
                <p className="text-[0.65rem] font-bold text-amber-500/70 uppercase tracking-widest mt-0.5">
                  {totalDays} días de validez agotados
                </p>
              </div>
            </div>

            {/* Quote Info */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-6">
              <p className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Cliente</p>
              <p className="text-base font-black text-white">{quote.customerName}</p>
              <p className="text-xs text-slate-400 mt-1">{quote.customerPhone}</p>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">Total cotizado</span>
                <span className="text-sm font-black text-amber-400">$ {quote.totalCost.toLocaleString()}</span>
              </div>
            </div>

            {isAutoExpired ? (
              /* Auto-expired: solo informar */
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-center">
                <p className="text-xs font-bold text-red-400 leading-relaxed">
                  Esta cotización fue extendida una vez y el período adicional también expiró.
                  Ha sido archivada automáticamente y notificada al CEO y al Administrador Maestro.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed mb-6 text-center">
                Esta cotización ha alcanzado su límite de validez. Selecciona qué deseas hacer:
                {alreadyExtended && (
                  <span className="block mt-2 text-amber-400/80 font-bold">
                    ⚠️ Ya fue extendida una vez. No se puede extender nuevamente.
                  </span>
                )}
              </p>
            )}

            {/* Actions */}
            {!isAutoExpired ? (
              <div className="flex flex-col gap-3">
                {/* Convert */}
                <button
                  id="quote-convert-btn"
                  onClick={() => handle('convert')}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {loading === 'convert' ? (
                    <span className="animate-pulse">Procesando…</span>
                  ) : (
                    <><CheckCircle2 size={18} /> Convertir en Orden de Servicio</>
                  )}
                </button>

                {/* Extend — only if not already extended */}
                {canExtend && (
                  <button
                    id="quote-extend-btn"
                    onClick={() => handle('extend')}
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading === 'extend' ? (
                      <span className="animate-pulse">Extendiendo…</span>
                    ) : (
                      <><Clock size={18} /> Extender 5 Días Más (1 vez)</>
                    )}
                  </button>
                )}

                {/* Archive/Delete */}
                <button
                  id="quote-archive-btn"
                  onClick={() => handle('archive')}
                  disabled={!!loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 border border-red-500/10 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading === 'archive' ? (
                    <span className="animate-pulse">Archivando…</span>
                  ) : (
                    <><Trash2 size={14} /> Archivar y Eliminar Cotización</>
                  )}
                </button>
              </div>
            ) : (
              /* Auto-expired: solo cerrar */
              <button
                onClick={onDismiss}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 font-black text-sm uppercase tracking-widest transition-all border border-white/10"
              >
                <X size={16} /> Entendido
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
