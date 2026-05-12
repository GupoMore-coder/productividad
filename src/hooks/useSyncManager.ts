import { useEffect, useState, useCallback, useRef } from 'react';
import { SyncService } from '../services/SyncService';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';

export function useSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isSyncingRef = useRef(isSyncing);

  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  const processQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current) return;

    const queue = await SyncService.getQueue();
    if (queue.length === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    setPendingCount(queue.length);
    console.log(`[Sync] Sincronizando ${queue.length} acciones pendientes...`);

    for (const action of queue) {
      try {
        let error: any = null;

        const targetId = action.payload?.id || action.payload?.partialUpdates?.id || (typeof action.payload === 'string' ? action.payload : null);
        
        if (targetId?.startsWith('SYNC-') && (action.type.includes('update') || action.type.includes('edit') || action.type.includes('patch'))) {
           const createAction = queue.find(a => a.id === targetId && (a.type.includes('create') || a.type.includes('insert')));
           if (createAction) {
              const updates = action.payload.partialUpdates || action.payload.updates || action.payload;
              const { ...cleanUpdates } = updates as { id?: string };
              createAction.payload = { ...createAction.payload, ...cleanUpdates };
              await SyncService.updateAction(createAction.id, { payload: createAction.payload });
              await SyncService.dequeue(action.id);
              console.log(`[Sync] Accion ${action.id} fusionada con creacion ${createAction.id}`);
              continue;
           }
        }

        const sanitize = (data: any) => {
          if (!data || typeof data !== 'object') return data;
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
            if (id?.startsWith('SYNC-')) throw new Error(`UUID invalido: ${id}`);
            error = { message: 'ID faltante' };
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _id, ...updateData } = sanitize(data);
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
          console.log(`[Sync] Accion ${action.id} sincronizada`);
        } else {
          console.error(`[Sync] Error en ${action.id}:`, error.message || error);
          
          if (action.retries >= 5 || error.code === '23505' || error.code === '42703' || error.message?.includes('column')) { 
             console.error(`[Sync] Abortando accion permanentemente`);
             await SyncService.dequeue(action.id);
          } else {
             throw error;
          }
        }
      } catch (err: any) {
        console.warn(`[Sync] Reintentando ${action.id}: ${err.message || 'Error desconocido'}`);
        await SyncService.updateAction(action.id, { retries: (action.retries || 0) + 1 });
      }
    }

    setIsSyncing(false);
    const finalQueue = await SyncService.getQueue();
    setPendingCount(finalQueue.length);
    if (finalQueue.length === 0) {
       triggerHaptic('success');
    }
  }, []);

  useEffect(() => {
    processQueue();
    window.addEventListener('online', processQueue);
    window.addEventListener('focus', processQueue);
    return () => {
      window.removeEventListener('online', processQueue);
      window.removeEventListener('focus', processQueue);
    };
  }, [processQueue]);

  useEffect(() => {
    const t = setInterval(processQueue, 15000);
    return () => clearInterval(t);
  }, [processQueue]);

  return { isSyncing, pendingCount, processQueue };
}