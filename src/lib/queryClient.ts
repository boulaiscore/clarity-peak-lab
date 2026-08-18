/**
 * ============================================
 * QUERY CLIENT SINGLETON
 * ============================================
 * 
 * Centralized QueryClient instance to avoid circular
 * dependency issues when importing from contexts.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // App routes remount often on mobile. Keep recently resolved server state
      // warm so returning Home or opening a breakdown does not repeat the same
      // Supabase requests before an explicit mutation invalidates them.
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
