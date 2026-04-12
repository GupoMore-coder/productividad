import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  QrCode,
  XCircle,
  AlertTriangle,
  PlayCircle,
  PlusCircle,
  DollarSign,
  MessageCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ServiceOrder } from '../../context/OrderContext';
import { WhatsAppService } from '../../services/whatsappService';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { triggerHaptic } from '../../utils/haptics';
import { OrderStatusPill } from './OrderStatusPill';
import { OrderTimeline } from './OrderTimeline';

interface OrderCardProps {
  order: ServiceOrder;
  onStatusChange: (id: string, newStatus: string) => void;
  onEdit: (order: ServiceOrder) => void;
  onDownloadPdf: (order: ServiceOrder) => void;
  onAddObservation: (id: string, obs: string) => void;
  onRegisterDeposit: (id: string, amount: number) => Promise<void>;
   onReactivate: (id: string) => Promise<void>;
  onPromote?: (id: string) => Promise<void>;
  isOverdue?: boolean;
  isGenerating?: boolean;
  sequenceLabel?: string;
  onDelete?: (id: string) => void;
}

export const OrderCard = memo(function OrderCard({ 
  order, 
  onStatusChange, 
  onEdit, 
  onDownloadPdf, 
  onAddObservation,
  onRegisterDeposit,
   onReactivate,
  onPromote,
  isOverdue,
  isGenerating,
  sequenceLabel,
  onDelete
}: OrderCardProps) {
  const { user } = useAuth();
  const { openWhatsApp } = useWhatsApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [obsValue, setObsValue] = useState('');
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [abonoValue, setAbonoValue] = useState('');
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const photos = order.photos || [];
  const hasMultiplePhotos = photos.length > 1;

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % photos.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const openZoom = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    triggerHaptic('light');
    (window as any).dispatchEvent(new CustomEvent('zoom-image', { 
      detail: { photos, index } 
    }));
  };

  const deliveryDate = new Date(order.deliveryDate);
  // unused timeRemaining removed

  const handleObsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (obsValue.trim()) {
      onAddObservation(order.id, obsValue);
      setObsValue('');
    }
  };

  const handleAbonoSubmit = () => {
    const amount = parseFloat(abonoValue);
    if (!isNaN(amount) && amount > 0) {
      onRegisterDeposit(order.id, amount);
      setAbonoValue('');
      setShowAbonoModal(false);
    }
  };


  // unused showPhotos removed

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative overflow-hidden rounded-3xl bg-slate-900/40 border backdrop-blur-md shadow-xl transition-all duration-500 ${
        order.recordType === 'cotizacion' 
          ? 'border-amber-500/20 hover:border-amber-500/40' 
          : 'border-white/10 hover:border-purple-500/30'
      }`}
    >
      {/* Accent Glow Line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-40 bg-gradient-to-r from-transparent ${
        order.recordType === 'cotizacion'
          ? 'via-amber-500'
          : (isOverdue ? 'via-red-500 animate-pulse' : (order.status === 'recibida' ? 'via-amber-500' : 'via-purple-500'))
      } to-transparent`} />

      {/* Header Area / Hero Carousel */}
      <div className="relative group/hero overflow-hidden">
        {/* Background Image / Placeholder */}
        <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-slate-800/50">
          <AnimatePresence mode="wait">
            {photos.length > 0 ? (
              <motion.img
                key={activeImgIndex}
                src={photos[activeImgIndex]}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-10">
                <FileText size={80} className="text-white" />
              </div>
            )}
          </AnimatePresence>
          
          {/* Overlay Gradient (Premium feel) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1622] via-transparent to-black/40" />

          {/* Carousel Controls */}
          {hasMultiplePhotos && (
            <>
              <div className="absolute inset-x-0 top-6 flex justify-center z-20 pointer-events-none">
                 <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-[0.65rem] font-black text-white/90 tracking-widest pointer-events-auto shadow-2xl">
                    {activeImgIndex + 1} / {photos.length}
                 </div>
              </div>
              <div className="absolute inset-y-0 left-0 flex items-center px-2 z-20 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                <button 
                  onClick={prevImg}
                  className="p-2 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all backdrop-blur-md"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 z-20 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                <button 
                  onClick={nextImg}
                  className="p-2 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all backdrop-blur-md"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}

          {/* Quick Action Top Bar (Zoom & Chat) */}
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <button
               onClick={(e) => {
                 e.stopPropagation();
                 const message = WhatsAppService.getDirectLink('', {
                   customerName: order.customerName,
                   documentNumber: sequenceLabel || order.id.slice(-6).toUpperCase(),
                   total: order.totalCost,
                   type: order.recordType || 'orden',
                   deliveryDate: format(deliveryDate, 'dd MMM, HH:mm', { locale: es })
                 }).split('text=')[1];
                 openWhatsApp(order.customerPhone, decodeURIComponent(message));
               }}
               className="w-10 h-10 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              <MessageSquare size={18} />
            </button>
            {photos.length > 0 && (
              <button
                onClick={(e) => openZoom(e, activeImgIndex)}
                className="w-10 h-10 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 text-purple-400 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg"
              >
                <ZoomIn size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Floating Header Info */}
        <div className="absolute bottom-4 left-5 right-5 z-20 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="px-2 py-0.5 rounded-full bg-purple-500/20 backdrop-blur-md text-[0.5rem] font-black text-purple-400 border border-purple-500/20 uppercase tracking-widest">
               {sequenceLabel || order.id.slice(-6).toUpperCase()}
             </div>
             {order.recordType === 'cotizacion' && (
               <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[0.5rem] font-bold tracking-widest border border-amber-500/20 uppercase">COTIZACIÓN</span>
             )}
          </div>
          <h3 className="text-xl font-black text-white truncate shadow-black drop-shadow-md">
            {order.customerName}
          </h3>
          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
             <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
             PRUEBA-ORDE
          </p>
        </div>
      </div>

      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-widest text-slate-400 group-hover:text-purple-400 transition-colors uppercase">
              INFO CLIENTE
            </span>
          </div>
          <div className="flex items-center gap-2">
            {order.isOfflinePending && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 text-[0.65rem] font-black uppercase tracking-widest rounded-xl animate-pulse border border-purple-500/30">
                <RefreshCw size={10} className="animate-spin" />
                Sincronizando
              </span>
            )}
            {!(order.is_demo || order.isTest) && order.recordType !== 'cotizacion' && <OrderStatusPill status={order.status} />}
            {(order.is_demo || order.isTest) && <span className="px-3 py-1 bg-amber-500 text-slate-900 text-[0.65rem] font-black uppercase tracking-widest rounded-xl animate-pulse">PRUEBA DE SISTEMA</span>}
          </div>
        </div>
      </div>

      {/* Services Pills & Thumbs */}
      {order.recordType === 'cotizacion' ? (
        <div className="px-5 py-2 flex flex-col gap-2">
          {order.quoteItems?.map((qi, i) => (
             <div key={i} className="flex justify-between items-center text-xs bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                <span className="text-slate-300 font-bold truncate max-w-[150px]">{qi.quantity}x {qi.item}</span>
                <span className="text-slate-400 font-medium">${qi.total.toLocaleString()}</span>
             </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-2 flex flex-wrap gap-1.5 overflow-hidden">
          {order.services.map((svc, i) => (
            <span key={i} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[0.65rem] text-slate-400 font-medium whitespace-nowrap">
              {svc}
            </span>
          ))}
        </div>
      )}

        <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
          {photos.map((p, i) => (
            <div 
              key={i} 
              onClick={() => setActiveImgIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden ring-2 transition-all cursor-pointer shadow-lg active:scale-95 ${activeImgIndex === i ? 'ring-purple-500 scale-105' : 'ring-white/10 hover:ring-white/30'}`}
            >
              <img 
                src={p} 
                alt="evidencia" 
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
            </div>
          ))}
        </div>

      {/* Financial Bar */}
      {order.recordType === 'cotizacion' ? (
        <div className="mx-5 my-3 grid grid-cols-1 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center relative shadow-[0_0_20px_rgba(245,158,11,0.05)]">
          <span className="text-[0.6rem] text-amber-500/80 font-bold uppercase tracking-widest mb-1">Total Cotizado (Inc. IVA)</span>
          <span className="text-xl font-black text-amber-400 tracking-tight">$ {order.totalCost.toLocaleString()}</span>
        </div>
      ) : (
        <div className="mx-5 my-3 grid grid-cols-3 p-3 rounded-2xl bg-black/30 border border-white/5 divide-x divide-white/10 group/finance relative">
          <div className="flex flex-col px-2">
            <span className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">Total</span>
            <span className="text-xs font-black text-slate-200 tracking-tight">$ {order.totalCost.toLocaleString()}</span>
          </div>
          <div className="flex flex-col px-4 text-center cursor-pointer hover:bg-emerald-500/5 transition-colors rounded-lg" onClick={() => ['recibida', 'en_proceso', 'pendiente_entrega'].includes(order.status) && setShowAbonoModal(true)}>
            <div className="flex items-center justify-center gap-1">
              <span className="text-[0.6rem] text-emerald-500 font-bold uppercase tracking-widest">Abono</span>
              {['recibida', 'en_proceso', 'pendiente_entrega'].includes(order.status) && <PlusCircle size={8} className="text-emerald-500" />}
            </div>
            <span className="text-xs font-black text-emerald-400/90 tracking-tight">$ {(order.totalCost - order.pendingBalance).toLocaleString()}</span>
          </div>
          <div className="flex flex-col px-2 text-right">
            <span className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest">Saldo</span>
            <span className={`text-xs font-black tracking-tight ${order.pendingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              $ {order.pendingBalance.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Expandable History / Novedades */}
      <div className="px-5 pb-5">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[0.7rem] text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest font-bold"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Ocultar Seguimiento' : 'Ver Novedades / Historial'}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black/20 rounded-2xl p-4 mt-2 border border-white/5"
            >
              {/* Add Observation Form */}
              <form onSubmit={handleObsSubmit} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={obsValue}
                  onChange={e => setObsValue(e.target.value)}
                  placeholder="Escribe una novedad..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-light"
                />
                <button type="submit" className="bg-purple-600/20 text-purple-400 p-2 rounded-xl hover:bg-purple-600/30 transition-colors border border-purple-500/20">
                  <MessageSquare size={18} />
                </button>
              </form>

              <OrderTimeline history={order.history} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-4 bg-white/[0.02] border-t border-white/10 flex flex-col gap-4">
        
        {/* Status Action Buttons - Redesigned to Labels */}
        <div className="flex flex-wrap gap-2">
          {order.recordType === 'cotizacion' ? (
            <button 
              onClick={() => {
                if(confirm('¿Convertir esta cotización en una Orden de Servicio Oficial?')) {
                  onStatusChange(order.id, 'en_proceso'); // Will be intercepted or we can just call an overarching method. Alternatively:
                  if (onPromote) onPromote(order.id);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white transition-all font-black text-[0.65rem] uppercase tracking-widest active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <CheckCircle2 size={18} /> Convertir a Orden
            </button>
          ) : ['recibida', 'en_proceso', 'pendiente_entrega'].includes(order.status) ? (
            <>
              {order.status === 'recibida' && (
                <button 
                  onClick={() => onStatusChange(order.id, 'en_proceso')} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/20 font-black text-[0.65rem] uppercase tracking-widest active:scale-95"
                >
                  <PlayCircle size={16} /> Producción
                </button>
              )}
              {order.status === 'en_proceso' && (
                <button 
                  onClick={() => onStatusChange(order.id, 'pendiente_entrega')} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all border border-purple-500/20 font-black text-[0.65rem] uppercase tracking-widest active:scale-95"
                >
                  <CheckCircle2 size={16} /> Listo p/ Entrega
                </button>
              )}
              {order.status === 'pendiente_entrega' && (
                <button 
                  onClick={() => onStatusChange(order.id, 'completada')} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 font-black text-[0.65rem] uppercase tracking-widest active:scale-95"
                >
                  <CheckCircle2 size={16} /> Entregado
                </button>
              )}


              {/* Cancel Button */}
              <button 
                onClick={() => { triggerHaptic('warning'); setShowCancelConfirm(true); }}
                className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-500/5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10 font-black text-[0.65rem] uppercase tracking-widest active:scale-95"
                title="Cancelar Orden"
              >
                <XCircle size={16} />
              </button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-between gap-3 px-2 min-h-[44px]">
              <div className="flex items-center gap-2 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                <AlertTriangle size={14} className="text-amber-500/50" />
                Historial - Solo Lectura
              </div>
              
              {user?.isSuperAdmin && (
                <button 
                  onClick={() => { triggerHaptic('medium'); onReactivate(order.id); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-[0.6rem] uppercase tracking-widest hover:bg-purple-500/20 transition-all active:scale-95 shadow-lg shadow-purple-500/10"
                >
                  <RefreshCw size={14} /> Restablecer Activa
                </button>
              )}
             </div>
          )}

        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex gap-2">
            {order.recordType !== 'cotizacion' && (
              <button 
                onClick={() => { triggerHaptic('light'); setShowQrModal(true); }}
                className="p-2.5 rounded-xl bg-slate-800 text-purple-400 hover:text-purple-300 hover:bg-slate-700 transition-all border border-purple-500/10 active:scale-95 shadow-lg"
                title="Ver Código QR de Seguimiento"
              >
                <QrCode size={18} />
              </button>
            )}
            <button 
              onClick={() => {
                triggerHaptic('light');
                const message = WhatsAppService.getDirectLink('', {
                  customerName: order.customerName,
                  documentNumber: sequenceLabel || order.id.slice(-6).toUpperCase(),
                  total: order.totalCost,
                  type: order.recordType || 'orden',
                  deliveryDate: format(deliveryDate, 'dd MMM, HH:mm', { locale: es })
                }).split('text=')[1];
                openWhatsApp(order.customerPhone, decodeURIComponent(message));
              }}
              className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 active:scale-95 shadow-lg"
              title="Notificar por WhatsApp"
            >
              <MessageCircle size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onDownloadPdf(order)} 
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-white/5 active:scale-95 shadow-lg ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isGenerating ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <FileText size={18} />
              )}
              <span className="text-[0.65rem] font-black uppercase tracking-widest">PDF</span>
            </button>
            
            <button 
              onClick={() => onEdit(order)} 
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-white/5 active:scale-95 shadow-lg"
              title="Editar Orden"
            >
              <Edit3 size={18} />
            </button>

            {user?.isMaster && onDelete && order.isTest && (
              <button 
                onClick={() => { if(confirm('¿BORRAR REGISTRO DE PRUEBA?')) onDelete(order.id); }} 
                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 active:scale-95 shadow-lg"
                title="BORRAR PRUEBA (Sin rastro)"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal Overlay */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 pb-[env(safe-area-inset-bottom)] pb-24">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQrModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#1a1622] p-5 sm:p-6 rounded-[32px] sm:rounded-[40px] border border-white/10 shadow-2xl text-center max-w-sm w-full max-h-[90vh] overflow-hidden flex flex-col items-center">
              
              <h3 className="text-base sm:text-lg font-black text-white mb-0.5 leading-tight uppercase tracking-tight">Seguimiento Digital</h3>
              <p className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest mb-3">
                {sequenceLabel ? sequenceLabel : `Orden #${order.id.toString().slice(-6).toUpperCase()}`}
              </p>
              
              <div 
                onClick={() => {
                  // Capture the QR as an image for the zoom modal
                  const svg = document.querySelector('.qr-container svg');
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const svgSize = svg.getBoundingClientRect();
                    canvas.width = svgSize.width * 4;
                    canvas.height = svgSize.height * 4;
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                      (window as any).dispatchEvent(new CustomEvent('zoom-image', { 
                        detail: { 
                          photos: [canvas.toDataURL("image/png")], 
                          index: 0 
                        } 
                      }));
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }
                }}
                className="qr-container bg-white p-2.5 rounded-[20px] inline-block shadow-xl shadow-purple-500/10 mb-3 border border-white/10 cursor-zoom-in active:scale-95 transition-transform"
              >
                <QRCodeSVG 
                  value={`${window.location.origin}/status/${order.id}`} 
                  size={135}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-[0.62rem] text-slate-400 leading-tight font-bold mb-4 px-4">
                Escanee el código para seguimiento en tiempo real del <span className="text-purple-400">Estado de su orden.</span>
              </p>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button 
                  onClick={() => {
                    const trackingLink = `${window.location.origin}/status/${order.id}`;
                    const pdfLink = order.pdfUrl || 'Generando...';
                    const signature = user?.full_name || user?.username || 'Grupo More';
                    const message = `Hola *${order.customerName}*, te saluda el equipo de *Grupo More* ✨.\n\nAquí tienes la información de tu ${order.recordType === 'cotizacion' ? 'cotización' : 'orden'}:\n\n📲 *Seguimiento Digital:* ${trackingLink}\n📄 *Descargar PDF:* ${pdfLink}\n\nFirma: *${signature}*`;
                    openWhatsApp(order.customerPhone, message);
                  }}
                  className="py-3 rounded-2xl bg-emerald-500 text-slate-900 font-black text-[0.65rem] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
                >
                  <MessageCircle size={14} /> WHATSAPP
                </button>

                <button 
                  onClick={() => setShowQrModal(false)}
                  className="py-3 rounded-2xl bg-white/5 text-slate-300 hover:text-white font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  Cerrar Panel
                </button>
              </div>

              <p className="mt-3 text-[0.45rem] text-slate-500 uppercase font-black tracking-widest leading-none">
                Se enviará link de seguimiento y descarga de PDF
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCancelConfirm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#1a1622] p-8 rounded-[40px] border border-red-500/20 shadow-2xl text-center max-w-sm w-full">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">¿Anular Orden?</h3>
              <p className="text-[0.7rem] text-slate-400 leading-relaxed font-medium mb-8">
                Esta acción moverá la orden al historial de canceladas. Para proceder debe justificar el motivo.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                  Volver
                </button>
                <button onClick={() => { setShowCancelConfirm(false); setShowCancelReason(true); }} className="flex-1 py-4 rounded-2xl bg-red-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                  Continuar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Reason Modal */}
      <AnimatePresence>
        {showCancelReason && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCancelReason(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-[#1a1622] p-8 rounded-[40px] border border-white/10 shadow-2xl text-center max-w-sm w-full">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight text-left">Justificación</h3>
              <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest mb-6 text-left">Motivo de la cancelación de la orden</p>
              
              <textarea
                autoFocus
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Escriba aquí los motivos..."
                className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/20 placeholder:text-slate-800 resize-none mb-6"
              />

              <button 
                disabled={!cancelReason.trim()}
                onClick={() => {
                  onStatusChange(order.id, 'cancelada');
                  // We also need to send the reason. Currently OrderCard only takes (id, status).
                  // I will update the OrderContext to accept cancelReason in updateOrder.
                  // For now, I'll update it through a custom event or update the prop if needed.
                  (window as any).dispatchEvent(new CustomEvent('cancel-order-reason', { detail: { id: order.id, reason: cancelReason } }));
                  setShowCancelReason(false);
                  setCancelReason('');
                  triggerHaptic('success');
                }}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${cancelReason.trim() ? 'bg-red-500 text-slate-950 shadow-xl shadow-red-500/20' : 'bg-white/5 text-slate-700 border border-white/5 cursor-not-allowed'}`}
              >
                Confirmar Cancelación
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Abono Modal Overlay */}
      <AnimatePresence>
        {showAbonoModal && (
          <div className="fixed inset-0 z-[10003] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAbonoModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-[#1a1622] p-8 rounded-[40px] border border-emerald-500/10 shadow-2xl text-left max-w-sm w-full">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                <DollarSign size={24} />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Registrar Nuevo Abono</h3>
              <p className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest mb-6">La información financiera se actualizará automáticamente</p>
              
              <div className="relative mb-8">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                <input
                  type="number"
                  autoFocus
                  value={abonoValue}
                  onChange={e => setAbonoValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl pl-8 pr-4 py-4 text-xl font-black text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-800 transition-all font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAbonoModal(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                  Cancelar
                </button>
                <button 
                  disabled={!abonoValue || parseFloat(abonoValue) <= 0}
                  onClick={handleAbonoSubmit}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${abonoValue && parseFloat(abonoValue) > 0 ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20' : 'bg-white/5 text-slate-700 border border-white/5 cursor-not-allowed'}`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Creator Info Overlay (Visible on Hover) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
         <div className="bg-slate-800 border border-white/10 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-xl">
            <span className="text-[0.65rem] text-slate-400 font-medium">✨ Creada por {order.createdByRole} • {format(new Date(order.createdAt), 'dd MMM HH:mm', { locale: es })}</span>
         </div>
      </div>
    </motion.div>
  );
});
