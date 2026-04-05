import { useEffect, useState } from 'react';
import { SyncService } from '../services/SyncService';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';

/**
 * v11: Vanguard Sync Manager
 * Automatically monitors connectivity and processes the offline queue.
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
        // Deterministic processing based on endpoint (table)
        const { error } = await supabase
          .from(action.endpoint)
          .insert(action.payload); // Simple insert for now, can be updated for upsert/updates

        if (!error) {
          await SyncService.dequeue(action.id);
          console.log(`✅ [Vanguard] Acción ${action.id} sincronizada con éxito.`);
        } else {
          throw error;
        }
      } catch (err) {
        console.warn(`⚠️ [Vanguard] Error sincronizando ${action.id}:`, err);
        await SyncService.updateAction(action.id, { retries: (action.retries || 0) + 1 });
      }
    }

    setIsSyncing(false);
    const finalQueue = await SyncService.getQueue();
    setPendingCount(finalQueue.length);
    if (finalQueue.length === 0) triggerHaptic('success');
  };

  useEffect(() => {
    // Check queue on mount and when connectivity returns
    processQueue();
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, []);

  // Periodic check every 60s as a safety net
  useEffect(() => {
    const t = setInterval(processQueue, 60000);
    return () => clearInterval(t);
  }, []);

  return { isSyncing, pendingCount, processQueue };
}
