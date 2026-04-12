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
        let error: any = null;

        // v14: Chained Sync Logic
        // If an update targets a SYNC- ID, it means the record isn't in DB yet.
        // We find the 'create' action for that record and merge the updates locally.
        const targetId = action.payload?.id || action.payload?.partialUpdates?.id || (typeof action.payload === 'string' ? action.payload : null);
        
        if (targetId?.startsWith('SYNC-') && (action.type.includes('update') || action.type.includes('edit') || action.type.includes('patch'))) {
           const createAction = queue.find(a => a.id === targetId && (a.type.includes('create') || a.type.includes('insert')));
           if (createAction) {
              const updates = action.payload.partialUpdates || action.payload.updates || action.payload;
              const { id: _, ...cleanUpdates } = updates;
              createAction.payload = { ...createAction.payload, ...cleanUpdates };
              await SyncService.updateAction(createAction.id, { payload: createAction.payload });
              await SyncService.dequeue(action.id);
              console.log(`🔗 [Vanguard] Acción ${action.id} fusionada en cadena con creación ${createAction.id}.`);
              continue; // Move to next action
           }
        }

        // v14: Payload Sanitization
        const sanitize = (data: any) => {
          if (!data || typeof data !== 'object') return data;
          // List of fields to EXCLUDE (frontend-only or forbidden)
          const blackList = ['supplier_name', 'isOfflinePending', 'is_demo_local', 'requested_by_role'];
          const clean: any = {};
          for (const key in data) {
            if (!blackList.includes(key)) clean[key] = data[key];
          }
          return clean;
        };

        if (action.type.includes('create') || action.type.includes('insert')) {
          const cleanPayload = sanitize(action.payload);
          const result = await supabase.from(action.endpoint).insert(cleanPayload);
          error = result.error;
        } 
        else if (action.type.includes('update') || action.type.includes('patch') || action.type.includes('edit')) {
          const id = targetId;
          const data = action.payload.partialUpdates || action.payload.updates || action.payload;
          
          if (!id || id.startsWith('SYNC-')) {
            // If it's still SYNC- but we didn't find the create action (maybe already processed?)
            // We just skip it and let it retry or fail, but Supabase will 400 for sure if we send it.
            if (id?.startsWith('SYNC-')) throw new Error(`UUID inválido (Temporal): ${id}. Esperando creación.`);
            error = { message: 'ID de registro faltante' };
          } else {
            const { id: _, ...updateData } = sanitize(data);
            const { error: updError } = await supabase.from(action.endpoint).update(updateData).eq('id', id);
            error = updError;
          }
        }
        else if (action.type.includes('delete') || action.type.includes('remove')) {
          const id = targetId;
          if (id && !id.startsWith('SYNC-')) {
            const { error: delError } = await supabase.from(action.endpoint).delete().eq('id', id);
            error = delError;
          } else {
            await SyncService.dequeue(action.id);
            continue;
          }
        }

        if (!error) {
          await SyncService.dequeue(action.id);
          console.log(`✅ [Vanguard] Acción ${action.id} (${action.type}) sincronizada.`);
        } else {
          // Improved error logging for better diagnostics
          console.error(`❌ [Vanguard] Error en ${action.id} (${action.type}) en tabla '${action.endpoint}':`, error.message || error);
          console.error(`📦 Payload fallido:`, action.payload);
          
          if (action.retries >= 5 || error.code === '23505' || error.code === '42703' || error.message?.includes('column')) { 
             console.error(`🛑 [Vanguard] Abortando acción permanentemente por error de esquema o duplicado.`, error);
             await SyncService.dequeue(action.id);
          } else {
             throw error;
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ [Vanguard] Re-intentando ${action.id}: ${err.message || 'Error desconocido'}`);
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
    window.addEventListener('focus', processQueue);
    return () => {
      window.removeEventListener('online', processQueue);
      window.removeEventListener('focus', processQueue);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(processQueue, 15000); // v13: Double frequency for faster recovery
    return () => clearInterval(t);
  }, []);

  return { isSyncing, pendingCount, processQueue };
}
