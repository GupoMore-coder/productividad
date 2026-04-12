import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function PWAInstallBanner() {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIphone = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIphone);

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // Show banner after a short delay if not installed
    const timer = setTimeout(() => {
      if (!isStandalone) {
        // For Android, wait until isInstallable is true
        // For iOS, show it anyway as it's the only way to "install"
        if (isIphone || isInstallable) {
          setIsVisible(true);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[9999] md:left-auto md:right-8 md:bottom-8 md:w-80"
      >
        <div className="bg-slate-900 border border-[#d4bc8f]/30 rounded-3xl p-5 shadow-2xl shadow-amber-500/10 backdrop-blur-xl relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#d4bc8f]/10 rounded-full blur-2xl group-hover:bg-[#d4bc8f]/20 transition-all" />
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4bc8f] to-[#b39063] flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
               <Download size={24} />
            </div>
            <div className="flex-1 pr-4">
              <h4 className="text-sm font-black text-white leading-tight uppercase tracking-tight">Instalar More Paper & Design</h4>
              <p className="text-[0.7rem] text-slate-400 mt-1 leading-relaxed">
                Accede más rápido y disfruta de la experiencia nativa a pantalla completa.
              </p>
            </div>
          </div>

          <div className="mt-5">
            {isIOS ? (
              <div className="space-y-3 bg-white/[0.03] rounded-2xl p-3 border border-white/5">
                <p className="text-[0.65rem] font-bold text-[#d4bc8f] uppercase tracking-widest flex items-center gap-2">
                   <Smartphone size={12} /> Para instalar en iPhone:
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400">
                    <Share size={12} />
                  </div>
                  <span>1. Pulsa el botón <strong>Compartir</strong></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <PlusSquare size={12} />
                  </div>
                  <span>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
                </div>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  const success = await installApp();
                  if (success) setIsVisible(false);
                }}
                className="w-full py-3 bg-[#d4bc8f] text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-amber-500/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Instalar Ahora
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
