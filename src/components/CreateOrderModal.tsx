import React, { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Save, Calendar, Check, RefreshCw, AlertCircle, FileText, Lock, Unlock, TrendingUp, Calculator, Trash2 } from 'lucide-react';
import { useOrders, ServiceOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { HoneypotField } from './HoneypotField';
import { triggerHaptic } from '../utils/haptics';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
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
  const isMaster = user?.role === 'Administrador maestro';
  const [isFinancialUnlocked, setIsFinancialUnlocked] = useState(false);
  const [newDepositAmount, setNewDepositAmount] = useState<number>(0);
  const [isRegisteringDeposit, setIsRegisteringDeposit] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      recordType: 'orden',
      customerName: '',
      customerCedula: '1234567890',
      customerPhone: '+57 ',
      services: [],
      quoteItems: [],
      notes: '',
      deliveryDate: format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'),
      totalCost: 0,
      depositAmount: 0,
      paymentStatus: 'pendiente',
      photos: []
    }
  });

  const { fields: quoteItems, append: appendQuoteItem, remove: removeQuoteItem } = useFieldArray({
    control,
    name: "quoteItems"
  });

  const recordType = watch('recordType');
  const selectedServices = watch('services') || [];
  const photos = watch('photos') || [];
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [hpValue, setHpValue] = useState('');

  // Watch items to calculate total for quotes
  const watchedQuoteItems = watch('quoteItems');

  useEffect(() => {
    if (recordType === 'cotizacion') {
      let subtotal = 0;
      const calculatedItems = watchedQuoteItems.map((item) => {
         const rawTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
         const dist = (Number(item.discountPercent) || 0) / 100;
         const lineTotal = rawTotal * (1 - dist);
         subtotal += lineTotal;
         return lineTotal;
      });
      // Set line totals
      calculatedItems.forEach((total, idx) => {
         setValue(`quoteItems.${idx}.total`, total);
      });
      // Set global total with IVA 19%
      const iva = subtotal * 0.19;
      const finalTotal = subtotal + iva;
      setValue('totalCost', finalTotal);
    }
  }, [watchedQuoteItems, recordType, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        reset({
          recordType: initialOrder.recordType || 'orden',
          customerName: initialOrder.customerName,
          customerCedula: initialOrder.customerCedula || '1234567890',
          customerPhone: initialOrder.customerPhone,
          services: initialOrder.services || [],
          quoteItems: initialOrder.quoteItems || [],
          notes: initialOrder.notes || '',
          deliveryDate: initialOrder.deliveryDate.split('T')[0],
          paymentStatus: initialOrder.paymentStatus,
          totalCost: initialOrder.totalCost,
          depositAmount: initialOrder.depositAmount,
          photos: initialOrder.photos || []
        });
      } else {
        reset({
          recordType: 'orden',
          customerName: '',
          customerCedula: '1234567890',
          customerPhone: '+57 ',
          services: [],
          quoteItems: [{ item: '', unitPrice: 0, quantity: 1, discountPercent: 0, total: 0 }],
          notes: '',
          deliveryDate: format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'),
          totalCost: 0,
          depositAmount: 0,
          paymentStatus: 'pendiente',
          photos: []
        });
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
      const isQuote = data.recordType === 'cotizacion';
      const orderData = {
        ...data,
        responsible: activeResponsible,
        deliveryDate: data.deliveryDate + 'T17:00', // Expiration date for quotes, Delivery for orders
        created_by_role: user?.role || 'Colaborador',
        depositAmount: isQuote ? 0 : data.depositAmount, // Quotes have no deposit initially
        paymentStatus: isQuote ? 'pendiente' : data.paymentStatus
      };

      if (initialOrder) await updateOrder(initialOrder.id, orderData);
      else await createOrder(orderData);
      
      triggerHaptic('success');
      onClose();
      setIsFinancialUnlocked(false);
    } catch (err: any) {
      console.error('Error submitting order:', err);
      triggerHaptic('error');
      alert(`⚠️ ERROR AL GUARDAR: ${err.message || 'No se pudo procesar.'}`);
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

            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{initialOrder ? (recordType === 'cotizacion' ? 'Editar Cotización' : 'Editar Orden') : 'Generar Nuevo Registro'}</h3>
                {!initialOrder && (
                  <div className="flex bg-black/40 rounded-xl p-1 mt-3 border border-white/5">
                    <button 
                      type="button"
                      onClick={() => setValue('recordType', 'orden')} 
                      className={`flex-1 py-1.5 px-4 rounded-lg text-[0.65rem] uppercase font-black tracking-widest transition-all ${recordType === 'orden' ? 'bg-purple-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                      Orden de Servicio
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setValue('recordType', 'cotizacion'); 
                        if(watchedQuoteItems.length === 0) appendQuoteItem({ item: '', unitPrice: 0, quantity: 1, discountPercent: 0, total: 0 });
                        setValue('deliveryDate', format(addDays(new Date(), 10), 'yyyy-MM-dd')); // Max 10 days default
                      }} 
                      className={`flex-1 py-1.5 px-4 rounded-lg text-[0.65rem] uppercase font-black tracking-widest transition-all ${recordType === 'cotizacion' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                      Cotización Detallada
                    </button>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors self-end sm:self-auto">
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
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Cliente / Señor(es) *</label>
                  <input 
                    {...register('customerName')}
                    type="text" 
                    placeholder="Nombre completo..."
                    className={`w-full bg-black/20 border ${errors.customerName ? 'border-red-500/50 text-red-200' : 'border-white/10 text-white'} rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-700`} 
                  />
                  {errors.customerName && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.customerName.message}</p>}
                </div>
                {recordType === 'cotizacion' && (
                   <div className="space-y-2">
                     <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">CC / NIT</label>
                     <input 
                       {...register('customerCedula')}
                       type="text" 
                       placeholder="1234567890"
                       className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-700" 
                     />
                   </div>
                )}
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Celular (+57 3...) *</label>
                  <input 
                    {...register('customerPhone')}
                    type="tel" 
                    placeholder="+57 300XXXXXXX"
                    className={`w-full bg-black/20 border ${errors.customerPhone ? 'border-red-500/50 text-red-200' : 'border-white/10 text-white'} rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-700`} 
                  />
                  {errors.customerPhone && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.customerPhone.message}</p>}
                </div>
              </div>

              {/* MODO ORDEN DE SERVICIO: SERVICIOS SIMPLES */}
              {recordType === 'orden' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
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
                  {errors.services && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> Seleccione al menos un servicio</p>}
                </div>
              )}

              {/* MODO COTIZACION: ITEMS DETALLADOS */}
              {recordType === 'cotizacion' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-black/10 border border-white/5 rounded-3xl p-4 sm:p-5">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-[0.65rem] uppercase tracking-widest text-amber-500 font-black ml-1 flex items-center gap-1.5"><Calculator size={12}/> Líneas de Cotización</label>
                      <button type="button" onClick={() => { appendQuoteItem({ item: '', unitPrice: 0, quantity: 1, discountPercent: 0, total: 0 }); triggerHaptic('light'); }} className="text-[0.6rem] text-white hover:text-amber-400 flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full transition-colors border border-white/10 uppercase tracking-widest font-black">
                         <Plus size={12} /> Agregar Ítem
                      </button>
                   </div>
                   
                   <div className="space-y-3">
                     {quoteItems.map((field, index) => (
                       <div key={field.id} className="grid grid-cols-12 gap-2 sm:gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4 relative group">
                          
                          <div className="col-span-12 sm:col-span-12">
                             <input 
                               placeholder="Descripción del ítem/servicio..."
                               {...register(`quoteItems.${index}.item` as const)}
                               className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500/50"
                             />
                          </div>
                          
                          <div className="col-span-4 sm:col-span-3">
                             <label className="text-[0.55rem] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Precio Und ($)</label>
                             <input 
                               type="number"
                               {...register(`quoteItems.${index}.unitPrice` as const, { valueAsNumber: true })}
                               className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500/50"
                             />
                          </div>
                          
                          <div className="col-span-3 sm:col-span-2">
                             <label className="text-[0.55rem] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Cant.</label>
                             <input 
                               type="number"
                               {...register(`quoteItems.${index}.quantity` as const, { valueAsNumber: true })}
                               className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500/50 text-center"
                             />
                          </div>

                          <div className="col-span-5 sm:col-span-3">
                             <label className="text-[0.55rem] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Desc. (%)</label>
                             <input 
                               type="number"
                               {...register(`quoteItems.${index}.discountPercent` as const, { valueAsNumber: true })}
                               className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-amber-500 focus:ring-1 focus:ring-amber-500/50"
                             />
                          </div>

                          <div className="col-span-12 sm:col-span-4 flex items-end justify-between sm:justify-end gap-3 mt-2 sm:mt-0 border-t sm:border-0 border-white/10 pt-2 sm:pt-0">
                             <div className="text-left sm:text-right">
                                <span className="text-[0.55rem] text-slate-500 font-bold uppercase tracking-widest block">Total Línea</span>
                                <span className="text-sm font-black text-white">$ {Math.round(watch(`quoteItems.${index}.total`)).toLocaleString()}</span>
                             </div>
                             {quoteItems.length > 1 && (
                               <button type="button" onClick={() => removeQuoteItem(index)} className="p-2 text-red-500/50 hover:text-red-400 bg-red-500/5 rounded-xl border border-red-500/10">
                                 <Trash2 size={16} />
                               </button>
                             )}
                          </div>

                       </div>
                     ))}
                   </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Calendar size={12}/> {recordType === 'cotizacion' ? 'Válido Hasta (Max 10 Días)' : 'Fecha Entrega'}</label>
                <input {...register('deliveryDate')} type="date" className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark" />
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black">Costo Total + IVA ($)</label>
                    {recordType === 'orden' && initialOrder && isMaster && (
                      <button 
                        type="button" 
                        onClick={() => { setIsFinancialUnlocked(!isFinancialUnlocked); triggerHaptic('medium'); }}
                        className={`text-[0.6rem] font-black uppercase flex items-center gap-1 transition-colors ${isFinancialUnlocked ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}
                      >
                        {isFinancialUnlocked ? <Unlock size={10}/> : <Lock size={10}/>}
                        {isFinancialUnlocked ? 'Desbloqueado' : 'Desbloquear'}
                      </button>
                    )}
                  </div>
                  <input 
                    {...register('totalCost', { valueAsNumber: true })} 
                    type="number" 
                    disabled={(initialOrder && !isFinancialUnlocked) || recordType === 'cotizacion'}
                    className={`w-full bg-black/20 border rounded-2xl px-4 py-3.5 text-sm transition-all text-white font-black opacity-100 ${
                      recordType === 'cotizacion' ? 'border-amber-500/50 text-amber-500 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                      (initialOrder && !isFinancialUnlocked ? 'border-white/5 opacity-50 cursor-not-allowed' : 'border-white/10 focus:ring-2 focus:ring-purple-500/20')
                    }`} 
                  />
                  {recordType === 'cotizacion' && <p className="text-[0.55rem] text-slate-500 uppercase font-bold text-right tracking-widest mt-1">Cálculo Aut. (Subtotal + IVA 19%)</p>}
                </div>
                
                {recordType === 'orden' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                    <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Abono Inicial ($)</label>
                    <input 
                      {...register('depositAmount', { valueAsNumber: true })} 
                      type="number" 
                      disabled={!!initialOrder}
                      className={`w-full bg-black/20 border rounded-2xl px-4 py-3.5 text-sm font-bold transition-all ${initialOrder ? 'border-white/5 text-emerald-500/50 cursor-not-allowed' : 'border-white/10 text-emerald-400 focus:ring-2 focus:ring-emerald-500/20'}`} 
                    />
                  </div>
                )}
              </div>

              {initialOrder && recordType === 'orden' && (
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-purple-400" />
                      <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">Gestión de Abonos</span>
                    </div>
                    <div className="px-3 py-1 bg-purple-500/10 rounded-full">
                       <span className="text-[0.6rem] font-black text-purple-400">SALDO: ${Math.max(0, watch('totalCost') - watch('depositAmount')).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                       <input 
                         type="number"
                         value={newDepositAmount || ''}
                         onChange={(e) => setNewDepositAmount(Number(e.target.value))}
                         placeholder="Nuevo abono..."
                         className="w-full bg-black/40 border border-white/10 rounded-2xl pl-8 pr-4 py-3.5 text-sm text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                       />
                    </div>
                    <button
                      type="button"
                      disabled={!newDepositAmount || isRegisteringDeposit}
                      onClick={async () => {
                        if (!newDepositAmount) return;
                        setIsRegisteringDeposit(true);
                        try {
                          const { registerDeposit } = (useOrders as any)();
                          await registerDeposit(initialOrder.id, newDepositAmount);
                          const currentTotal = watch('depositAmount') + newDepositAmount;
                          setValue('depositAmount', currentTotal);
                          setNewDepositAmount(0);
                          triggerHaptic('success');
                        } finally {
                          setIsRegisteringDeposit(false);
                        }
                      }}
                      className="px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black text-[0.6rem] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isRegisteringDeposit ? '...' : 'Registrar'}
                    </button>
                  </div>
                </div>
              )}

              {recordType === 'orden' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Estado de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pendiente', 'abono', 'pagado'] as const).map((status) => {
                      const isSelected = watch('paymentStatus') === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => { setValue('paymentStatus', status); triggerHaptic('light'); }}
                          className={`py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest border transition-all ${
                            isSelected 
                              ? status === 'pagado' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                              : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Evidencias/Anexos ({photos.length}/12)</label>
                  <label className="flex items-center gap-2 px-4 py-2 bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-black cursor-pointer hover:bg-white/20 transition-all">
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
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Notas Adicionales</label>
                <textarea {...register('notes')} placeholder="Detalles u observaciones extra..." rows={2} className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white resize-none" />
              </div>

              <HoneypotField value={hpValue} onChange={e => setHpValue(e.target.value)} />
            </form>

            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl flex gap-3 shrink-0">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.65rem] uppercase tracking-widest">Cancelar</button>
              <button 
                type="submit" 
                form="create-order-form"
                disabled={isSubmitting || uploadingPhotos} 
                className={`flex-[2] px-6 py-3.5 rounded-2xl font-black text-[0.65rem] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 ${recordType === 'cotizacion' ? 'bg-amber-500 text-amber-950' : 'bg-[#d4bc8f] text-slate-900'}`}
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : (initialOrder ? <Save size={16} /> : <Plus size={16} />)}
                {isSubmitting ? 'Guardando...' : (initialOrder ? 'Guardar Cambios' : (recordType === 'cotizacion' ? 'Generar Cotización' : 'Generar Orden'))}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
