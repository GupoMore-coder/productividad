import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission 
} from '../services/NotificationsService';
import { triggerHaptic } from '../utils/haptics';

export default function PermissionBanner() {
  const [status, setStatus] = useState(getNotificationPermissionStatus());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after a short delay if permission is not granted
    const timer = setTimeout(() => {
      if (status !== 'granted') {
        setIsVisible(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleRequest = async () => {
    triggerHaptic('light');
    const granted = await requestNotificationPermission();
    setStatus(granted ? 'granted' : 'denied');
    if (granted) {
      setTimeout(() => setIsVisible(false), 1000);
    }
  };

  if (!isVisible || status === 'granted' || status === 'unsupported') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-20 left-4 right-4 z-[999] mx-auto max-w-md"
      >
        <div className="bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl rounded-3xl p-4 shadow-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <Bell className="text-amber-500 animate-pulse" size={24} />
          </div>
          
          <div className="flex-1">
            <h4 className="text-white text-xs font-black uppercase tracking-widest mb-1">Permisos de Alerta</h4>
            <p className="text-slate-400 text-[10px] leading-tight font-medium">
              Habilita las notificaciones para recibir avisos sonoros y visuales de tus tareas.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleRequest}
              className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-tighter px-4 py-2 rounded-xl active:scale-95 transition-all whitespace-nowrap"
            >
              Habilitar
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <X size={14} className="mx-auto" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
