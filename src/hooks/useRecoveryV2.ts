/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY v2.0 HOOK
 * ============================================
 * 
 * Central hook for the daily snapshot Recovery model.
 * 
 * Features:
 * - Loads persistent rec_value/rec_last_ts from user_cognitive_metrics
 * - Applies decay on foreground (via useMemo)
 * - Provides mutation for applying recovery actions (detox/walk)
 * - Handles RRI baseline initialization for new users
 * 
 * v2.1: Updated to use useRecordIntradayOnAction for complete metric snapshots
 */

import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useRecordIntradayOnAction } from "@/hooks/useRecordIntradayOnAction";
import { trackProductEvent } from "@/lib/productAnalytics";
import {
  RecoveryState,
  applyRecoveryDecay,
  hasValidRecoveryData,
  applyRecoveryAction,
  initializeRecoveryBaseline,
  calculateRRI,
  calculateDailyRecoveryTarget,
} from "@/lib/recoveryV2";
import { calculatePhysioEstimate } from "@/lib/cognitiveEngine";

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
  const { recordMetricsSnapshot } = useRecordIntradayOnAction();
  
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
  
  // Fetch today's phone health snapshot for dynamic REC target
  const { data: phoneHealthTarget, isLoading: phoneHealthLoading } = useQuery({
    queryKey: ["phone-health-target", userId, format(new Date(), "yyyy-MM-dd")],
    queryFn: async (): Promise<{ targetRec: number | null; sleepMin: number | null } | null> => {
      if (!userId) return null;
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("phone_health_snapshots")
        .select("target_rec, sleep_min")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      return data ? {
        targetRec: data.target_rec ?? null,
        sleepMin: data.sleep_min ?? null,
      } : null;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const { data: wearableSnapshot, isLoading: wearableLoading } = useQuery({
    queryKey: ["wearable-snapshot", userId, format(new Date(), "yyyy-MM-dd")],
    queryFn: async () => {
      if (!userId) return null;
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("wearable_daily_canonical")
        .select("hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, updated_at")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const recoveryTarget = useMemo(() => {
    const physio = wearableSnapshot ? calculatePhysioEstimate({
      hrvMs: wearableSnapshot.hrv_ms,
      restingHr: wearableSnapshot.resting_hr,
      sleepDurationMin: wearableSnapshot.sleep_duration_min,
      sleepEfficiency: wearableSnapshot.sleep_efficiency,
    }, {
      includeSleepDuration: phoneHealthTarget?.sleepMin == null,
    }) : null;
    return calculateDailyRecoveryTarget(phoneHealthTarget?.targetRec, physio);
  }, [phoneHealthTarget, wearableSnapshot]);

  // Compute current recovery with decay applied (using phone-health target if available)
  const currentRecovery = useMemo(() => {
    if (!recoveryState) return null;
    if (recoveryState.recValue == null || recoveryState.recLastTs == null) return null;
    if (!recoveryState.hasRecoveryBaseline) return null;
    return applyRecoveryDecay(
      recoveryState.recValue,
      recoveryState.recLastTs,
      new Date().toISOString(),
      recoveryTarget,
    );
  }, [recoveryState, recoveryTarget]);
  
  const isInitialized = recoveryState ? hasValidRecoveryData(recoveryState) : false;
  
  // Mutation: Apply recovery action (detox/walk)
  const applyActionMutation = useMutation({
    mutationFn: async ({ detoxMinutes, walkMinutes }: { detoxMinutes: number; walkMinutes: number }) => {
      if (!userId) throw new Error("Not authenticated");

      // Read inside the mutation so multi-device actions and a just-created
      // baseline cannot be overwritten by a stale hook closure.
      const { data: latestState, error: stateError } = await supabase
        .from("user_cognitive_metrics")
        .select("rec_value, rec_last_ts, has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();
      if (stateError) throw stateError;
      if (!latestState) throw new Error("Cognitive metrics are not initialized");

      let baseRec = latestState.rec_value;
      let baseTs = latestState.rec_last_ts;
      let hasBaseline = latestState.has_recovery_baseline ?? false;

      if (!hasBaseline || baseRec == null || baseTs == null) {
        const rriValue = rriData?.rri_value ?? null;
        const baseline = initializeRecoveryBaseline(rriValue);
        baseRec = baseline.newRecValue;
        baseTs = baseline.newRecLastTs;
        hasBaseline = true;
      }
      
      const result = applyRecoveryAction(
        baseRec,
        baseTs,
        detoxMinutes,
        walkMinutes,
        recoveryTarget,
      );
      
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          rec_value: result.newRecValue,
          rec_last_ts: result.newRecLastTs,
          has_recovery_baseline: hasBaseline,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (error) throw error;
      
      return result;
    },
    onSuccess: async (result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recovery-v2-state", userId] }),
        queryClient.invalidateQueries({ queryKey: ["today-metrics", userId] }),
      ]);
      
      const eventType = variables.walkMinutes > 0 ? 'walking' : 'detox';
      await recordMetricsSnapshot(
        eventType,
        {
          detoxMinutes: variables.detoxMinutes,
          walkMinutes: variables.walkMinutes,
          previousRecovery: currentRecovery,
          newRecovery: result.newRecValue,
        },
        150,
      );
      trackProductEvent("recovery_action_completed", {
        action: eventType,
        durationMinutes: variables.detoxMinutes + variables.walkMinutes,
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
    isLoading: stateLoading || phoneHealthLoading || wearableLoading,
    rawState: recoveryState ?? null,
    applyAction,
    initializeBaseline,
  };
}
