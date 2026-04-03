import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Save, Calendar, Clock, FileText, Check, RefreshCw } from 'lucide-react';
import { useOrders, ServiceOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { HoneypotField } from './HoneypotField';
import { triggerHaptic } from '../utils/haptics';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: ServiceOrder;
}

const COUNTRY_CODES = [
  { code: '+1', name: 'USA/Canadá' },
  { code: '+34', name: 'España' },
  { code: '+51', name: 'Perú' },
  { code: '+52', name: 'México' },
  { code: '+54', name: 'Argentina' },
  { code: '+55', name: 'Brasil' },
  { code: '+56', name: 'Chile' },
  { code: '+57', name: 'Colombia' },
  { code: '+58', name: 'Venezuela' },
  { code: '+591', name: 'Bolivia' },
  { code: '+593', name: 'Ecuador' },
].sort((a, b) => parseInt(a.code.replace('+', '')) - parseInt(b.code.replace('+', '')));

export default function CreateOrderModal({ isOpen, onClose, initialOrder }: CreateOrderModalProps) {
  const { createOrder, updateOrder, serviceTypes } = useOrders();
  const { user } = useAuth();
  
  const activeResponsible = user?.full_name || user?.username || user?.email || 'Usuario';

  const [customerName, setCustomerName] = useState('');
  const [customerPhoneCode, setCustomerPhoneCode] = useState('+57');
  const [customerPhoneNum, setCustomerPhoneNum] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'));
  const [deliveryTime, setDeliveryTime] = useState('17:00');
  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'abono' | 'pagado'>('pendiente');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hpValue, setHpValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        setCustomerName(initialOrder.customerName);
        const match = initialOrder.customerPhone.match(/^(\+\d+)\s(.*)$/);
        if (match) {
          setCustomerPhoneCode(match[1]);
          setCustomerPhoneNum(match[2]);
        } else {
          setCustomerPhoneCode('+57');
          setCustomerPhoneNum(initialOrder.customerPhone);
        }
        setSelectedServices(initialOrder.services);
        setNotes(initialOrder.notes);
        const [dD, dT] = initialOrder.deliveryDate.split('T');
        setDeliveryDate(dD || format(new Date(), 'yyyy-MM-dd'));
        setDeliveryTime(dT || '17:00');
        setPaymentStatus(initialOrder.paymentStatus);
        setTotalCost(initialOrder.totalCost);
        setDepositAmount(initialOrder.depositAmount);
        setPhotos(initialOrder.photos || []);
      } else {
        setCustomerName('');
        setCustomerPhoneNum('');
        setSelectedServices([]);
        setNotes('');
        setTotalCost(0);
        setDepositAmount(0);
        setPhotos([]);
      }
    }
  }, [isOpen, initialOrder]);

  if (!isOpen && !initialOrder) return null;

  const toggleService = (svc: string) => {
    triggerHaptic('light');
    setSelectedServices(prev => 
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const newFiles = Array.from(e.target.files);
    const filesToProcess = newFiles.slice(0, 12 - photos.length);
    if (filesToProcess.length === 0) return;
    
    setUploadingPhotos(true);
    try {
      for (const file of filesToProcess) {
        const compressedBase64 = await compressImage(file);
        const blob = base64ToBlob(compressedBase64);
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const filePath = `${user.id}/${fileName}`;
        const publicUrl = await uploadFile('order-photos', filePath, blob);
        setPhotos(prev => [...prev, publicUrl]);
        triggerHaptic('success');
      }
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      triggerHaptic('error');
      alert(`⚠️ ERROR DE CARGA: ${err.message || 'Verifica tu conexión o permisos de almacenamiento'}`);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || selectedServices.length === 0 || submitting) return;

    // Honeypot check
    if (hpValue) {
      console.warn('Honeypot triggered in CreateOrderModal');
      onClose();
      return;
    }
    
    setSubmitting(true);
    try {
      const orderData = {
        customerName,
        customerPhone: `${customerPhoneCode} ${customerPhoneNum}`,
        services: selectedServices,
        notes,
        responsible: activeResponsible,
        deliveryDate: `${deliveryDate}T${deliveryTime}`,
        paymentStatus,
        totalCost,
        depositAmount: paymentStatus === 'abono' ? depositAmount : (paymentStatus === 'pagado' ? totalCost : 0),
        photos
      };
      if (initialOrder) await updateOrder(initialOrder.id, orderData);
      else await createOrder(orderData);
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      console.error('Error submitting order:', err);
      triggerHaptic('error');
      alert(`⚠️ ERROR AL GUARDAR: ${err.message || 'No se pudo crear la orden. Verifica los campos y tu sesión.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-[#251f30] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
          >
            {/* Handle bar for bottom sheet feel */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" aria-hidden="true" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <div>
                <h3 id="order-modal-title" className="text-xl font-bold text-white tracking-tight">{initialOrder ? `Editar ${initialOrder.id}` : 'Nueva Orden de Servicio'}</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Gestión de flujo técnico</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"
                type="button"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Cliente</label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    required 
                    disabled={submitting}
                    placeholder="Nombre completo..."
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all disabled:opacity-50 placeholder:text-slate-700" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Celular</label>
                  <div className="flex gap-2">
                    <select 
                      value={customerPhoneCode} 
                      onChange={e => setCustomerPhoneCode(e.target.value)}
                      className="bg-black/20 border border-white/10 rounded-2xl px-2 py-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} style={{color: 'black'}}>{c.code}</option>)}
                    </select>
                    <input 
                      type="tel" 
                      value={customerPhoneNum} 
                      onChange={e => setCustomerPhoneNum(e.target.value.replace(/[^0-9]/g, ''))} 
                      required 
                      placeholder="300XXXXXXX"
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-700" 
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-4">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Servicios Técnicos</label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map(svc => {
                    const isSelected = selectedServices.includes(svc);
                    return (
                      <button 
                        key={svc} 
                        type="button" 
                        onClick={() => toggleService(svc)} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-2 ${isSelected ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                      >
                        {isSelected && <Check size={14} />}
                        {svc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Calendar size={12}/> Fecha Entrega</label>
                  <input 
                    type="date" 
                    value={deliveryDate} 
                    onChange={e => setDeliveryDate(e.target.value)} 
                    required 
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Clock size={12}/> Hora</label>
                  <input 
                    type="time" 
                    value={deliveryTime} 
                    onChange={e => setDeliveryTime(e.target.value)} 
                    required 
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20" 
                  />
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Recursos / Evidencias ({photos.length}/12)</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-slate-900 rounded-xl text-xs font-black cursor-pointer hover:bg-purple-400 transition-all active:scale-95">
                    <Camera size={14} />
                    {uploadingPhotos ? 'Subiendo...' : 'Agregar'}
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhotos} />
                  </label>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  <AnimatePresence>
                    {photos.map((p, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ scale: 0.8, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group shrink-0"
                      >
                        <img src={p} alt="Vista previa de adjunto" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          aria-label="Eliminar foto"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {photos.length === 0 && (
                    <div className="w-full py-8 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-600">
                      <FileText size={24} className="opacity-20 mb-2" />
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest">Sin adjuntos</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Observaciones Internas</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Detalles adicionales de la orden..." 
                  rows={3} 
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none" 
                />
              </div>
            </form>

            <HoneypotField value={hpValue} onChange={e => setHpValue(e.target.value)} />

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl flex gap-3 shrink-0">
              <button 
                type="button" 
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSubmit} 
                disabled={uploadingPhotos || submitting || !customerName || selectedServices.length === 0}
                className="flex-[2] px-6 py-3.5 rounded-2xl bg-[#d4bc8f] text-slate-900 font-black text-[0.65rem] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  initialOrder ? <Save size={16} /> : <Plus size={16} />
                )}
                {submitting ? 'Procesando...' : (initialOrder ? 'Guardar Cambios' : 'Generar Orden')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
