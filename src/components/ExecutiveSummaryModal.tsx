import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Clock, 
  ClipboardList, 
  CheckCircle2, 
  Tag,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // Task or ServiceOrder
  type: 'task' | 'order';
  users?: any[];
  onUpdate?: (id: string, fields: any) => Promise<void>;
}

export default function ExecutiveSummaryModal({ isOpen, onClose, data, type, users = [], onUpdate }: ExecutiveSummaryModalProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isOrder = type === 'order';
  const title = String(isOrder ? data?.customerName : (data?.title || 'Sin título'));
  const subtitle = isOrder ? `Orden ${String(data?.id)}` : (data?.isShared ? 'Tarea de Equipo' : 'Tarea Personal');
  
  // Mapping UID to Name
  const responsibleId = isOrder ? data?.responsible : data?.userId;
  const responsibleName = useMemo(() => {
    if (!responsibleId) return 'Sin asignar';
    const found = users.find(u => u.id === responsibleId || u.username === responsibleId);
    return found ? (found.full_name || found.username) : responsibleId;
  }, [responsibleId, users]);

  const images = useMemo(() => {
    if (!data) return [];
    if (isOrder) return data.photos || [];
    return data.imageUrl ? [data.imageUrl] : [];
  }, [data, isOrder]);

  const status = data.status || 'Pendiente';
  const getStatusColor = (s: string) => {
    const s_lower = s.toLowerCase();
    if (s_lower.includes('completada') || s_lower.includes('accepted')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s_lower.includes('proceso') || s_lower.includes('pendiente')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (s_lower.includes('cancelada') || s_lower.includes('declined')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const handleUpdate = async (fields: any) => {
    if (!onUpdate) return;
    setIsUpdating(true);
    try {
      await onUpdate(data.id, fields);
      triggerHaptic('success');
    } catch (err) {
      console.error('Update error:', err);
      triggerHaptic('error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper for image zoom
  const handleZoom = () => {
    if (images.length > 0) {
      window.dispatchEvent(new CustomEvent('zoom-image', { detail: images[currentImgIndex] }));
    }
  };

  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative w-full max-w-lg bg-[#0f111a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-3xl flex flex-col max-h-[90vh]"
          >
            {/* Header / Gallery Carousel */}
            <div className="relative h-64 bg-slate-950 group/gallery overflow-hidden">
              <AnimatePresence mode="wait">
                {images.length > 0 ? (
                  <motion.div 
                    key={currentImgIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="w-full h-full relative"
                  >
                    <img 
                      src={images[currentImgIndex]} 
                      alt={`Slide ${currentImgIndex}`} 
                      className="w-full h-full object-cover select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-transparent to-transparent opacity-60" />
                  </motion.div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950/40 to-slate-950 flex flex-col items-center justify-center text-white/5">
                     {isOrder ? <ClipboardList size={100} /> : <CheckCircle2 size={100} />}
                  </div>
                )}
              </AnimatePresence>

              {/* Carousel Controls */}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentImgIndex((prev: number) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 border border-white/10 text-white opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-purple-600 shadow-xl"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setCurrentImgIndex((prev: number) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 border border-white/10 text-white opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-purple-600 shadow-xl"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 rounded-full bg-black/40 backdrop-blur-md">
                     {images.map((_: any, i: number) => (
                       <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImgIndex ? 'bg-purple-500 w-4' : 'bg-white/20'}`} />
                     ))}
                  </div>
                </>
              )}

              {/* Close & Zoom */}
              <div className="absolute top-6 left-6 right-6 flex justify-between">
                 <button onClick={onClose} className="p-3 rounded-2xl bg-black/40 border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-md">
                    <X size={20} />
                 </button>
                 {images.length > 0 && (
                   <button onClick={handleZoom} className="p-3 rounded-2xl bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20 active:scale-90">
                      <Maximize2 size={20} />
                   </button>
                 )}
              </div>

              <div className="absolute bottom-6 left-8 right-8">
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[0.6rem] font-black uppercase tracking-widest mb-3 ${getStatusColor(status)} shadow-lg`}>
                    {String(status).replace('_', ' ')}
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight leading-none truncate">{title}</h2>
                 <p className="text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> {subtitle}
                 </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-10">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} className="text-purple-500" /> {isOrder ? 'Cliente' : 'Responsable'}
                  </div>
                  <div className="text-sm font-bold text-white tracking-tight">
                    {responsibleName}
                  </div>
                </div>

                <div className="space-y-2 text-right">
                   <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 justify-end">
                    <Tag size={12} className="text-purple-500" /> Prioridad
                  </div>
                  {!isOrder ? (
                    <div className="flex gap-1.5 justify-end">
                       {['baja', 'media', 'alta'].map(p => (
                         <button 
                           key={p} 
                           disabled={isUpdating}
                           onClick={() => handleUpdate({ priority: p })}
                           className={`px-2 py-1 rounded-lg text-[0.55rem] font-black uppercase border transition-all ${data.priority === p ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-600 hover:border-white/10'}`}
                         >
                            {p}
                         </button>
                       ))}
                    </div>
                  ) : (
                    <div className="text-sm font-black text-emerald-400">$ {data.totalCost?.toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* Date & Time Pickers */}
              <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                          <CalendarDays size={24} />
                       </div>
                       <div>
                          <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Traslado de Fecha</div>
                          <input 
                            type="date" 
                            disabled={isUpdating}
                            value={data.date || (isOrder ? data.deliveryDate?.split('T')[0] : '')}
                            onChange={(e) => handleUpdate(isOrder ? { deliveryDate: `${e.target.value}T${data.deliveryDate?.split('T')[1] || '12:00:00'}` } : { date: e.target.value })}
                            className="bg-transparent text-sm font-black text-white outline-none cursor-pointer hover:text-purple-400 transition-colors uppercase"
                          />
                       </div>
                    </div>
                    {isUpdating && <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />}
                 </div>
                 
                 <div className="h-px bg-white/5" />

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <Clock size={24} />
                       </div>
                       <div>
                          <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Horario Programado</div>
                          <input 
                            type="time" 
                            disabled={isUpdating}
                            value={data.time || (isOrder ? data.deliveryDate?.split('T')[1] : '')}
                            onChange={(e) => handleUpdate(isOrder ? { deliveryDate: `${data.deliveryDate?.split('T')[0] || '2026-04-05'}T${e.target.value}` } : { time: e.target.value })}
                            className="bg-transparent text-sm font-black text-white outline-none cursor-pointer hover:text-amber-500 transition-colors"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {isOrder && data.services && (
                <div className="space-y-3">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={12} className="text-purple-500" /> Especificaciones de Servicio
                  </div>
                  <div className="flex flex-wrap gap-2 text-[0.6rem] font-black">
                    {data.services.map((s: string, idx: number) => (
                      <span key={idx} className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">
                         {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!isOrder && data.description) && (
                <div className="space-y-3">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={12} className="text-purple-500" /> Bitácora de la Tarea
                  </div>
                  <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/5 text-xs text-slate-400 leading-relaxed italic shadow-inner">
                    "{data.description}"
                  </div>
                </div>
              )}

              {/* Status Action / Delete */}
              <div className="pt-4 space-y-4">
                 <button 
                   onClick={onClose}
                   className="w-full py-5 rounded-[24px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 shadow-xl shadow-purple-500/20"
                 >
                   Confirmar y Cerrar
                 </button>
                 
                 {!isOrder && (
                    <button 
                      onClick={() => {
                        if (confirm('¿Deseas eliminar esta tarea permanentemente?')) {
                          handleUpdate({ status: 'cancelled_with_reason', completed: true });
                          onClose();
                        }
                      }}
                      className="w-full py-4 text-[0.6rem] font-black text-slate-700 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                    >
                       <Trash2 size={12} /> Eliminar Tarea de Agenda
                    </button>
                 )}
              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
