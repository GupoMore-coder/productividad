import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Hash, DollarSign, Loader2 } from 'lucide-react';
import { WhatsAppService } from '../../services/whatsappService';
import { triggerHaptic } from '../../utils/haptics';

interface WhatsAppEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhone: string;
  customerName: string;
  documentNumber: string;
  total: number;
  type: 'cotizacion' | 'orden';
  onSuccess?: () => void;
}

export const WhatsAppEditModal: React.FC<WhatsAppEditModalProps> = ({
  isOpen,
  onClose,
  customerPhone,
  customerName: initialName,
  documentNumber: initialDoc,
  total: initialTotal,
  type,
  onSuccess
}) => {
  const [name, setName] = useState(initialName);
  const [doc, setDoc] = useState(initialDoc);
  const [total, setTotal] = useState(initialTotal.toString());
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    triggerHaptic('medium');

    try {
      const formattedTotal = parseFloat(total).toLocaleString('es-CO');
      
      if (type === 'orden') {
        await WhatsAppService.sendOrderNotification(customerPhone, name, doc, formattedTotal);
      } else {
        await WhatsAppService.sendQuoteNotification(customerPhone, name, doc, formattedTotal);
      }

      triggerHaptic('success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al enviar la notificación. Verifica la configuración API.');
      triggerHaptic('error');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 md:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }} 
          className="relative bg-[#1a1622] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden max-w-md w-full"
        >
          {/* Header */}
          <div className="p-8 pb-4 flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 text-emerald-400 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Confirmar Envío API</h3>
              </div>
              <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest pl-13">
                Edita los parámetros de la plantilla oficial
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-8 py-4 space-y-5">
            {/* Template Info Alert */}
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex gap-3">
              <div className="text-purple-400 shrink-0">✨</div>
              <p className="text-[0.6rem] text-slate-400 font-medium leading-relaxed">
                Estás usando la plantilla <span className="text-purple-400 font-bold">"{type === 'orden' ? 'nueva_orden_servicio' : 'cotizacion_generada'}"</span>. 
                Solo puedes editar los valores variables, el texto base es fijo por Meta.
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Cliente ({{1}})</label>
                <div className="relative group">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-purple-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all font-light"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Documento ({{2}})</label>
                <div className="relative group">
                  <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-purple-400" />
                  <input 
                    type="text" 
                    value={doc}
                    onChange={e => setDoc(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all font-light"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.6rem] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Total ({{3}})</label>
                <div className="relative group">
                  <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-purple-400" />
                  <input 
                    type="number" 
                    value={total}
                    onChange={e => setTotal(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all font-light"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.65rem] font-bold text-center">
                {error}
              </div>
            )}
          </div>

          <div className="p-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-500 font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSend}
              disabled={isSending || !name || !doc || !total}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[0.65rem] uppercase tracking-widest transition-all ${
                isSending || !name || !doc || !total 
                  ? 'bg-white/5 text-slate-700 cursor-not-allowed' 
                  : 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Enviar API
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
