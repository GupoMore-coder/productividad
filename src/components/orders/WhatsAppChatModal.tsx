import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, User, Clock, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { triggerHaptic } from '../../utils/haptics';

interface Message {
  id: string;
  message_text: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
  status: string;
}

interface WhatsAppChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
}

export const WhatsAppChatModal: React.FC<WhatsAppChatModalProps> = ({
  isOpen,
  onClose,
  orderId,
  customerName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cargar mensajes iniciales
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Suscripción Real-time
    const subscription = supabase
      .channel(`chat_${orderId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        triggerHaptic('light');
        scrollToBottom();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, orderId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 md:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }} 
          className="relative bg-[#0f0d13] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden max-w-lg w-full h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">{customerName}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">Chat en tiempo real</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Body */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
          >
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <Loader2 size={32} className="text-purple-500 animate-spin" />
                <p className="text-[0.6rem] text-slate-600 font-black uppercase tracking-widest">Cargando historial...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-slate-800/10 flex items-center justify-center mb-6">
                  <MessageSquare size={32} className="text-slate-700" />
                </div>
                <h4 className="text-white font-bold mb-2 uppercase tracking-tight">Sin mensajes</h4>
                <p className="text-[0.65rem] text-slate-500 font-medium max-w-[200px] leading-relaxed">
                  Aún no hay mensajes registrados para esta orden. Las notificaciones enviadas aparecerán aquí.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOutbound = msg.direction === 'outbound';
                const isFirstOfGroup = index === 0 || messages[index - 1].direction !== msg.direction;

                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, x: isOutbound ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} ${isFirstOfGroup ? 'mt-4' : 'mt-1'}`}
                  >
                    <div 
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isOutbound 
                          ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/20' 
                          : 'bg-slate-800 text-white rounded-bl-none border border-white/5'
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-light">{msg.message_text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <Clock size={10} className="text-slate-600" />
                      <span className="text-[0.6rem] text-slate-600 font-medium">{formatTime(msg.created_at)}</span>
                      {isOutbound && (
                        <CheckCheck size={12} className={msg.status === 'read' ? 'text-blue-400' : 'text-slate-600'} />
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer - Info Only (Input is Meta API) */}
          <div className="p-6 bg-white/[0.01] border-t border-white/5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCheck size={16} className="text-emerald-400" />
              </div>
              <p className="text-[0.6rem] text-slate-400 font-medium leading-relaxed">
                Este historial es consultivo. Para enviar nuevos mensajes usa el botón de <span className="text-emerald-400 font-bold uppercase tracking-tight">WhatsApp</span> en la tarjeta.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </AnimatePresence>
  );
};
