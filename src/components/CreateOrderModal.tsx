import React, { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Save, Calendar, Check, RefreshCw, AlertCircle, FileText, Lock, Unlock, TrendingUp, Calculator, Trash2, Search, ChevronDown } from 'lucide-react';
import { useOrders, ServiceOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { HoneypotField } from './HoneypotField';
import { triggerHaptic } from '../utils/haptics';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OrderSchema, OrderFormData } from '../lib/schemas';
import { countries, CountryCode } from '../constants/countries';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: ServiceOrder;
}

export default function CreateOrderModal({ isOpen, onClose, initialOrder }: CreateOrderModalProps) {
  const { createOrder, updateOrder, registerDeposit, serviceTypes, getOrderSequenceLabel, getQuoteSequenceLabel, orders } = useOrders();
  const { user } = useAuth();
  
  const activeResponsible = user?.full_name || user?.username || user?.email || 'Usuario';
  const isMaster = user?.role === 'Administrador maestro';
  const [isFinancialUnlocked, setIsFinancialUnlocked] = useState(false);
  const [newDepositAmount, setNewDepositAmount] = useState<number>(0);
  const [isRegisteringDeposit, setIsRegisteringDeposit] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formDataCache, setFormDataCache] = useState<OrderFormData | null>(null);
  const [hpValue, setHpValue] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  // v3.3: UI Resilience Guard (Spinner Timeouts)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (uploadingPhotos || isRegisteringDeposit || isFinalizing) {
       timeout = setTimeout(() => {
         if (uploadingPhotos) {
           setUploadingPhotos(false);
           console.warn('⚠️ Foto upload timeout');
         }
         if (isRegisteringDeposit) {
           setIsRegisteringDeposit(false);
           console.warn('⚠️ Abono timeout');
         }
         if (isFinalizing) {
           setIsFinalizing(false);
           console.warn('⚠️ Finalizing timeout');
         }
         triggerHaptic('error');
         // We don't alert here to avoid annoying the user if it eventually finishes,
         // but we release the buttons so they can try to "Save" again.
       }, 15000); // 15s Guard
    }
    return () => clearTimeout(timeout);
  }, [uploadingPhotos, isRegisteringDeposit, isFinalizing]);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countries[0]); // Colombia default
  const [phoneInput, setPhoneInput] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);

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
      photos: [],
      isTest: false
    }
  });

  const { fields: quoteItems, append: appendQuoteItem, remove: removeQuoteItem } = useFieldArray({
    control,
    name: "quoteItems"
  });

  const recordType = watch('recordType');
  const currentIsTest = watch('isTest');
  const selectedServices = watch('services') || [];
  const photos = watch('photos') || [];

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

  // REACTIVE LIVE ORDER (v21.1): Ensures deposits and status changes show up without closing/reopening
  const liveOrder = orders.find(o => o.id === initialOrder?.id) || initialOrder;

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        // Parse international phone
        const fullPhone = initialOrder.customerPhone || '';
        const foundCountry = countries.find(c => fullPhone.startsWith(c.code)) || countries[0];
        const localPart = fullPhone.replace(foundCountry.code, '').trim();
        
        setSelectedCountry(foundCountry);
        setPhoneInput(localPart);

        reset({
          recordType: initialOrder.recordType || 'orden',
          customerName: initialOrder.customerName,
          customerCedula: initialOrder.customerCedula || '1234567890',
          customerPhone: initialOrder.customerPhone,
          customerEmail: initialOrder.customerEmail || '',
          services: initialOrder.services || [],
          quoteItems: initialOrder.quoteItems || [],
          notes: initialOrder.notes || '',
          deliveryDate: initialOrder.deliveryDate.split('T')[0],
          totalCost: initialOrder.totalCost,
          depositAmount: initialOrder.depositAmount,
          paymentStatus: initialOrder.paymentStatus || 'pendiente',
          photos: initialOrder.photos || [],
          isTest: initialOrder.isTest || false
        });
      } else {
        setSelectedCountry(countries[0]);
        setPhoneInput('');
        reset({
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
          photos: [],
          isTest: false
        });
      }
    }
  }, [isOpen, initialOrder, reset]);

  // Sync internal phone state to RHF
  useEffect(() => {
    setValue('customerPhone', `${selectedCountry.code} ${phoneInput}`.trim(), { shouldValidate: !!phoneInput });
  }, [selectedCountry, phoneInput, setValue]);

  const filteredCountries = countries
    .filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
      c.code.includes(countrySearch)
    )
    .sort((a, b) => {
      if (a.code === '+57') return -1;
      if (b.code === '+57') return 1;
      return a.name.localeCompare(b.name);
    });

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
    setFormDataCache(data);
    setShowConfirm(true);
  };

  const handleFinalSubmit = async () => {
    if (!formDataCache || isFinalizing) return;
    setIsFinalizing(true);
    const data = formDataCache;
    setShowConfirm(false);
    setFormDataCache(null);

    if (hpValue) {
      onClose();
      return;
    }
    
    try {
      const isQuote = data.recordType === 'cotizacion';
      const calculatedStatus = isQuote ? 'pendiente' : (
        data.depositAmount === 0 ? 'pendiente' : (
          data.depositAmount >= data.totalCost ? 'pagado' : 'abono'
        )
      );

      const orderData = {
        ...data,
        responsible: activeResponsible,
        deliveryDate: data.deliveryDate + 'T17:00',
        createdByRole: user?.role || 'Colaborador',
        depositAmount: isQuote ? 0 : data.depositAmount,
        paymentStatus: calculatedStatus
      };

      // v3.3: Promise.race for better UX or just await
      if (liveOrder) await updateOrder(liveOrder.id, orderData);
      else await createOrder(orderData);
      
      triggerHaptic('success');
      onClose();
      setIsFinancialUnlocked(false);
    } catch (err: any) {
      console.error('Error submitting order:', err);
      // Ensure we go back to a usable state
      setIsFinalizing(false);
      triggerHaptic('error');
      alert(`⚠️ ERROR AL GUARDAR: ${err.message || 'No se pudo procesar.'} Reintenta en unos segundos.`);
    } finally {
      // isFinalizing is reset by useEffect guard or here if success
      setIsFinalizing(false);
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

            <div className="p-5 border-b border-white/5 bg-black/20 shrink-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {liveOrder 
                    ? (recordType === 'cotizacion' 
                        ? `Editar ${getQuoteSequenceLabel(liveOrder.id)}` 
                        : `Editar ${getOrderSequenceLabel(liveOrder.id)}`) 
                    : (recordType === 'cotizacion' 
                        ? `Cotización # ${getQuoteSequenceLabel('new')}` 
                        : `Nueva Orden # ${getOrderSequenceLabel('new')}`)}
                </h3>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 flex-1 max-w-sm">
                  <button 
                    type="button"
                    onClick={() => setValue('recordType', 'orden')} 
                    className={`flex-1 py-1.5 px-4 rounded-lg text-[0.6rem] uppercase font-black tracking-widest transition-all ${recordType === 'orden' ? 'bg-purple-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                    Orden de Servicio
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setValue('recordType', 'cotizacion'); 
                      if(watchedQuoteItems.length === 0) appendQuoteItem({ item: '', unitPrice: 0, quantity: 1, discountPercent: 0, total: 0 });
                      setValue('deliveryDate', format(addDays(new Date(), 10), 'yyyy-MM-dd'));
                    }} 
                    className={`flex-1 py-1.5 px-4 rounded-lg text-[0.6rem] uppercase font-black tracking-widest transition-all ${recordType === 'cotizacion' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-white'}`}
                  >
                    Cotización Detallada
                  </button>
                </div>

                {isMaster && recordType === 'orden' && !liveOrder && (
                  <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/10 shrink-0">
                    <div className="flex flex-col text-right hidden sm:flex">
                      <span className="text-[0.55rem] font-black uppercase tracking-widest text-slate-500">Modo de Registro</span>
                      <span className={`text-[0.6rem] font-bold ${currentIsTest ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {currentIsTest ? 'Prueba' : 'Original'}
                      </span>
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 h-7">
                        <button 
                          type="button"
                          onClick={() => setValue('isTest', false)}
                          className={`px-3 py-0.5 rounded-md text-[0.55rem] font-black uppercase tracking-widest transition-all ${!currentIsTest ? 'bg-emerald-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        >
                          Original
                        </button>
                        <button 
                          type="button"
                          onClick={() => setValue('isTest', true)}
                          className={`px-3 py-0.5 rounded-md text-[0.55rem] font-black uppercase tracking-widest transition-all ${currentIsTest ? 'bg-amber-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        >
                          Prueba
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form 
              id="create-order-form"
              onSubmit={handleSubmit(onFormSubmit as any, (errors) => console.log('Validation Errors:', errors))} 
              className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Cliente / Señor(es) *</label>
                  <input 
                    {...register('customerName')}
                    type="text" 
                    placeholder="Nombre completo..."
                    className={`w-full bg-black/20 border ${errors.customerName ? 'border-red-500/50 text-red-200' : 'border-white/10 text-white'} rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-800`} 
                  />
                  {errors.customerName && <p className="text-[0.55rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.customerName.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-black ml-1">Celular *</label>
                  <div className="flex gap-1.5">
                    <div className="relative w-24">
                      <button
                        type="button"
                        onClick={() => setCountryMenuOpen(!countryMenuOpen)}
                        className="w-full h-full min-h-[40px] bg-black/20 border border-white/10 rounded-xl px-2.5 flex items-center justify-between text-white text-[0.7rem] hover:bg-white/5 transition-all outline-none"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{selectedCountry.flag}</span>
                          <span className="font-bold">{selectedCountry.code}</span>
                        </span>
                        <ChevronDown size={10} className="text-slate-500" />
                      </button>

                      <AnimatePresence>
                        {countryMenuOpen && (
                          <>
                            <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              onClick={() => setCountryMenuOpen(false)}
                              className="fixed inset-0 z-[100]"
                            />
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full left-0 mt-1 w-56 bg-[#1a1625] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl"
                            >
                              <div className="p-2 border-b border-white/5 bg-black/20">
                                <div className="relative">
                                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                  <input 
                                    autoFocus
                                    type="text"
                                    placeholder="Buscar..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-[0.65rem] text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                {filteredCountries.map((c) => (
                                  <button
                                    key={c.code + c.name}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setCountryMenuOpen(false);
                                      setCountrySearch('');
                                      triggerHaptic('light');
                                    }}
                                    className={`w-full px-3 py-2 flex items-center gap-2.5 hover:bg-white/5 transition-all text-left ${selectedCountry.code === c.code ? 'bg-purple-500/10' : ''}`}
                                  >
                                    <span className="text-sm shrink-0">{c.flag}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[0.65rem] font-bold text-white truncate">{c.name}</div>
                                      <div className="text-[0.55rem] text-slate-500 font-bold uppercase">{c.code}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <input 
                      type="tel" 
                      value={phoneInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (selectedCountry.code === '+57' && val.length > 10) return;
                        setPhoneInput(val);
                      }}
                      placeholder={selectedCountry.code === '+57' ? "300..." : "# Local"}
                      className={`flex-1 min-h-[40px] bg-black/20 border ${errors.customerPhone ? 'border-red-500/50 text-red-200' : 'border-white/10 text-white'} rounded-xl px-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500/30 placeholder:text-slate-800 transition-all`} 
                    />
                  </div>
                  {errors.customerPhone && <p className="text-[0.55rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.customerPhone.message}</p>}
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

              <div className="grid grid-cols-3 gap-4 items-end bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="space-y-1.5">
                   <label className="text-[0.55rem] uppercase tracking-[0.15em] text-slate-400 font-black ml-1 flex items-center gap-1.5"><Calendar size={10}/> Fecha Entrega</label>
                   <input {...register('deliveryDate')} type="date" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[0.7rem] text-white color-scheme-dark focus:outline-none" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[0.55rem] uppercase tracking-[0.15em] text-slate-400 font-black">Total + IVA</label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] text-slate-500 font-bold">$</span>
                    <input 
                      {...register('totalCost', { valueAsNumber: true })} 
                      type="number" 
                      disabled={(liveOrder && !isFinancialUnlocked) || recordType === 'cotizacion'}
                      className={`w-full bg-black/40 border rounded-xl pl-6 pr-2 py-2 text-[0.75rem] transition-all text-white font-black ${
                        recordType === 'cotizacion' ? 'border-amber-500/30 text-amber-500' : (liveOrder && !isFinancialUnlocked ? 'border-white/5 opacity-50' : 'border-white/10')
                      }`} 
                    />
                  </div>
                </div>
                
                {recordType === 'orden' && (
                  <div className="space-y-1.5 pt-0">
                    <label className="text-[0.55rem] uppercase tracking-[0.15em] text-slate-400 font-black ml-1">Abono Inicial</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] text-emerald-500/50 font-bold">$</span>
                      <input 
                        {...register('depositAmount', { 
                          valueAsNumber: true,
                          validate: (val) => val <= watch('totalCost') || "Excede total"
                        })} 
                        type="number" 
                        disabled={!!liveOrder}
                        className={`w-full bg-black/40 border rounded-xl pl-6 pr-2 py-2 text-[0.75rem] font-bold transition-all ${liveOrder ? 'border-white/5 text-emerald-500/30' : 'border-white/10 text-emerald-400 focus:ring-1 focus:ring-emerald-500/50'}`} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* REAL-TIME BALANCE INDICATOR (UI EXACT MATCH) */}
              {recordType === 'orden' && (
                <div className="flex items-center justify-between px-5 py-3 bg-white/5 rounded-2xl border border-white/10 mx-1">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                       <Calculator size={18} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[0.45rem] font-black text-slate-500 uppercase tracking-widest">Cálculo de Saldo</span>
                        <span className="text-[0.6rem] font-bold text-slate-300">Resumen Financiero Inmediato</span>
                     </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[0.45rem] font-black text-purple-400/80 uppercase tracking-widest block mb-0.5">Saldo Pendiente Final</span>
                      <span className={`text-xl font-black ${
                        (watch('totalCost') - (liveOrder ? (liveOrder.totalCost - liveOrder.pendingBalance) : (watch('depositAmount') || 0)) - (newDepositAmount || 0)) < 0 ? 'text-red-400' : 'text-white'
                      }`}>
                        $ {Math.max(0, 
                          (liveOrder 
                            ? watch('totalCost') - (liveOrder.totalCost - liveOrder.pendingBalance)
                            : watch('totalCost') - (watch('depositAmount') || 0)
                          ) - (newDepositAmount || 0)
                        ).toLocaleString()}
                      </span>
                   </div>
                </div>
              )}

              {liveOrder && recordType === 'orden' && (
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <TrendingUp size={14} className="text-purple-400" />
                       <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">Gestión de Abonos</span>
                    </div>
                    <div className="px-3 py-1 bg-purple-500/10 rounded-full">
                       <span className="text-[0.6rem] font-black text-purple-400">SALDO ACTUAL: ${liveOrder.pendingBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Historial de Abonos Adicionales (v21 Requirement) */}
                  <div className="space-y-2">
                    {liveOrder.history.filter(h => h.type === 'financiero').map((h, i) => (
                      <div key={i} className="flex justify-between items-center px-3 py-2 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[0.55rem] font-bold text-emerald-400 uppercase">{h.description.split('|')[0].trim()}</span>
                           <span className="text-[0.45rem] font-medium text-slate-500 lowercase">Recibido por {h.userName} • {format(new Date(h.timestamp), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        <Check className="text-emerald-500/40" size={12} />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <div className="flex-1 relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                       <input 
                         type="number"
                         value={newDepositAmount || ''}
                         onChange={(e) => setNewDepositAmount(Number(e.target.value))}
                         placeholder="Nuevo abono..."
                         className={`w-full bg-black/40 border rounded-2xl pl-8 pr-4 py-3.5 text-sm font-bold focus:outline-none transition-all ${
                           newDepositAmount > liveOrder.pendingBalance ? 'border-red-500/50 text-red-500 ring-4 ring-red-500/10' : 'border-white/10 text-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                         }`}
                       />
                       {newDepositAmount > liveOrder.pendingBalance && (
                         <p className="absolute left-1 -bottom-5 text-[0.5rem] text-red-400 font-black uppercase tracking-widest animate-pulse">Excede el saldo pendiente</p>
                       )}
                    </div>
                    <button
                      type="button"
                      disabled={!newDepositAmount || isRegisteringDeposit || newDepositAmount > liveOrder.pendingBalance}
                      onClick={async () => {
                        if (!newDepositAmount || newDepositAmount > liveOrder.pendingBalance) return;
                        setIsRegisteringDeposit(true);
                        try {
                          await registerDeposit(liveOrder.id, newDepositAmount);
                          setNewDepositAmount(0);
                          triggerHaptic('success');
                        } catch (err: any) {
                          alert(`⚠️ ERROR: ${err.message}`);
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



              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[0.55rem] uppercase tracking-widest text-slate-500 font-black ml-1 outline-none">Evidencias/Anexos ({photos.length}/12)</label>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-slate-300 border border-white/10 rounded-xl text-[0.6rem] font-bold cursor-pointer hover:bg-white/20 transition-all uppercase tracking-widest">
                    <Camera size={12} />
                    {uploadingPhotos ? '...' : 'Agregar'}
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

            <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-xl flex flex-col gap-3 shrink-0">
              {Object.keys(errors).length > 0 && (
                <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-pulse">
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-[0.6rem] font-bold text-red-400 uppercase tracking-widest">
                    Faltan campos obligatorios: {Object.keys(errors).map(k => k === 'services' ? 'Servicios' : k === 'deliveryDate' ? 'Fecha' : k).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.6rem] uppercase tracking-widest transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  form="create-order-form"
                  disabled={isSubmitting || uploadingPhotos} 
                  className={`flex-[1.5] px-6 py-3 rounded-xl font-black text-[0.6rem] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 ${
                    Object.keys(errors).length > 0 ? 'opacity-50 grayscale' : ''
                  } ${
                    recordType === 'cotizacion' ? 'bg-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-[#d4bc8f] text-slate-900 shadow-[0_0_15px_rgba(212,188,143,0.1)]'
                  }`}
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : (liveOrder ? <Save size={14} /> : <Plus size={14} />)}
                  {isSubmitting ? 'Guardando...' : (liveOrder ? 'Guardar Cambios' : (recordType === 'cotizacion' ? 'Generar Cotización' : 'Generar Orden'))}
                </button>
              </div>
            </div>
          </motion.div>

          {/* New Confirmation Modal Internal */}
          <AnimatePresence>
            {showConfirm && formDataCache && (
               <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 pb-24">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#1a1622] p-8 rounded-[40px] border border-white/10 shadow-2xl text-center max-w-sm w-full">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${formDataCache.isTest ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">¿Confirmar Datos?</h3>
                    <p className="text-[0.7rem] text-slate-400 leading-relaxed font-medium mb-8">
                       Estás a punto de registrar {formDataCache.recordType === 'cotizacion' ? 'una cotización' : 'una orden'} para <span className="text-white font-bold">{formDataCache.customerName}</span>. 
                       {formDataCache.isTest && <span className="block mt-2 text-amber-500 font-black">MODO PRUEBA: DOCUMENTO NO OFICIAL</span>}
                    </p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowConfirm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                        Revisar
                      </button>
                      <button 
                        type="button" 
                        onClick={handleFinalSubmit} 
                        disabled={isFinalizing}
                        className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all ${
                          isFinalizing ? 'bg-slate-700 text-slate-500' :
                          (formDataCache.isTest ? 'bg-amber-500 text-slate-900 shadow-amber-500/20' : 'bg-emerald-500 text-slate-700 shadow-emerald-500/20')
                        }`}
                      >
                        {isFinalizing ? <RefreshCw className="animate-spin mx-auto" size={20} /> : (liveOrder ? 'Actualizar' : 'Generar')}
                      </button>
                    </div>
                  </motion.div>
               </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
