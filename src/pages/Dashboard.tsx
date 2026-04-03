import { useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Target, 
  BarChart2, 
  Users, 
  PieChart, 
  Activity,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Skeleton, StatsSkeleton } from '../components/ui/Skeleton';

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

// ── Custom SVG Pie Component ─────────────────────────────────────
const MiniPie = ({ percent, color, label }: { percent: number, color: string, label: string }) => {
  const radius = 18;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (percent / 100) * circum;

  return (
    <div className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-[24px] border border-white/5 hover:bg-white/[0.04] transition-all group">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 48 48" className="absolute top-0 left-0">
          <circle cx="24" cy="24" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <motion.circle
            cx="24" cy="24" r={radius} fill="transparent" stroke={color} strokeWidth="4"
            strokeDasharray={circum}
            initial={{ strokeDashoffset: circum }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'circOut' }}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
            className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
          />
        </svg>
        <span className="text-[0.6rem] font-black text-slate-400">{percent.toFixed(0)}%</span>
      </div>
      <div>
        <div className="text-xl font-black text-white leading-none mb-1 tabular-nums">{percent.toFixed(0)}<span className="text-xs text-slate-500">%</span></div>
        <div className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { orders, loading } = useOrders();
  const { user } = useAuth();

  const stats = useMemo(() => {
    const excludedUsers = ['miguel', 'flor', 'fernando', 'admin'];
    const financialOrders = orders.filter(o => 
      !excludedUsers.some(ex => (o.responsible || '').toLowerCase().includes(ex))
    );

    const totalSales = financialOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
    const totalCollected = financialOrders.reduce((acc, o) => acc + (o.depositAmount || 0), 0);
    const totalPending = financialOrders.reduce((acc, o) => acc + (o.pendingBalance || 0), 0);
    
    // Revenue by Service
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

    // Productivity by Responsible
    const respMap: Record<string, number> = {};
    orders.forEach(o => {
      respMap[o.responsible] = (respMap[o.responsible] || 0) + 1;
    });
    const productivityData = Object.entries(respMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const activeCount = orders.filter(o => ['recibida', 'en_proceso', 'pendiente_entrega'].includes(o.status)).length;
    const completedCount = orders.filter(o => o.status === 'completada').length;
    const totalCount = orders.length || 1;

    return { totalSales, totalCollected, totalPending, serviceRanking, productivityData, activeCount, completedCount, totalCount };
  }, [orders]);

  if (!user?.isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Acceso Restringido</h2>
        <p className="text-slate-500 font-medium">Esta sección de Inteligencia de Negocio es de acceso exclusivo para administradores maestros.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 animate-pulse space-y-8">
      <div className="space-y-2">
         <Skeleton width={300} height={32} />
         <Skeleton width={200} height={16} />
      </div>
      <StatsSkeleton />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton width="100%" height={100} className="rounded-3xl" />
        <Skeleton width="100%" height={100} className="rounded-3xl" />
      </div>
      <Skeleton width="100%" height={300} className="rounded-[40px]" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-32 animate-in fade-in duration-700">
      <header className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <TrendingUp className="text-slate-900" size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Inteligencia de Negocio</h1>
          <p className="text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 opacity-60">
            <ShieldCheck size={14} className="text-emerald-500" /> Analítica Financiera Grupo More
          </p>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 hover:border-amber-500/30 transition-all group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 text-amber-500/10 group-hover:text-amber-500/20 transition-colors"><TrendingUp size={80} /></div>
          <span className="text-[0.6rem] font-black tracking-[0.25em] text-slate-500 block mb-4">VENTAS BRUTAS</span>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-500 text-lg font-bold">$</span>
            <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{stats.totalSales.toLocaleString()}</h3>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[0.6rem] font-bold text-emerald-500 uppercase">
             <ArrowUpRight size={14} /> Histórico total
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] p-8 hover:border-emerald-500/40 transition-all group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors"><Wallet size={80} /></div>
          <span className="text-[0.6rem] font-black tracking-[0.25em] text-emerald-500/60 block mb-4 uppercase">Recaudado (Caja)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-emerald-500/40 text-lg font-bold">$</span>
            <h3 className="text-4xl font-black text-white tracking-tighter tabular-nums">{stats.totalCollected.toLocaleString()}</h3>
          </div>
          <p className="text-[0.6rem] font-bold text-slate-500 uppercase mt-4">Eficiencia cobro: {((stats.totalCollected / (stats.totalSales || 1)) * 100).toFixed(1)}%</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="md:col-span-2 bg-[#d4bc8f]/10 border border-[#d4bc8f]/30 rounded-[40px] p-8 hover:bg-[#d4bc8f]/15 transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-[#d4bc8f]/10"><CreditCard size={100} /></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div>
              <span className="text-[0.65rem] font-black tracking-[0.3em] text-[#d4bc8f] block mb-2 uppercase">Cartera por cobrar</span>
              <h3 className="text-5xl font-black text-white tracking-tighter tabular-nums">$ {stats.totalPending.toLocaleString()}</h3>
            </div>
            <div className="bg-black/20 p-4 rounded-3xl border border-white/5 backdrop-blur-xl md:w-48 text-center sm:text-right">
               <span className="text-[0.55rem] font-black text-slate-400 block mb-1 uppercase tracking-widest leading-none">Riesgo Financiero</span>
               <div className="text-xl font-black text-[#d4bc8f]">{((stats.totalPending / (stats.totalSales || 1)) * 100).toFixed(1)}%</div>
               <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.totalPending / (stats.totalSales || 1)) * 100}%` }} className="h-full bg-[#d4bc8f]" />
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Operative Mix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <MiniPie percent={(stats.activeCount / stats.totalCount) * 100} color="#3b82f6" label="Órdenes Activas" />
        <MiniPie percent={(stats.completedCount / stats.totalCount) * 100} color="#10b981" label="Servicios Finalizados" />
      </div>

      {/* Services Ranking */}
      <motion.section 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] mb-10 shadow-lg"
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="text-amber-500" size={20} /> Ranking de Servicios
            </h4>
            <p className="text-[0.65rem] font-bold text-slate-600 uppercase tracking-widest mt-1">Ingresos brutos por rubro especializado</p>
          </div>
          <div className="text-[0.6rem] font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-1 rounded-lg">Top 5</div>
        </div>
        <BarChart data={stats.serviceRanking} color="var(--accent-color)" />
      </motion.section>

      {/* Team Productivity */}
      <motion.section 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-8">
           <Users className="text-emerald-500" size={20} />
           <h4 className="text-lg font-black text-white tracking-tight uppercase">Carga Operativa por Analista</h4>
        </div>
        <div className="grid gap-4">
          {stats.productivityData.map((p, i) => (
            <div key={i} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-emerald-400 font-black group-hover:scale-110 transition-transform">
                  {p.label.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-300 block">@{p.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${(p.value / stats.totalCount) * 100}%` }} className="h-full bg-emerald-500" />
                    </div>
                    <span className="text-[0.6rem] text-slate-600 font-bold">{((p.value / stats.totalCount) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-white tabular-nums">{p.value} <span className="text-[0.6rem] text-slate-500">ORD</span></div>
                <div className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-500/60 mt-0.5">Asignado</div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <footer className="mt-16 text-center text-slate-600 space-y-2">
        <Activity className="mx-auto opacity-20" size={24} />
        <p className="text-[0.6rem] font-black uppercase tracking-[0.2em]">Documento Analítico Dinámico · Grupo More Cloud Logic</p>
        <p className="text-[0.55rem] font-bold text-slate-700 tracking-tight italic">Los datos financieros excluyen cuentas maestras de administración.</p>
      </footer>
    </div>
  );
}
