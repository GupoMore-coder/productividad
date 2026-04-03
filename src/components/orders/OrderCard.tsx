import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Phone, 
  Clock, 
  FileText, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { ServiceOrder } from '../../context/OrderContext';
import { OrderStatusPill } from './OrderStatusPill';
import { OrderTimeline } from './OrderTimeline';

interface OrderCardProps {
  order: ServiceOrder;
  onStatusChange: (id: string, newStatus: string) => void;
  onEdit: (order: ServiceOrder) => void;
  onDownloadPdf: (order: ServiceOrder) => void;
  onAddObservation: (id: string, obs: string) => void;
  isOverdue?: boolean;
  isGenerating?: boolean;
}

export function OrderCard({ 
  order, 
  onStatusChange, 
  onEdit, 
  onDownloadPdf, 
  onAddObservation,
  isOverdue,
  isGenerating
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [obsValue, setObsValue] = useState('');

  const deliveryDate = new Date(order.deliveryDate);
  const timeRemaining = formatDistanceToNow(deliveryDate, { addSuffix: true, locale: es });

  const handleObsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (obsValue.trim()) {
      onAddObservation(order.id, obsValue);
      setObsValue('');
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-md shadow-xl hover:border-purple-500/30 transition-all duration-500"
    >
      {/* Accent Glow Line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-40 bg-gradient-to-r from-transparent ${isOverdue ? 'via-red-500 animate-pulse' : (order.status === 'recibida' ? 'via-amber-500' : 'via-purple-500')} to-transparent`} />

      {/* Header Area */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-black tracking-widest text-slate-400 group-hover:text-purple-400 transition-colors">
            {order.id}
          </span>
          <OrderStatusPill status={order.status} />
        </div>

        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate group-hover:translate-x-1 transition-transform duration-300">
              {order.customerName}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-slate-400">
              <Phone size={14} className="text-purple-500/70" />
              <span className="text-sm font-light">{order.customerPhone}</span>
            </div>
          </div>
          
          <div className="text-right shrink-0">
            <div className="text-[0.65rem] uppercase tracking-tighter text-slate-500 font-bold">Entrega</div>
            <div className={`text-sm font-bold mt-0.5 ${isOverdue ? 'text-red-400 underline underline-offset-4 decoration-red-500/50' : 'text-slate-200'}`}>
              {format(deliveryDate, 'dd MMM, HH:mm', { locale: es })}
            </div>
            <div className={`text-[0.68rem] mt-1 font-medium ${isOverdue ? 'text-red-400 animate-pulse' : 'text-amber-500/80'}`}>
              <Clock size={10} className="inline mr-1" />
              {timeRemaining}
            </div>
          </div>
        </div>
      </div>

      {/* Services Pills & Thumbs */}
      <div className="px-5 py-2 flex flex-wrap gap-1.5 overflow-hidden">
        {order.services.map((svc, i) => (
          <span key={i} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[0.65rem] text-slate-400 font-medium whitespace-nowrap">
            {svc}
          </span>
        ))}
      </div>

      {order.photos && order.photos.length > 0 && (
        <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {order.photos.map((p, i) => (
            <img 
              key={i} 
              src={p} 
              alt="evidencia" 
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 hover:ring-purple-500/50 transition-all cursor-zoom-in"
              onClick={() => (window as any).dispatchEvent(new CustomEvent('zoom-image', { detail: p }))}
            />
          ))}
        </div>
      )}

      {/* Financial Bar */}
      <div className="mx-5 my-3 grid grid-cols-3 p-3 rounded-2xl bg-black/30 border border-white/5 divide-x divide-white/10">
        <div className="flex flex-col px-2">
          <span className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">Total</span>
          <span className="text-xs font-black text-slate-200 tracking-tight">$ {order.totalCost.toLocaleString()}</span>
        </div>
        <div className="flex flex-col px-4 text-center">
          <span className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">Abono</span>
          <span className="text-xs font-black text-emerald-400/90 tracking-tight">$ {order.depositAmount.toLocaleString()}</span>
        </div>
        <div className="flex flex-col px-2 text-right">
          <span className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">Saldo</span>
          <span className={`text-xs font-black tracking-tight ${order.pendingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            $ {order.pendingBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Expandable History / Novedades */}
      <div className="px-5 pb-5">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[0.7rem] text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest font-bold"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Ocultar Seguimiento' : 'Ver Novedades / Historial'}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black/20 rounded-2xl p-4 mt-2 border border-white/5"
            >
              {/* Add Observation Form */}
              <form onSubmit={handleObsSubmit} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={obsValue}
                  onChange={e => setObsValue(e.target.value)}
                  placeholder="Escribe una novedad..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-light"
                />
                <button type="submit" className="bg-purple-600/20 text-purple-400 p-2 rounded-xl hover:bg-purple-600/30 transition-colors border border-purple-500/20">
                  <MessageSquare size={18} />
                </button>
              </form>

              <OrderTimeline history={order.history} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {['recibida', 'en_proceso', 'pendiente_entrega'].includes(order.status) ? (
            <>
              {order.status !== 'en_proceso' && (
                <button onClick={() => onStatusChange(order.id, 'en_proceso')} className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors" title="Pasar a Producción">
                  <Edit3 size={18} />
                </button>
              )}
              {order.status !== 'pendiente_entrega' && (
                <button onClick={() => onStatusChange(order.id, 'pendiente_entrega')} className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors" title="Pte Entrega">
                  <CheckCircle2 size={18} />
                </button>
              )}
              <button onClick={() => onStatusChange(order.id, 'completada')} className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" title="Finalizar Entrega">
                <CheckCircle2 size={18} />
              </button>
            </>
          ) : (
             <span className="text-[0.6rem] text-slate-500 font-bold px-2 py-1">SOLO LECTURA</span>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => onDownloadPdf(order)} 
            disabled={isGenerating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-white/5 active:scale-95 shadow-lg ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
            title="Generar PDF"
          >
            {isGenerating ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <FileText size={18} />
            )}
            <span className="text-[0.7rem] font-bold uppercase tracking-widest md:hidden lg:inline">PDF</span>
          </button>
          
          <button 
            onClick={() => onEdit(order)} 
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-white/5 active:scale-95 shadow-lg"
            title="Editar Orden"
          >
            <Edit3 size={18} />
          </button>
        </div>
      </div>

      {/* Creator Info Overlay (Visible on Hover) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
         <div className="bg-slate-800 border border-white/10 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-xl">
            <span className="text-[0.65rem] text-slate-400 font-medium">✨ Creada por {order.createdByRole} • {format(new Date(order.createdAt), 'dd MMM HH:mm', { locale: es })}</span>
         </div>
      </div>
    </motion.div>
  );
}
