import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSupabaseConfigured } from '@/lib/supabase';
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
  RefreshCw,
  BellRing,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';

interface HelpManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'inicio' | 'agenda' | 'ordenes' | 'inventario' | 'inteligencia' | 'seguridad' | 'admin' | 'ia';
}

export default function HelpManualModal({ isOpen, onClose, initialTab = 'inicio' }: HelpManualModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inicio' | 'agenda' | 'ordenes' | 'inventario' | 'inteligencia' | 'seguridad' | 'admin' | 'ia'>(initialTab);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset to initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, initialTab]);
  
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
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const fnResponse = await fetch(`${supabaseUrl}/functions/v1/ai-helper`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ 
            prompt: userMsg,
            history: chatMessages.map(m => ({ 
              role: m.role, 
              text: m.text.length > 500 ? m.text.substring(0, 500) + '...' : m.text 
            })).slice(-6) 
          })
        });

        const responseData = await fnResponse.json();

        if (!fnResponse.ok || responseData.error) {
          const errorMessage = responseData.error || `Error del servidor (${fnResponse.status})`;
          setChatMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${errorMessage}` }]);
          setIsTyping(false);
          return;
        }
        
        setChatMessages(prev => [...prev, { role: 'assistant', text: responseData?.text || 'No pude obtener una respuesta.' }]);
      } else {
        setTimeout(() => {
          setChatMessages(prev => [...prev, { role: 'assistant', text: "Modo Local: El asistente requiere conexión a Supabase y la Edge Function 'ai-helper' activa." }]);
          setIsTyping(false);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error IA:', err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `⚠️ Hubo un problema técnico: ${err.message || 'Error de conexión'}. Verifica tu conexión a internet o los secretos de Supabase.` 
      }]);
    } finally {
      setIsTyping(false);
      triggerHaptic('light');
    }
  };

  const isElevated = user?.isMaster || user?.role === 'Director General (CEO)' || user?.role === 'Gestor Administrativo' || user?.isAccountant || user?.isSupervisor;

  const tabs = [
    { id: 'inicio', label: 'Universo More', icon: Rocket, tag: 'Intro' },
    { id: 'agenda', label: 'Agenda Inteligente', icon: ClipboardList, tag: 'Core' },
    { id: 'ordenes', label: 'Órdenes & Finance', icon: Package, tag: 'Finanzas' },
    { id: 'inventario', label: 'Suministros', icon: Briefcase, tag: 'Data' },
    { id: 'inteligencia', label: 'Inteligencia Cloud', icon: TrendingUp, hidden: !isElevated, tag: 'VIP' },
    { id: 'seguridad', label: 'Seguridad Bio', icon: ShieldCheck, tag: 'Bio' },
    { id: 'admin', label: 'Administración', icon: Crown, hidden: !user?.isMaster, tag: 'Master' },
    { id: 'ia', label: 'Asistencia IA', icon: Bot, tag: 'Smart' },
  ];

  const filteredTabs = useMemo(() => {
    if (!search) return tabs;
    return tabs.filter(t => 
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, tabs]);

  // Animation variants
  const pageVariants: any = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  const itemVariants: any = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const NavButton = ({ id, label, icon: Icon, tag, hidden }: { id: any, label: string, icon: any, tag: string, hidden?: boolean }) => {
    if (hidden) return null;
    return (
      <button
        onClick={() => handleTabChange(id)}
        className={`
          w-full px-4 py-3 xl:py-4 rounded-2xl flex items-center gap-3 transition-all duration-300 active:scale-[0.98] border group relative overflow-hidden
          ${activeTab === id 
            ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/5 border-purple-500/40 shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] text-white' 
            : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.05] hover:border-white/10 hover:text-white'}
        `}
      >
        <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300'}`}>
           <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-start">
           <span className="text-[0.7rem] uppercase font-black tracking-widest leading-tight">{label}</span>
           <span className={`text-[0.55rem] font-bold uppercase tracking-widest mt-0.5 ${activeTab === id ? 'text-purple-300' : 'text-slate-600'}`}>{tag}</span>
        </div>
        {activeTab === id && (
          <motion.div layoutId="nav-indicator" className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-blue-500" />
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-[#0a0a0f]/95 backdrop-blur-2xl flex flex-col md:flex-row overflow-hidden font-sans"
        >
          {/* Glass Overlay Effects */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

          {/* Sidebar / Navigation */}
          <aside className="w-full md:w-80 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 relative z-10 backdrop-blur-md">
            <header className="p-6 border-b border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-white/10">
                  <Gem size={24} className="animate-pulse drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm uppercase tracking-tight leading-none mb-1">Enciclopedia More</h2>
                  <p className="text-[0.55rem] text-purple-400 uppercase tracking-widest font-black opacity-80 flex items-center gap-1"><Award size={10}/> Dossier de Élite</p>
                </div>
              </div>

              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Explorar módulos..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[0.65rem] font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] transition-all uppercase tracking-widest"
                />
              </div>
            </header>

            <nav className="flex-1 overflow-y-auto p-4 flex md:flex-col gap-2 custom-scrollbar scroll-smooth">
              {filteredTabs.map(tab => (
                <NavButton key={tab.id} id={tab.id} label={tab.label} icon={tab.icon} tag={tab.tag} hidden={tab.hidden} />
              ))}
            </nav>

            <div className="p-6 border-t border-white/5 bg-gradient-to-b from-transparent to-black/50 mt-auto hidden md:block">
               <button 
                 onClick={onClose}
                 className="w-full py-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] text-slate-400 hover:text-white text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-3 group"
               >
                 Cerrar Dossier <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
               </button>
            </div>
          </aside>

          {/* Mobile Close Bar */}
          <div className="md:hidden flex justify-between items-center p-4 bg-black/40 border-b border-white/5 backdrop-blur-xl relative z-10">
              <span className="text-[0.65rem] font-black text-purple-400 uppercase tracking-widest leading-none flex items-center gap-2"><Crown size={12}/> Dossier Activo</span>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-full active:bg-white/20 transition-colors"><X size={18} className="text-white" /></button>
          </div>

          {/* Main Content Area */}
          <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 custom-scrollbar scroll-smooth relative z-10">
            <div className="max-w-4xl mx-auto pb-32">
              <AnimatePresence mode="wait">
                
                {/* 1. UNIVERSO MORE */}
                {activeTab === 'inicio' && (
                  <motion.div key="inicio" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-16">
                    
                    {/* Hero Section */}
                    <motion.div variants={itemVariants} className="space-y-6 relative">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-[0.6rem] uppercase tracking-[0.2em]">
                        <Award size={14} /> PWA de Siguiente Generación
                      </div>
                      <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase italic drop-shadow-2xl">
                        Universo <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-blue-500">More</span>
                      </h1>
                      <p className="text-xl md:text-2xl text-slate-400 leading-relaxed font-medium">
                        Has entrado a un entorno de control supremo. Antigravity no es solo una app, es el núcleo operativo de More Paper & Design, forjado con una arquitectura de élite al 1000% para empoderar cada una de tus acciones.
                      </p>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                       <div className="p-10 rounded-[3rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-colors duration-500">
                          <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />
                          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 drop-shadow-lg"><Smartphone size={28} /></div>
                          <h3 className="text-white text-xl font-black uppercase tracking-tight mb-3">Tu Teléfono, Tu Mando</h3>
                          <p className="text-[0.8rem] text-slate-400 font-medium leading-relaxed">
                            Diseñada como una Progressive Web App (PWA). Entra desde el menú de opciones de tu navegador y selecciona <strong>"Añadir a la pantalla de inicio"</strong>. Funcionará como una app nativa, a pantalla completa y con notificaciones push.
                          </p>
                       </div>
                       
                       <div className="p-10 rounded-[3rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-colors duration-500">
                          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 drop-shadow-lg"><Globe size={28} /></div>
                          <h3 className="text-white text-xl font-black uppercase tracking-tight mb-3">Mente Maestra Nube</h3>
                          <p className="text-[0.8rem] text-slate-400 font-medium leading-relaxed">
                            No existen los retrasos. Toda la información que agregues o edites se sincroniza en milisegundos a través de los servidores de Supabase, enlazando a todo el equipo simultáneamente sin necesidad de recargar la app.
                          </p>
                       </div>
                    </motion.div>

                    {/* Step-by-Step */}
                    <motion.div variants={itemVariants} className="p-10 rounded-[3rem] bg-black/40 border border-white/10 backdrop-blur-md relative">
                      <div className="absolute top-0 left-10 w-32 h-1 bg-gradient-to-r from-purple-500 to-transparent" />
                      <div className="flex items-center gap-3 text-purple-400 font-black text-sm uppercase tracking-widest mb-8">
                        <Zap size={20} /> Protocolo de Inicio
                      </div>
                      <div className="space-y-8">
                        {[
                          { title: 'Identidad Biométrica', desc: 'Dirígete a tu perfil y vincula tu huella o Face ID. El acceso será inmediato, cero tecleo de claves.' },
                          { title: 'Navegación Táctica', desc: 'Utiliza la consola inferior. Solo botones esenciales. Toda la información a un swipe horizontal.' },
                          { title: 'Creación Instantánea', desc: 'El núcleo de tu productividad es el gran botón circular mágico (+). Desde él lanzas órdenes o tareas al instante.' }
                        ].map((step, i) => (
                          <div key={i} className="flex gap-6 items-start group">
                            <div className="flex flex-col items-center gap-2">
                               <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-sm group-hover:bg-purple-500 group-hover:border-purple-400 transition-colors">
                                 {i + 1}
                               </div>
                               {i < 2 && <div className="w-0.5 h-10 bg-white/10 rounded-full" />}
                            </div>
                            <div className="pt-2">
                               <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1">{step.title}</h4>
                               <p className="text-[0.75rem] text-slate-400 font-medium max-w-lg leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* 2. AGENDA INTELIGENTE */}
                {activeTab === 'agenda' && (
                  <motion.div key="agenda" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-16">
                    <motion.div variants={itemVariants} className="space-y-6">
                       <h2 className="text-[0.6rem] font-black text-blue-500 uppercase tracking-[0.4em]">Módulo Estructural</h2>
                       <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none italic">Agenda Inteligente</h1>
                       <p className="text-slate-400 text-xl font-medium max-w-2xl">
                         No es un calendario, es una consola de mando temporal. Control exhaustivo con jerarquía visual y emisión de alertas precisas en tu dispositivo.
                       </p>
                    </motion.div>

                    {/* Timeline Hierarchy CSS Graphic */}
                    <motion.div variants={itemVariants} className="p-8 md:p-12 rounded-[3rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10">
                       <h3 className="text-white font-black uppercase tracking-widest text-sm mb-10 flex items-center gap-3">
                         <BellRing className="text-purple-400" /> Jerarquía de Notificaciones Push
                       </h3>
                       
                       <div className="space-y-6">
                          {/* Alto */}
                          <div className="relative group">
                             <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                             <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 bg-black/80 rounded-2xl border border-red-500/30">
                                <div className="w-full md:w-32 text-center md:text-left shrink-0">
                                   <div className="text-red-500 font-black text-2xl uppercase tracking-tighter">ALTA</div>
                                   <div className="text-[0.6rem] text-slate-400 font-black uppercase tracking-widest">Prioridad Absoluta</div>
                                </div>
                                <div className="w-full h-px md:h-12 md:w-px bg-white/10 shrink-0" />
                                <div className="flex-1 flex flex-wrap gap-2 justify-center md:justify-start">
                                   {[72, 48, 24, 12, 6, 3].map(h => (
                                     <span key={h} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 font-black text-xs">
                                       -{h}h
                                     </span>
                                   ))}
                                   <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 font-black text-xs shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                                     -1h (¡Centro de Pantalla!)
                                   </span>
                                </div>
                             </div>
                          </div>
                          
                          {/* Medio */}
                          <div className="relative group">
                             <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                             <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 bg-black/80 rounded-2xl border border-amber-500/30">
                                <div className="w-full md:w-32 text-center md:text-left shrink-0">
                                   <div className="text-amber-500 font-black text-2xl uppercase tracking-tighter">MEDIA</div>
                                   <div className="text-[0.6rem] text-slate-400 font-black uppercase tracking-widest">Gestión Operativa</div>
                                </div>
                                <div className="w-full h-px md:h-12 md:w-px bg-white/10 shrink-0" />
                                <div className="flex-1 flex flex-wrap gap-2 justify-center md:justify-start">
                                   {[48, 24, 12].map(h => (
                                     <span key={h} className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-black text-xs">
                                       -{h}h
                                     </span>
                                   ))}
                                </div>
                             </div>
                          </div>

                          {/* Bajo */}
                          <div className="relative group">
                             <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-5 group-hover:opacity-20 transition duration-500"></div>
                             <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 bg-black/80 rounded-2xl border border-emerald-500/30">
                                <div className="w-full md:w-32 text-center md:text-left shrink-0">
                                   <div className="text-emerald-500 font-black text-2xl uppercase tracking-tighter">BAJA</div>
                                   <div className="text-[0.6rem] text-slate-400 font-black uppercase tracking-widest">Información</div>
                                </div>
                                <div className="w-full h-px md:h-12 md:w-px bg-white/10 shrink-0" />
                                <div className="flex-1 flex flex-wrap gap-2 justify-center md:justify-start">
                                   {[12, 6].map(h => (
                                     <span key={h} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-black text-xs">
                                       -{h}h
                                     </span>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center"><Activity size={24} /></div>
                        <h4 className="text-white font-black text-lg uppercase tracking-tight">Timeline AHORA</h4>
                        <p className="text-[0.75rem] text-slate-400 font-medium leading-relaxed">
                          La vista diaria incluye un radar milimétrico. Una insignia de plasma morado rastreará exactamente la hora actual posicionándose horizontalmente frente a los compromisos de ese instante, así no te pierdes.
                        </p>
                      </div>
                      
                      <div className="p-8 bg-gradient-to-br from-[#ffd700]/10 to-transparent border border-[#ffd700]/20 rounded-[3rem] space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#ffd700]/20 text-[#ffd700] flex items-center justify-center text-3xl font-black">!</div>
                        <h4 className="text-white font-black text-lg uppercase tracking-tight text-[#ffd700]">Cumpleaños Oro</h4>
                        <p className="text-[0.75rem] text-slate-400 font-medium leading-relaxed">
                          Detectado automáticamente. Cualquier compañero con su fecha de nacimiento registrada será ensalzado en la Agenda con prioridad inamovible color oro. Lo humano es primero.
                        </p>
                      </div>
                    </motion.div>

                  </motion.div>
                )}

                {/* 3. ÓRDENES Y FINANZAS */}
                {activeTab === 'ordenes' && (
                  <motion.div key="ordenes" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-16">
                    <motion.div variants={itemVariants} className="space-y-6">
                       <h2 className="text-[0.6rem] font-black text-amber-500 uppercase tracking-[0.4em]">Módulo Comercial</h2>
                       <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none italic">Órdenes & Finance</h1>
                       <p className="text-slate-400 text-xl font-medium max-w-2xl">
                         Motor de manufactura y cobranza. Transformamos datos en documentos corporativos profesionales y métricas implacables.
                       </p>
                    </motion.div>

                    {/* Stepper Process Visual */}
                    <motion.div variants={itemVariants} className="p-10 rounded-[3rem] bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden relative">
                      <h3 className="text-white font-black uppercase tracking-widest text-sm mb-12 flex items-center gap-3">
                         <Package className="text-amber-500" /> Ciclo de Vida de Manufactura
                      </h3>
                      
                      <div className="relative">
                        {/* Connection Line */}
                        <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-white/5 rounded-full block" />
                        
                        <div className="grid grid-cols-4 gap-4 relative z-10 w-full">
                           {[
                             { s: 'RECIBIDA', c: 'border-blue-500 text-blue-500', bg: 'bg-blue-500/10', d: 'Creación y abono' },
                             { s: 'PROCESO', c: 'border-purple-500 text-purple-500', bg: 'bg-purple-500/10', d: 'Diseño/Armado' },
                             { s: 'PENDIENTE', c: 'border-amber-500 text-amber-500', bg: 'bg-amber-500/10', d: 'Lista p/ entregar' },
                             { s: 'COMPLETADA', c: 'border-emerald-500 text-emerald-500', bg: 'bg-emerald-500/10', d: 'Cerrada / Pagada' }
                           ].map((step, i) => (
                             <div key={i} className="flex flex-col items-center text-center">
                               <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg bg-[#0a0a0f] mb-4 shadow-lg ${step.c}`}>
                                 {i + 1}
                               </div>
                               <h4 className={`text-[0.6rem] md:text-[0.7rem] font-black uppercase tracking-widest ${step.c.split(' ')[1]}`}>{step.s}</h4>
                               <p className="text-[0.5rem] md:text-[0.6rem] text-slate-500 font-bold uppercase mt-1 px-2">{step.d}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* Double info cards */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-8 border border-white/10 rounded-[3rem] bg-gradient-to-b from-white/[0.04] to-transparent">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400"><FileText size={20} /></div>
                             <h4 className="text-white font-black uppercase tracking-widest text-sm">Contratos PDF VIP</h4>
                          </div>
                          <p className="text-[0.8rem] text-slate-400 leading-relaxed font-medium">
                            Con 1 clic la aplicación compila un PDF Ejecutivo. Éste integra códigos QR únicos, branding exacto de "More Design" (o Paper), desglose contable, subtotal, IVA, e historial de transacciones. Formateado perfecto para distribuir directo por el botón "Mandar por WhatsApp".
                          </p>
                       </div>
                       
                       <div className="p-8 border border-white/10 rounded-[3rem] bg-gradient-to-b from-red-500/5 to-transparent">
                          <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 rounded-xl bg-red-500/20 text-red-400"><AlertTriangle size={20} /></div>
                             <h4 className="text-white font-black uppercase tracking-widest text-sm text-red-100">Incumplimientos</h4>
                          </div>
                          <p className="text-[0.8rem] text-slate-400 leading-relaxed font-medium">
                            Cero tolerancia a los olvidos. Si la "Fecha de Vencimiento Estimada" de una Orden se cruza y aún no ha sido marcada como 'Completada', el Motor de Rastreo la degrada automáticamente a Estado: "Incumplida", detonando alarmas directas al supervisor y exigiendo un comentario de justificación para poder cerrarla.
                          </p>
                       </div>
                    </motion.div>

                  </motion.div>
                )}

                {/* 4. SUMINISTROS */}
                {activeTab === 'inventario' && (
                  <motion.div key="inventario" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
                     <motion.div variants={itemVariants} className="space-y-6">
                       <h2 className="text-[0.6rem] font-black text-emerald-500 uppercase tracking-[0.4em]">Módulo Proveedores</h2>
                       <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none italic">Partners Corporativos</h1>
                       <p className="text-slate-400 text-xl font-medium max-w-2xl">
                         Un directorio con red interconectada. Tu libreta de contactos ultra-enriquecida.
                       </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/10 grid md:grid-cols-2 gap-10">
                       <div>
                          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6"><Briefcase size={28} /></div>
                          <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-4">Etiquetado Inteligente</h3>
                          <p className="text-[0.85rem] text-slate-400 font-medium leading-relaxed mb-6">
                            Ya no es 1 a 1. ¿Un proveedor te surte cajas pero también listones mágicos temporales? Asigna <strong>múltiples categorías</strong> por proveedor desde Checks interactivos. Al utilizar el buscador general, emergerán instantáneamente sin importar qué ángulo busques.
                          </p>
                          <div className="flex gap-2">
                             <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-black">Empaques</span>
                             <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-xs font-black">Papelería</span>
                          </div>
                       </div>
                       
                       <div className="border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 md:pl-10">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6"><Globe size={28} /></div>
                          <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-4">Mapeo Social 360°</h3>
                          <p className="text-[0.85rem] text-slate-400 font-medium leading-relaxed">
                            No solo nombres y teléfonos. Entramos en la modernidad: captura URLs puras para el Portafolio, Perfil Analizado de Instagram y Canal de TikTok.
                            Botones dedicados en cada tarjeta sacarán al usuario hacia la aplicación social respectiva con 1 solo tap, facilitando análisis de referencias.
                          </p>
                       </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* 5. INTELIGENCIA CLOUD */}
                {activeTab === 'inteligencia' && isElevated && (
                  <motion.div key="inteligencia" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-16">
                     <motion.div variants={itemVariants} className="space-y-6">
                       <h2 className="text-[0.6rem] font-black text-purple-500 uppercase tracking-[0.4em]">Módulo Control Master</h2>
                       <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none italic">Inteligencia Cloud</h1>
                       <p className="text-slate-400 text-xl font-medium max-w-2xl">
                         El panel de los directores. Toma decisiones exactas utilizando el analizador estadístico con proyección temporal.
                       </p>
                    </motion.div>

                    {/* Dashboard Metric CSS UI */}
                    <motion.div variants={itemVariants} className="p-8 md:p-12 border border-white/10 rounded-[3rem] bg-gradient-to-b from-[#0a0a0f] to-[#120d18] relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
                       
                       <div className="flex items-center gap-4 mb-10 relative z-10">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white"><Award size={24} /></div>
                         <div>
                            <h3 className="text-white font-black uppercase tracking-widest">Algoritmo de Valoración "More"</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase mt-1">Así calculamos quién es el número #1 cada mes.</p>
                         </div>
                       </div>

                       <div className="flex flex-col md:flex-row gap-6 relative z-10">
                          {/* Segment 1 */}
                          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 font-black text-4xl text-white/5 group-hover:text-amber-500/10 transition-colors">40%</div>
                             <div className="text-amber-500 font-black text-3xl mb-2 tracking-tighter">40%</div>
                             <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Ventas Brutas</h4>
                             <p className="text-[0.65rem] text-slate-400 font-medium">Volumen de dinero total en las órdenes creadas por este asesor, sin importar lo ya pagado.</p>
                          </div>
                          
                          {/* Segment 2 */}
                          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 font-black text-4xl text-white/5 group-hover:text-emerald-500/10 transition-colors">40%</div>
                             <div className="text-emerald-500 font-black text-3xl mb-2 tracking-tighter">40%</div>
                             <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Recaudo Efectivo</h4>
                             <p className="text-[0.65rem] text-slate-400 font-medium">Capacidad del empleado para perseguir pagos y lograr el retorno final del abono/saldo en caja.</p>
                          </div>

                          {/* Segment 3 */}
                          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 font-black text-4xl text-white/5 group-hover:text-blue-500/10 transition-colors">20%</div>
                             <div className="text-blue-500 font-black text-3xl mb-2 tracking-tighter">20%</div>
                             <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Puntualidad</h4>
                             <p className="text-[0.65rem] text-slate-400 font-medium">Se califica según cuántas órdenes logró finalizar en estado Completada, mitigando incumplimientos.</p>
                          </div>
                       </div>
                    </motion.div>

                    {/* KPIs Info */}
                    <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                       <div className="p-8 border border-white/10 bg-white/[0.02] rounded-[3rem]">
                         <div className="flex gap-4">
                           <div className="mt-1 text-purple-400"><TrendingUp size={20} /></div>
                           <div>
                              <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Forecast Predictivo</h4>
                              <p className="text-[0.75rem] text-slate-400 leading-relaxed font-medium">Usamos regresión de la data fresca del mes actuante. Supabase calcula promedios y te arroja la cantidad de dinero estimado que harás en la próxima semana, dejándote anticipar si debes empujar marketing urgente.</p>
                           </div>
                         </div>
                       </div>
                       
                       <div className="p-8 border border-white/10 bg-white/[0.02] rounded-[3rem]">
                         <div className="flex gap-4">
                           <div className="mt-1 text-blue-400"><Clock size={20} /></div>
                           <div>
                              <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">Métricas SLA</h4>
                              <p className="text-[0.75rem] text-slate-400 leading-relaxed font-medium">Acuerdo de Nivel de Servicio. Mide las diferencias en horas entre el click de "Crear Orden" y el click de convertirla en "Completada". Tu meta ejecutiva es mantener este número inferior a 24-48hrs máximas.</p>
                           </div>
                         </div>
                       </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* 6. SEGURIDAD BIO */}
                {activeTab === 'seguridad' && (
                  <motion.div key="seguridad" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
                     <motion.div variants={itemVariants} className="space-y-6">
                       <h2 className="text-[0.6rem] font-black text-teal-400 uppercase tracking-[0.4em]">Módulo Confidencial</h2>
                       <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none italic">Seguridad Bio</h1>
                       <p className="text-slate-400 text-xl font-medium max-w-2xl">
                         Arquitectura blindada. Acceso transparente pero infraqueable desde el frontend al nivel de base de datos.
                       </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="p-10 border border-teal-500/30 bg-gradient-to-br from-teal-900/20 to-black rounded-[3rem] relative grid md:grid-cols-2 items-center gap-10 overflow-hidden">
                       <div className="relative z-10 space-y-6">
                          <h3 className="text-white text-3xl font-black uppercase tracking-tighter leading-none">Pasaporte<br/>Zero-Click</h3>
                          <p className="text-[0.8rem] text-teal-100/70 font-medium leading-relaxed text-justify">
                            ¿Cansado de digitar claves? Entra a tu Perfil y da clic al interruptor central. La plataforma anclará un Certificado WebAuthn en el procesador seguro de tu iPhone o Android. ¡Se acabó! La próxima vez que cierres sesión, bastará con posar el dedo o usar tu cámara facial para reanudar el trabajo en 0.5 segundos.
                          </p>
                       </div>
                       
                       <div className="relative z-10 flex justify-center">
                          <div className="w-48 h-48 rounded-full border border-teal-500/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(20,184,166,0.3)]">
                             <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-ping opacity-20"></div>
                             <div className="w-32 h-32 rounded-full bg-teal-950 border border-teal-500/50 flex items-center justify-center relative overflow-hidden">
                               <div className="absolute top-0 left-0 w-full h-[5%] bg-teal-400/80 shadow-[0_0_15px_#2dd4bf] animate-[scan_2s_linear_infinite]" />
                               <Fingerprint size={60} className="text-teal-400/80" strokeWidth={1} />
                             </div>
                          </div>
                          
                          <style>{`
                            @keyframes scan {
                              0% { top: 0; opacity: 0; }
                              10% { opacity: 1; }
                              90% { opacity: 1; }
                              100% { top: 100%; opacity: 0; }
                            }
                          `}</style>
                       </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* 7. ADMIN */}
                {activeTab === 'admin' && user?.isMaster && (
                  <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
                     <motion.div variants={itemVariants} className="space-y-6">
                       <h2 className="text-[0.6rem] font-black text-rose-500 uppercase tracking-[0.4em]">Módulo Maestro</h2>
                       <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none italic">Administración Suprema</h1>
                       <p className="text-slate-400 text-xl font-medium max-w-2xl">
                         Control absoluto "God Mode". Editas todo, ves todo, administras todos los recursos.
                       </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid gap-4">
                       <div className="p-8 border border-rose-500/30 bg-rose-950/10 rounded-[3rem] flex items-center gap-6">
                         <div className="w-16 h-16 shrink-0 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center"><CheckCircle2 size={30} /></div>
                         <div>
                            <h3 className="text-white text-lg font-black uppercase tracking-tight mb-2">Visibilidad Global RLS Inversa</h3>
                            <p className="text-[0.75rem] text-slate-400 font-medium">La base de datos bloquea la vista de otros perfiles. El Administrador Maestro tiene bypass de seguridad: puede ver la agenda, datos financieros e inventarios compartidos cruzados por todos los usuarios simultáneamente.</p>
                         </div>
                       </div>
                       
                       <div className="p-8 border border-white/10 bg-white/[0.02] rounded-[3rem] flex items-center gap-6">
                         <div className="w-16 h-16 shrink-0 bg-white/5 text-slate-300 rounded-2xl flex items-center justify-center"><Crown size={30} /></div>
                         <div>
                            <h3 className="text-white text-lg font-black uppercase tracking-tight mb-2">Dictador de Usuarios</h3>
                            <p className="text-[0.75rem] text-slate-400 font-medium">En el Panel de Cuentas, tienes el botón nuclear. Puedes extender periódos Sandbox, reiniciar contraseñas manualmente, convertir Colaboradores temporales en Directores Ejecutivos.</p>
                         </div>
                       </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* 8. IA ASSISTANT */}
                {activeTab === 'ia' && (
                  <motion.div key="ia" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full flex flex-col pt-4 md:pt-0">
                    <motion.div variants={itemVariants} className="space-y-4 mb-8">
                       <h2 className="text-[0.6rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase tracking-[0.4em]">Núcleo AI</h2>
                       <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none italic">Brain AI</h1>
                       <p className="text-slate-400 text-lg font-medium">Asistente Google Gemini integrado 100% en la sintáxis de More.</p>
                    </motion.div>

                    {/* Chat Area - Completely Redesigned Glass UI */}
                    <div className="flex-1 min-h-[400px] flex flex-col bg-white/[0.03] rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
                      
                      {/* Background decor */}
                      <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

                      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar relative z-10">
                        {chatMessages.map((msg, i) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            transition={{ duration: 0.3 }}
                            key={i} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-3xl text-[0.8rem] md:text-sm font-medium leading-relaxed shadow-xl ${
                              msg.role === 'user' 
                                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-sm border border-purple-400/30' 
                                : 'bg-black/60 backdrop-blur-md text-slate-200 rounded-tl-sm border border-white/10'
                            }`}>
                              {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 text-[0.6rem] font-black text-purple-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                                  <Bot size={12} /> Jarvis Mode
                                </div>
                              )}
                              <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                            </div>
                          </motion.div>
                        ))}
                        {isTyping && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-black/60 text-slate-400 p-4 rounded-3xl rounded-tl-sm border border-white/10 flex items-center gap-3 backdrop-blur-md">
                               <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                               </div>
                               <span className="text-[0.65rem] font-black uppercase tracking-widest text-purple-400 ml-1">Procesando</span>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Input Panel */}
                      <div className="p-4 md:p-6 bg-black/60 backdrop-blur-xl border-t border-white/10 flex gap-3 relative z-10 shrink-0">
                        <input 
                          type="text" 
                          value={userInput}
                          onChange={e => setUserInput(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Consulta tu duda aquí..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium placeholder:font-bold placeholder:text-slate-600 tracking-wide"
                        />
                        <button 
                          onClick={handleSendMessage}
                          disabled={!userInput.trim() || isTyping}
                          className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-slate-200 hover:scale-105 transition-all active:scale-95 disabled:opacity-20 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                          <Send size={22} className="ml-1" />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
