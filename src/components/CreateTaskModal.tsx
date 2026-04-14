import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Clock, Type, AlignLeft, Flag, Check, Camera, RefreshCw, Trash2, IterationCw, AlertCircle, Users, User } from 'lucide-react';
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
  const { groups, memberships, fetchAllProfiles } = useGroups();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [hpValue, setHpValue] = useState('');
  const [userDirectory, setUserDirectory] = useState<{ id: string; email: string; full_name: string; avatar?: string }[]>([]);
  const [userSearch, setUserSearch] = useState('');

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
      shared_user_ids: [],
      isShared: false,
      imageUrl: '',
      type: 'task',
      recurrence: 'none',
      recurrenceInterval: 1
    }
  });

  const isEdit = !!initialData;
  const groupIds = watch('group_ids');
  const sharedUserIds = watch('shared_user_ids') || [];
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
        shared_user_ids: initialData.shared_user_ids || [],
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
        shared_user_ids: [],
        isShared: false,
        imageUrl: '',
        type: 'task',
        recurrence: 'none',
        recurrenceInterval: 1
      });
    }
  }, [initialData, initialDate, reset]);

  const myApprovedGroups = groups.filter(g => 
    memberships.some(m => m.groupId === g.id && m.userId === user?.id && m.status === 'approved')
  );

  // Load user directory for sharing with individual users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const profiles = await fetchAllProfiles();
        setUserDirectory(profiles.filter(p => p.id !== user?.id));
      } catch (err) {
        console.error('Error loading user directory:', err);
      }
    };
    if (isOpen) loadUsers();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        date: initialDate || format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        priority: 'media',
        group_ids: [],
        shared_user_ids: [],
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
    setValue('isShared', next.length > 0 || sharedUserIds.length > 0);
  };

  const toggleUser = (userId: string) => {
    triggerHaptic('light');
    const current = sharedUserIds || [];
    const next = current.includes(userId) ? current.filter(uid => uid !== userId) : [...current, userId];
    setValue('shared_user_ids', next);
    setValue('isShared', (groupIds?.length ?? 0) > 0 || next.length > 0);
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
        isShared: data.isShared,
        shared_user_ids: data.shared_user_ids || [],
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
              className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24"
            >
              {/* v2.1: Nature & Priority at the top for quick context */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Naturaleza de la Actividad</label>
                  <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <button 
                      type="button"
                      onClick={() => { setValue('type', 'task'); triggerHaptic('light'); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${typeSelection === 'task' ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      📋 Tarea
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setValue('type', 'reminder'); triggerHaptic('light'); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all ${typeSelection === 'reminder' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      🔔 Recordatorio
                    </button>
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
                        className={`py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest border transition-all ${
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
              </div>

              {/* Visibility / Sharing Section - Refactored to grid as in image */}
              <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10 mb-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black flex items-center gap-1.5">
                    <span>🔒</span> Visibilidad
                  </label>
                  <div className={`flex items-center gap-1.5 text-[0.55rem] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    ((groupIds?.length ?? 0) > 0 || sharedUserIds.length > 0)
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    {((groupIds?.length ?? 0) > 0 || sharedUserIds.length > 0) ? <Users size={10} /> : <span>🔐</span>}
                    {((groupIds?.length ?? 0) > 0 || sharedUserIds.length > 0)
                      ? `COMPARTIDA`
                      : 'PRIVADA — SOLO TÚ'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  {/* Left: Teams */}
                  <div className="space-y-3">
                    <span className="text-[0.55rem] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                      <Users size={10} /> Equipos
                    </span>
                    <div className="flex flex-col gap-2">
                      {myApprovedGroups.length > 0 ? (
                        myApprovedGroups.map(g => {
                          const isSelected = groupIds?.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => toggleGroup(g.id)}
                              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between ${
                                isSelected ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Users size={14} className={isSelected ? 'animate-pulse' : ''} />
                                {g.name}
                              </div>
                              {isSelected && <Check size={14} />}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-[0.6rem] text-slate-700 italic">No hay equipos.</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Individual User Dropdown */}
                  <div className="space-y-3">
                    <span className="text-[0.55rem] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                      <User size={10} /> Usuarios Específicos
                    </span>
                    
                    <div className="relative">
                      {/* Custom Dropdown Trigger */}
                      <div className="relative">
                        <input
                          type="text"
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          onFocus={() => triggerHaptic('light')}
                          placeholder="Buscar usuario..."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-700 transition-all font-medium"
                        />
                        <User size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" />
                      </div>

                      {/* Dropdown List */}
                      <AnimatePresence>
                        {userSearch.trim().length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute z-[110] left-0 right-0 top-full mt-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[180px] overflow-y-auto no-scrollbar"
                          >
                            {userDirectory
                              .filter(u => 
                                !sharedUserIds.includes(u.id) &&
                                (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
                              )
                              .map(u => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => { toggleUser(u.id); setUserSearch(''); }}
                                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-all flex items-center gap-3 border-b border-white/5 last:border-0"
                                >
                                  <div className="w-7 h-7 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                    {u.avatar && u.avatar.length > 10 ? (
                                      <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 text-white text-[10px] font-black flex items-center justify-center">
                                        {(u.full_name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.7rem] font-bold text-white">{u.full_name}</span>
                                    <span className="text-[0.55rem] text-slate-500 truncate">{u.email}</span>
                                  </div>
                                </button>
                              ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selected Users Chips */}
                    {sharedUserIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                        {sharedUserIds.map(uid => {
                          const profile = userDirectory.find(u => u.id === uid);
                          if (!profile) return null;
                          return (
                            <button
                              key={uid}
                              type="button"
                              onClick={() => toggleUser(uid)}
                              className="px-2.5 py-1.5 rounded-xl text-[0.6rem] font-bold border bg-purple-500/10 border-purple-500/30 text-purple-400 transition-all flex items-center gap-2 group hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                            >
                              <div className="w-5 h-5 rounded-lg border border-purple-500/30 overflow-hidden flex items-center justify-center shrink-0">
                                {profile.avatar && profile.avatar.length > 10 ? (
                                  <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 text-white text-[8px] font-black flex items-center justify-center">
                                    {(profile.full_name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              {profile.full_name.split(' ')[0]}
                              <X size={10} className="group-hover:scale-125 transition-transform" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Task Data Feed */}
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Type size={12}/> Título</label>
                  <input 
                    {...register('title')}
                    autoFocus
                    placeholder="¿Qué hay que hacer?"
                    className={`w-full bg-black/30 border ${errors.title ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-700 font-medium`} 
                  />
                  {errors.title && <p className="text-[0.6rem] text-red-400 font-bold mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><AlignLeft size={12}/> Descripción</label>
                  <textarea 
                    {...register('description')}
                    placeholder="Detalles adicionales (opcional)..." 
                    rows={2} 
                    className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-700 resize-none font-medium" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Calendar size={12}/> Fecha</label>
                    <input 
                      {...register('date')}
                      type="date" 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5"><Clock size={12}/> Hora</label>
                    <input 
                      {...register('time')}
                      type="time" 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20" 
                    />
                  </div>
                </div>
              </div>

              {/* v2.2: Recurrence Selector (Only for Reminders) */}
              {typeSelection === 'reminder' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 bg-white/5 p-5 rounded-3xl border border-white/5"
                >
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-black ml-1 flex items-center gap-2">
                    <RefreshCw size={12} className="text-amber-500" /> Recurrencia del Recordatorio
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
                        className={`py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest border transition-all ${
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
                    <div className="mt-4 flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                      <span className="text-[0.6rem] text-slate-500 font-bold uppercase ml-1">CADA</span>
                      <input 
                        type="number"
                        {...register('recurrenceInterval', { valueAsNumber: true })}
                        className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-center text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                        min={1}
                      />
                      <span className="text-[0.6rem] text-slate-500 font-bold uppercase">
                        {recurrence === 'daily' ? 'días' : recurrence === 'weekly' ? 'semanas' : recurrence === 'monthly' ? 'meses' : 'años'}
                      </span>
                    </div>
                  )}
                </motion.div>
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
                     className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 text-[0.65rem] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={14} /> Prorrogar Ciclo
                   </button>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Imagen de Referencia</label>
                <div className="flex items-center gap-4">
                  <label className="w-24 h-24 bg-white/5 border border-dashed border-white/10 rounded-[28px] flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-white/10 transition-all group active:scale-95">
                    <Camera size={28} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[0.55rem] font-black mt-2 uppercase tracking-widest">Subir</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {uploading && (
                    <div className="w-24 h-24 flex items-center justify-center bg-black/20 rounded-[28px] border border-white/5">
                      <RefreshCw size={24} className="animate-spin text-purple-400" />
                    </div>
                  )}
                  {imageUrl && !uploading && (
                    <div className="relative w-24 h-24 rounded-[28px] overflow-hidden border border-white/10 group">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setValue('imageUrl', '')}
                        className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={24} className="text-white" />
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
