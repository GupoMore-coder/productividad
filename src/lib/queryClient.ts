import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes in background
    },
    mutations: {
      retry: 1,
    }
  }
});
