import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthMonitor } from '../hooks/useHealthMonitor';

import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  BarChart2, 
  Activity,
  ShieldCheck,
  Timer,
  CheckCircle2,
  Star,
  Search,
  Filter,
  Trophy,
  CalendarDays,
  ChevronRight,
  Users,
  Target,
  Rocket,
  ShieldAlert,
  Info,
  Layers,
  Zap,
  Heart,
  FileText
} from 'lucide-react';
import UserOrdersModal from '../components/UserOrdersModal';
import { Skeleton, StatsSkeleton } from '../components/ui/Skeleton';
import { triggerHaptic } from '../utils/haptics';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { generateExecutiveReport } from '../services/ExecutiveReportService';


// ── Custom SVG Bar Component ──────────────────────────────────────
const BarChart = ({ data, color }: { data: { label: string, value: number }[], color: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-4 mt-6">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-4 group">
          <div className="flex-1 min-w-[120px] text-[0.65rem] font-black uppercase tracking-widest text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap group-hover:text-amber-400 transition-colors">
            {d.label}
          </div>
          <div className="flex-[3] h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 1.2, ease: 'circOut' }}
              className="h-full rounded-full"
              style={{ background: color }}
            />
          </div>
          <div className="flex-none w-20 text-xs font-black text-right text-slate-300 tabular-nums">
            ${d.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};



export default function Dashboard() {
  const navigate = useNavigate();
  const { orders, loading: ordersLoading } = useOrders();
  usePageTitle('Panel de Control');
  const { tasks, loading: tasksLoading } = useTasks();
  const { user, extendSandbox, deleteUserSandbox } = useAuth();
  const health = useHealthMonitor();
  
  const [activeTab, setActiveTab] = useState<'financial' | 'productivity'>('productivity');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'range' | 'global'>('global');
  const [rangeStart, setRangeStart] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [rangeEnd, setRangeEnd] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const [selectedDetailUser, setSelectedDetailUser] = useState<{ id: string, username: string } | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  const [expiringUsers, setExpiringUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showUserFilter, setShowUserFilter] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      const hasElevatedView = user?.isMaster || user?.role === 'Director General (CEO)' || user?.role === 'Gestor Administrativo' || user?.isAccountant || user?.isSupervisor;
      
      if (hasElevatedView) {
        const { data } = await supabase.from('profiles').select('id, username, full_name, avatar, role');
        if (data) {
          setAllUsers(data);
          setSelectedUserIds(data.map(u => u.id)); 
        }
      } else {
        if (user) {
          setSelectedUserIds([user.id]);
          const self = { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
          setAllUsers([self]);
        }
      }
    }
    fetchUsers();

    if (user?.isMaster || user?.role === 'Director General (CEO)') {
      const checkExpiring = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, sandbox_expiry')
          .not('sandbox_expiry', 'is', null);
        
        if (data) {
          const now = Date.now();
          const soon = data.filter(u => {
            const expiry = new Date(u.sandbox_expiry).getTime();
            const hoursLeft = (expiry - now) / (1000 * 3600);
            return hoursLeft < 24 && hoursLeft > -48;
          });
          setExpiringUsers(soon);
        }
      }
      checkExpiring();
    }
  }, [user]);

  useEffect(() => {
    setIsCalculating(true);
    const t = setTimeout(() => setIsCalculating(false), 600);
    return () => clearTimeout(t);
  }, [timeFilter, selectedUserIds]);

  const stats = useMemo(() => {
    const filterByTime = (itemDate: string) => {
      if (timeFilter === 'global') return true;
      const d = new Date(itemDate);
      if (timeFilter === 'range') {
        return isWithinInterval(d, { 
          start: new Date(rangeStart), 
          end: new Date(rangeEnd) 
        });
      }
      const days = timeFilter === '7d' ? 7 : 30;
      const limit = subDays(new Date(), days);
      return d >= limit;
    };

    const excludedUsers = ['miguel', 'flor', 'fernando', 'admin'];
    const financialOrders = orders.filter(o => {
      const isExcluded = excludedUsers.some(ex => (o.responsible || '').toLowerCase().includes(ex));
      return !isExcluded && o.recordType !== 'cotizacion' && filterByTime(o.createdAt);
    });

    const totalSales = financialOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalCollected = financialOrders.reduce((acc, o) => acc + (o.depositAmount || 0), 0);
    const totalPending = financialOrders.reduce((acc, o) => acc + (o.pendingBalance || 0), 0);

    const serviceMap: Record<string, number> = {};
    financialOrders.forEach(o => {
      o.services.forEach((s: string) => {
        serviceMap[s] = (serviceMap[s] || 0) + (o.totalCost / (o.services.length || 1));
      });
    });
    const serviceRanking = Object.entries(serviceMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // ANALISIS DE COTIZACIONES (Global - Sin filtro de tiempo por solicitud)
    const allQuotes = orders.filter(o => o.recordType === 'cotizacion');
    const quotesTotal = allQuotes.length;
    const quotesCancelled = allQuotes.filter(o => o.status === 'cancelada').length;
    const quotesConverted = orders.filter(o => 
      o.recordType === 'orden' && 
      o.history.some(h => h.description.includes('Cotización CONVERTIDA'))
    ).length;
    const quotesConversionRate = quotesTotal > 0 ? (quotesConverted / quotesTotal) * 100 : 0;
    const quotesCancelledRate = quotesTotal > 0 ? (quotesCancelled / quotesTotal) * 100 : 0;

    const targetIds = user?.isSuperAdmin ? selectedUserIds : [user?.id];
    
    const filteredTasks = tasks.filter(t => {
       const isUserMatch = targetIds.includes(t.userId || '');
       const isTask = !t.type || t.type === 'task';
       return isUserMatch && isTask && filterByTime(t.date);
    });

    const filteredOrders = orders.filter(o => {
       const isUserMatch = targetIds.includes(o.createdBy || '');
       return isUserMatch && filterByTime(o.createdAt);
    });

    const tasksTotal = filteredTasks.length;
    const tasksCompleted = filteredTasks.filter(t => t.completed || t.status === 'completed').length;
    const tasksCancelled = filteredTasks.filter(t => t.status === 'cancelled_with_reason' || t.status === 'declined').length;
    const tasksEfficiency = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

    const ordersTotal = filteredOrders.length;
    const ordersCompleted = filteredOrders.filter(o => o.status === 'completada').length;
    const ordersActive = filteredOrders.filter(o => ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status)).length;
    const ordersEfficiency = ordersTotal > 0 ? (ordersCompleted / (ordersTotal - ordersActive || 1)) * 100 : 0;

    const respMap: Record<string, { total: number, completed: number, collection: number, sales: number }> = {};
    filteredOrders.forEach(o => {
      const creator = allUsers.find(u => u.id === o.createdBy);
      const name = creator?.full_name || creator?.username || 'Sistema';
      
      if (!respMap[name]) respMap[name] = { total: 0, completed: 0, collection: 0, sales: 0 };
      respMap[name].total++;
      respMap[name].sales += o.totalCost;
      if (o.status === 'completada') respMap[name].completed++;
      respMap[name].collection += o.depositAmount;
    });

    const productivityRanking = Object.entries(respMap)
      .map(([label, data]) => {
        const efficiency = data.total > 0 ? (data.completed / data.total) * 100 : 0;
        // Algoritmo de Élite: (Ventas 40%) + (Recaudo 40%) + (Eficiencia 20%)
        // Normalizamos basado en el total del equipo para este periodo
        const salesScore = totalSales > 0 ? (data.sales / totalSales) * 40 : 0;
        const collectionScore = totalCollected > 0 ? (data.collection / totalCollected) * 40 : 0;
        const efficiencyScore = (efficiency / 100) * 20;
        const score = salesScore + collectionScore + efficiencyScore;

        return { 
          label, 
          value: data.total,
          completed: data.completed,
          efficiency,
          collection: data.collection,
          sales: data.sales,
          score
        };
      })
      .sort((a, b) => b.score - a.score);

    // Inteligencia Predictiva (Fase 15)
    // 1. SLA (Tiempo Medio de Ciclo en Horas)
    const completedWithDates = financialOrders.filter(o => o.status === 'completada' && o.completedAt);
    const totalCycleTime = completedWithDates.reduce((acc, o) => {
      const start = new Date(o.createdAt).getTime();
      const end = new Date(o.completedAt!).getTime();
      return acc + (end - start);
    }, 0);
    const avgSLA = completedWithDates.length > 0 ? (totalCycleTime / completedWithDates.length) / (1000 * 60 * 60) : 0;

    // 2. Retención de Clientes
    const customerMap: Record<string, number> = {};
    financialOrders.forEach(o => {
      customerMap[o.customerName] = (customerMap[o.customerName] || 0) + 1;
    });
    const recurringCustomers = Object.values(customerMap).filter(count => count > 1).length;
    const totalUniqueCustomers = Object.keys(customerMap).length || 1;
    const loyaltyRatio = (recurringCustomers / totalUniqueCustomers) * 100;

    // 3. Pronóstico Semanal (Forecast)
    // Determinamos el número de días en el filtro actual
    const daysInPeriod = timeFilter === 'global' ? 30 : timeFilter === '7d' ? 7 : 30;
    const dailyAvgSales = totalSales / daysInPeriod;
    const weeklyForecast = dailyAvgSales * 7;

    return { 
      totalSales, totalCollected, totalPending, serviceRanking, 
      productivityRanking, tasksTotal, tasksCompleted, tasksCancelled, tasksEfficiency,
      ordersTotal, ordersCompleted, ordersEfficiency,
      totalCount: orders.length || 1,
      avgSLA, loyaltyRatio, weeklyForecast,
      quotesTotal, quotesCancelled, quotesConverted, quotesConversionRate, quotesCancelledRate
    };
  }, [orders, tasks, selectedUserIds, user, allUsers, timeFilter, rangeStart, rangeEnd]);

  const handleGenerateReport = async () => {
    triggerHaptic('medium');
    try {
      const execStats = {
        period: timeFilter === 'global' ? 'Histórico Global' : timeFilter === '7d' ? 'Últimos 7 Días' : 'Últimos 30 Días',
        generatedBy: user?.full_name || user?.username || 'Administrador',
        financial: {
          totalSales: stats.totalSales,
          totalCollected: stats.totalCollected,
          totalPending: stats.totalPending,
          weeklyForecast: stats.weeklyForecast,
          quotesConversionRate: stats.quotesConversionRate
        },
        productivity: {
          tasksEfficiency: stats.tasksEfficiency,
          ordersEfficiency: stats.ordersEfficiency,
          avgSLA: stats.avgSLA,
          loyaltyRatio: stats.loyaltyRatio,
          ranking: stats.productivityRanking.map(p => ({
            label: p.label,
            score: p.score,
            efficiency: p.efficiency,
            sales: p.sales
          }))
        },
        administrative: {
          userCount: allUsers.length,
          onlineUsers: health.isOnline ? allUsers.length : 1, // Mock or real online count
          systemHealth: health.status as any
        }
      };
      await generateExecutiveReport(execStats as any);
      handleAction('success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      triggerHaptic('error');
    }
  };

  const toggleUser = (id: string) => {
    triggerHaptic('light');
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const loading = ordersLoading || tasksLoading;

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 animate-pulse space-y-8">
      <StatsSkeleton />
      <Skeleton width="100%" height={300} className="rounded-[40px]" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 animate-in fade-in duration-700">
      
      {/* v3.1: System Health Monitor (Real-time Audit) */}
      {(user?.isMaster || user?.role === 'Director General (CEO)') && (
        <div className="mb-10 p-0.5 rounded-[32px] bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-blue-500/10 border border-white/5">
          <div className="bg-[#0f0a15]/80 backdrop-blur-2xl rounded-[30px] p-6 flex flex-wrap items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${health.status === 'optimal' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : health.status === 'degraded' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`} />
                <div>
                   <h4 className="text-[0.6rem] font-black text-slate-500 uppercase tracking-[0.25em] leading-none mb-1">Salud del Ecosistema</h4>
                   <p className="text-sm font-black text-white uppercase tracking-tighter tabular-nums flex items-center gap-2">
                      {health.isOnline ? 'Online' : 'Sin Conexión'} · <span className="text-purple-400">{health.dbLatency}ms</span>
                   </p>
                </div>
             </div>

             <div className="flex gap-8 items-center">
                <div className="text-center sm:text-right">
                   <span className="text-[0.55rem] font-black text-slate-600 block uppercase mb-1">Carga Latente</span>
                   <div className="flex items-center gap-2 justify-end">
                      <div className="flex gap-0.5">
                         {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-1 h-3 rounded-full ${i <= (health.dbLatency < 100 ? 5 : health.dbLatency < 300 ? 3 : 1) ? 'bg-emerald-500' : 'bg-white/10'}`} />
                         ))}
                      </div>
                   </div>
                </div>
                <div className="text-right border-l border-white/5 pl-8">
                   <span className="text-[0.55rem] font-black text-slate-600 block uppercase mb-1">Sincronización</span>
                   <p className="text-[0.65rem] font-black text-slate-400 uppercase tabular-nums tracking-widest">{health.lastCheck}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* v3.1: Sandbox Expiration Alerts (Master Only) */}
      <AnimatePresence>
        {expiringUsers.length > 0 && (user?.isMaster || user?.role === 'Director General (CEO)') && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-[32px] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Timer size={22} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Alerta de Expiración Sandbox</h4>
                  <p className="text-[0.6rem] text-amber-500/70 font-black uppercase tracking-widest">Acción requerida · 72h Trial Control</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {expiringUsers.map(u => {
                  const hours = Math.round((new Date(u.sandbox_expiry).getTime() - Date.now()) / (1000 * 3600));
                  const isExpired = hours <= 0;

                  return (
                    <div key={u.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[0.6rem] font-black text-slate-400">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white">@{u.username}</span>
                          <p className={`text-[0.6rem] font-bold uppercase ${isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                            {isExpired ? 'EXPIRADO' : `Expira en ${hours}h`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={async () => {
                            try {
                              await extendSandbox(u.id, 3);
                              setExpiringUsers(prev => prev.filter(x => x.id !== u.id));
                            } catch (e) { console.error('Error al extender'); }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-[0.6rem] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                        >
                          Extender 3d
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`¿Seguro que deseas ELIMINAR permanentemente los datos de @${u.username}? Esta acción no se puede deshacer.`)) {
                              try {
                                await deleteUserSandbox(u.id);
                                setExpiringUsers(prev => prev.filter(x => x.id !== u.id));
                              } catch (e) { console.error('Error al liquidar'); }
                            }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-500/20 text-red-500 text-[0.6rem] font-black uppercase tracking-widest border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        >
                          Liquidar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <button 
             onClick={() => { triggerHaptic('light'); window.history.back(); }}
             className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-95"
             aria-label="Volver"
          >
             <ChevronRight size={18} className="rotate-180" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShieldCheck className="text-slate-900" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Executive Insight</h1>
              <p className="text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 opacity-60">
                <ShieldCheck size={14} className="text-purple-500" /> More Paper & Design · Inteligencia Gerencial
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {(user?.isMaster || user?.role === 'Director General (CEO)') && (
               <>
                 <button 
                   onClick={handleGenerateReport}
                   className="px-5 py-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 text-slate-950 text-[0.6rem] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-2"
                 >
                   <FileText size={14} /> Generar Informe
                 </button>
               </>

           )}
           <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
              <button 
                onClick={() => { triggerHaptic('light'); setActiveTab('productivity'); }}
                className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'productivity' ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
              >
                Productividad
              </button>
              {(user?.isMaster || user?.role === 'Director General (CEO)' || user?.role === 'Gestor Administrativo' || user?.isAccountant) && (
                <button 
                  onClick={() => { triggerHaptic('light'); setActiveTab('financial'); }}
                  className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'financial' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  Finanzas
                </button>
              )}
           </div>
        </div>
      </header>

      {/* v12.3: Elite Time Filter Control */}
      <div className="flex items-center gap-2 mb-8 bg-white/[0.02] border border-white/5 p-1 rounded-2xl w-fit">
        <button 
           onClick={() => { triggerHaptic('light'); setTimeFilter('7d'); }}
           className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${timeFilter === '7d' ? 'bg-slate-800 text-white border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <CalendarDays size={12} /> 7 Días
        </button>
        <button 
           onClick={() => { triggerHaptic('light'); setTimeFilter('30d'); }}
           className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${timeFilter === '30d' ? 'bg-slate-800 text-white border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <CalendarDays size={12} /> 30 Días
        </button>
        <button 
           onClick={() => { triggerHaptic('light'); setTimeFilter('range'); }}
           className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${timeFilter === 'range' ? 'bg-purple-600 text-white border border-white/10 shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Filter size={12} /> Rango Personalizado
        </button>
        <button 
           onClick={() => { triggerHaptic('light'); setTimeFilter('global'); }}
           className={`px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-tighter transition-all ${timeFilter === 'global' ? 'bg-slate-800 text-white border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Global
        </button>
      </div>

      <AnimatePresence>
        {timeFilter === 'range' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] lg:flex lg:items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/10"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Fecha Inicial</label>
              <input 
                type="date" 
                value={rangeStart} 
                onChange={e => setRangeStart(e.target.value)}
                title="Fecha Inicial"
                placeholder="AAAA-MM-DD"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="w-10 h-10 flex items-center justify-center text-slate-500 mt-6 hidden sm:flex">
              <ChevronRight />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Fecha Final</label>
              <input 
                type="date" 
                value={rangeEnd} 
                onChange={e => setRangeEnd(e.target.value)}
                title="Fecha Final"
                placeholder="AAAA-MM-DD"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="w-full sm:w-auto mt-auto">
               <button 
                 onClick={() => triggerHaptic('medium')}
                 className="w-full px-8 py-3.5 bg-purple-500 text-slate-950 font-black text-[0.65rem] uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-105 transition-all active:scale-95"
               >
                 Actualizar Reporte
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'productivity' ? (
          <motion.div key="prod" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
            
            {(user?.isMaster || user?.role === 'Director General (CEO)' || user?.role === 'Gestor Administrativo' || user?.isAccountant || user?.isSupervisor) && (
              <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                     <Filter size={14} /> Filtro Dinámico de Reporte
                   </h3>
                   <button 
                     onClick={() => setShowUserFilter(!showUserFilter)}
                     className="text-[0.6rem] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-2"
                   >
                     {showUserFilter ? 'Ocultar Lista' : 'Elegir Usuarios'} <Search size={12} />
                   </button>
                </div>

                {showUserFilter && (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 animate-in slide-in-from-top-2 duration-300">
                    {allUsers.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[0.6rem] font-bold transition-all ${selectedUserIds.includes(u.id) ? 'bg-purple-500/20 border-purple-500/40 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                      >
                         <div className="w-5 h-5 rounded-md bg-black/20 flex items-center justify-center text-[0.5rem]">{u.avatar?.length === 1 ? u.avatar : '👤'}</div>
                         <span className="truncate">@{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[0.6rem] text-slate-600 font-medium italic mt-4">Analizando {selectedUserIds.length} usuarios seleccionados dinámica para el reporte grupal.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => { triggerHaptic('light'); setSelectedMetric('eficacia_agenda'); }}
                 className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group text-left"
               >
                  <div className="absolute -right-4 -top-4 text-purple-500/5 group-hover:scale-110 transition-transform"><CheckCircle2 size={100} /></div>
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                    Eficacia Agenda <Info size={10} className="text-purple-500 opacity-40" />
                  </span>
                  <div className="text-4xl font-black text-white tabular-nums mb-1">{stats.tasksEfficiency.toFixed(1)}%</div>
                  <div className="text-[0.6rem] font-bold text-slate-600 uppercase italic">Basado en {stats.tasksTotal} tareas</div>
               </motion.button>

               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => { triggerHaptic('light'); setSelectedMetric('cierre_ordenes'); }}
                 className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group text-left"
               >
                  <div className="absolute -right-4 -top-4 text-emerald-500/5 group-hover:scale-110 transition-transform"><Timer size={100} /></div>
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                    Cierre de Órdenes <Info size={10} className="text-emerald-500 opacity-40" />
                  </span>
                  <div className="text-4xl font-black text-white tabular-nums mb-1">{stats.ordersEfficiency.toFixed(1)}%</div>
                  <div className="text-[0.6rem] font-bold text-slate-600 uppercase italic">{stats.ordersCompleted} finalizadas de {stats.ordersTotal}</div>
               </motion.button>

               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => { triggerHaptic('light'); setSelectedMetric('fuerza_operativa'); }}
                 className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group text-left"
               >
                  <div className="absolute -right-4 -top-4 text-amber-500/5 group-hover:scale-110 transition-transform"><Star size={100} /></div>
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                    Fuerza Operativa <Info size={10} className="text-amber-500 opacity-40" />
                  </span>
                  <div className="text-4xl font-black text-white tabular-nums mb-1">{((stats.tasksCompleted + stats.ordersCompleted) || 0).toFixed(0)}</div>
                  <div className="text-[0.6rem] font-bold text-slate-600 uppercase italic">Índice total de impacto</div>
               </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <motion.button 
                 whileHover={{ scale: 1.01 }}
                 whileTap={{ scale: 0.99 }}
                 onClick={() => { triggerHaptic('light'); setSelectedMetric('distribucion_agenda'); }}
                 className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col items-center text-center group relative overflow-hidden"
               >
                  <div className="absolute top-4 right-6 text-slate-700 opacity-20 group-hover:text-purple-500 transition-colors"><Info size={16} /></div>
                  <h4 className="text-[0.65rem] font-black text-white uppercase tracking-widest mb-6 border-b border-purple-500/20 pb-2">Distribución Grupal de Agenda</h4>
                  <div className="grid grid-cols-2 gap-8 w-full">
                    <div className="space-y-1">
                      <div className="text-2xl font-black text-emerald-400">{stats.tasksCompleted}</div>
                      <div className="text-[0.55rem] font-bold text-slate-500 uppercase">Completadas</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-black text-red-400">{stats.tasksCancelled}</div>
                      <div className="text-[0.55rem] font-bold text-slate-500 uppercase">Perdidas</div>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full mt-8 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.tasksEfficiency}%` }} className="h-full bg-purple-500 shadow-lg shadow-purple-500/40" />
                  </div>
               </motion.button>

               <motion.button 
                 whileHover={{ scale: 1.01 }}
                 whileTap={{ scale: 0.99 }}
                 onClick={() => { triggerHaptic('light'); setSelectedMetric('rendimiento_operativo'); }}
                 className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 text-left group relative overflow-hidden"
               >
                  <div className="absolute top-4 right-6 text-slate-700 opacity-20 group-hover:text-emerald-500 transition-colors"><Info size={16} /></div>
                  <h4 className="text-[0.65rem] font-black text-white uppercase tracking-widest mb-6 border-b border-emerald-500/20 pb-2 text-center">Rendimiento Operativo</h4>
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between text-[0.6rem] font-black text-slate-500 mb-1">
                           <span>EFICIENCIA ÚLTIMO MES (REAL)</span>
                           <span className="text-emerald-400">{(stats.ordersEfficiency).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${stats.ordersEfficiency}%` }} className="h-full bg-emerald-500" />
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[0.6rem] font-black text-slate-500 mb-1">
                           <span>CUMPLIMIENTO DE TIEMPOS</span>
                           <span className="text-purple-400">{stats.tasksEfficiency.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${stats.tasksEfficiency}%` }} className="h-full bg-purple-500" />
                        </div>
                     </div>
                  </div>
               </motion.button>
            </div>

            {/* v4.0: Módulo de Cotizaciones & Inteligencia Predictiva */}
            {(user?.isMaster || user?.role === 'Director General (CEO)' || user?.role === 'Gestor Administrativo' || user?.isAccountant || user?.isSupervisor) && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <motion.button 
                   whileHover={{ y: -5 }}
                   onClick={() => { triggerHaptic('light'); setSelectedMetric('cumplimiento_cotizaciones'); }}
                   className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-500/20 rounded-[32px] p-8 backdrop-blur-xl group text-left relative overflow-hidden"
                 >
                    <div className="absolute -right-4 -top-4 text-amber-500/5 group-hover:scale-110 transition-transform"><Layers size={140} /></div>
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                          <Layers size={24} />
                       </div>
                       <div>
                         <h4 className="text-[0.7rem] font-black text-white uppercase tracking-widest leading-none">Cumplimiento Cotizaciones</h4>
                         <p className="text-[0.6rem] text-slate-500 font-bold uppercase mt-1">Análisis Global de Conversión</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                       <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                          <span className="text-[0.55rem] font-black text-slate-500 block uppercase mb-1">Total Generadas</span>
                          <span className="text-2xl font-black text-white tabular-nums">{stats.quotesTotal}</span>
                       </div>
                       <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                          <span className="text-[0.55rem] font-black text-emerald-500 block uppercase mb-1">Convertidas (OS)</span>
                          <span className="text-2xl font-black text-emerald-400 tabular-nums">{stats.quotesConverted}</span>
                       </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                       <div className="flex justify-between items-end">
                          <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-tighter italic">Ratio de Éxito de Venta</span>
                          <span className="text-lg font-black text-amber-500 tabular-nums">{stats.quotesConversionRate.toFixed(1)}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${stats.quotesConversionRate}%` }} className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                       </div>
                    </div>
                 </motion.button>

                 <div className="grid grid-cols-1 gap-6">
                    <motion.button 
                      whileHover={{ x: 5 }}
                      onClick={() => { triggerHaptic('light'); setSelectedMetric('sla_eficiencia'); }}
                      className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 flex items-center justify-between group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                             <Zap size={22} />
                          </div>
                          <div className="text-left">
                             <h4 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">SLA de Entrega</h4>
                             <span className="text-2xl font-black text-white tabular-nums">{stats.avgSLA.toFixed(1)}h</span>
                          </div>
                       </div>
                       <ChevronRight size={20} className="text-slate-700 group-hover:text-blue-400 transition-colors" />
                    </motion.button>

                    <motion.button 
                      whileHover={{ x: 5 }}
                      onClick={() => { triggerHaptic('light'); setSelectedMetric('lealtad_retencion'); }}
                      className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 flex items-center justify-between group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                             <Heart size={22} />
                          </div>
                          <div className="text-left">
                             <h4 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">Lealtad Clientes</h4>
                             <span className="text-2xl font-black text-white tabular-nums">{stats.loyaltyRatio.toFixed(0)}%</span>
                          </div>
                       </div>
                       <ChevronRight size={20} className="text-slate-700 group-hover:text-emerald-400 transition-colors" />
                    </motion.button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.button 
                  whileHover={{ y: -5 }} 
                  onClick={() => { triggerHaptic('light'); setSelectedMetric('forecast_7d'); }}
                  className="bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/20 rounded-[32px] p-6 backdrop-blur-xl group md:col-span-3 text-left relative overflow-hidden"
                >
                   <div className="absolute right-10 top-1/2 -translate-y-1/2 text-purple-500/5 group-hover:scale-125 transition-transform"><TrendingUp size={120} /></div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <Rocket size={24} />
                         </div>
                         <div>
                            <h4 className="text-[0.7rem] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">Impacto Predictivo (Forecast)</h4>
                            <p className="text-[0.6rem] text-purple-500/60 font-black uppercase tracking-widest italic">Proyección Analítica Próximos 7 Días</p>
                         </div>
                      </div>
                      <div className="flex flex-col sm:items-end">
                         <span className="text-4xl font-black text-white tabular-nums tracking-tighter">${stats.weeklyForecast.toLocaleString()}</span>
                         <span className="text-[0.65rem] text-slate-500 font-bold uppercase mt-1">Potencial de Venta Semanal</span>
                      </div>
                   </div>
                   <div className="mt-6 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-[0.5rem] font-black text-purple-500 uppercase tracking-[0.2em]">Cálculo basado en tendencia histórica del periodo seleccionado</span>
                   </div>
                </motion.button>
              </div>
              </>
            )}

            <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] shadow-lg">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <Trophy className="text-amber-500" size={20} />
                    <h4 className="text-lg font-black text-white tracking-tight uppercase">Ranking de Productividad</h4>
                 </div>
                 <span className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">
                    {timeFilter === 'global' ? 'Todo el tiempo' : timeFilter === '7d' ? 'Últimos 7 días' : 'Último mes'}
                 </span>
              </div>
              <div className="grid gap-3">
                {stats.productivityRanking.filter(p => {
                  const hasElevatedView = user?.isMaster || user?.role === 'Director General (CEO)' || user?.role === 'Gestor Administrativo' || user?.isAccountant || user?.isSupervisor;
                  if (hasElevatedView) return true;
                  return p.label.toLowerCase() === user?.username?.toLowerCase();
                }).map((p, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                        triggerHaptic('light');
                        setSelectedDetailUser({ id: p.label, username: p.label });
                    }}
                    className={`w-full flex justify-between items-center p-5 rounded-[32px] border transition-all group active:scale-[0.98] ${
                      i === 0 ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 
                      i === 1 ? 'bg-slate-300/10 border-slate-300/30' :
                      i === 2 ? 'bg-amber-800/10 border-amber-800/30' : 'bg-black/30 border-white/5 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105 duration-500 ${
                          i === 0 ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 
                          i === 1 ? 'bg-slate-300 text-slate-900' :
                          i === 2 ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {(p.label || 'U').charAt(0).toUpperCase()}
                        </div>
                        {i < 3 && (
                          <div className="absolute -top-3 -right-3 bg-slate-950 rounded-full p-1.5 border border-white/10 shadow-xl">
                            <Trophy size={14} className={i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-300' : 'text-amber-600'} />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-white uppercase tracking-tight">@{p.label}</span>
                           {i < 3 && <span className={`text-[0.55rem] font-black uppercase px-2 py-0.5 rounded-full ${i === 0 ? 'bg-amber-500/20 text-amber-500' : i === 1 ? 'bg-slate-300/20 text-slate-300' : 'bg-amber-800/20 text-amber-500'}`}>ELITE #{i+1}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                             <span className="text-[0.55rem] text-slate-400 font-black uppercase">{p.value} ÓRDENES</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[0.55rem] text-emerald-400 font-bold uppercase">{p.efficiency.toFixed(0)}% ÉXITO</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-60">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                             <span className="text-[0.55rem] text-slate-500 font-bold uppercase">SCORE: {p.score.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-black text-white tabular-nums tracking-tighter leading-none">${p.sales.toLocaleString()}</div>
                        <div className="text-[0.55rem] font-black text-slate-500 uppercase tracking-widest mt-1.5 group-hover:text-emerald-400 transition-colors">Ventas Brutas</div>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-purple-500 group-hover:text-slate-900 transition-all">
                         <ChevronRight size={20} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

          </motion.div>
        ) : (
          <motion.div key="fin" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 hover:border-amber-500/30 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 text-amber-500/10 group-hover:text-amber-500/20 transition-colors"><TrendingUp size={80} /></div>
                <span className="text-[0.6rem] font-black tracking-[0.25em] text-slate-500 block mb-4">VENTAS BRUTAS</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-500 text-lg font-bold">$</span>
                  <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{stats.totalSales.toLocaleString()}</h3>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] p-8 hover:border-emerald-500/40 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors"><Wallet size={80} /></div>
                <span className="text-[0.6rem] font-black tracking-[0.25em] text-emerald-500/60 block mb-4 uppercase">Recaudado (Caja)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-emerald-500/40 text-lg font-bold">$</span>
                  <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{stats.totalCollected.toLocaleString()}</h3>
                </div>
              </div>

              <div className="md:col-span-2 bg-[#d4bc8f]/10 border border-[#d4bc8f]/30 rounded-[40px] p-8 hover:bg-[#d4bc8f]/15 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-[#d4bc8f]/10"><CreditCard size={100} /></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                  <div>
                    <span className="text-[0.65rem] font-black tracking-[0.3em] text-[#d4bc8f] block mb-2 uppercase">Cartera por cobrar</span>
                    <h3 className="text-5xl font-black text-white tracking-tighter tabular-nums">$ {stats.totalPending.toLocaleString()}</h3>
                  </div>
                  <div className="bg-black/20 p-4 rounded-3xl border border-white/5 backdrop-blur-xl md:w-48 text-center sm:text-right">
                     <span className="text-[0.55rem] font-black text-slate-400 block mb-1 uppercase tracking-widest leading-none">Riesgo Financiero</span>
                     <div className="text-xl font-black text-[#d4bc8f]">{((stats.totalPending / (stats.totalSales || 1)) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>

            <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] shadow-lg">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <BarChart2 className="text-amber-500" size={20} /> Ranking de Servicios
                  </h4>
                  <p className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-widest mt-1">Ingresos brutos por rubro especializado</p>
                </div>
              </div>
              <BarChart data={stats.serviceRanking} color="#f59e0b" />
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-16 text-center text-slate-600 space-y-2">
        <Activity className="mx-auto opacity-20" size={24} />
        <p className="text-[0.6rem] font-black uppercase tracking-[0.2em]">SISTEMA ANALÍTICO More Paper & Design · CLOUD LOGIC v2.0</p>
      </footer>

      <UserOrdersModal 
        isOpen={!!selectedDetailUser}
        onClose={() => setSelectedDetailUser(null)}
        userName={selectedDetailUser?.username || ''}
        orders={orders.filter(o => {
          const resp = (o.responsible || '').toLowerCase();
          const target = selectedDetailUser?.username?.toLowerCase();
          return resp === target || (o.createdBy || '').toLowerCase() === target;
        })}
      />

      <MetricDetailModal
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
      />
    </div>
  );
}

// ── Metric Detail Modal (Analytic Drill-down) ───────────────────────
function MetricDetailModal({ metric, onClose }: { metric: string | null, onClose: () => void }) {
  if (!metric) return null;

  const metricInfo: Record<string, { title: string, icon: any, color: string, tech: string, strategy: string, formula: string }> = {
    eficacia_agenda: {
      title: 'Eficacia de Agenda',
      icon: <CheckCircle2 size={24} />,
      color: 'text-purple-400',
      tech: 'Calculado como el ratio porcentual entre tareas marcadas como completadas y el total de tareas asignadas para el periodo seleccionado.',
      strategy: 'Mide la capacidad de cumplimiento del equipo en su planificación diaria. Una eficacia baja indica cuellos de botella en la gestión del tiempo.',
      formula: '(Tareas Completadas / Tareas Totales) * 100'
    },
    cierre_ordenes: {
      title: 'Cierre de Órdenes',
      icon: <Timer size={24} />,
      color: 'text-emerald-400',
      tech: 'Ratio entre órdenes en estado "Completada" vs órdenes que no están en estados activos (Recibida/Proceso). Excluye órdenes en cola.',
      strategy: 'Indica la velocidad de conversión de trabajo en curso a producto finalizado. Vital para medir la liquidez operativa del taller.',
      formula: '(OS Completadas / (OS Totales - OS Activas)) * 100'
    },
    fuerza_operativa: {
      title: 'Fuerza Operativa',
      icon: <Star size={24} />,
      color: 'text-amber-400',
      tech: 'Índice absoluto que suma el volumen total de tareas finalizadas y órdenes de servicio despachadas en el periodo.',
      strategy: 'Representa el "músculo" real de la empresa. Cuanto más alto es este valor, mayor es la carga de trabajo que el sistema está procesando con éxito.',
      formula: 'Tareas Completadas + OS Completadas'
    },
    rendimiento_operativo: {
      title: 'Rendimiento Operativo Real',
      icon: <Zap size={24} />,
      color: 'text-blue-400',
      tech: 'Métrica comparativa que analiza la eficiencia de cierre de órdenes vs el cumplimiento de tiempos de la agenda.',
      strategy: 'Permite al CEO visualizar si la rapidez en cerrar pedidos está alineada con la disciplina académica de la agenda interna.',
      formula: 'Análisis Multivariante (Sin márgenes de error artificiales)'
    },
    cumplimiento_cotizaciones: {
      title: 'Cumplimiento de Cotizaciones',
      icon: <Layers size={24} />,
      color: 'text-amber-500',
      tech: 'Análisis global (sin filtro de tiempo) de la conversión de documentos proforma a órdenes de servicio reales.',
      strategy: 'KPI crítico del área comercial. Permite identificar si el precio o la oferta comercial está alineada con la expectativa del cliente.',
      formula: '(OS Originadas en Cotiz / Total Cotizaciones) * 100'
    },
    sla_eficiencia: {
      title: 'SLA (Service Level Agreement)',
      icon: <ShieldAlert size={24} />,
      color: 'text-blue-500',
      tech: 'Tiempo medio transcurrido entre la creación de la orden y su fecha de finalización real en el sistema.',
      strategy: 'Garantiza la promesa de valor al cliente. Tiempos superiores a 72h requieren intervención en la cadena de suministros.',
      formula: 'Σ(Fecha_Final - Fecha_Inicio) / Total OS Completadas'
    },
    lealtad_retencion: {
      title: 'Lealtad y Retención',
      icon: <ChevronRight size={24} />,
      color: 'text-emerald-500',
      tech: 'Porcentaje de clientes únicos que han realizado más de una orden de servicio en el periodo histórico analizado.',
      strategy: 'Cuesta 5 veces más conseguir un cliente nuevo que retener a uno actual. Un ratio alto indica excelencia en el servicio post-venta.',
      formula: '(Clientes Recurrentes / Clientes Únicos) * 100'
    },
    forecast_7d: {
      title: 'Pronóstico Analítico (Forecast)',
      icon: <Rocket size={24} />,
      color: 'text-purple-500',
      tech: 'Algoritmo predictivo basado en la media diaria de ventas del periodo actual, proyectado a una semana de 7 días.',
      strategy: 'Permite al CEO anticipar flujos de caja y tomar decisiones de inversión o ahorro preventivo.',
      formula: '(Ventas Periodo / Días Periodo) * 7'
    }
  };

  const info = metricInfo[metric] || metricInfo['eficacia_agenda'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-[#0f0a15]/95 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1a1622] w-full max-w-lg border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative z-10"
      >
        <div className="p-8 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${info.color}`}>
                   {info.icon}
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">{info.title}</h2>
                    <p className="text-[0.6rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Análisis de Profundidad CEO</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                ✕
              </button>
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                 <h4 className="flex items-center gap-2 text-[0.65rem] font-black text-white uppercase tracking-widest">
                   <Target size={14} className="text-purple-500" /> Enfoque Estratégico
                 </h4>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">
                   {info.strategy}
                 </p>
              </div>

              <div className="space-y-3 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                 <h4 className="flex items-center gap-2 text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">
                   <ShieldAlert size={14} className="text-blue-500" /> Detalle Técnico y Algoritmo
                 </h4>
                 <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                   {info.tech}
                 </p>
                 <div className="mt-4 pt-4 border-t border-white/5">
                   <span className="text-[0.55rem] font-black text-slate-600 uppercase block mb-1">Fórmula Aplicada</span>
                   <code className="text-[0.65rem] text-purple-400 font-black bg-purple-500/5 px-3 py-1 rounded-lg">
                     {info.formula}
                   </code>
                 </div>
              </div>
           </div>

           <button 
             onClick={onClose}
             className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black text-[0.65rem] uppercase tracking-widest rounded-2xl transition-all border border-white/5"
           >
             Entendido, Continuar Monitoreo
           </button>
        </div>
      </motion.div>
    </div>
  );
}
