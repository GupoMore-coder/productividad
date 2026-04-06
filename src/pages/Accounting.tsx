import { motion } from 'framer-motion';
import { FileText, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const Accounting = () => {
    usePageTitle('Balance Contable');
    
    const stats = [
        { label: 'Ventas Brutas', value: '$ 12.450.000', change: '+12%', up: true },
        { label: 'Recaudo Efectivo', value: '$ 8.920.000', change: '+5%', up: true },
        { label: 'Saldos Pendientes', value: '$ 3.530.000', change: '-2%', up: false },
    ];

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
                    {stats.map((s, i) => (
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
                        <span className="text-[0.55rem] font-black text-emerald-500 uppercase tracking-[0.2em] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Real-Time Update</span>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'Abonos de Órdenes', val: '$ 4.200.000', icon: <DollarSign size={14} /> },
                            { title: 'Gastos Operativos', val: '$ 1.150.000', icon: <Clock size={14} /> },
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
                   <p className="text-[0.6rem] font-black text-slate-500 uppercase tracking-[0.3em]">Módulo Contable v3.0</p>
                   <p className="text-[0.5rem] font-bold text-slate-600 uppercase tracking-widest mt-1">Sincronizado con Antigravity Multi-Sede</p>
                </div>
            </div>
        </div>
    );
};

export default Accounting;
