import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  X, 
  Rocket, 
  ClipboardList, 
  Package, 
  Crown, 
  ChevronRight,
  Search,
  ShieldCheck,
  Zap,
  Globe,
  Smartphone,
  Fingerprint,
  TrendingUp,
  Clock,
  Briefcase,
  ExternalLink,
  Gem,
  Award,
  FileText,
  Send,
  Bot,
  RefreshCw
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';

interface HelpManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpManualModal({ isOpen, onClose }: HelpManualModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inicio' | 'agenda' | 'ordenes' | 'inventario' | 'inteligencia' | 'seguridad' | 'admin' | 'ia'>('inicio');
  const [search, setSearch] = useState('');
  
  // Chat IA State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: '¡Hola! Soy el asistente inteligente de Grupo More. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleTabChange = (tab: any) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    triggerHaptic('medium');
    const userMsg = userInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setUserInput('');
    setIsTyping(true);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.functions.invoke('ai-helper', {
          body: { 
            prompt: userMsg,
            history: chatMessages.slice(-6) // Enviar últimos 3 intercambios para contexto ligero
          }
        });

        if (error) throw error;
        
        setChatMessages(prev => [...prev, { role: 'assistant', text: data?.text || 'No pude obtener una respuesta.' }]);
      } else {
        // Fallback para desarrollo sin Supabase
        setTimeout(() => {
          setChatMessages(prev => [...prev, { role: 'assistant', text: "Modo Local: El asistente requiere conexión a Supabase y la Edge Function 'ai-helper' activa." }]);
          setIsTyping(false);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error IA:', err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: '⚠️ No pude conectarme con mi centro de inteligencia. Verifica que la función ai-helper esté desplegada y configurada correctamente.' 
      }]);
    } finally {
      setIsTyping(false);
      triggerHaptic('light');
    }
  };

  const isElevated = user?.isMaster || user?.role === 'Director General (CEO)' || user?.role === 'Gestor Administrativo' || user?.isAccountant || user?.isSupervisor;

  const tabs = [
    { id: 'inicio', label: 'Universo More', icon: Rocket },
    { id: 'agenda', label: 'Agenda Inteligente', icon: ClipboardList },
    { id: 'ordenes', label: 'Órdenes & Finance', icon: Package },
    { id: 'inventario', label: 'Suministros', icon: Briefcase },
    { id: 'inteligencia', label: 'Inteligencia Cloud', icon: TrendingUp, hidden: !isElevated },
    { id: 'seguridad', label: 'Seguridad Bio', icon: Smartphone },
    { id: 'admin', label: 'Administración', icon: Crown, hidden: !user?.isMaster },
    { id: 'ia', label: 'Asistencia IA', icon: Zap },
  ];

  const filteredTabs = useMemo(() => {
    if (!search) return tabs;
    return tabs.filter(t => 
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, tabs]);

  const NavButton = ({ id, label, icon: Icon, hidden }: { id: any, label: string, icon: any, hidden?: boolean }) => {
    if (hidden) return null;
    return (
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
        <span className="text-[0.7rem] uppercase font-black tracking-widest text-left leading-tight">{label}</span>
        {activeTab === id && <motion.div layoutId="activeInd" className="ml-auto w-1 h-4 bg-purple-500 rounded-full" />}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="fixed inset-0 z-[99999] bg-[#0f172a] flex flex-col md:flex-row overflow-hidden"
        >
          {/* Sidebar / Navigation */}
          <aside className="w-full md:w-72 bg-[#1a1622] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
            <header className="p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Gem size={22} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm uppercase tracking-tight">Enciclopedia More</h2>
                  <p className="text-[0.55rem] text-slate-500 uppercase tracking-widest font-black mt-0.5 opacity-60">Fase 16 · Elite Admin</p>
                </div>
              </div>

              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar función..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[0.65rem] font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-500/50 transition-all uppercase tracking-widest"
                />
              </div>
            </header>

            <nav className="flex-1 overflow-y-auto p-4 flex md:flex-col gap-2 no-scrollbar scroll-smooth">
              {filteredTabs.map(tab => (
                <NavButton key={tab.id} id={tab.id} label={tab.label} icon={tab.icon} hidden={tab.hidden} />
              ))}
            </nav>

            <div className="p-6 border-t border-white/5 bg-black/20 mt-auto hidden md:block">
               <button 
                 onClick={onClose}
                 className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2"
               >
                 Cerrar Manual <X size={14} />
               </button>
            </div>
          </aside>

          {/* Mobile Close Bar */}
          <div className="md:hidden flex justify-between items-center p-4 bg-[#1a1622] border-b border-white/5">
              <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest leading-none">Centro de Ayuda</span>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-xl"><X size={18} className="text-white" /></button>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-16 custom-scrollbar scroll-smooth">
            <div className="max-w-4xl mx-auto pb-32">
              
              {activeTab === 'inicio' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-purple-500 font-black text-[0.6rem] uppercase tracking-[0.3em]">
                      <Award size={16} /> Elite Progressive Web App
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-[0.9] uppercase italic">
                      Bienvenido al <br /><span className="text-purple-500">Universo More</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-semibold italic opacity-80">
                      "Personalizar es identidad". Esta suite progresiva ha sido diseñada para administrar las operaciones internas de More Paper & Design con una arquitectura de élite al 1000%.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400"><Smartphone size={24} /></div>
                        <h3 className="text-white font-black uppercase tracking-tight">PWA Ready</h3>
                        <p className="text-[0.7rem] text-slate-500 font-bold leading-relaxed uppercase">Instala la App en tu pantalla de inicio como una aplicación nativa para recibir alertas críticas en tiempo real.</p>
                     </div>
                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400"><Globe size={24} /></div>
                        <h3 className="text-white font-black uppercase tracking-tight">Cloud Sync</h3>
                        <p className="text-[0.7rem] text-slate-500 font-bold leading-relaxed uppercase">Toda la información se sincroniza en tiempo real en la nube, garantizando que el equipo esté siempre coordinado.</p>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 p-8 rounded-[40px] space-y-6">
                    <div className="flex items-center gap-3 text-purple-400 font-black text-xs uppercase tracking-widest">
                      <Zap size={20} className="fill-purple-500/20" /> Tu Primeros Pasos
                    </div>
                    <ol className="space-y-4">
                      {[
                        'Vincula tu Biometría en el Perfil para acceso instantáneo.',
                        'Navega con la barra inferior: Agenda, Órdenes, Dashboard.',
                        'Usa el botón central (+) para agendar tareas o crear órdenes rápidas.'
                      ].map((item, i) => (
                        <li key={i} className="flex gap-4 text-white text-sm font-black italic">
                          <span className="text-purple-500 text-lg opacity-40 leading-none">0{i+1}</span>
                          <span className="uppercase tracking-tight">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}

              {activeTab === 'agenda' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="space-y-4">
                     <h2 className="text-[0.6rem] font-black text-blue-400 uppercase tracking-[0.4em]">Módulo #01</h2>
                     <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Agenda Inteligente</h1>
                     <p className="text-slate-400 text-lg font-medium">Control total del tiempo con visualización de 14 días y alertas jerárquicas.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                     {[
                       { t: 'Prioridad ALTA', d: '6 Alarmas Críticas (72h a 3h).', c: 'text-red-500', bg: 'bg-red-500/5', b: 'border-red-500/20' },
                       { t: 'Prioridad MEDIA', d: '3 Alarmas (48h a 12h).', c: 'text-amber-500', bg: 'bg-amber-500/5', b: 'border-amber-500/20' },
                       { t: 'Prioridad BAJA', d: '2 Alarmas (12h y 6h).', c: 'text-emerald-500', bg: 'bg-emerald-500/5', b: 'border-emerald-500/20' }
                     ].map(p => (
                       <div key={p.t} className={`${p.bg} ${p.b} border p-6 rounded-[32px] group`}>
                          <div className={`text-[0.65rem] font-black uppercase tracking-widest ${p.c}`}>{p.t}</div>
                          <div className="text-[0.55rem] text-slate-500 font-bold uppercase mt-2">{p.d}</div>
                       </div>
                     ))}
                  </div>

                  <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-4">Funciones de Élite en Agenda</h3>
                     <ul className="space-y-6">
                        <li className="flex gap-5">
                           <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0"><Clock size={18} /></div>
                           <div>
                              <strong className="text-white text-xs font-black uppercase block tracking-widest">Sincronización en Tiempo Real</strong>
                              <p className="text-[0.65rem] text-slate-500 font-bold mt-1 uppercase leading-snug">Cada vez que guardas una tarea, el equipo visualiza el cambio instantáneamente sin necesidad de recargar.</p>
                           </div>
                        </li>
                        <li className="flex gap-5">
                           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">🎂</div>
                           <div>
                              <strong className="text-white text-xs font-black uppercase block tracking-widest">Alertas de Cumpleaños</strong>
                              <p className="text-[0.65rem] text-slate-500 font-bold mt-1 uppercase leading-snug">La agenda resalta en color oro los perfiles de los compañeros que cumplen años para una gestión humana excepcional.</p>
                           </div>
                        </li>
                     </ul>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ordenes' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="space-y-4">
                     <h2 className="text-[0.6rem] font-black text-amber-500 uppercase tracking-[0.4em]">Módulo #02</h2>
                     <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Órdenes & Finance</h1>
                     <p className="text-slate-400 text-lg font-medium">El motor operativo de More Paper & Design. Gestión financiera y operativa de pedidos.</p>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">Ciclo de Vida de la Orden</h3>
                     <div className="flex flex-col md:flex-row gap-3">
                        {[
                          { s: 'RECIBIDA', c: 'border-blue-500/30 text-blue-400', d: 'Notifica al responsable.' },
                          { s: 'EN PROCESO', c: 'border-purple-500/30 text-purple-400', d: 'Elaboración activa.' },
                          { s: 'PENDIENTE', c: 'border-amber-500/30 text-amber-400', d: 'Lista para entrega.' },
                          { s: 'COMPLETADA', c: 'border-emerald-500/30 text-emerald-400', d: 'Ciclo financiero cerrado.' }
                        ].map(step => (
                          <div key={step.s} className={`flex-1 p-4 rounded-2xl border ${step.c.split(' ')[0]} bg-white/[0.02]`}>
                             <div className={`text-[0.6rem] font-black uppercase tracking-tighter ${step.c.split(' ')[1]}`}>{step.s}</div>
                             <div className="text-[0.55rem] text-slate-500 font-bold mt-1 uppercase leading-none tracking-tighter">{step.d}</div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><TrendingUp size={18} /></div>
                        <h4 className="text-white font-black uppercase text-xs tracking-widest">Reglas Financieras</h4>
                        <ul className="space-y-2">
                           {['Abonos mínimos obligatorios.', 'Cálculo automático de saldos.', 'Estado de pago sincronizado.'].map((tip, i) => (
                             <li key={i} className="text-[0.65rem] text-slate-400 font-bold uppercase flex items-center gap-2">
                               <ChevronRight size={12} className="text-purple-500" /> {tip}
                             </li>
                           ))}
                        </ul>
                     </div>
                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><FileText size={18} /></div>
                        <h4 className="text-white font-black uppercase text-xs tracking-widest">Documentos PDF</h4>
                        <p className="text-[0.65rem] text-slate-500 font-bold uppercase leading-relaxed">Generación de archivos ejecutivos con QR de seguimiento, historial de pagos y branding oficial para enviar por WhatsApp.</p>
                     </div>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[32px]">
                    <div className="flex items-center gap-3 text-red-500 font-black text-xs uppercase tracking-widest mb-4">
                      <ShieldCheck size={16} /> Auditoría Estricta
                    </div>
                    <p className="text-[0.65rem] text-slate-500 font-bold uppercase">Toda acción (cambio de estado o ajuste de saldo) queda registrada en el historial con fecha y autor, garantizando trazabilidad absoluta al 1000%.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'inventario' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="space-y-4">
                     <h2 className="text-[0.6rem] font-black text-emerald-500 uppercase tracking-[0.4em]">Módulo #03</h2>
                     <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Suministros & Partners</h1>
                     <p className="text-slate-400 text-lg font-medium">Gestión estratégica de la cadena de suministro y directorio de proveedores.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                           <Briefcase size={16} /> Categorización Multi-Select
                        </div>
                        <p className="text-[0.65rem] text-slate-500 font-bold uppercase leading-relaxed">Asocia un proveedor a múltiples segmentos (ej: WA More Paper, Sublimación, Empaques) mediante el sistema inteligente de Checkboxes.</p>
                     </div>
                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="text-blue-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                           <ExternalLink size={16} /> Links Sociales
                        </div>
                        <p className="text-[0.65rem] text-slate-500 font-bold uppercase leading-relaxed">Conexión directa con Instagram, TikTok y Web del proveedor para validación rápida de tendencias.</p>
                     </div>
                  </div>

                  <div className="bg-purple-500/5 border border-purple-500/20 p-8 rounded-[40px]">
                     <h4 className="text-white font-black uppercase text-xs tracking-widest mb-4">Propiedades del Proveedor</h4>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <div className="text-[0.6rem] text-purple-400 font-black uppercase mb-1">Nombre Comercial</div>
                           <p className="text-[0.55rem] text-slate-500 font-bold uppercase italic">Identidad pública del partner.</p>
                        </div>
                        <div>
                           <div className="text-[0.6rem] text-purple-400 font-black uppercase mb-1">NIT / ID Social</div>
                           <p className="text-[0.55rem] text-slate-500 font-bold uppercase italic">Tributario y legal.</p>
                        </div>
                        <div>
                           <div className="text-[0.6rem] text-purple-400 font-black uppercase mb-1">Contacto Principal</div>
                           <p className="text-[0.55rem] text-slate-500 font-bold uppercase italic">Nombre directo del gestor.</p>
                        </div>
                        <div>
                           <div className="text-[0.6rem] text-purple-400 font-black uppercase mb-1">Redes Sociales</div>
                           <p className="text-[0.55rem] text-slate-500 font-bold uppercase italic">Links directos de mercadeo.</p>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'inteligencia' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="space-y-4">
                     <h2 className="text-[0.6rem] font-black text-purple-500 uppercase tracking-[0.4em]">Módulo #04</h2>
                     <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Inteligencia Cloud</h1>
                     <p className="text-slate-400 text-lg font-medium">Análisis predictivo y ranking de élite para la toma de decisiones.</p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Award size={28} /></div>
                        <div>
                           <h3 className="text-white font-black uppercase tracking-tight">Algoritmo de Productividad</h3>
                           <p className="text-[0.65rem] text-slate-500 font-bold uppercase">Puntuación ponderada para el Ranking de Usuarios</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 border border-white/5 rounded-2xl">
                           <div className="text-xl font-black text-white">40%</div>
                           <div className="text-[0.55rem] text-slate-500 font-black uppercase mt-1">VENTAS BRUTAS</div>
                        </div>
                        <div className="text-center p-4 border border-white/5 rounded-2xl">
                           <div className="text-xl font-black text-white">40%</div>
                           <div className="text-[0.55rem] text-slate-500 font-black uppercase mt-1">RECAUDO EFECTIVO</div>
                        </div>
                        <div className="text-center p-4 border border-white/5 rounded-2xl">
                           <div className="text-xl font-black text-white">20%</div>
                           <div className="text-[0.55rem] text-slate-500 font-black uppercase mt-1">ÉXITO (FINALIZADAS)</div>
                        </div>
                     </div>

                     <div className="p-6 bg-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-purple-400 font-black text-[0.6rem] uppercase tracking-widest">
                           <TrendingUp size={16} /> Forecast (Pronóstico)
                        </div>
                        <p className="text-[0.65rem] text-slate-400 font-bold uppercase leading-relaxed">Basado en el histórico del periodo actual, el sistema predice las ventas estimadas para los próximos 7 días, permitiendo ajustar proyecciones de compra.</p>
                     </div>

                     <div className="p-6 bg-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 font-black text-[0.6rem] uppercase tracking-widest">
                           <Clock size={16} /> SLA (Ciclo Medio)
                        </div>
                        <p className="text-[0.65rem] text-slate-400 font-bold uppercase leading-relaxed">Calcula cuántas horas promedio tarda una orden desde su creación hasta su entrega final. Meta ideal: &lt; 24h.</p>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'seguridad' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="space-y-4">
                     <h2 className="text-[0.6rem] font-black text-blue-500 uppercase tracking-[0.4em]">Módulo #05</h2>
                     <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Seguridad & Biometría</h1>
                     <p className="text-slate-400 text-lg font-medium">Protección de datos de élite con autenticación de vanguardia.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 inline-flex"><Fingerprint size={24} /></div>
                        <h3 className="text-white font-black uppercase tracking-tight">Acceso Zero-Click</h3>
                        <p className="text-[0.7rem] text-slate-500 font-bold leading-relaxed uppercase">Si activas la Biometría en tu perfil, el sistema te identificará automáticamente al entrar, eliminando la necesidad de contraseñas manuales.</p>
                        <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 text-[0.6rem] font-black text-blue-400 uppercase text-center tracking-tighter">
                           Actívalo en: Perfil → Habilitar Biometría
                        </div>
                     </div>

                     <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 inline-flex"><ShieldCheck size={24} /></div>
                        <h3 className="text-white font-black uppercase tracking-tight">Privacidad RLS</h3>
                        <p className="text-[0.7rem] text-slate-500 font-bold leading-relaxed uppercase">Usamos políticas de "Row Level Security". Nadie puede ver información financiera de una sede que no le corresponde. Tu seguridad es nuestra prioridad.</p>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'admin' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="space-y-4">
                     <h2 className="text-[0.6rem] font-black text-purple-500 uppercase tracking-[0.4em]">Módulo #06</h2>
                     <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Administración Maestra</h1>
                     <p className="text-slate-400 text-lg font-medium">Centro de control para la jerarquía suprema de More Paper & Design.</p>
                  </div>

                  <div className="grid gap-4">
                    {[
                      { t: 'Edición Universal', d: 'Capacidad de modificar cualquier orden en cualquier estado.', i: <Briefcase size={16} /> },
                      { t: 'Visibilidad Global', d: 'Acceso a la agenda y estadísticas de todo el personal sin restricciones.', i: <Globe size={16} /> },
                      { t: 'Gestión de Identidad', d: 'Control de roles, reinicio de contraseñas y moderación de equipos.', i: <ShieldCheck size={16} /> }
                    ].map(card => (
                      <div key={card.t} className="p-8 rounded-[40px] bg-white/[0.01] border border-white/5 hover:border-purple-500/30 transition-all flex items-start gap-6 group">
                         <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0">
                            {card.i}
                         </div>
                         <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">{card.t}</h4>
                            <p className="text-slate-500 text-[0.7rem] font-bold uppercase tracking-tight leading-relaxed">{card.d}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'ia' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col pt-4 md:pt-0">
                  <div className="space-y-4 mb-8">
                     <h2 className="text-[0.6rem] font-black text-amber-500 uppercase tracking-[0.4em]">Módulo IA</h2>
                     <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">Asistencia Inteligente</h1>
                     <p className="text-slate-400 text-lg font-medium">Resuelve tus dudas sobre la plataforma de manera inmediata.</p>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col bg-black/20 rounded-[40px] border border-white/5 overflow-hidden">
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-purple-600 text-white rounded-tr-none' 
                              : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                          }`}>
                            {msg.role === 'assistant' && <Bot size={14} className="mb-2 text-purple-400" />}
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 text-slate-400 p-4 rounded-3xl rounded-tl-none border border-white/5 flex items-center gap-2">
                             <RefreshCw size={14} className="animate-spin" />
                             <span className="text-[0.6rem] font-black uppercase tracking-widest">Escribiendo...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                      <input 
                        type="text" 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Pregunta algo sobre la aplicación..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!userInput.trim() || isTyping}
                        className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Send size={24} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
