import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Plus, Save, Calendar, Clock, Check, AlertTriangle, ListTodo } from 'lucide-react';
import { Task } from './TaskCard';
import { useGroups } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadFile, base64ToBlob } from '@/lib/supabase';
import { HoneypotField } from './HoneypotField';
import { triggerHaptic } from '../utils/haptics';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onSave }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hpValue, setHpValue] = useState('');

  const { groups, memberships } = useGroups();
  const { user } = useAuth();

  const myApprovedGroups = groups.filter(g => 
    memberships.some(m => m.groupId === g.id && m.userId === (user?.id || user?.email) && m.status === 'approved')
  );

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setPriority('media');
      setGroupIds([]);
      setImageUrl(undefined);
      setUploading(false);
    }
  }, [isOpen]);

  const toggleGroup = (id: string) => {
    triggerHaptic('light');
    setGroupIds(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const compressedBase64 = await compressImage(file);
      const blob = base64ToBlob(compressedBase64);
      const fileName = `task-${Date.now()}.jpg`;
      const publicUrl = await uploadFile('task-photos', `${user.id}/${fileName}`, blob);
      setImageUrl(publicUrl);
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || uploading || submitting) return;

    // Honeypot check
    if (hpValue) {
      console.warn('Honeypot triggered in CreateTaskModal');
      onClose();
      return;
    }

    setSubmitting(true);

    onSave({
      id: Date.now().toString(),
      title,
      description,
      date,
      time,
      priority,
      status: 'accepted',
      isShared: groupIds.length > 0,
      groupId: groupIds[0] || undefined,
      group_ids: groupIds,
      imageUrl
    } as any);
    triggerHaptic('success');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Content (Bottom Sheet on Mobile, Dialog on Desktop) */}
          <motion.div 
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-[#251f30] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Handle bar for bottom sheet feel */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" aria-hidden="true" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <ListTodo size={24} />
                </div>
                <div>
                  <h3 id="modal-title" className="text-xl font-bold text-white tracking-tight">Nueva Actividad</h3>
                  <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-black mt-0.5">Gestión Personal y Grupal</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Título de la Actividad</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Revisión técnica equipo A"
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all placeholder:text-slate-700"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Descripción / Notas</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detalles opcionales..."
                  rows={2}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all resize-none placeholder:text-slate-700"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5">
                    <Calendar size={12}/> Fecha
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1 flex items-center gap-1.5">
                    <Clock size={12}/> Hora
                  </label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white color-scheme-dark focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Priority Selector */}
              <div className="space-y-3">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Prioridad Operativa</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['baja', 'media', 'alta'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`
                        py-3 px-2 rounded-xl text-[0.65rem] font-bold uppercase tracking-widest border transition-all active:scale-95
                        ${priority === p 
                          ? p === 'alta' ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                            : p === 'media' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                            : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-400'}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Group Selector */}
              {myApprovedGroups.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Sincronización Grupal</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-black/20 rounded-2xl border border-white/5">
                    {myApprovedGroups.map(g => {
                      const isSelected = groupIds.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGroup(g.id)}
                          className={`
                            px-3 py-1.5 rounded-full text-[0.6rem] font-bold transition-all flex items-center gap-1.5 border
                            ${isSelected 
                              ? 'bg-purple-500 border-purple-500 text-slate-900 shadow-lg shadow-purple-500/20' 
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}
                          `}
                        >
                          {isSelected ? <Check size={10} /> : <Plus size={10} />}
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[0.6rem] text-slate-500 italic ml-1 flex items-center gap-1">
                    <AlertTriangle size={10} aria-hidden="true" /> Compartir esta actividad con los grupos seleccionados.
                  </p>
                </div>
              )}

              {/* Photo Upload */}
              <div className="space-y-3">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">Referencia Visual</label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                      <img src={imageUrl} alt="Vista previa de tarea" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setImageUrl(undefined)}
                        className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Eliminar imagen"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all text-slate-500" aria-label="Subir imagen">
                      {uploading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                          <Clock size={20} aria-hidden="true" />
                        </motion.div>
                      ) : (
                        <Camera size={20} aria-hidden="true" />
                      )}
                      <span className="text-[0.5rem] font-black uppercase tracking-tighter" aria-hidden="true">{uploading ? 'Cargando' : 'Añadir'}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                    </label>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-white font-bold">{imageUrl ? 'Imagen adjunta con éxito' : 'Adjuntar referencia'}</p>
                    <p className="text-[0.65rem] text-slate-500 mt-0.5 leading-tight">Sube una captura o foto de la evidencia si es necesario.</p>
                  </div>
                </div>
              </div>
            </form>

            <HoneypotField value={hpValue} onChange={e => setHpValue(e.target.value)} />

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl flex gap-3 shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || uploading || submitting}
                className="flex-[2] px-6 py-3.5 rounded-2xl bg-[#d4bc8f] text-slate-900 font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading || submitting ? <Clock className="animate-spin" size={16} /> : <Save size={16} />}
                {uploading || submitting ? (uploading ? 'Subiendo...' : 'Procesando...') : 'Guardar Actividad'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
