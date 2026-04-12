import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Smartphone } from 'lucide-react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { triggerHaptic } from '../utils/haptics';

export const WhatsAppEditorModal: React.FC = () => {
  const { state, closeWhatsApp } = useWhatsApp();
  const [editedMessage, setEditedMessage] = useState('');

  useEffect(() => {
    if (state.isOpen) {
      setEditedMessage(state.message);
    }
  }, [state.isOpen, state.message]);

  const handleSend = () => {
    triggerHaptic('success');
    const cleanPhone = state.phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(editedMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    closeWhatsApp();
  };

  if (!state.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeWhatsApp}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-lg bg-[#0a0b14]/90 border border-white/10 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-3xl flex flex-col"
        >
          {/* Accent Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

          {/* Header */}
          <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">WhatsApp Editor</h3>
                <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <Smartphone size={10} className="text-emerald-500" /> +{state.phone.replace(/\D/g, '')}
                </p>
              </div>
            </div>
            <button
              onClick={closeWhatsApp}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          {/* Editor Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <textarea
                autoFocus
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="relative w-full h-48 sm:h-60 bg-black/40 border border-white/10 rounded-[20px] p-5 text-sm sm:text-base text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all leading-relaxed custom-scrollbar placeholder:text-slate-700 font-medium"
              />
            </div>

            <div className="flex flex-col gap-4">
               {/* Pre-flight Info */}
               <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 animate-pulse" />
                  <p className="text-[0.65rem] text-slate-500 font-medium leading-relaxed italic">
                    "Al confirmar, se abrirá la aplicación de WhatsApp con el mensaje listo para ser enviado al destinatario."
                  </p>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-3">
                <button
                  onClick={closeWhatsApp}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={!editedMessage.trim()}
                  className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={18} />
                  Enviar a WhatsApp
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
