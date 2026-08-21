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
  calculateCurrentRecoveryBreakdown,
  calculateDailyRecoveryTargetBreakdown,
  hasValidRecoveryData,
} from "@/lib/recoveryV2";
import { calculatePhysioEstimate } from "@/lib/cognitiveEngine";
import { getMediumPeriodStart } from "@/lib/temporalWindows";
import { format } from "date-fns";
import { useUserMetrics } from "@/hooks/useExercises";
import {
  usePhoneHealthDailyContext,
  useWearableDailySnapshot,
} from "@/hooks/useDailyRecoveryInputs";

export interface UseRecoveryEffectiveResult {
  /** The effective recovery value for gating (0-100) */
  recoveryEffective: number;
  
  /** Retained for compatibility; daily metrics no longer use onboarding RRI. */
  isUsingRRI: boolean;
  
  /** True if Recovery v2.0 is initialized (has_recovery_baseline) */
  isV2Initialized: boolean;
  
  /** The raw recovery value from v2 decay model (may be null) */
  recoveryV2: number | null;

  /** Persisted Recovery state and exact unpersisted daily transition. */
  storedRecoveryValue: number | null;
  storedRecoveryUpdatedAt: string | null;
  recalibrationDays: number;
  recalibrationAdjustment: number;
  
  /** Retained for compatibility; always null in the canonical daily path. */
  rriValue: number | null;

  /** Today's combined Health + wearable recovery target, or neutral 50. */
  recoveryTarget: number;

  /** Exact passive inputs used by the canonical Recovery target. */
  phoneHealthTarget: number | null;
  phoneHealthConfidence: number;
  phoneHealthAvailableSources: string[];
  phoneHealthUpdatedAt: string | null;
  phoneHealthSource: string | null;
  wearableRawScore: number | null;
  wearableTarget: number | null;
  wearableConfidence: number;
  wearableWeight: number;
  wearableContribution: number;
  wearableUpdatedAt: string | null;
  wearableSource: string | null;
  
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
  
  const { data: rawMetrics, isLoading: v2Loading } = useUserMetrics(userId);
  const v2State = useMemo(() => rawMetrics ? {
    recValue: rawMetrics.rec_value,
    recLastTs: rawMetrics.rec_last_ts,
    hasRecoveryBaseline: rawMetrics.has_recovery_baseline ?? false,
  } : null, [rawMetrics]);

  const today = format(new Date(), "yyyy-MM-dd");
  const { data: phoneHealthTarget } = usePhoneHealthDailyContext(userId, today);
  const { data: wearableSnapshot } = useWearableDailySnapshot(userId, today);

  const wearablePhysioEstimate = useMemo(() => wearableSnapshot ? calculatePhysioEstimate({
      hrvMs: wearableSnapshot.hrv_ms,
      restingHr: wearableSnapshot.resting_hr,
      sleepDurationMin: wearableSnapshot.sleep_duration_min,
      sleepEfficiency: wearableSnapshot.sleep_efficiency,
    }, {
      includeSleepDuration: phoneHealthTarget?.sleep_min == null,
    }) : null, [phoneHealthTarget?.sleep_min, wearableSnapshot]);
  const recoveryTargetBreakdown = useMemo(() => calculateDailyRecoveryTargetBreakdown(
    phoneHealthTarget?.target_rec,
    wearablePhysioEstimate,
  ), [phoneHealthTarget, wearablePhysioEstimate]);
  const combinedRecoveryTarget = recoveryTargetBreakdown.combinedTarget;
  const hasPassiveRecoveryTarget = phoneHealthTarget?.target_rec != null || wearablePhysioEstimate !== null;
  
  // Fetch weekly breakdown for UI display (v2.0: still useful for breakdown)
  const { data: weeklyData } = useQuery({
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
  // Health, wearable and weekly action totals progressively enrich Recovery.
  // They must never hold the already-known canonical state behind a loader.
  const isLoading = !hasUser || v2Loading;
  const weeklyDetoxMinutes = weeklyData?.detoxMinutes ?? 0;
  const weeklyWalkMinutes = weeklyData?.walkMinutes ?? 0;
  
  // Compute effective recovery
  const result = useMemo((): Omit<UseRecoveryEffectiveResult, 'isLoading' | 'weeklyDetoxMinutes' | 'weeklyWalkMinutes'> => {
    // Check v2 state
    const isV2Initialized = v2State ? hasValidRecoveryData(v2State) : false;
    const currentRecovery = calculateCurrentRecoveryBreakdown(v2State, combinedRecoveryTarget);
    const recoveryV2 = isV2Initialized ? currentRecovery.currentValue : null;
    
    // PRIORITY 1: Use v2 recovery if initialized
    if (isV2Initialized && recoveryV2 !== null) {
      return {
        recoveryEffective: recoveryV2,
        isUsingRRI: false,
        isV2Initialized: true,
        recoveryV2,
        storedRecoveryValue: currentRecovery.storedValue,
        storedRecoveryUpdatedAt: currentRecovery.storedAt,
        recalibrationDays: currentRecovery.elapsedDays,
        recalibrationAdjustment: currentRecovery.recalibrationAdjustment,
        rriValue: null,
        hasRecoveryData: true,
        recoveryTarget: combinedRecoveryTarget,
        phoneHealthTarget: recoveryTargetBreakdown.phoneHealthTarget,
        phoneHealthConfidence: phoneHealthTarget?.confidence ?? 0,
        phoneHealthAvailableSources: phoneHealthTarget?.available_sources ?? [],
        phoneHealthUpdatedAt: phoneHealthTarget?.updated_at ?? null,
        phoneHealthSource: phoneHealthTarget?.source ?? null,
        wearableRawScore: recoveryTargetBreakdown.wearableRawScore,
        wearableTarget: recoveryTargetBreakdown.wearableTarget,
        wearableConfidence: recoveryTargetBreakdown.wearableConfidence,
        wearableWeight: recoveryTargetBreakdown.wearableWeight,
        wearableContribution: recoveryTargetBreakdown.wearableContribution,
        wearableUpdatedAt: wearableSnapshot?.updated_at ?? null,
        wearableSource: wearableSnapshot?.source ?? null,
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
        storedRecoveryValue: null,
        storedRecoveryUpdatedAt: null,
        recalibrationDays: 0,
        recalibrationAdjustment: 0,
        rriValue: null,
        hasRecoveryData: true,
        recoveryTarget: combinedRecoveryTarget,
        phoneHealthTarget: recoveryTargetBreakdown.phoneHealthTarget,
        phoneHealthConfidence: phoneHealthTarget?.confidence ?? 0,
        phoneHealthAvailableSources: phoneHealthTarget?.available_sources ?? [],
        phoneHealthUpdatedAt: phoneHealthTarget?.updated_at ?? null,
        phoneHealthSource: phoneHealthTarget?.source ?? null,
        wearableRawScore: recoveryTargetBreakdown.wearableRawScore,
        wearableTarget: recoveryTargetBreakdown.wearableTarget,
        wearableConfidence: recoveryTargetBreakdown.wearableConfidence,
        wearableWeight: recoveryTargetBreakdown.wearableWeight,
        wearableContribution: recoveryTargetBreakdown.wearableContribution,
        wearableUpdatedAt: wearableSnapshot?.updated_at ?? null,
        wearableSource: wearableSnapshot?.source ?? null,
      };
    }

    // PRIORITY 3: missing evidence is neutral, never zero capacity.
    return {
      recoveryEffective: combinedRecoveryTarget,
      isUsingRRI: false,
      isV2Initialized: false,
      recoveryV2: null,
      storedRecoveryValue: null,
      storedRecoveryUpdatedAt: null,
      recalibrationDays: 0,
      recalibrationAdjustment: 0,
      rriValue: null,
      hasRecoveryData: false,
      recoveryTarget: combinedRecoveryTarget,
      phoneHealthTarget: recoveryTargetBreakdown.phoneHealthTarget,
      phoneHealthConfidence: phoneHealthTarget?.confidence ?? 0,
      phoneHealthAvailableSources: phoneHealthTarget?.available_sources ?? [],
      phoneHealthUpdatedAt: phoneHealthTarget?.updated_at ?? null,
      phoneHealthSource: phoneHealthTarget?.source ?? null,
      wearableRawScore: recoveryTargetBreakdown.wearableRawScore,
      wearableTarget: recoveryTargetBreakdown.wearableTarget,
      wearableConfidence: recoveryTargetBreakdown.wearableConfidence,
      wearableWeight: recoveryTargetBreakdown.wearableWeight,
      wearableContribution: recoveryTargetBreakdown.wearableContribution,
      wearableUpdatedAt: wearableSnapshot?.updated_at ?? null,
      wearableSource: wearableSnapshot?.source ?? null,
    };
  }, [
    v2State,
    combinedRecoveryTarget,
    hasPassiveRecoveryTarget,
    phoneHealthTarget,
    recoveryTargetBreakdown,
    wearableSnapshot,
  ]);
  
  return {
    ...result,
    recoveryTarget: combinedRecoveryTarget,
    isLoading,
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
  };
}
