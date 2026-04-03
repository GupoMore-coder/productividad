import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  Package, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  ChevronLeft, 
  CheckCircle2, 
  Clock4, 
  History, 
  Info,
  ShieldCheck,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';


export default function PublicOrderStatus() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const { data, error } = await supabase
          .from('service_orders')
          .select(`*, order_history(*)`)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        
        // Sort history by timestamp descending
        if (data.order_history) {
          data.order_history.sort((a: any, b: any) => 
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );
        }
        
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching public order:', err);
        setError('No pudimos localizar la orden. Verifica el código o escanea el QR nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6 space-y-8">
        <header className="text-center space-y-4 pt-12">
          <Skeleton width={120} height={24} className="mx-auto rounded-full" />
          <Skeleton width="80%" height={40} className="mx-auto rounded-xl" />
          <Skeleton width={150} height={16} className="mx-auto rounded-lg" />
        </header>

        <div className="max-w-xl mx-auto space-y-10">
          <Skeleton width="100%" height={240} className="rounded-[40px]" />
          
          <div className="flex justify-between px-2">
            <Skeleton width={60} height={60} className="rounded-2xl" />
            <Skeleton width={60} height={60} className="rounded-2xl" />
            <Skeleton width={60} height={60} className="rounded-2xl" />
            <Skeleton width={60} height={60} className="rounded-2xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Skeleton width="100%" height={80} className="rounded-3xl" />
            <Skeleton width="100%" height={80} className="rounded-3xl" />
          </div>

          <Skeleton width="100%" height={200} className="rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
            <Info size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Orden no Encontrada</h2>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
            <ChevronLeft size={16} /> Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string, color: string, icon: any, step: number }> = {
      'recibida': { label: 'Recibida', color: 'text-blue-500', icon: Clock4, step: 1 },
      'en_proceso': { label: 'En Elaboración', color: 'text-amber-500', icon: Zap, step: 2 },
      'pendiente_entrega': { label: 'Lista para Entrega', color: 'text-purple-500', icon: Package, step: 3 },
      'completada': { label: 'Entregada', color: 'text-emerald-500', icon: CheckCircle2, step: 4 },
      'cancelada': { label: 'Cancelada', color: 'text-red-500', icon: Info, step: 0 },
      'vencida': { label: 'Vencida', color: 'text-red-400', icon: AlertCircle, step: 1.5 }
    };
    return configs[status] || { label: status, color: 'text-slate-500', icon: Info, step: 0 };
  };

  const statusCfg = getStatusConfig(order.status);
  const steps = [
    { label: 'Recibida', step: 1 },
    { label: 'Elaboración', step: 2 },
    { label: 'Lista', step: 3 },
    { label: 'Entregada', step: 4 }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20 animate-fade-in relative overflow-x-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-xl mx-auto px-6 pt-12 space-y-10 relative z-10">
        
        {/* Branding */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
            <ShieldCheck size={14} className="text-[#d4bc8f]" />
            <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#d4bc8f]">Autenticidad Verificada</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Productividad <span className="text-[#d4bc8f]">GrupoMore</span></h1>
          <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-[0.3em]">Portal de Cliente v2.0</p>
        </header>

        {/* Order Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
            <Package size={120} />
          </div>
          
          <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-500">Número de Orden</span>
          <h2 className="text-5xl font-black text-white mt-1 mb-6 tracking-tight">#{order.id.toString().padStart(4, '0')}</h2>
          
          <div 
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 ${statusCfg.color} font-black text-xs uppercase tracking-widest`}
            aria-label={`Estado actual de la orden: ${statusCfg.label}`}
          >
            <statusCfg.icon size={16} aria-hidden="true" />

            {statusCfg.label}
          </div>
        </motion.div>

        {/* Progress Tracker */}
        {order.status !== 'cancelada' && (
          <section className="px-2">
            <div className="flex justify-between relative">
              {/* Background Line */}
              <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-white/5 rounded-full" />
              {/* Active Line */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, (statusCfg.step - 1) * 33 + 1))}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`absolute top-4 left-[10%] h-1 ${statusCfg.color.replace('text', 'bg')} rounded-full shadow-[0_0_15px_rgba(212,188,143,0.3)]`}
              />
              
              {steps.map((s, i) => {
                const isActive = statusCfg.step >= s.step;
                const IconComp = isActive ? CheckCircle2 : Clock;
                return (
                  <div key={i} className="z-10 text-center w-1/4 space-y-3" aria-label={`Paso ${i + 1}: ${s.label} - ${isActive ? 'Completado' : 'Pendiente'}`}>
                    <div className={`w-8 h-8 rounded-[10px] mx-auto flex items-center justify-center border-2 transition-all duration-700 ${isActive ? `${statusCfg.color.replace('text', 'bg')} border-transparent text-slate-900` : 'bg-[#1a1a24] border-white/10 text-slate-600'}`}>
                      <IconComp size={14} aria-hidden="true" />

                    </div>
                    <span className={`text-[0.55rem] font-black uppercase tracking-tighter block ${isActive ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-start gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <User size={20} />
            </div>
            <div>
              <p className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-0.5">Cliente</p>
              <p className="text-sm font-bold text-white leading-tight">{order.customer_name}</p>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-start gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-0.5">Entrega Estimada</p>
              <p className="text-sm font-bold text-white leading-tight">
                {order.delivery_date 
                  ? format(parseISO(order.delivery_date), 'dd MMMM, yyyy', { locale: es })
                  : 'Fecha por confirmar'}
              </p>
            </div>
          </div>
        </div>

        {/* Services & History - New Audit Requirement */}
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 shadow-xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 font-black text-[4rem] text-white/[0.02] select-none uppercase tracking-tighter">Specs</div>
            <h3 className="text-[0.65rem] font-black text-[#d4bc8f] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Zap size={14} /> Servicios Contratados
            </h3>
            <div className="flex flex-wrap gap-2">
              {order.services.map((s: string, i: number) => (
                <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300">
                  {s}
                </span>
              ))}
            </div>
            {order.notes && (
              <div className="mt-8 p-4 bg-black/40 rounded-2xl border-l-4 border-[#d4bc8f] italic text-xs text-slate-400 leading-relaxed font-medium">
                "{order.notes}"
              </div>
            )}
          </div>

          {/* New Timeline History Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={14} /> Historial de Operación
              </h3>
              <div className="text-[0.5rem] font-bold text-slate-600 uppercase tracking-widest">En tiempo real</div>
            </div>
            
            <div className="space-y-8 border-l-2 border-white/5 ml-2 pl-6">
              {order.order_history && order.order_history.length > 0 ? (
                order.order_history.map((h: any, i: number) => {
                  const eventType = h.type || 'cambio_estado';
                  return (
                    <div key={i} className="relative">
                      {/* Dot */}
                      <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-4 border-[#0a0a0f] ${
                        eventType === 'creacion' ? 'bg-blue-500' :
                        eventType === 'completada' ? 'bg-emerald-500' :
                        eventType === 'observacion' ? 'bg-purple-500' : 'bg-[#d4bc8f]'
                      }`} />
                      <div className="space-y-1">
                        <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">
                          {h.timestamp 
                            ? format(new Date(h.timestamp), 'dd MMM, HH:mm', { locale: es })
                            : 'Pendiente'}
                        </p>
                        <p className="text-xs font-bold text-white tracking-tight">{h.description || 'Actualización de sistema'}</p>
                        {h.type === 'observacion' && <p className="text-[0.65rem] text-purple-400/80 font-medium italic mt-1">Nota: {h.description}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 opacity-30">
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest">Iniciando seguimiento...</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="pt-10 pb-20 text-center space-y-4">
          <div className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-[#d4bc8f] opacity-50">
            Grupo More — Calidad y Seguridad
          </div>
          <div className="text-[0.6rem] text-slate-600 font-bold uppercase tracking-widest space-y-1">
            <p>© {new Date().getFullYear()} Bogotá, Colombia</p>
            <p className="flex items-center justify-center gap-2">
              <Phone size={10} /> Soporte: +57 {order.customer_phone?.slice(0, 3)} *** **
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
