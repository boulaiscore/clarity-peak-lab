/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY EFFECTIVE HOOK v2.0
 * ============================================
 * 
 * Provides REC_effective for gating and difficulty decisions.
 * 
 * v2.0 CHANGES:
 * - Uses Recovery v2 daily recalibration (rec_value, rec_last_ts)
 * - Falls back to today's Health/wearable target, or neutral 50
 * - Applies decay automatically on each read
 * 
 * REC_effective is used ONLY for:
 * - Games gating (System 1 vs System 2 access)
 * - Difficulty suggestion
 * - UX feedback (locks, hints, warnings)
 * 
 * The canonical formula hooks independently resolve the same raw value and
 * daily target; this hook is the gating/detail adapter only.
 * REC_effective MUST NOT be used for:
 * - Cognitive Age
 * - Skill values (AE, RA, CT, IN)
 * - Any decay logic
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  calculateDailyRecoveryTarget,
  getCurrentRecovery,
  hasValidRecoveryData,
  RecoveryState,
} from "@/lib/recoveryV2";
import { calculatePhysioEstimate } from "@/lib/cognitiveEngine";
import { getMediumPeriodStart } from "@/lib/temporalWindows";
import { format } from "date-fns";

export interface UseRecoveryEffectiveResult {
  /** The effective recovery value for gating (0-100) */
  recoveryEffective: number;
  
  /** Retained for compatibility; daily metrics no longer use onboarding RRI. */
  isUsingRRI: boolean;
  
  /** True if Recovery v2.0 is initialized (has_recovery_baseline) */
  isV2Initialized: boolean;
  
  /** The raw recovery value from v2 decay model (may be null) */
  recoveryV2: number | null;
  
  /** Retained for compatibility; always null in the canonical daily path. */
  rriValue: number | null;

  /** Today's combined Health + wearable recovery target, or neutral 50. */
  recoveryTarget: number;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Whether user has any recovery data */
  hasRecoveryData: boolean;
  
  /** Weekly minutes for UI breakdown */
  weeklyDetoxMinutes: number;
  weeklyWalkMinutes: number;
}

export function useRecoveryEffective(): UseRecoveryEffectiveResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const hasUser = !!userId;
  
  // Fetch Recovery v2 state from user_cognitive_metrics
  const { data: v2State, isLoading: v2Loading } = useQuery({
    queryKey: ["recovery-v2-state", userId],
    queryFn: async (): Promise<RecoveryState | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("rec_value, rec_last_ts, has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("[useRecoveryEffective] Error fetching v2 state:", error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        recValue: data.rec_value as number | null,
        recLastTs: data.rec_last_ts as string | null,
        hasRecoveryBaseline: data.has_recovery_baseline ?? false,
      };
    },
    enabled: hasUser,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const { data: phoneHealthTarget, isLoading: phoneTargetLoading } = useQuery({
    queryKey: ["phone-health-target", userId, today],
    queryFn: async (): Promise<{ targetRec: number | null; sleepMin: number | null } | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("phone_health_snapshots")
        .select("target_rec, sleep_min")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data ? {
        targetRec: data.target_rec ?? null,
        sleepMin: data.sleep_min ?? null,
      } : null;
    },
    enabled: hasUser,
    staleTime: 5 * 60_000,
  });

  const { data: wearableSnapshot, isLoading: wearableLoading } = useQuery({
    queryKey: ["wearable-snapshot", userId, today],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("wearable_snapshots")
        .select("hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, updated_at")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: hasUser,
    staleTime: 5 * 60_000,
  });

  const wearablePhysioEstimate = useMemo(() => wearableSnapshot ? calculatePhysioEstimate({
      hrvMs: wearableSnapshot.hrv_ms,
      restingHr: wearableSnapshot.resting_hr,
      sleepDurationMin: wearableSnapshot.sleep_duration_min,
      sleepEfficiency: wearableSnapshot.sleep_efficiency,
    }, {
      includeSleepDuration: phoneHealthTarget?.sleepMin == null,
    }) : null, [phoneHealthTarget?.sleepMin, wearableSnapshot]);
  const combinedRecoveryTarget = useMemo(() => calculateDailyRecoveryTarget(
    phoneHealthTarget?.targetRec,
    wearablePhysioEstimate,
  ), [phoneHealthTarget, wearablePhysioEstimate]);
  const hasPassiveRecoveryTarget = phoneHealthTarget?.targetRec != null || wearablePhysioEstimate !== null;
  
  // Fetch weekly breakdown for UI display (v2.0: still useful for breakdown)
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-recovery-breakdown", userId],
    queryFn: async () => {
      if (!userId) return { detoxMinutes: 0, walkMinutes: 0 };
      
      const rollingStartDate = getMediumPeriodStart();
      
      // Parallel queries for detox and walking
      const [detoxResult, walkResult] = await Promise.all([
        supabase
          .from("detox_completions")
          .select("duration_minutes")
          .eq("user_id", userId)
          .gte("completed_at", rollingStartDate.toISOString()),
        supabase
          .from("walking_sessions")
          .select("duration_minutes")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", rollingStartDate.toISOString()),
      ]);
      
      const detoxMinutes = (detoxResult.data || []).reduce(
        (sum, c) => sum + (c.duration_minutes || 0),
        0
      );
      const walkMinutes = (walkResult.data || []).reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );
      
      return { detoxMinutes, walkMinutes };
    },
    enabled: hasUser,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  // IMPORTANT: when userId is not resolved yet, React Query marks queries as not loading
  // (because they're disabled). We still want the UI to stay in a loading state instead
  // of falling back to 0%.
  const isLoading = !hasUser || v2Loading || phoneTargetLoading || wearableLoading || weeklyLoading;
  const weeklyDetoxMinutes = weeklyData?.detoxMinutes ?? 0;
  const weeklyWalkMinutes = weeklyData?.walkMinutes ?? 0;
  
  // Compute effective recovery
  const result = useMemo((): Omit<UseRecoveryEffectiveResult, 'isLoading' | 'weeklyDetoxMinutes' | 'weeklyWalkMinutes'> => {
    // Check v2 state
    const isV2Initialized = v2State ? hasValidRecoveryData(v2State) : false;
    const recoveryV2 = v2State ? getCurrentRecovery(v2State, combinedRecoveryTarget) : null;
    
    console.log("[useRecoveryEffective v2] Computing:", {
      isV2Initialized,
      recoveryV2,
    });
    
    // PRIORITY 1: Use v2 recovery if initialized
    if (isV2Initialized && recoveryV2 !== null) {
      console.log("[useRecoveryEffective v2] Using REC v2:", recoveryV2);
      return {
        recoveryEffective: recoveryV2,
        isUsingRRI: false,
        isV2Initialized: true,
        recoveryV2,
        rriValue: null,
        hasRecoveryData: true,
        recoveryTarget: combinedRecoveryTarget,
      };
    }
    
    // PRIORITY 2: use observed Health/wearable context. This keeps gating and
    // Recovery detail on the same daily input as Home.
    if (hasPassiveRecoveryTarget) {
      return {
        recoveryEffective: combinedRecoveryTarget,
        isUsingRRI: false,
        isV2Initialized: false,
        recoveryV2: null,
        rriValue: null,
        hasRecoveryData: true,
        recoveryTarget: combinedRecoveryTarget,
      };
    }

    // PRIORITY 3: missing evidence is neutral, never zero capacity.
    console.log("[useRecoveryEffective v2] No recovery data; using neutral target");
    return {
      recoveryEffective: combinedRecoveryTarget,
      isUsingRRI: false,
      isV2Initialized: false,
      recoveryV2: null,
      rriValue: null,
      hasRecoveryData: false,
      recoveryTarget: combinedRecoveryTarget,
    };
  }, [v2State, combinedRecoveryTarget, hasPassiveRecoveryTarget]);
  
  return {
    ...result,
    recoveryTarget: combinedRecoveryTarget,
    isLoading,
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
  };
}
