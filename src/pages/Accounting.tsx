import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Clock, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useOrders } from '../context/OrderContext';
import { isSameMonth, subMonths } from 'date-fns';

const Accounting = () => {
    usePageTitle('Balance Contable');
    const { orders } = useOrders();

    const data = useMemo(() => {
        const now = new Date();
        const prevMonthDate = subMonths(now, 1);
        
        let currentVentas = 0;
        let currentRecaudo = 0;
        let currentSaldos = 0;

        let prevVentas = 0;
        let prevRecaudo = 0;
        let prevSaldos = 0;

        // Ignorar órdenes de prueba (MOCKS/DEMO) o canceladas para la contabilidad real
        const validOrders = orders.filter(o => !o.is_demo && o.status !== 'cancelada');

        for (const order of validOrders) {
             const createdAt = new Date(order.createdAt);
             if (isSameMonth(createdAt, now)) {
                 currentVentas += order.totalCost || 0;
                 currentRecaudo += order.depositAmount || 0;
                 currentSaldos += order.pendingBalance || 0;
             } else if (isSameMonth(createdAt, prevMonthDate)) {
                 prevVentas += order.totalCost || 0;
                 prevRecaudo += order.depositAmount || 0;
                 prevSaldos += order.pendingBalance || 0;
             }
        }

        const calcChange = (curr: number, prev: number) => {
            if (prev === 0) return { changeText: curr > 0 ? '+100%' : '0%', isUp: curr >= prev };
            const percent = ((curr - prev) / prev) * 100;
            return {
                changeText: `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`,
                isUp: percent >= 0
            };
        };

        const formatMoney = (val: number) => `$ ${Math.round(val).toLocaleString('es-CO')}`;

        const ventasInf = calcChange(currentVentas, prevVentas);
        const recaudoInf = calcChange(currentRecaudo, prevRecaudo);
        const saldosInf = calcChange(currentSaldos, prevSaldos);

        return {
            stats: [
                { label: 'Ventas Brutas', value: formatMoney(currentVentas), change: ventasInf.changeText, up: ventasInf.isUp },
                { label: 'Recaudo Efectivo', value: formatMoney(currentRecaudo), change: recaudoInf.changeText, up: recaudoInf.isUp },
                { label: 'Saldos Pendientes', value: formatMoney(currentSaldos), change: saldosInf.changeText, up: saldosInf.isUp },
            ],
            rawRecaudo: formatMoney(currentRecaudo)
        };
    }, [orders]);

    return (
        <div className="min-h-screen bg-[#1a1622] pt-6 pb-32 px-4 animate-in fade-in duration-700">
            <header className="mb-10 text-center">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4">
                    <FileText size={24} />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Balance Contable</h1>
                <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic shadow-sm">Grupo More · Gestión Financiera</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.stats.map((s, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-xl"
                        >
                            <p className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                            <h3 className="text-xl font-black text-white mb-2">{s.value}</h3>
                            <div className={`flex items-center gap-1 text-[0.65rem] font-bold ${s.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {s.change} <span className="text-slate-600 ml-1 italic font-normal text-[0.55rem]">vs mes anterior</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="p-8 rounded-[40px] bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <TrendingUp size={20} />
                            </div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Resumen Operativo</h2>
                        </div>
                        <span className="text-[0.55rem] font-black text-emerald-500 uppercase tracking-[0.2em] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse">En Línea</span>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'Abonos de Órdenes', val: data.rawRecaudo, icon: <DollarSign size={14} /> },
                            { title: 'Gastos Operativos (Fase Beta)', val: '$ 0', icon: <Clock size={14} className="text-amber-500" /> },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-500">{item.icon}</div>
                                    <span className="text-[0.65rem] font-bold text-slate-300 uppercase">{item.title}</span>
                                </div>
                                <span className="text-xs font-black text-white">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                   <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <FileText size={20} className="text-slate-500" />
                   </div>
                   <p className="text-[0.6rem] font-black text-slate-500 uppercase tracking-[0.3em]">Módulo Contable v3.1</p>
                   <p className="text-[0.5rem] font-bold text-slate-600 uppercase tracking-widest mt-1 pt-1 flex items-center gap-1 justify-center"><AlertTriangle size={10} className="text-amber-500"/> Sincronizado en tiempo real</p>
                </div>
            </div>
        </div>
    );
};

export default Accounting;
