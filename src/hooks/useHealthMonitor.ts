import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface HealthStats {
  dbLatency: number;
  isOnline: boolean;
  lastCheck: string;
  status: 'optimal' | 'degraded' | 'critical';
}

export const useHealthMonitor = (intervalMs = 30000) => {
  const [stats, setStats] = useState<HealthStats>({
    dbLatency: 0,
    isOnline: navigator.onLine,
    lastCheck: new Date().toLocaleTimeString(),
    status: 'optimal'
  });

  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now();
      let dbLatency = 0;
      let isOnline = navigator.onLine;
      
      try {
        // Ping Supabase (minimal check)
        const { error } = await supabase.from('profiles').select('id').limit(1).single();
        const end = performance.now();
        dbLatency = Math.round(end - start);
        
        if (error) throw error;
      } catch (err) {
        console.warn('Health check DB error:', err);
        dbLatency = -1; // Error state
      }

      let status: 'optimal' | 'degraded' | 'critical' = 'optimal';
      if (!isOnline || dbLatency === -1) status = 'critical';
      else if (dbLatency > 500) status = 'degraded';

      setStats({
        dbLatency,
        isOnline,
        lastCheck: new Date().toLocaleTimeString(),
        status
      });
    };

    const handleOnline = () => setStats(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStats(prev => ({ ...prev, isOnline: false, status: 'critical' }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(checkHealth, intervalMs);
    checkHealth(); // Initial check

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return stats;
};
