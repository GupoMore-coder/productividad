import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Clock, Type, AlignLeft, Flag, Check, Camera, RefreshCw, Trash2, Share2, IterationCw, AlertCircle } from 'lucide-react';
import { useGroups } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../utils/haptics';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskSchema, TaskFormData } from '../lib/schemas';
import { compressImage } from '../utils/imageCompressor';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { HoneypotField } from './HoneypotField';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  initialDate?: string;
  initialData?: any;
  onDelete?: (id: string) => Promise<void>;
  onExtend?: (task: any) => Promise<void>;
}

export default function CreateTaskModal({ isOpen, onClose, onSave, initialDate, initialData, onDelete, onExtend }: CreateTaskModalProps) {
  const { groups, memberships } = useGroups();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [hpValue, setHpValue] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: '',
      description: '',
      date: initialDate || format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      priority: 'media',
      group_ids: [],
      isShared: false,
      imageUrl: '',
      type: 'task',
      recurrence: 'none',
      recurrenceInterval: 1
    }
  });

  const isEdit = !!initialData;
  const groupIds = watch('group_ids');
  const imageUrl = watch('imageUrl');
  const priority = watch('priority');
  const typeSelection = watch('type');
  const recurrence = watch('recurrence');

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description || '',
        date: initialData.date,
        time: initialData.time,
        priority: initialData.priority,
        group_ids: initialData.group_ids || [],
        isShared: initialData.isShared || false,
        imageUrl: initialData.imageUrl || '',
        type: initialData.type || 'task',
        recurrence: initialData.recurrence || 'none',
        recurrenceInterval: initialData.recurrenceInterval || 1
      });
    } else {
      reset({
        title: '',
        description: '',
        date: initialDate || format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        priority: 'media',
        group_ids: [],
        isShared: false,
        imageUrl: '',
        type: 'task',
        recurrence: 'none',
        recurrenceInterval: 1
      });
    }
  }, [initialData, initialDate, reset]);

  const myApprovedGroups = groups.filter(g => 
    memberships.some(m => m.groupId === g.id && m.userId === (user?.id || user?.email) && m.status === 'approved')
  );

  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        date: initialDate || format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        priority: 'media',
        group_ids: [],
        isShared: false,
        imageUrl: '',
        type: 'task',
        recurrence: 'none',
        recurrenceInterval: 1
      });
      setUploading(false);
    }
  }, [isOpen, reset, initialDate]);

  const toggleGroup = (id: string) => {
    triggerHaptic('light');
    const current = groupIds || [];
    const next = current.includes(id) ? current.filter(gid => gid !== id) : [...current, id];
    setValue('group_ids', next);
    setValue('isShared', next.length > 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const compressedBase64 = await compressImage(file);
      const blob = base64ToBlob(compressedBase64);
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const publicUrl = await uploadFile('task-photos', `${user.id}/${fileName}`, blob);
      setValue('imageUrl', publicUrl);
      triggerHaptic('success');
    } catch (err) {
      console.error('Upload Error:', err);
      triggerHaptic('error');
      alert('Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const onFormSubmit = async (data: TaskFormData) => {
    if (hpValue) {
      onClose();
      return;
    }

    try {
      await onSave({
        ...data,
        status: 'accepted',
        isShared: (data.group_ids || []).length > 0,
        groupId: (data.group_ids || [])[0] || undefined,
      });

      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      console.error('Save Task Error:', err);
      triggerHaptic('error');
      alert(`Error al guardar la tarea: ${err.message || 'Verifica tu conexión o permisos.'}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#251f30] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-purple-400" />
                Nueva Actividad
              </h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form 
              id="create-task-form"
              onSubmit={handleSubmit(onFormSubmit as any)} 
              className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-24"
            >
              {/* v2.1: Type Selector */}
              <div className="space-y-3">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Naturaleza de la Actividad</label>
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                  <button 
                    type="button"
                    onClick={() => { setValue('type', 'task'); triggerHaptic('light'); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${typeSelection === 'task' ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    <span>📋</span> Tarea
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setValue('type', 'reminder'); triggerHaptic('light'); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${typeSelection === 'reminder' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    <span>🔔</span> Recordatorio
                  </button>
                </div>
                <p className="text-[0.55rem] text-slate-600 font-medium px-2 italic">
                  {typeSelection === 'task' 
                    ? '* Las tareas afectan métricas de desempeño e inician proceso de incumplimiento si vencen.' 
                    : '* Los recordatorios son personales/compartibles, tienen recurrencia y no afectan métricas.'}
                </p>
              </div>

              {/* v2.2: Recurrence Selector (Only for Reminders) */}
              {typeSelection === 'reminder' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5"
                >
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-black ml-1 flex items-center gap-2">
                    <RefreshCw size={12} className="text-amber-500" /> Recurrencia
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'none', label: 'Sin Repetir' },
                      { val: 'daily', label: 'Diaria' },
                      { val: 'weekly', label: 'Semanal' },
                      { val: 'monthly', label: 'Mensual' },
                      { val: 'yearly', label: 'Anual' }
                    ].map(rec => (
                      <button
                        key={rec.val}
                        type="button"
                        onClick={() => { setValue('recurrence', rec.val as any); triggerHaptic('light'); }}
                        className={`py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest border transition-all ${
                          recurrence === rec.val
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {rec.label}
                      </button>
                    ))}
                  </div>
                  {recurrence !== 'none' && (
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[0.6rem] text-slate-500 font-bold uppercase">Repetir cada:</span>
                      <input 
                        type="number"
                        {...register('recurrenceInterval', { valueAsNumber: true })}
                        className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none"
                        min={1}
                      />
                      <span className="text-[0.6rem] text-slate-500 font-bold uppercase">
                        {recurrence === 'daily' ? 'días' : recurrence === 'weekly' ? 'semanas' : recurrence === 'monthly' ? 'meses' : 'años'}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Type size={12}/> Título</label>
                <input 
                  {...register('title')}
                  autoFocus
                  placeholder="¿Qué hay que hacer?"
                  className={`w-full bg-black/30 border ${errors.title ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-700`} 
                />
                {errors.title && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><AlignLeft size={12}/> Descripción</label>
                <textarea 
                  {...register('description')}
                  placeholder="Detalles adicionales (opcional)..." 
                  rows={2} 
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-700 resize-none" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Calendar size={12}/> Fecha</label>
                  <input 
                    {...register('date')}
                    type="date" 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Clock size={12}/> Hora</label>
                  <input 
                    {...register('time')}
                    type="time" 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Flag size={12}/> Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['baja', 'media', 'alta'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setValue('priority', p); triggerHaptic('light'); }}
                      className={`py-2.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest border transition-all ${
                        priority === p 
                          ? p === 'alta' ? 'bg-red-500/20 border-red-500/50 text-red-400' : p === 'media' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {myApprovedGroups.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Compartir con Grupos</label>
                  <div className="flex flex-wrap gap-2">
                    {myApprovedGroups.map(g => {
                      const isSelected = groupIds?.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGroup(g.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                            isSelected ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/5 text-slate-500'
                          }`}
                        >
                          <span className="text-lg">👥</span>
                          {g.name}
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* v2.3: Extension UI for recurring reminders */}
              {isEdit && typeSelection === 'reminder' && recurrence !== 'none' && onExtend && (
                <div className="p-6 rounded-[32px] bg-amber-500/5 border border-amber-500/10 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                         <IterationCw size={20} />
                      </div>
                      <div>
                         <h4 className="text-xs font-black text-white uppercase tracking-tight">Extensión de Serie</h4>
                         <p className="text-[0.6rem] text-slate-500 font-bold uppercase">Agrega un nuevo ciclo a este recordatorio</p>
                      </div>
                   </div>
                   <button
                     type="button"
                     onClick={() => {
                       if (window.confirm(`¿Deseas prorrogar este recordatorio según su ciclo original?`)) {
                         onExtend(initialData);
                         onClose();
                       }
                     }}
                     className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 text-[0.65rem] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={14} /> Prorrogar Ciclo
                   </button>
                   <p className="text-[0.5rem] text-slate-600 font-medium italic text-center">
                      * Se generarán instancias adicionales para {recurrence === 'daily' ? '30 días' : recurrence === 'weekly' ? '6 meses' : recurrence === 'monthly' ? '12 meses' : '2 años'}.
                   </p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Imagen de Referencia</label>
                <div className="flex items-center gap-4">
                  <label className="w-20 h-20 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-white/10 transition-colors">
                    <Camera size={24} />
                    <span className="text-[0.5rem] font-bold mt-1 uppercase">Subir</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {uploading && <RefreshCw size={24} className="animate-spin text-purple-400" />}
                  {imageUrl && !uploading && (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setValue('imageUrl', '')}
                        className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex transition-all"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <HoneypotField value={hpValue} onChange={e => setHpValue(e.target.value)} />
            </form>

            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl flex gap-3 shrink-0">
              {isEdit && onDelete && (
                <button 
                  type="button" 
                  onClick={() => {
                    if (window.confirm('¿Borrar definitivamente?')) {
                      onDelete(initialData.id);
                      onClose();
                    }
                  }}
                  className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  <Trash2 size={24} />
                </button>
              )}
              <button 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {hpValue ? 'Cerrar' : 'Cancelar'}
              </button>
              <button 
                type="submit"
                form="create-task-form"
                disabled={isSubmitting || uploading}
                className={`flex-[2] px-6 py-3.5 rounded-2xl font-black text-[0.65rem] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${typeSelection === 'reminder' ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' : 'bg-purple-500 text-white shadow-purple-500/20'}`}
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                {isSubmitting ? 'Guardando...' : hpValue ? 'Cerrar' : isEdit ? 'Actualizar' : 'Crear Actividad'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
