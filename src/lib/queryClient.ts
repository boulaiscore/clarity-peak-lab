/**
 * ============================================
 * QUERY CLIENT SINGLETON
 * ============================================
 * 
 * Centralized QueryClient instance to avoid circular
 * dependency issues when importing from contexts.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();
