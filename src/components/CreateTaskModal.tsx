import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Clock, Type, AlignLeft, Flag, Check, Camera, RefreshCw, AlertCircle } from 'lucide-react';
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
}

export default function CreateTaskModal({ isOpen, onClose, onSave }: CreateTaskModalProps) {
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
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      priority: 'media',
      group_ids: [],
      isShared: false,
      imageUrl: ''
    }
  });

  const groupIds = watch('group_ids');
  const imageUrl = watch('imageUrl');
  const priority = watch('priority');

  const myApprovedGroups = groups.filter(g => 
    memberships.some(m => m.groupId === g.id && m.userId === (user?.id || user?.email) && m.status === 'approved')
  );

  useEffect(() => {
    if (isOpen) {
      reset();
      setUploading(false);
    }
  }, [isOpen, reset]);

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

  const onFormSubmit = (data: TaskFormData) => {
    if (hpValue) {
      onClose();
      return;
    }

    onSave({
      ...data,
      id: Date.now().toString(),
      status: 'accepted',
      isShared: (data.group_ids || []).length > 0,
      groupId: (data.group_ids || [])[0] || undefined,
    });

    triggerHaptic('success');
    onClose();
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

            <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-24">
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
              <button 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                onClick={handleSubmit(onFormSubmit)}
                disabled={isSubmitting || uploading}
                className="flex-[2] px-6 py-3.5 rounded-2xl bg-[#d4bc8f] text-slate-900 font-black text-[0.65rem] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                {isSubmitting ? 'Guardando...' : 'Crear Tarea'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
