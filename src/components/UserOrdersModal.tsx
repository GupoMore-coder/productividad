import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ServiceOrder } from '../context/OrderContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * v12.3: Elite User Orders Modal (Compact View)
 * Displays a summarized list of all orders a user is responsible for or created.
 * Optimized for transparency and fast operational auditing.
 */
interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  orders: ServiceOrder[];
}

export default function UserOrdersModal({ isOpen, onClose, userName, orders }: UserOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">@ {userName}</h3>
                <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest mt-1">Auditando {orders.length} órdenes</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {orders.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <AlertCircle className="mx-auto text-slate-700" size={40} />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">No se encontraron órdenes registradas para este periodo.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id}
                  className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-4 hover:border-purple-500/20 transition-all group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[0.6rem] font-black text-purple-500 uppercase tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className={`text-[0.55rem] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        order.status === 'completada' ? 'bg-emerald-500/10 text-emerald-400' : 
                        order.status === 'en_proceso' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{order.customerName}</h4>
                    <div className="flex items-center gap-2 text-[0.6rem] font-medium text-slate-500 uppercase mt-1">
                      <Clock size={10} />
                      {format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: es })}
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                     <span className="text-sm font-black text-white">$ {order.totalCost.toLocaleString()}</span>
                     {order.status === 'completada' ? (
                       <CheckCircle2 size={16} className="text-emerald-500 ml-auto mt-1" />
                     ) : (
                       <div className="text-[0.55rem] font-black text-slate-600 mt-1 uppercase">Saldo: ${order.pendingBalance.toLocaleString()}</div>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Footer */}
          <div className="p-4 bg-black/40 border-t border-white/5 text-center">
            <p className="text-[0.5rem] font-black text-slate-700 uppercase tracking-[0.2em]">Resumen de Operaciones · Vanguard Cloud Logic</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
