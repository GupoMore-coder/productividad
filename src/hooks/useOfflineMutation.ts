import { useMutation, useQueryClient, MutationFunction } from '@tanstack/react-query';
import { SyncService } from '../services/SyncService';
import { triggerHaptic } from '../utils/haptics';

interface OfflineMutationOptions {
  mutationKey: string[];
  type: string;
  table: string;
  onSuccess?: (data: any) => void;
  onError?: (err: any) => void;
}

/**
 * v11: Vanguard Offline Mutation Wrapper
 * Automatically enqueues actions if the network fails or the device is offline.
 */
export function useOfflineMutation<TData = any, TVariables = any>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: OfflineMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      // 1. Try online first
      if (navigator.onLine) {
        try {
          return await (mutationFn as any)(variables);
        } catch (err) {
          console.warn('⚠️ [Vanguard] Error online, intentando modo offline persistente.', err);
        }
      }

      // 2. Fallback to Offline Sync Queue (Universal)
      const syncId = await SyncService.enqueue(
        options.type,
        variables,
        options.table
      );
      
      triggerHaptic('warning');
      
      // We return a "Mock" success response with the Sync ID
      return { 
        id: syncId, 
        isOfflinePending: true, 
        ...variables 
      } as any as TData;
    },
    onSuccess: (data) => {
      // Invalidate queries so the UI shows the "Draft/Pending" state if possible
      queryClient.invalidateQueries({ queryKey: options.mutationKey });
      if (options.onSuccess) options.onSuccess(data);
    },
    onError: options.onError
  });
}
