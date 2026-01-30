/**
 * Hook that computes Today's metrics (Sharpness, Readiness, Recovery)
 * using the cognitive engine formulas.
 * 
 * v2.0: Now uses Recovery v2.0 continuous decay model instead of weekly aggregates.
 * Recovery is fetched from user_cognitive_metrics (rec_value, rec_last_ts)
 * and decay is applied using getCurrentRecovery() from recoveryV2.ts.
 * 
 * v1.5: Added stability mechanism to prevent metrics flicker on refresh.
 * Uses useRef to cache the last valid computed values and only updates
 * when ALL data sources are loaded.
 * 
 * ⚠️ CRITICAL: This hook follows the MANDATORY computation order (Section D):
 * 
 * 1. Load persistent skills: AE, RA, CT, IN (from useCognitiveStates)
 * 2. Compute aggregates: S1 = (AE+RA)/2, S2 = (CT+IN)/2 (from useCognitiveStates)
 * 3. Compute Recovery: Using v2.0 exponential decay model (72h half-life)
 * 4. Compute Sharpness and Readiness from skill values and Recovery
 * 5. Apply Readiness decay if consecutive low REC days >= 3
 * 
 * SHARPNESS = 0.6×S1 + 0.4×S2, modulated by Recovery (0.75 + 0.25×REC/100)
 * READINESS = 0.35×REC + 0.35×S2 + 0.30×AE (without wearable) - decay
 * RECOVERY = Continuous decay model: REC × 2^(-Δt_hours / 72)
 * 
 * DATA SOURCES:
 * - Cognitive States (AE, RA, CT, IN): from user_cognitive_metrics table
 * - Recovery: from user_cognitive_metrics (rec_value, rec_last_ts, has_recovery_baseline)
 * - Wearable Data: from wearable_snapshots table
 */

import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useAuth } from "@/contexts/AuthContext";
import { getMediumPeriodStartDate } from "@/lib/temporalWindows";
import {
  calculateSharpness,
  calculateReadiness,
  calculatePhysioComponent,
  calculateReadinessDecay,
  clamp,
} from "@/lib/cognitiveEngine";
import { getCurrentRecovery, RecoveryState } from "@/lib/recoveryV2";

export interface UseTodayMetricsResult {
  // Today metrics (0-100)
  sharpness: number;
  readiness: number;
  recovery: number;
  /** Raw recovery value - null if not initialized (for snapshots) */
  recoveryRaw: number | null;
  
  // Decay adjustments
  readinessDecay: number;
  consecutiveLowRecDays: number;
  
  // Underlying cognitive states
  AE: number;
  RA: number;
  CT: number;
  IN: number;
  S1: number;
  S2: number;
  
  // Status
  hasWearableData: boolean;
  isRecoveryInitialized: boolean;
  isLoading: boolean;
}

// v2.0: Use rolling 7-day window instead of calendar week
function getRollingPeriodStart(): string {
  return getMediumPeriodStartDate();
}

export function useTodayMetrics(): UseTodayMetricsResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  // v2.0: Use rolling 7-day window
  const rollingStart = getRollingPeriodStart();
  const today = new Date().toISOString().split("T")[0];
  
  const { states, S1, S2, isLoading: statesLoading } = useCognitiveStates();
  
  // Fetch Recovery v2 state from user_cognitive_metrics
  const { data: recoveryV2State, isLoading: recoveryV2Loading } = useQuery({
    queryKey: ["recovery-v2-state", userId],
    queryFn: async (): Promise<RecoveryState | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("rec_value, rec_last_ts, has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("[useTodayMetrics] Error fetching recovery state:", error);
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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // REMOVED: Old weekly detox/walking minutes queries
  // Recovery is now calculated using the v2.0 continuous decay model
  
  // Fetch today's wearable snapshot
  const { data: wearableSnapshot, isLoading: wearableLoading } = useQuery({
    queryKey: ["wearable-snapshot", userId, today],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("wearable_snapshots")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  // Fetch readiness decay tracking data
  // NOTE: Using type cast because these columns are new and types.ts may not be updated yet
  const { data: decayData, isLoading: decayLoading } = useQuery({
    queryKey: ["readiness-decay-tracking", userId, rollingStart],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select(`
          low_rec_streak_days,
          readiness_decay_applied,
          readiness_decay_week_start
        `)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Cast to expected shape
      return data as {
        low_rec_streak_days: number | null;
        readiness_decay_applied: number | null;
        readiness_decay_week_start: string | null;
      } | null;
    },
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  // Check if all data sources are loaded
  const allLoaded = !statesLoading && !recoveryV2Loading && !wearableLoading && !decayLoading;
  
  // Use ref to cache last valid result (prevents flicker during refetch)
  const cachedResultRef = useRef<UseTodayMetricsResult | null>(null);
  
  const freshResult = useMemo((): UseTodayMetricsResult => {
    // Calculate Recovery (REC) using v2.0 continuous decay model
    // recoveryRawValue: null if not initialized (used for snapshots to avoid saving 0)
    // recovery: always numeric (0 fallback) for calculations
    const recoveryRawValue = recoveryV2State ? getCurrentRecovery(recoveryV2State) : null;
    const recovery = recoveryRawValue ?? 0;
    const isRecoveryInitialized = recoveryV2State?.hasRecoveryBaseline ?? false;
    
    // Calculate Physio component (if wearable data available)
    const physioComponent = wearableSnapshot ? calculatePhysioComponent({
      hrvMs: wearableSnapshot.hrv_ms ?? null,
      restingHr: wearableSnapshot.resting_hr ?? null,
      sleepDurationMin: wearableSnapshot.sleep_duration_min ?? null,
      sleepEfficiency: wearableSnapshot.sleep_efficiency ?? null,
    }) : null;
    
    // Calculate Sharpness
    const sharpness = calculateSharpness(states, recovery);
    
    // Calculate base Readiness
    const baseReadiness = calculateReadiness(states, recovery, physioComponent);
    
    // Calculate Readiness decay (using low_rec_streak_days from daily snapshot)
    // v2.0: Compare against rolling period instead of calendar week
    const consecutiveLowRecDays = decayData?.low_rec_streak_days ?? 0;
    const readinessDecayWeekStart = decayData?.readiness_decay_week_start;
    const currentDecayApplied = 
      readinessDecayWeekStart === rollingStart 
        ? (decayData?.readiness_decay_applied ?? 0) 
        : 0;
    
    const readinessDecay = calculateReadinessDecay({
      consecutiveLowRecDays,
      currentDecayApplied,
    });
    
    // Apply Readiness decay
    const readiness = clamp(baseReadiness - readinessDecay, 0, 100);
    
    return {
      sharpness,
      readiness,
      recovery,
      recoveryRaw: recoveryRawValue,
      readinessDecay,
      consecutiveLowRecDays,
      hasWearableData: !!wearableSnapshot,
      isRecoveryInitialized,
      AE: states.AE,
      RA: states.RA,
      CT: states.CT,
      IN: states.IN,
      S1,
      S2,
      isLoading: !allLoaded,
    };
  }, [states, S1, S2, recoveryV2State, wearableSnapshot, decayData, rollingStart, allLoaded]);
  
  // Update cached result only when all data is loaded
  if (allLoaded) {
    cachedResultRef.current = freshResult;
  }
  
  // STABILITY: Return cached result while loading to prevent flicker
  if (!allLoaded && cachedResultRef.current) {
    return {
      ...cachedResultRef.current,
      isLoading: true,
    };
  }
  
  return freshResult;
}
