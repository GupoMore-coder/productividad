import { useMutation, useQueryClient, MutationFunction } from '@tanstack/react-query';
import { SyncService } from '../services/SyncService';
import { triggerHaptic } from '../utils/haptics';

interface OfflineMutationOptions<TVariables> {
  mutationKey: string[];
  type: string;
  table: string;
  onSuccess?: (data: any) => void;
  onError?: (err: any) => void;
  /**
   * Transforms the raw mutation variables into a format suitable for the offline queue (e.g. Snake Case for DB)
   */
  transform?: (variables: TVariables) => any;
}

/**
 * v12: Vanguard Offline Mutation Wrapper (Stabilized)
 * Automatically enqueues actions if the network fails or the device is offline.
 * Now supports pre-enqueue transformation to ensure database compatibility.
 */
export function useOfflineMutation<TData = any, TVariables = any>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: OfflineMutationOptions<TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      // 1. Try online first
      if (navigator.onLine) {
        try {
          return await (mutationFn as any)(variables);
        } catch (err: any) {
          // Only fallback to offline queue for actual network errors
          // Re-throw database/logic errors so the UI can display them
          const isNetworkError = !navigator.onLine || 
            err?.message?.includes('Failed to fetch') || 
            err?.message?.includes('NetworkError') ||
            err?.message?.includes('ERR_INTERNET_DISCONNECTED');
          
          if (!isNetworkError) {
            throw err; // Let the UI handle real errors (missing columns, permissions, etc.)
          }
          console.warn('⚠️ [Vanguard] Network error, switching to offline queue.', err);
        }
      }

      // 2. Fallback to Offline Sync Queue (Universal)
      // v12: Transform payload if a transformer is provided (e.g. for Snake Case compatibility)
      const payload = options.transform ? options.transform(variables) : variables;

      const syncId = await SyncService.enqueue(
        options.type,
        payload,
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
