import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Save, Calendar, Check, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { useOrders, ServiceOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { HoneypotField } from './HoneypotField';
import { triggerHaptic } from '../utils/haptics';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OrderSchema, OrderFormData } from '../lib/schemas';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: ServiceOrder;
}

export default function CreateOrderModal({ isOpen, onClose, initialOrder }: CreateOrderModalProps) {
  const { createOrder, updateOrder, serviceTypes } = useOrders();
  const { user } = useAuth();
  
  const activeResponsible = user?.full_name || user?.username || user?.email || 'Usuario';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '+57 ',
      services: [],
      notes: '',
      deliveryDate: format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'),
      totalCost: 0,
      depositAmount: 0,
      paymentStatus: 'pendiente',
      photos: []
    }
  });

  const selectedServices = watch('services') || [];
  const photos = watch('photos') || [];
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [hpValue, setHpValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        reset({
          customerName: initialOrder.customerName,
          customerPhone: initialOrder.customerPhone,
          services: initialOrder.services,
          notes: initialOrder.notes || '',
          deliveryDate: initialOrder.deliveryDate.split('T')[0],
          paymentStatus: initialOrder.paymentStatus,
          totalCost: initialOrder.totalCost,
          depositAmount: initialOrder.depositAmount,
          photos: initialOrder.photos || []
        });
      } else {
        reset();
      }
    }
  }, [isOpen, initialOrder, reset]);

  if (!isOpen && !initialOrder) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const newFiles = Array.from(e.target.files);
    const filesToProcess = newFiles.slice(0, 12 - photos.length);
    if (filesToProcess.length === 0) return;
    
    setUploadingPhotos(true);
    try {
      const uploadedUrls = [...photos];
      for (const file of filesToProcess) {
        const compressedBase64 = await compressImage(file);
        const blob = base64ToBlob(compressedBase64);
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const filePath = `${user.id}/${fileName}`;
        const publicUrl = await uploadFile('order-photos', filePath, blob);
        uploadedUrls.push(publicUrl);
        triggerHaptic('success');
      }
      setValue('photos', uploadedUrls);
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      triggerHaptic('error');
      alert(`⚠️ ERROR DE CARGA: ${err.message || 'Verifica tu conexión'}`);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const onFormSubmit: SubmitHandler<OrderFormData> = async (data) => {
    if (hpValue) {
      onClose();
      return;
    }
    
    try {
      const orderData = {
        ...data,
        responsible: activeResponsible,
        deliveryDate: data.deliveryDate + 'T17:00',
        created_by_role: user?.role || 'Colaborador'
      };
      if (initialOrder) await updateOrder(initialOrder.id, orderData);
      else await createOrder(orderData);
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      console.error('Error submitting order:', err);
      triggerHaptic('error');
      alert(`⚠️ ERROR AL GUARDAR: ${err.message || 'No se pudo procesar la orden.'}`);
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
            className="relative w-full max-w-2xl bg-[#251f30] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{initialOrder ? `Editar ${initialOrder.id}` : 'Nueva Orden de Servicio'}</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Validación Profesional Zod</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form 
              id="create-order-form"
              onSubmit={handleSubmit(onFormSubmit as any)} 
              className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Cliente</label>
                  <input 
                    {...register('customerName')}
                    type="text" 
                    placeholder="Nombre completo..."
                    className={`w-full bg-black/20 border ${errors.customerName ? 'border-red-500/50 text-red-200' : 'border-white/10 text-white'} rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-700`} 
                  />
                  {errors.customerName && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.customerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Celular (+57 3...)</label>
                  <input 
                    {...register('customerPhone')}
                    type="tel" 
                    placeholder="+57 300XXXXXXX"
                    className={`w-full bg-black/20 border ${errors.customerPhone ? 'border-red-500/50 text-red-200' : 'border-white/10 text-white'} rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-700`} 
                  />
                  {errors.customerPhone && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.customerPhone.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Servicios Técnicos</label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map(svc => {
                    const isSelected = selectedServices.includes(svc);
                    return (
                      <button 
                        key={svc} 
                        type="button" 
                        onClick={() => {
                          triggerHaptic('light');
                          const next = isSelected ? selectedServices.filter(s => s !== svc) : [...selectedServices, svc];
                          setValue('services', next, { shouldValidate: true });
                        }} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${isSelected ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                      >
                        {isSelected && <Check size={14} />}
                        {svc}
                      </button>
                    );
                  })}
                </div>
                {errors.services && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.services.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Calendar size={12}/> Fecha Entrega</label>
                  <input {...register('deliveryDate')} type="date" className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark" />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Costo Total ($)</label>
                  <input {...register('totalCost', { valueAsNumber: true })} type="number" className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Evidencias ({photos.length}/12)</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-slate-900 rounded-xl text-xs font-black cursor-pointer hover:bg-purple-400 transition-all">
                    <Camera size={14} />
                    {uploadingPhotos ? 'Subiendo...' : 'Agregar'}
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhotos} />
                  </label>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 group shrink-0">
                      <img src={p} alt="Evidencia" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setValue('photos', photos.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {photos.length === 0 && (
                    <div className="w-full py-6 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-600">
                      <FileText size={20} className="opacity-20 mb-2" />
                      <span className="text-[0.6rem] font-bold uppercase">Sin archivos</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Observaciones</label>
                <textarea {...register('notes')} placeholder="Detalles técnicos..." rows={2} className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white resize-none" />
              </div>

              <HoneypotField value={hpValue} onChange={e => setHpValue(e.target.value)} />
            </form>

            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl flex gap-3 shrink-0">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.65rem] uppercase tracking-widest">Cancelar</button>
              <button 
                type="submit" 
                form="create-order-form"
                disabled={isSubmitting || uploadingPhotos} 
                className="flex-[2] px-6 py-3.5 rounded-2xl bg-[#d4bc8f] text-slate-900 font-black text-[0.65rem] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : (initialOrder ? <Save size={16} /> : <Plus size={16} />)}
                {isSubmitting ? 'Guardando...' : (initialOrder ? 'Guardar' : 'Generar')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
