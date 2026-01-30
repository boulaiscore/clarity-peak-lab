/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY v2.0 HOOK
 * ============================================
 * 
 * Central hook for the new continuous decay recovery model.
 * 
 * Features:
 * - Loads persistent rec_value/rec_last_ts from user_cognitive_metrics
 * - Applies decay on foreground (via useMemo)
 * - Provides mutation for applying recovery actions (detox/walk)
 * - Handles RRI baseline initialization for new users
 */

import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordIntradayEvent } from "@/hooks/useRecordIntradayEvent";
import {
  RecoveryState,
  getCurrentRecovery,
  hasValidRecoveryData,
  applyRecoveryAction,
  initializeRecoveryBaseline,
  calculateRRI,
} from "@/lib/recoveryV2";

export interface UseRecoveryV2Result {
  /** Current recovery value with decay applied (0-100), null if not initialized */
  recovery: number | null;
  
  /** True if recovery is initialized (has baseline) */
  isInitialized: boolean;
  
  /** True if still loading data */
  isLoading: boolean;
  
  /** Raw state from database */
  rawState: RecoveryState | null;
  
  /** Apply a recovery action (detox/walk minutes) */
  applyAction: (detoxMinutes: number, walkMinutes: number) => Promise<void>;
  
  /** Initialize baseline from RRI (only call once per user) */
  initializeBaseline: () => Promise<void>;
}

export function useRecoveryV2(): UseRecoveryV2Result {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const queryClient = useQueryClient();
  const { recordEvent } = useRecordIntradayEvent();
  
  // Fetch recovery state from user_cognitive_metrics
  const { data: recoveryState, isLoading: stateLoading } = useQuery({
    queryKey: ["recovery-v2-state", userId],
    queryFn: async (): Promise<RecoveryState | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("rec_value, rec_last_ts, has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("[useRecoveryV2] Error fetching state:", error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        recValue: data.rec_value as number | null,
        recLastTs: data.rec_last_ts as string | null,
        hasRecoveryBaseline: data.has_recovery_baseline ?? false,
      };
    },
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: true, // Refetch on foreground to apply decay
    refetchOnMount: true,
  });
  
  // Fetch RRI data for baseline initialization
  const { data: rriData } = useQuery({
    queryKey: ["rri-data-v2", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("rri_value, rri_sleep_hours, rri_detox_hours, rri_mental_state")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Compute current recovery with decay applied
  const currentRecovery = useMemo(() => {
    if (!recoveryState) return null;
    return getCurrentRecovery(recoveryState);
  }, [recoveryState]);
  
  const isInitialized = recoveryState ? hasValidRecoveryData(recoveryState) : false;
  
  // Mutation: Apply recovery action (detox/walk)
  const applyActionMutation = useMutation({
    mutationFn: async ({ detoxMinutes, walkMinutes }: { detoxMinutes: number; walkMinutes: number }) => {
      if (!userId || !recoveryState) throw new Error("Not initialized");
      
      // Use current decayed value as base
      const baseRec = currentRecovery ?? recoveryState.recValue ?? 0;
      const baseTs = recoveryState.recLastTs ?? new Date().toISOString();
      
      const result = applyRecoveryAction(baseRec, baseTs, detoxMinutes, walkMinutes);
      
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          rec_value: result.newRecValue,
          rec_last_ts: result.newRecLastTs,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (error) throw error;
      
      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recovery-v2-state", userId] });
      queryClient.invalidateQueries({ queryKey: ["today-metrics", userId] });
      
      // v1.8: Record intraday event for recovery action
      // Determine event type based on which action was taken
      const eventType = variables.walkMinutes > 0 ? 'walking' : 'detox';
      
      // We need to record with the NEW recovery value after the action
      // Other metrics will be fetched fresh by the charts
      recordEvent({
        eventType,
        readiness: null, // Will be recalculated by queries
        sharpness: null, // Will be recalculated by queries
        recovery: result.newRecValue,
        reasoningQuality: null, // Doesn't change with recovery actions
        eventDetails: {
          detoxMinutes: variables.detoxMinutes,
          walkMinutes: variables.walkMinutes,
          previousRecovery: currentRecovery,
        },
      });
    },
  });
  
  // Mutation: Initialize baseline from RRI
  const initializeBaselineMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user");
      
      // Check if already initialized
      const { data: existing } = await supabase
        .from("user_cognitive_metrics")
        .select("has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (existing?.has_recovery_baseline) {
        console.log("[useRecoveryV2] Baseline already initialized, skipping");
        return;
      }
      
      // Calculate RRI from onboarding data
      let rriValue: number | null = null;
      if (rriData) {
        if (rriData.rri_value) {
          rriValue = rriData.rri_value;
        } else if (rriData.rri_sleep_hours || rriData.rri_detox_hours || rriData.rri_mental_state) {
          rriValue = calculateRRI(
            rriData.rri_sleep_hours,
            rriData.rri_detox_hours,
            rriData.rri_mental_state
          );
        }
      }
      
      const result = initializeRecoveryBaseline(rriValue);
      
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          rec_value: result.newRecValue,
          rec_last_ts: result.newRecLastTs,
          has_recovery_baseline: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (error) throw error;
      
      console.log("[useRecoveryV2] Initialized baseline with RRI:", result.newRecValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-v2-state", userId] });
      queryClient.invalidateQueries({ queryKey: ["today-metrics", userId] });
    },
  });
  
  const applyAction = useCallback(
    async (detoxMinutes: number, walkMinutes: number) => {
      await applyActionMutation.mutateAsync({ detoxMinutes, walkMinutes });
    },
    [applyActionMutation]
  );
  
  const initializeBaseline = useCallback(async () => {
    await initializeBaselineMutation.mutateAsync();
  }, [initializeBaselineMutation]);
  
  return {
    recovery: currentRecovery,
    isInitialized,
    isLoading: stateLoading,
    rawState: recoveryState ?? null,
    applyAction,
    initializeBaseline,
  };
}
