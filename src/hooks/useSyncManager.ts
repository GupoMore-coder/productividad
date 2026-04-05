import { useEffect, useState } from 'react';
import { SyncService } from '../services/SyncService';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';

/**
 * v12: Vanguard Sync Manager (Stabilized)
 * Automatically monitors connectivity and processes the offline queue.
 * Optimized for database-ready payloads and resilient error handling.
 */
export function useSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const processQueue = async () => {
    if (!navigator.onLine || isSyncing) return;

    const queue = await SyncService.getQueue();
    if (queue.length === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    setPendingCount(queue.length);
    console.log(`🔄 [Vanguard] Sincronizando ${queue.length} acciones pendientes...`);

    for (const action of queue) {
      try {
        // v12: Use sanitized payload directly (already Snake Case from the context)
        const { error } = await supabase
          .from(action.endpoint)
          .insert(action.payload);

        if (!error) {
          await SyncService.dequeue(action.id);
          console.log(`✅ [Vanguard] Acción ${action.id} sincronizada con éxito.`);
        } else {
          // If the error is a duplicate or a schema constraint, we might want to dequeue it
          // after some retries to avoid blocking the whole queue forever.
          if (action.retries >= 5) {
             console.error(`❌ [Vanguard] Acción ${action.id} falló permanentemente después de ${action.retries} intentos. Eliminando de la cola para evitar bloqueo.`, error);
             await SyncService.dequeue(action.id);
          } else {
             throw error;
          }
        }
      } catch (err) {
        console.warn(`⚠️ [Vanguard] Error sincronizando ${action.id}:`, err);
        await SyncService.updateAction(action.id, { retries: (action.retries || 0) + 1 });
      }
    }

    setIsSyncing(false);
    const finalQueue = await SyncService.getQueue();
    setPendingCount(finalQueue.length);
    if (finalQueue.length === 0) {
       triggerHaptic('success');
       // Invalidate all relevant queries to reflect the new data
       // Note: We can't easily access the queryClient here without a hook or context,
       // but the individual contexts refresh periodically or via real-time.
    }
  };

  useEffect(() => {
    processQueue();
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, []);

  useEffect(() => {
    const t = setInterval(processQueue, 30000); // More frequent check for v12
    return () => clearInterval(t);
  }, []);

  return { isSyncing, pendingCount, processQueue };
}
