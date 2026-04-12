import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ClipboardList, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface UnifiedAlarmPayload {
  id: string;
  type: 'order' | 'task' | 'global' | 'critical';
  title: string;
  body: string;
  navigateUrl?: string;
  isMuted?: boolean;
}

export default function UnifiedAlarmModal() {
  const [queue, setQueue] = useState<UnifiedAlarmPayload[]>([]);
  const navigate = useNavigate();

  // Shared AudioContext to handle browser restrictions better
  const [audioCtx] = useState(() => {
    try {
      return new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  });

  const playAlarmSound = () => {
    if (!audioCtx) return;
    
    try {
      // If context was suspended (browser policy), try to resume
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      
      setTimeout(() => {
        if (audioCtx.state === 'closed') return;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime); 
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 150);
    } catch (err) {
      console.warn("[UnifiedAlarm] Audio failed:", err);
    }
  };

  useEffect(() => {
    const handleAlarm = (e: any) => {
      const payload = e.detail as UnifiedAlarmPayload;
      
      setQueue((prev) => {
        if (prev.some(p => p.id === payload.id)) return prev;
        return [...prev, payload];
      });
      
      // ONLY vibrate and play sound if NOT muted
      if (!payload.isMuted) {
        triggerHaptic('critical');
        playAlarmSound();
      }
    };

    // Global listener to unlock audio context on first user click
    const unlockAudio = () => {
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume();
      }
      window.removeEventListener('click', unlockAudio);
    };

    window.addEventListener('app:show-unified-alarm', handleAlarm);
    window.addEventListener('click', unlockAudio);

    return () => {
      window.removeEventListener('app:show-unified-alarm', handleAlarm);
      window.removeEventListener('click', unlockAudio);
    };
  }, [audioCtx]);

  const dismissCurrent = () => {
    triggerHaptic('light');
    setQueue((prev) => prev.slice(1));
  };

  const handleAction = () => {
    const current = queue[0];
    if (current?.navigateUrl) {
      navigate(current.navigateUrl);
    }
    dismissCurrent();
  };

  const currentAlert = queue[0];

  return (
    <AnimatePresence>
      {currentAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 30 }} 
            className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border ${
                currentAlert.type === 'order' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                currentAlert.type === 'task' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                currentAlert.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                'bg-blue-500/10 border-blue-500/30 text-blue-500'
              }`}>
                {currentAlert.type === 'order' && <ClipboardList size={40} />}
                {currentAlert.type === 'task' && <CheckCircle2 size={40} />}
                {currentAlert.type === 'critical' && <AlertTriangle size={40} />}
                {currentAlert.type === 'global' && <Bell size={40} className="animate-bounce" />}
              </div>
            </div>
            
            <h3 className={`text-xl font-black mb-4 tracking-tight uppercase ${
              currentAlert.type === 'order' ? 'text-amber-500' :
              currentAlert.type === 'task' ? 'text-purple-400' :
              currentAlert.type === 'critical' ? 'text-red-500' :
              'text-blue-500'
            }`}>
              {currentAlert.title}
            </h3>
            
            <p className="text-sm text-slate-300 leading-relaxed font-medium mb-8 whitespace-pre-wrap">
              {currentAlert.body}
            </p>

            <div className="space-y-3">
              <button 
                onClick={handleAction} 
                className={`w-full font-black py-4 rounded-2xl transition-all active:scale-95 text-[#000] uppercase tracking-[0.2em] text-xs shadow-lg ${
                  currentAlert.type === 'order' ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20' :
                  currentAlert.type === 'task' ? 'bg-purple-500 hover:bg-purple-400 shadow-purple-500/20' :
                  currentAlert.type === 'critical' ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20' :
                  'bg-blue-500 hover:bg-blue-400 shadow-blue-500/20'
                }`}
              >
                Entendido
              </button>
              
              {queue.length > 1 && (
                <p className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-black pt-2">
                  {queue.length - 1} alerta{queue.length - 1 > 1 ? 's' : ''} más en cola
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
