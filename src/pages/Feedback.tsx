import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Send, MessageSquare, BadgeCheck, AlertCircle, Sparkles } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';

const Feedback = () => {
    usePageTitle('Hallazgos y Sugerencias');
    const { user } = useAuth();
    const [msg, setMsg] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!msg) return;
        triggerHaptic('success');
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setMsg('');
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-[#1a1622] pt-6 pb-32 px-4 animate-in fade-in duration-700">
            <header className="mb-10 text-center">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4">
                    <Lightbulb size={24} />
                </div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Hallazgos & Sugerencias</h1>
                <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 italic">Grupo More · Sandbox Improvement</p>
            </header>

            <div className="max-w-xl mx-auto">
                <AnimatePresence mode="wait">
                    {!sent ? (
                        <motion.form 
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleSubmit}
                            className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-6 shadow-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Aportes del Equipo</h2>
                                    <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Tu visión construye Antigravity</p>
                                </div>
                            </div>
                            
                            <textarea 
                                value={msg}
                                onChange={e => setMsg(e.target.value)}
                                placeholder="Describe cualquier fallo encontrado o idea para mejorar la plataforma..."
                                className="w-full h-40 bg-black/40 border border-white/10 rounded-3xl p-5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all font-medium placeholder:text-slate-700"
                                required
                            />

                            <button 
                                type="submit"
                                className="w-full py-5 rounded-[24px] bg-purple-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Send size={16} /> Enviar Hallazgo
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[40px] flex flex-col items-center text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                                <BadgeCheck size={32} />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Sugerencia Recibida</h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                                Gracias por tu aporte. Los administradores revisarán tu hallazgo para seguir evolucionando la suite de herramientas.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[32px] flex items-start gap-4">
                    <AlertCircle size={20} className="text-blue-500 shrink-0" />
                    <div>
                        <p className="text-[0.65rem] font-black text-blue-500 uppercase tracking-widest mb-1 shadow-sm">Protocolo Sandbox</p>
                        <p className="text-[0.6rem] text-slate-500 font-bold uppercase leading-relaxed">
                            Respetado <span className="text-slate-300">@{user?.username}</span>, este canal es exclusivo para reportes de usabilidad y estabilidad. Si tienes un problema técnico crítico, por favor contacta soporte directamente.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center opacity-30 flex flex-col items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    <p className="text-[0.5rem] font-bold text-slate-600 uppercase tracking-[0.5em]">Elite Enhancement Unit</p>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
