import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Rocket, 
  ClipboardList, 
  Users, 
  Package, 
  Crown, 
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Info
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface HelpManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpManualModal({ isOpen, onClose }: HelpManualModalProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'agenda' | 'grupos' | 'ordenes' | 'admin'>('inicio');

  const handleTabChange = (tab: any) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  const NavButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={`
        w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] border
        ${activeTab === id 
          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold shadow-lg shadow-purple-500/5' 
          : 'bg-white/[0.02] border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-400'}
      `}
    >
      <Icon size={18} className={activeTab === id ? 'text-purple-400' : 'text-slate-600'} />
      <span className="text-sm tracking-tight">{label}</span>
      {activeTab === id && <motion.div layoutId="activeInd" className="ml-auto w-1 h-4 bg-purple-500 rounded-full" />}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[99999] bg-[#0f172a] flex flex-col"
        >
          {/* Header */}
          <header className="px-6 py-5 flex justify-between items-center bg-[#1a1622] border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Info size={24} />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg tracking-tight">Manual de Operaciones</h2>
                <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-black mt-0.5">Centro de Ayuda GrupoMore</p>
              </div>
            </div>
            <button 
              onClick={() => { triggerHaptic('medium'); onClose(); }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 border border-white/10 flex items-center gap-2"
            >
              Cerrar <X size={14} />
            </button>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Nav (Desktop) / Tabs (Mobile scroll) */}
            <aside className="w-20 sm:w-64 bg-[#1a1622]/50 border-r border-white/5 p-3 flex flex-col gap-2 overflow-y-auto no-scrollbar shrink-0">
              <NavButton id="inicio" label="Empezar" icon={Rocket} />
              <NavButton id="agenda" label="Agenda" icon={ClipboardList} />
              <NavButton id="grupos" label="Equipos" icon={Users} />
              <NavButton id="ordenes" label="Órdenes" icon={Package} />
              <NavButton id="admin" label="Admin" icon={Crown} />
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto bg-slate-950 p-6 sm:p-12 no-scrollbar">
              <div className="max-w-3xl mx-auto space-y-8 pb-20">
                
                {activeTab === 'inicio' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none">
                      Bienvenido a <span className="text-purple-500">Grupo More</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium">
                      Esta aplicación híbrida progresiva ha sido diseñada exclusivamente para administrar las operaciones internas, desde la programación de compromisos hasta el estado de facturación de servicios.
                    </p>
                    
                    <div className="bg-purple-500/5 border-l-4 border-purple-500 p-6 rounded-r-2xl space-y-3">
                      <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
                        <Lightbulb size={16} /> Primeros Pasos
                      </div>
                      <ul className="space-y-3">
                        {['Registra una cuenta nueva si aún no tienes acceso.', 'Navega usando los íconos de la barra inferior.', 'Instala la PWA en tu pantalla de inicio para alertas críticas.'].map((item, i) => (
                          <li key={i} className="flex gap-3 text-slate-300 text-sm leading-snug">
                            <ChevronRight size={14} className="mt-0.5 text-purple-500 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'agenda' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Actividades</h1>
                      <p className="text-slate-400 leading-relaxed">
                        Usa el botón central (<span className="text-white font-bold">+</span>) para agendar tareas. El sistema activará notificaciones automáticas inteligentes.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-2">Niveles de Alarma</h3>
                      <div className="grid gap-3">
                         {[
                           { p: 'Alta', c: 'text-red-400', b: 'border-red-500/20', bg: 'bg-red-500/5', desc: '72h, 48h, 24h, 12h, 6h y 3h antes.' },
                           { p: 'Media', c: 'text-amber-400', b: 'border-amber-500/20', bg: 'bg-amber-500/5', desc: '48h, 24h y 12h antes.' },
                           { p: 'Baja', c: 'text-emerald-400', b: 'border-emerald-500/20', bg: 'bg-emerald-500/5', desc: '12h y 6h antes.' }
                         ].map(item => (
                           <div key={item.p} className={`${item.bg} ${item.b} border rounded-2xl p-4 flex justify-between items-center group`}>
                             <div>
                               <strong className={`${item.c} text-sm font-black`}>{item.p} Prioridad</strong>
                               <p className="text-[0.7rem] text-slate-500 font-medium mt-1 uppercase tracking-tight">{item.desc}</p>
                             </div>
                             <div className={`w-2 h-2 rounded-full ${item.bg.replace('/5', '')} animate-pulse`} />
                           </div>
                         ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'grupos' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-3xl font-black text-white tracking-tight">Equipos Corporativos</h1>
                      <p className="text-slate-400 leading-relaxed">
                        Colabora en tiempo real. Al asignar una tarea a un grupo, todos los miembros aprobados verán la actualización instantáneamente.
                      </p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white text-center">Flujo de Onboarding</h3>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                        <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 text-[0.65rem] font-bold text-slate-400 w-full sm:w-auto">1. Crear Grupo</div>
                        <ChevronRight className="rotate-90 sm:rotate-0 text-purple-500 hidden sm:block" />
                        <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/10 text-[0.65rem] font-bold text-slate-400 w-full sm:w-auto">2. Solicitar Unión</div>
                        <ChevronRight className="rotate-90 sm:rotate-0 text-purple-500 hidden sm:block" />
                        <div className="bg-purple-500/20 px-6 py-4 rounded-3xl border border-purple-500/50 text-[0.65rem] font-black text-purple-400 w-full sm:w-auto shadow-lg shadow-purple-500/10">3. LÍDER APRUEBA</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ordenes' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-3xl font-black text-white tracking-tight leading-none">Órdenes (Mini-ERP)</h1>
                      <p className="text-slate-400 leading-relaxed">
                        Control total del ciclo de facturación, estado operativo y adjuntos gráficos de cada pedido.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Estados del Servicio</h3>
                      {[
                        { s: 'RECIBIDA', c: 'bg-blue-500', t: 'Inicio del ciclo, notifica al equipo.' },
                        { s: 'ELABORACIÓN', c: 'bg-amber-500', t: 'Producción activa del servicio.' },
                        { s: 'FINALIZADA', c: 'bg-emerald-500', t: 'Orden inactiva, alarmas apagadas.' }
                      ].map(step => (
                        <div key={step.s} className="flex gap-4 group">
                          <div className={`w-1 rounded-full ${step.c} shrink-0`} />
                          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex-1 group-hover:bg-white/[0.04] transition-colors">
                            <strong className="text-white text-xs font-black uppercase tracking-widest">{step.s}</strong>
                            <p className="text-[0.7rem] text-slate-500 mt-1 font-medium">{step.t}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-red-500/5 border-l-4 border-red-500 p-6 rounded-r-2xl space-y-3">
                      <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest">
                        <AlertTriangle size={16} /> Reglas Estrictas
                      </div>
                      <ul className="space-y-2">
                        {['Solo el creador puede editar montos.', 'Solo el creador puede reactivar órdenes.', 'La cancelación requiere motivo obligatorio.'].map((rule, i) => (
                           <li key={i} className="flex gap-3 text-slate-400 text-[0.7rem] font-bold uppercase tracking-tight">
                            <ChevronRight size={12} className="text-red-500 shrink-0 mt-0.5" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'admin' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="space-y-4 text-center sm:text-left">
                      <h1 className="text-3xl font-black text-white tracking-tight">Zona Administrativa 👑</h1>
                      <p className="text-slate-400 leading-relaxed font-medium">Control omnisciente para la continuidad de negocio.</p>
                    </div>

                    <div className="grid gap-4">
                      {[
                        { t: 'Edición Universal', d: 'Edita cualquier orden sin importar el autor.' },
                        { t: 'Ojo Omnisciente', d: 'Visualiza la agenda de todo el personal.' },
                        { t: 'Onboarding', d: 'Gestión masiva de cuentas y permisos.' }
                      ].map(card => (
                        <div key={card.t} className="p-6 rounded-[32px] bg-white/[0.01] border border-white/5 hover:border-purple-500/30 transition-all">
                          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">{card.t}</h4>
                          <p className="text-slate-500 text-xs font-medium">{card.d}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </div>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
