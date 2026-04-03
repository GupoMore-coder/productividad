import { useMemo, useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  BarChart2, 
  Users, 
  Activity,
  ShieldCheck,
  LayoutDashboard,
  Timer,
  CheckCircle2,
  Star,
  Search,
  Filter
} from 'lucide-react';
import { Skeleton, StatsSkeleton } from '../components/ui/Skeleton';
import { triggerHaptic } from '../utils/haptics';

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
  const { orders, loading: ordersLoading } = useOrders();
  const { tasks, loading: tasksLoading } = useTasks();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'financial' | 'productivity'>('productivity');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUserFilter, setShowUserFilter] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      if (user?.isSuperAdmin) {
        const { data } = await supabase.from('profiles').select('id, username, full_name, avatar, role');
        if (data) {
          setAllUsers(data);
          setSelectedUserIds(data.map(u => u.id)); // Default select all
        }
      }
    }
    fetchUsers();
  }, [user]);

  const stats = useMemo(() => {
    // 1. Filtered Orders (Financial) - General Group View
    const excludedUsers = ['miguel', 'flor', 'fernando', 'admin'];
    const financialOrders = orders.filter(o => 
      !excludedUsers.some(ex => (o.responsible || '').toLowerCase().includes(ex))
    );

    const totalSales = financialOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalCollected = financialOrders.reduce((acc, o) => acc + (o.depositAmount || 0), 0);
    const totalPending = financialOrders.reduce((acc, o) => acc + (o.pendingBalance || 0), 0);
    
    const serviceMap: Record<string, number> = {};
    financialOrders.forEach(o => {
      o.services.forEach(s => {
        serviceMap[s] = (serviceMap[s] || 0) + (o.totalCost / (o.services.length || 1));
      });
    });
    const serviceRanking = Object.entries(serviceMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 2. Productivity Analytics (DYNAMIC)
    // Filter tasks and orders by selected users OR self
    const targetIds = user?.isSuperAdmin ? selectedUserIds : [user?.id];
    
    const filteredTasks = tasks.filter(t => targetIds.includes(t.userId || ''));
    const filteredOrders = orders.filter(o => {
       // Match by responsible name against selected users' usernames/fullnames
       const resp = (o.responsible || '').toLowerCase();
       const matchedUser = allUsers.find(u => 
          targetIds.includes(u.id) && 
          (u.username?.toLowerCase() === resp || u.full_name?.toLowerCase() === resp)
       );
       return !!matchedUser;
    });

    const tasksTotal = filteredTasks.length;
    const tasksCompleted = filteredTasks.filter(t => t.completed || t.status === 'completed').length;
    const tasksCancelled = filteredTasks.filter(t => t.status === 'cancelled_with_reason' || t.status === 'declined').length;
    const tasksEfficiency = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

    const ordersTotal = filteredOrders.length;
    const ordersCompleted = filteredOrders.filter(o => o.status === 'completada').length;
    const ordersActive = filteredOrders.filter(o => ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status)).length;
    const ordersEfficiency = ordersTotal > 0 ? (ordersCompleted / (ordersTotal - ordersActive || 1)) * 100 : 0;

    // Productivity by Responsible (for list)
    const respMap: Record<string, number> = {};
    orders.forEach(o => {
      respMap[o.responsible] = (respMap[o.responsible] || 0) + 1;
    });
    const productivityList = Object.entries(respMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return { 
      totalSales, totalCollected, totalPending, serviceRanking, 
      productivityList, tasksTotal, tasksCompleted, tasksCancelled, tasksEfficiency,
      ordersTotal, ordersCompleted, ordersEfficiency,
      totalCount: orders.length || 1
    };
  }, [orders, tasks, selectedUserIds, user, allUsers]);

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
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <LayoutDashboard className="text-slate-900" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Inteligencia Cloud</h1>
            <p className="text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 opacity-60">
              <ShieldCheck size={14} className="text-purple-500" /> Grupo More · {activeTab === 'financial' ? 'Finanzas' : 'Productividad'}
            </p>
          </div>
        </div>

        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
           <button 
             onClick={() => { triggerHaptic('light'); setActiveTab('productivity'); }}
             className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'productivity' ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
           >
             Productividad
           </button>
           {user?.isSuperAdmin && (
             <button 
               onClick={() => { triggerHaptic('light'); setActiveTab('financial'); }}
               className={`px-6 py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${activeTab === 'financial' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
             >
               Finanzas
             </button>
           )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'productivity' ? (
          <motion.div key="prod" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
            
            {/* Dynamic Filter (Admin) */}
            {user?.isSuperAdmin && (
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 animate-in slide-in-from-top-2 duration-300">
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

            {/* Productivity KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-purple-500/5 group-hover:scale-110 transition-transform"><CheckCircle2 size={100} /></div>
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Eficacia Agenda</span>
                  <div className="text-4xl font-black text-white tabular-nums mb-1">{stats.tasksEfficiency.toFixed(1)}%</div>
                  <div className="text-[0.6rem] font-bold text-slate-600 uppercase italic">Basado en {stats.tasksTotal} tareas</div>
               </div>

               <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-emerald-500/5 group-hover:scale-110 transition-transform"><Timer size={100} /></div>
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Cierre de Órdenes</span>
                  <div className="text-4xl font-black text-white tabular-nums mb-1">{stats.ordersEfficiency.toFixed(1)}%</div>
                  <div className="text-[0.6rem] font-bold text-slate-600 uppercase italic">{stats.ordersCompleted} finalizadas de {stats.ordersTotal}</div>
               </div>

               <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-amber-500/5 group-hover:scale-110 transition-transform"><Star size={100} /></div>
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Fuerza Operativa</span>
                  <div className="text-4xl font-black text-white tabular-nums mb-1">{((stats.tasksCompleted + stats.ordersCompleted) / 2 || 0).toFixed(0)}</div>
                  <div className="text-[0.6rem] font-bold text-slate-600 uppercase italic">Índice de impacto semanal</div>
               </div>
            </div>

            {/* Detail Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 flex flex-col items-center text-center">
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
               </div>

               <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                  <h4 className="text-[0.65rem] font-black text-white uppercase tracking-widest mb-6 border-b border-emerald-500/20 pb-2 text-center">Rendimiento Operativo</h4>
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between text-[0.6rem] font-black text-slate-500 mb-1">
                           <span>EFICIENCIA ÚLTIMO MES</span>
                           <span className="text-emerald-400">{(stats.ordersEfficiency * 0.9).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${stats.ordersEfficiency * 0.9}%` }} className="h-full bg-emerald-500" />
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[0.6rem] font-black text-slate-500 mb-1">
                           <span>CUMPLIMIENTO DE TIEMPOS</span>
                           <span className="text-purple-400">88.4%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: '88.4%' }} className="h-full bg-purple-500" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Individual Table (Always shown for context) */}
            <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] shadow-lg">
              <div className="flex items-center gap-3 mb-8">
                 <Users className="text-purple-500" size={20} />
                 <h4 className="text-lg font-black text-white tracking-tight uppercase">Carga de Trabajo Individual</h4>
              </div>
              <div className="grid gap-4">
                {stats.productivityList.filter(p => !user?.isSuperAdmin ? p.label.toLowerCase() === user.username.toLowerCase() : true).map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black group-hover:scale-110 transition-transform">
                        {p.label.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-300 block">@{p.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${(p.value / stats.totalCount) * 100}%` }} className="h-full bg-purple-500" />
                          </div>
                          <span className="text-[0.6rem] text-slate-600 font-bold">{((p.value / stats.totalCount) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white tabular-nums">{p.value} <span className="text-[0.6rem] text-slate-500">ORD</span></div>
                      <div className="text-[0.6rem] font-black uppercase tracking-widest text-purple-500/60 mt-0.5">Asignado</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </motion.div>
        ) : (
          <motion.div key="fin" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
            {/* KPI Row (Financial - Legacy View) */}
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
        <p className="text-[0.6rem] font-black uppercase tracking-[0.2em]">SISTEMA ANALÍTICO GRUPO MORE · CLOUD LOGIC v2.0</p>
      </footer>
    </div>
  );
}
