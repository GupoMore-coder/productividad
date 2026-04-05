import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ClipboardList, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { scheduleLocalNotification } from '../services/NotificationsService';

export default function RealtimeNotificationListener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeNotification, setActiveNotification] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Listen for NEW Service Orders
    const ordersChannel = supabase
      .channel('public:service_orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_orders' },
        (payload) => {
          if (payload.new.created_by !== user.id) {
            handleNewEvent({
              type: 'order',
              title: 'Nueva Orden de Servicio',
              body: `Cliente: ${payload.new.customer_name} · ${payload.new.id}`,
              id: payload.new.id,
              data: payload.new
            });
          }
        }
      )
      .subscribe();

    // Listen for NEW Tasks (Shared)
    const tasksChannel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          // Notify if it's a shared task and I didn't create it
          if (payload.new.is_shared && payload.new.created_by !== user.id) {
            handleNewEvent({
              type: 'task',
              title: 'Nueva Tarea de Equipo',
              body: payload.new.title,
              id: payload.new.id,
              data: payload.new
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [user?.id]);

  const handleNewEvent = (event: any) => {
    triggerHaptic('success');
    setActiveNotification(event);
    
    // Also push a native OS notification
    scheduleLocalNotification(event.title, {
       body: event.body,
       tag: event.id
    });

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
       setActiveNotification((prev: any) => prev?.id === event.id ? null : prev);
    }, 8000);
  };

  return (
    <AnimatePresence>
      {activeNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 20, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%' }}
          className="fixed top-0 left-1/2 z-[2000] w-[90%] max-w-sm bg-[#1a1622]/95 border border-purple-500/30 rounded-3xl shadow-2xl backdrop-blur-xl p-4 flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${activeNotification.type === 'order' ? 'bg-amber-500/20 text-amber-500' : 'bg-purple-500/20 text-purple-400'}`}>
             {activeNotification.type === 'order' ? <ClipboardList size={24} /> : <CheckCircle2 size={24} />}
          </div>
          
          <div className="flex-1 min-w-0">
             <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Bell size={12} className="animate-bounce" /> {activeNotification.title}
             </h4>
             <p className="text-[0.7rem] text-slate-400 font-medium truncate mt-0.5">{activeNotification.body}</p>
             <button 
               onClick={() => {
                 setActiveNotification(null);
                 if (activeNotification.type === 'order') navigate('/orders');
                 else navigate('/'); // Agenda
               }}
               className="text-[0.65rem] font-black text-purple-400 uppercase tracking-widest mt-2 flex items-center gap-1 hover:text-purple-300 transition-colors"
             >
                Ver Detalle <ExternalLink size={10} />
             </button>
          </div>

          <button 
            onClick={() => setActiveNotification(null)}
            className="p-2 text-slate-600 hover:text-white transition-colors"
          >
             <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
