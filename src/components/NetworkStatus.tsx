import { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Hide the success message after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[11000] flex justify-center p-4 pointer-events-none"
        >
          <div className={`
            flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-xl pointer-events-auto
            ${isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-red-500/10 border-red-500/20 text-red-500'}
          `}>
             {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest leading-none">
                  {isOnline ? 'Conexión Restablecida' : 'Sin Conexión'}
                </span>
                <span className="text-[0.6rem] font-medium opacity-80 mt-1">
                  {isOnline ? 'Tus datos se están sincronizando' : 'Modo fuera de línea activo'}
                </span>
             </div>
             {!isOnline && (
               <div className="ml-2 animate-pulse bg-red-500/20 p-1.5 rounded-full">
                  <AlertTriangle size={12} />
               </div>
             )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
