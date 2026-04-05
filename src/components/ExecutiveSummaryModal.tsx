import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  ClipboardList, 
  CheckCircle2, 
  Phone,
  Tag
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // Can be Task or ServiceOrder
  type: 'task' | 'order';
}

export default function ExecutiveSummaryModal({ isOpen, onClose, data, type }: ExecutiveSummaryModalProps) {
  if (!data) return null;

  const isOrder = type === 'order';
  const title = isOrder ? data.customerName : data.title;
  const subtitle = isOrder ? `Orden ${data.id}` : (data.isShared ? 'Tarea de Equipo' : 'Tarea Personal');
  const responsible = isOrder ? data.responsible : (data.userId || 'Sin asignar');
  
  // Date formatting
  let displayDate = 'Sin fecha';
  let displayTime = 'Sin hora';
  try {
    const dateObj = isOrder ? parseISO(data.deliveryDate) : parseISO(`${data.date}T${data.time}`);
    displayDate = format(dateObj, "EEEE, d 'de' MMMM", { locale: es });
    displayTime = format(dateObj, "HH:mm 'hrs'");
  } catch (e) {
    console.error('Date error', e);
  }

  const status = data.status || 'Pendiente';
  const getStatusColor = (s: string) => {
    const s_lower = s.toLowerCase();
    if (s_lower.includes('completada') || s_lower.includes('accepted')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s_lower.includes('proceso') || s_lower.includes('pendiente')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (s_lower.includes('cancelada') || s_lower.includes('declined')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const image = isOrder ? (data.photos?.[0]) : data.imageUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#1a1622]/90 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            {/* Header / Banner Image */}
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-slate-900 flex items-center justify-center text-white/5">
                   {isOrder ? <ClipboardList size={80} /> : <CheckCircle2 size={80} />}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1622] via-transparent to-transparent" />
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-black/40 border border-white/10 text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>

              <div className="absolute bottom-6 left-8 right-8">
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[0.6rem] font-black uppercase tracking-widest mb-3 ${getStatusColor(status)}`}>
                    {status.replace('_', ' ')}
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight line-clamp-2">{title}</h2>
                 <p className="text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">{subtitle}</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-8">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} className="text-purple-500" /> Responsable
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {responsible}
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                   <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 justify-end">
                    <Tag size={12} className="text-purple-500" /> Categoria
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {isOrder ? 'Orden de Servicio' : (data.priority || 'General')}
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                       <Calendar size={24} />
                    </div>
                    <div>
                       <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest">Fecha Estimada</div>
                       <div className="text-sm font-bold text-slate-200 capitalize">{displayDate}</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                       <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest">Hora</div>
                       <div className="text-sm font-bold text-white">{displayTime}</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                       <Clock size={24} />
                    </div>
                 </div>
              </div>

              {isOrder && data.services && (
                <div className="space-y-2">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={12} className="text-purple-500" /> Servicios Solicitados
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.services.map((s: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[0.65rem] font-bold text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!isOrder && data.description) && (
                <div className="space-y-2">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={12} className="text-purple-500" /> Detalles de la Actividad
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-400 leading-relaxed italic">
                    "{data.description}"
                  </div>
                </div>
              )}

              {isOrder && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                   <Phone size={16} className="text-emerald-500" />
                   <div className="flex-1 text-xs font-bold text-emerald-400">
                      {data.customerPhone}
                   </div>
                   <div className="text-[0.65rem] font-black text-white tracking-widest flex items-center gap-1">
                      $ {data.totalCost?.toLocaleString()}
                   </div>
                </div>
              )}

              {/* Action */}
              <div className="pt-4">
                 <p className="text-[0.65rem] text-slate-600 font-medium italic mb-6 text-center">
                    * El resumen ejecutivo es de solo lectura. Para realizar modificaciones, dirígete a la sección correspondiente.
                 </p>
                 <button 
                   onClick={onClose}
                   className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                 >
                   Entendido
                 </button>
              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
