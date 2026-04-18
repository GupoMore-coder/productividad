import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Calendar, 
  Eye,
  EyeOff,
  User,
  ExternalLink,
  FileText,
  Rocket
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { triggerHaptic } from '../utils/haptics';
import { useNavigate } from 'react-router-dom';

interface GlobalAlert {
  id: string;
  type: string;
  order_id: string;
  user_id: string;
  user_name: string;
  message: string;
  seen_by: string[];
  created_at: string;
}

export default function GlobalActivityFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  useEffect(() => {
    fetchAlerts();

    // Real-time subscription
    const channel = supabase
      .channel('global_feed_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_alerts' },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('global_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching alerts:', error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const markAsSeen = async (alertId: string, currentSeenBy: string[]) => {
    if (!user || currentSeenBy.includes(user.id)) return;
    
    triggerHaptic('light');
    const updatedSeenBy = [...currentSeenBy, user.id];
    
    const { error } = await supabase
      .from('global_alerts')
      .update({ seen_by: updatedSeenBy })
      .eq('id', alertId);

    if (error) console.error('Error marking as seen:', error);
    else {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, seen_by: updatedSeenBy } : a));
    }
  };

  const markAllAsSeen = async () => {
    if (!user) return;
    triggerHaptic('medium');
    
    // We update all alerts that don't have the user ID in seen_by
    for (const alert of alerts) {
      if (!alert.seen_by.includes(user.id)) {
        await markAsSeen(alert.id, alert.seen_by);
      }
    }
    fetchAlerts();
  };

  const filteredAlerts = showOnlyUnread && user
    ? alerts.filter(a => !a.seen_by.includes(user.id))
    : alerts;

  const getIcon = (type: string, message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('💰') || msg.includes('precio')) return <CreditCard size={16} className="text-amber-400" />;
    if (msg.includes('📅') || msg.includes('fecha')) return <Calendar size={16} className="text-purple-400" />;
    if (msg.includes('💵') || msg.includes('abono')) return <CreditCard size={16} className="text-emerald-400" />;
    if (msg.includes('✅') || msg.includes('completada') || msg.includes('convertida')) return <CheckCircle2 size={16} className="text-emerald-500" />;
    if (msg.includes('🚀') || msg.includes('oficial')) return <Rocket size={16} className="text-purple-500" />;
    if (msg.includes('🚨') || msg.includes('cancelada')) return <AlertTriangle size={16} className="text-red-500" />;
    if (msg.includes('cotización')) return <FileText size={16} className="text-blue-400" />;
    return <Bell size={16} className="text-blue-400" />;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="text-slate-500" size={18} />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Actividad Reciente</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { triggerHaptic('light'); setShowOnlyUnread(!showOnlyUnread); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-tighter transition-all ${showOnlyUnread ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20' : 'bg-white/5 text-slate-500 hover:text-white'}`}
          >
            {showOnlyUnread ? <EyeOff size={12} /> : <Eye size={12} />}
            {showOnlyUnread ? 'Solo No Leídos' : 'Ver Todos'}
          </button>
          
          {alerts.some(a => user && !a.seen_by.includes(user.id)) && (
            <button 
              onClick={markAllAsSeen}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[0.6rem] font-black uppercase tracking-tighter text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              Leídos Todos
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[32px]"
            >
              <Bell className="mx-auto mb-3 text-slate-800" size={32} />
              <p className="text-xs font-medium text-slate-600 uppercase tracking-widest">No hay actividad nueva por ahora.</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => {
              const isUnread = user && !alert.seen_by.includes(user.id);
              
              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative group p-4 rounded-2xl border transition-all cursor-pointer ${
                    isUnread 
                      ? 'bg-gradient-to-tr from-purple-500/10 to-transparent border-purple-500/30' 
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                  }`}
                  onClick={() => markAsSeen(alert.id, alert.seen_by)}
                >
                  {isUnread && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
                      isUnread ? 'bg-purple-500/20 border-purple-500/20' : 'bg-white/5 border-white/5'
                    }`}>
                      {getIcon(alert.type, alert.message)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="text-[0.6rem] font-black text-slate-600 uppercase tracking-[0.15em] flex items-center gap-1.5">
                          <User size={10} className="text-slate-700" />
                          {alert.user_name || 'Sistema'} · {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: es })}
                        </span>
                        
                        {alert.order_id && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              navigate(`/pedidos/${alert.order_id}`);
                            }}
                            className="text-[0.6rem] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center gap-1"
                          >
                            #{alert.order_id.slice(-6).toUpperCase()} <ExternalLink size={10} />
                          </button>
                        )}
                      </div>

                      <p className={`text-xs font-bold leading-relaxed ${isUnread ? 'text-white' : 'text-slate-400'}`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="pt-4 border-t border-white/5">
        <p className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.2em] text-center">
          Mostrando los últimos 50 eventos globales sincronizados en tiempo real
        </p>
      </div>
    </div>
  );
}
