import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Clock, 
  ClipboardList, 
  CheckCircle2, 
  Tag,
  Maximize2,
  Trash2,
  CalendarDays,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupContext';
import { useOrders } from '../context/OrderContext';
import { FileText } from 'lucide-react';

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
  const [showReminderDraft, setShowReminderDraft] = useState(false);
  const { user: currentUser } = useAuth();
  const { memberships } = useGroups();
  const [justification, setJustification] = useState('');
  const [showJustificationOverlay, setShowJustificationOverlay] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  
  // WhatsApp / Reminder State
  const [reminderMsg, setReminderMsg] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendQueue, setSendQueue] = useState<string[]>([]);
  const [currentQueueIdx, setCurrentQueueIdx] = useState(0);
  
  // Date/Time Buffering
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');
  
  const { getOrderSequenceLabel, getQuoteSequenceLabel } = useOrders();
  const isOrder = type === 'order';
  const isQuote = !isOrder && data?.recordType === 'cotizacion';
  
  const title = String(isOrder || isQuote ? data?.customerName : (data?.title || 'Sin título'));
  
  const subtitle = useMemo(() => {
    if (isOrder) return getOrderSequenceLabel(data.id);
    if (isQuote) return getQuoteSequenceLabel(data.id);
    return data?.isShared ? 'Tarea de Equipo' : 'Tarea Personal';
  }, [data?.id, isOrder, isQuote, getOrderSequenceLabel, getQuoteSequenceLabel, data?.isShared]);

  // Mapping UID to Name
  const responsibleId = isOrder ? data?.responsible : data?.userId;
  const responsibleName = useMemo(() => {
    if (!responsibleId) return 'Sin asignar';
    const found = users.find(u => u.id === responsibleId || u.username === responsibleId);
    return found ? (found.full_name || found.username) : responsibleId;
  }, [responsibleId, users]);

  const groupMembers = useMemo(() => {
    if (!data) return [];
    if (!isOrder && data.groupId) {
      const allowedIds = memberships
        .filter(m => m.groupId === data.groupId && m.status === 'approved')
        .map(m => m.userId);
      return users.filter(u => allowedIds.includes(u.id));
    }
    return [];
  }, [isOrder, data?.groupId, memberships, users]);

  const canSendWA = isOrder ? !!data?.customerPhone : groupMembers.length > 0;

  const images = useMemo(() => {
    if (!data) return [];
    if (isOrder || isQuote) return data.photos || [];
    return data.imageUrls || [];
  }, [data, isOrder, isQuote]);

  const status = data?.status || 'Pendiente';
  const getStatusColor = (s: string) => {
    const s_lower = String(s).toLowerCase();
    if (s_lower === 'incumplida') return 'bg-red-500 text-white border-red-400 font-black';
    if (s_lower.includes('completada') || s_lower.includes('accepted')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s_lower.includes('proceso') || s_lower.includes('pendiente')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (s_lower.includes('cancelada') || s_lower.includes('declined')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const isCreator = currentUser?.id === data?.userId || currentUser?.email === data?.createdBy;
  
  useEffect(() => {
    if (status === 'incumplida' && !data?.cancelReason && isCreator) {
      setShowJustificationOverlay(true);
    }

    // Initialize temp state
    if (data) {
      if (isOrder) {
        const parts = data.deliveryDate?.split('T') || [];
        setTempDate(parts[0] || '');
        setTempTime(parts[1]?.slice(0, 5) || '');
      } else {
        setTempDate(data.date || '');
        setTempTime(data.time || '');
      }
    }
  }, [status, data?.cancelReason, isCreator, data, isOrder, isOpen]);

  const handleUpdate = async (fields: any) => {
    if (!data || !onUpdate) return;
    
    // Check if cancellation requires justification (by any user performing the action)
    if (fields.status === 'cancelada' && !justification && !data?.cancelReason) {
      setTargetStatus('cancelada');
      setShowJustificationOverlay(true);
      return;
    }

    setIsUpdating(true);
    try {
      if (justification) {
        fields.cancelReason = justification;
        fields.newObservation = `JUSTIFICACIÓN (${fields.status || data?.status}) por ${currentUser?.full_name || currentUser?.username}: ${justification}`;
      }

      await onUpdate(data?.id, fields);
      triggerHaptic('success');
      setShowJustificationOverlay(false);
      setJustification('');
    } catch (err) {
      console.error('Update error:', err);
      triggerHaptic('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const submitJustification = () => {
    if (!justification.trim()) {
      alert('Por favor, redacte una justificación válida.');
      return;
    }
    if (!data) return;
    handleUpdate({ status: targetStatus || data?.status });
  };

  // Helper for image zoom
  const handleZoom = () => {
    if (images.length > 0) {
      window.dispatchEvent(new CustomEvent('zoom-image', { 
        detail: { photos: images, index: currentImgIndex } 
      }));
    }
  };

  const prepareReminder = () => {
    if (!data) return;
    triggerHaptic('light');
    let msg = '';
    const signature = `\n\nEnviado por: ${currentUser?.full_name || currentUser?.username} - ${currentUser?.role || 'Colaborador'}`;
    
    if (isOrder) {
      msg = `Hola ${data.customerName}, te saludamos de More Paper & Design. ✨ Te recordamos que tu orden #${data.id} (${data.services?.join(' + ')}) está programada para hoy. 🚀`;
      setSelectedRecipients([data.customerPhone]);
    } else {
      msg = `Hola, recordatorio equipo More para la tarea: "${data.title}". Fecha: ${data.date} a las ${data.time}. 📋${signature}`;
      // Iniciar con responsables o vacío
      const initSelection = data.userId ? [data.userId] : [];
      setSelectedRecipients(initSelection);
    }
    setReminderMsg(msg);
    setShowReminderDraft(true);
    setSendQueue([]);
    setCurrentQueueIdx(0);
  };

  const startSending = () => {
    if (!data) return;
    triggerHaptic('success');
    const phones = isOrder 
      ? [data.customerPhone] 
      : users.filter(u => selectedRecipients.includes(u.id) && u.phone).map(u => u.phone!.replace(/[^0-9]/g, ''));
    
    if (phones.length === 0) {
      alert('No hay números de teléfono válidos seleccionados.');
      return;
    }

    setSendQueue(phones);
    setCurrentQueueIdx(0);
    
    const encoded = encodeURIComponent(reminderMsg);
    window.open(`https://wa.me/${phones[0]}?text=${encoded}`, '_blank');
  };

  const sendNextInQueue = () => {
    triggerHaptic('light');
    const nextIdx = currentQueueIdx + 1;
    if (nextIdx < sendQueue.length) {
      setCurrentQueueIdx(nextIdx);
      const encoded = encodeURIComponent(reminderMsg);
      window.open(`https://wa.me/${sendQueue[nextIdx]}?text=${encoded}`, '_blank');
    } else {
      setShowReminderDraft(false);
      setSendQueue([]);
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
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative w-full max-w-lg bg-[#0a0b14] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-3xl flex flex-col max-h-[90vh]"
          >
            {/* Header / Gallery Carousel */}
            <div className="relative h-64 bg-slate-950 group/gallery overflow-hidden">
              {/* Gallery Scroll */}
              <div className="w-full h-full relative cursor-pointer" onClick={() => images.length > 0 && handleZoom()}>
                {images.length > 0 ? (
                  <div 
                    onScroll={(e) => {
                      const scrollLeft = e.currentTarget.scrollLeft;
                      const width = e.currentTarget.offsetWidth;
                      const newIndex = Math.round(scrollLeft / width);
                      if (newIndex !== currentImgIndex) setCurrentImgIndex(newIndex);
                    }}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar w-full h-full"
                  >
                    {images.map((img: string, i: number) => (
                      <div key={i} className="flex-none w-full h-full snap-center relative">
                        <img 
                          src={img} 
                          alt={`Slide ${i}`} 
                          className="w-full h-full object-cover select-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b14] via-transparent to-black/60" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950/40 to-slate-950 flex flex-col items-center justify-center text-white/5">
                     {isOrder ? <ClipboardList size={100} /> : (isQuote ? <FileText size={100} /> : <CheckCircle2 size={100} />)}
                  </div>
                )}

                {/* Indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 rounded-full bg-black/40 backdrop-blur-md">
                     {images.map((_: any, i: number) => (
                       <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImgIndex ? 'bg-purple-500 w-4' : 'bg-white/20'}`} />
                     ))}
                  </div>
                )}
              </div>

              {/* Header Floating UI - Redesigned to avoid overlaps */}
              <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-10 pointer-events-none p-6">
                 <div className="flex justify-between items-start w-full">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onClose(); }} 
                      className="p-3.5 rounded-2xl bg-black/60 border border-white/20 text-white hover:bg-white/10 transition-all backdrop-blur-xl pointer-events-auto active:scale-90 shadow-2xl"
                    >
                        <X size={20} />
                    </button>

                    {/* Centered Image Counter */}
                    {images.length > 1 && (
                      <div className="mt-1 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-[0.65rem] font-black text-white tracking-[0.2em] pointer-events-auto shadow-2xl transition-all hover:scale-105 active:scale-95">
                        {currentImgIndex + 1} / {images.length}
                      </div>
                    )}

                    <div className="flex gap-2.5 pointer-events-auto">
                        {canSendWA && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); prepareReminder(); }}
                            className="p-3.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/30 active:scale-90"
                            title="Enviar Recordatorio WhatsApp"
                          >
                              <MessageSquare size={20} />
                          </button>
                        )}
                        {images.length > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleZoom(); }} 
                            className="p-3.5 rounded-2xl bg-purple-600 border border-purple-400/30 text-white hover:bg-purple-500 transition-all shadow-xl shadow-purple-500/30 active:scale-90"
                          >
                             <Maximize2 size={20} />
                          </button>
                        )}
                    </div>
                 </div>
              </div>

              <div className="absolute bottom-6 left-8 right-8">
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[0.6rem] font-black uppercase tracking-widest mb-3 ${getStatusColor(status)} shadow-lg`}>
                    {String(status).replace('_', ' ')}
                 </div>
                 {status === 'incumplida' && !data?.cancelReason && (
                    <button 
                      onClick={() => setShowJustificationOverlay(true)}
                      className="ml-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[0.6rem] font-black uppercase tracking-widest animate-pulse"
                    >
                      ¡JUSTIFICACIÓN REQUERIDA!
                    </button>
                 )}
                 <h2 className="text-2xl font-black text-white tracking-tight leading-none truncate">{title}</h2>
                 <div className="text-[0.65rem] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> {subtitle}
                 </div>
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
                           className={`px-2 py-1 rounded-lg text-[0.55rem] font-black uppercase border transition-all ${data?.priority === p ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-600 hover:border-white/10'}`}
                         >
                            {p}
                         </button>
                       ))}
                    </div>
                  ) : (
                    <div className="text-sm font-black text-emerald-400">$ {data?.totalCost?.toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* Financial Summary for Orders */}
              {isOrder && data?.recordType !== 'cotizacion' && (
                <div className="grid grid-cols-3 gap-3 bg-white/[0.03] border border-white/5 rounded-[28px] p-4 text-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-widest">Total Venta</span>
                    <span className="text-sm font-black text-white">$ {data?.totalCost?.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-x border-white/5">
                    <span className="text-[0.55rem] font-black text-emerald-500 uppercase tracking-widest">Recibido</span>
                    <span className="text-sm font-black text-emerald-400">$ {(data?.totalCost - data?.pendingBalance).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.55rem] font-black text-amber-500 uppercase tracking-widest">Por Pagar</span>
                    <span className="text-sm font-black text-amber-500">$ {data?.pendingBalance?.toLocaleString()}</span>
                  </div>
                </div>
              )}

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
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
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
                            value={tempTime}
                            onChange={(e) => setTempTime(e.target.value)}
                            className="bg-transparent text-sm font-black text-white outline-none cursor-pointer hover:text-amber-500 transition-colors"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {isOrder && data?.services && (
                <div className="space-y-3">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={12} className="text-purple-500" /> Especificaciones de Servicio
                  </div>
                  <div className="flex flex-wrap gap-2 text-[0.6rem] font-black">
                    {data?.services?.map((s: string, idx: number) => (
                      <span key={idx} className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">
                         {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(!isOrder && data?.description) && (
                <div className="space-y-3">
                  <div className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={12} className="text-purple-500" /> Bitácora de la Tarea
                  </div>
                  <div className="p-5 rounded-[24px] bg-slate-900/50 border border-white/5 text-xs text-slate-400 leading-relaxed italic shadow-inner">
                    "{data?.description}"
                  </div>
                </div>
              )}

              {/* Status Action / Delete */}
              <div className="pt-4 space-y-4">
                 {status !== 'incumplida' && status !== 'cancelada' && (
                    <button 
                      onClick={() => handleUpdate({ status: 'cancelada' })}
                      className="w-full py-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 font-black text-xs uppercase tracking-[0.3em] hover:bg-red-500/20 transition-all active:scale-95 mb-2"
                    >
                      {isOrder ? 'Cancelar Orden de Servicio' : (data?.isShared ? 'Cancelar Tarea de Equipo' : 'Cancelar Tarea Personal')}
                    </button>
                 )}

                  <button 
                    disabled={isUpdating}
                    onClick={async () => {
                      const updates: any = {};
                      if (isOrder) {
                        const newDelivery = `${tempDate}T${tempTime}:00`;
                        if (newDelivery !== data?.deliveryDate) {
                          updates.deliveryDate = newDelivery;
                        }
                      } else {
                        if (tempDate !== data?.date) updates.date = tempDate;
                        if (tempTime !== data?.time) updates.time = tempTime;
                      }

                      if (Object.keys(updates).length > 0) {
                        await handleUpdate(updates);
                      }
                      onClose();
                    }}
                    className="w-full py-5 rounded-[24px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 shadow-xl shadow-purple-500/20 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Confirmar y Cerrar'}
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
          {/* Reminder Draft Modal (Overlay) */}
          <AnimatePresence>
            {showReminderDraft && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[1200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <MessageSquare size={20} />
                     </div>
                     <h4 className="text-sm font-black text-white uppercase tracking-widest">
                        {sendQueue.length > 0 ? `Enviando ${currentQueueIdx + 1} de ${sendQueue.length}` : 'Editar Recordatorio'}
                     </h4>
                  </div>
                  
                  {sendQueue.length === 0 ? (
                    <>
                      <textarea 
                        value={reminderMsg}
                        onChange={(e) => setReminderMsg(e.target.value)}
                        className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/50 outline-none resize-none mb-4 leading-relaxed"
                      />

                      {!isOrder && (
                        <div className="mb-6">
                           <p className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <User size={10} /> Destinatarios (Miembros del Grupo)
                           </p>
                           <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                              {groupMembers.map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    triggerHaptic('light');
                                    setSelectedRecipients(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]);
                                  }}
                                  className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all ${selectedRecipients.includes(m.id) ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'bg-white/5 border-transparent text-slate-500 opacity-60'}`}
                                >
                                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[0.6rem] font-bold">
                                    {m.avatar?.length > 10 ? <img src={m.avatar} className="w-full h-full object-cover rounded-lg" /> : (m.full_name || m.username || 'U').charAt(0)}
                                  </div>
                                  <span className="text-[0.65rem] font-bold truncate flex-1 text-left">{m.full_name || m.username}</span>
                                  {selectedRecipients.includes(m.id) && <CheckCircle2 size={12} className="text-emerald-500" />}
                                </button>
                              ))}
                           </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowReminderDraft(false)}
                          className="flex-1 py-3 rounded-xl bg-white/5 text-slate-500 text-[0.6rem] font-black uppercase tracking-widest hover:bg-white/10"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={startSending}
                          disabled={selectedRecipients.length === 0}
                          className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 text-[0.6rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale"
                        >
                          <Send size={12} /> {isOrder ? 'Enviar' : 'Iniciar'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                       <p className="text-xs text-slate-400 mb-6">Chat de WhatsApp abierto. ¿Deseas enviar al siguiente integrante del equipo?</p>
                       <div className="flex flex-col gap-3">
                        <button 
                          onClick={sendNextInQueue}
                          className="w-full py-4 rounded-xl bg-emerald-500 text-slate-900 text-[0.7rem] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                        >
                          {currentQueueIdx + 1 < sendQueue.length ? 'Enviar Siguiente' : 'Finalizar Envío'}
                        </button>
                        <button 
                          onClick={() => setShowReminderDraft(false)}
                          className="w-full py-3 text-[0.6rem] font-bold text-slate-600 uppercase tracking-widest"
                        >
                          Cerrar Proceso
                        </button>
                       </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Justification Overlay */}
          <AnimatePresence>
            {showJustificationOverlay && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[1300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-[32px] p-8 shadow-2xl relative"
                >
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                        <MessageSquare size={32} />
                    </div>
                    <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2">
                       Justificación Obligatoria
                    </h4>
                    <p className="text-[0.65rem] text-slate-500 font-bold leading-relaxed">
                      Ha ocurrido un incumplimiento o cancelación. Por favor, especifique el motivo para el registro histórico y métricas de desempeño.
                    </p>
                  </div>
                  
                  <textarea 
                    autoFocus
                    placeholder="Escriba aquí los detalles..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:ring-1 focus:ring-red-500 outline-none resize-none mb-6 leading-relaxed"
                  />
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={submitJustification}
                      disabled={!justification.trim() || isUpdating}
                      className="w-full py-4 rounded-xl bg-red-600 text-white text-[0.7rem] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50"
                    >
                      {isUpdating ? 'Guardando...' : 'Guardar y Archivar'}
                    </button>
                    {status !== 'incumplida' && (
                       <button 
                        onClick={() => {
                          setShowJustificationOverlay(false);
                          setJustification('');
                          setTargetStatus(null);
                        }}
                        className="w-full py-2 text-[0.6rem] font-bold text-slate-600 uppercase tracking-widest"
                      >
                        Volver
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </AnimatePresence>
  );
}
