import React, { useState, useEffect } from 'react';
import { useGroups } from '../context/GroupContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, PlusCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const { createGroup } = useGroups();

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic('success');
    createGroup(name);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-[#1a1622] rounded-t-[32px] sm:rounded-3xl border-t border-white/10 sm:border shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,16px)]"
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-white/10 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <PlusCircle size={22} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg tracking-tight">Nuevo Equipo</h3>
                  <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-black">Colaboración en Tiempo Real</p>
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

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-black ml-1">
                  Nombre del Proyecto / Grupo
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Familia López, Equipo Backend..."
                    required
                    autoFocus
                    className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all placeholder:text-slate-700 font-medium"
                  />
                </div>
                <p className="text-[0.65rem] text-slate-600 italic ml-1">
                  Este nombre será visible para todos los integrantes invitados.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-[2] px-6 py-3.5 rounded-2xl bg-[#d4bc8f] text-slate-900 font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-amber-500/20 disabled:opacity-50"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
