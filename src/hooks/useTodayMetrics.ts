/**
 * Hook that computes Today's metrics (Sharpness, Readiness, Recovery)
 * using the new cognitive engine formulas.
 * 
 * v1.5: Added stability mechanism to prevent metrics flicker on refresh.
 * Uses useRef to cache the last valid computed values and only updates
 * when ALL data sources are loaded.
 * 
 * v1.4: Now includes Readiness decay adjustment.
 * Readiness decays if REC < 40 for 3+ consecutive days.
 * 
 * ⚠️ CRITICAL: This hook follows the MANDATORY computation order (Section D):
 * 
 * 1. Load persistent skills: AE, RA, CT, IN (from useCognitiveStates)
 * 2. Compute aggregates: S1 = (AE+RA)/2, S2 = (CT+IN)/2 (from useCognitiveStates)
 * 3. Compute Recovery: REC = min(100, (detox + 0.5×walk) / target × 100)
 * 4. Compute Sharpness and Readiness from skill values and Recovery
 * 5. Apply Readiness decay if consecutive low REC days >= 3
 * 
 * METRICS READ ONLY FROM PERSISTENT SKILL STATE:
 * - NEVER from per-session game data (accuracy, reaction time, score)
 * - NEVER from baseline session records
 * 
 * SHARPNESS = 0.6×S1 + 0.4×S2, modulated by Recovery (0.75 + 0.25×REC/100)
 * READINESS = 0.35×REC + 0.35×S2 + 0.30×AE (without wearable) - decay
 * RECOVERY = min(100, (detox_min + 0.5×walk_min) / target × 100)
 * 
 * DATA SOURCES:
 * - Cognitive States (AE, RA, CT, IN): from user_cognitive_metrics table
 * - Detox Minutes: from detox_completions table (weekly aggregate)
 * - Walking Minutes: from walking_sessions table (weekly aggregate)
 * - Wearable Data: from wearable_snapshots table
 */

import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { getMediumPeriodStart, getMediumPeriodStartDate } from "@/lib/temporalWindows";
import {
  calculateSharpness,
  calculateReadiness,
  calculateRecovery,
  calculatePhysioComponent,
  calculateReadinessDecay,
  clamp,
} from "@/lib/cognitiveEngine";

export interface UseTodayMetricsResult {
  // Today metrics (0-100)
  sharpness: number;
  readiness: number;
  recovery: number;
  
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
  
  // Recovery breakdown (minutes)
  weeklyDetoxMinutes: number;
  weeklyWalkMinutes: number;
  detoxTarget: number;
  
  // Status
  hasWearableData: boolean;
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
  
  // Fetch weekly detox minutes from detox_completions - v2.0: rolling window
  const { data: detoxData, isLoading: detoxLoading } = useQuery({
    queryKey: ["weekly-detox-minutes", userId, rollingStart],
    queryFn: async () => {
      if (!userId) return { totalMinutes: 0 };
      
      // v2.0: Use rolling 7-day window - query by completed_at
      const rollingStartDate = getMediumPeriodStart();
      const { data, error } = await supabase
        .from("detox_completions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .gte("completed_at", rollingStartDate.toISOString());
      
      if (error) throw error;
      
      const totalMinutes = (data || []).reduce((sum, c) => sum + (c.duration_minutes || 0), 0);
      return { totalMinutes };
    },
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  // Fetch weekly walking minutes from walking_sessions - v2.0: rolling window
  const { data: walkingData, isLoading: walkingLoading } = useQuery({
    queryKey: ["weekly-walking-minutes", userId, rollingStart],
    queryFn: async () => {
      if (!userId) return { totalMinutes: 0 };
      
      // v2.0: Use rolling 7-day window - query by completed_at
      const rollingStartDate = getMediumPeriodStart();
      const { data, error } = await supabase
        .from("walking_sessions")
        .select("duration_minutes, status, completed_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", rollingStartDate.toISOString());
      
      if (error) throw error;
      
      const totalMinutes = (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      return { totalMinutes };
    },
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
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
  
  const weeklyDetoxMinutes = detoxData?.totalMinutes ?? 0;
  const weeklyWalkMinutes = walkingData?.totalMinutes ?? 0;
  
  // Get detox target from training plan
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  const detoxTarget = plan?.detox?.weeklyMinutes ?? 60;
  
  // Check if all data sources are loaded
  const allLoaded = !statesLoading && !detoxLoading && !walkingLoading && !wearableLoading && !decayLoading;
  
  // Use ref to cache last valid result (prevents flicker during refetch)
  const cachedResultRef = useRef<UseTodayMetricsResult | null>(null);
  
  const freshResult = useMemo((): UseTodayMetricsResult => {
    // Calculate Recovery (REC)
    const recovery = calculateRecovery({
      weeklyDetoxMinutes,
      weeklyWalkMinutes,
      detoxTarget,
    });
    
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
      readinessDecay,
      consecutiveLowRecDays,
      hasWearableData: !!wearableSnapshot,
      AE: states.AE,
      RA: states.RA,
      CT: states.CT,
      IN: states.IN,
      S1,
      S2,
      weeklyDetoxMinutes,
      weeklyWalkMinutes,
      detoxTarget,
      isLoading: !allLoaded,
    };
  }, [states, S1, S2, weeklyDetoxMinutes, weeklyWalkMinutes, detoxTarget, wearableSnapshot, decayData, rollingStart, allLoaded]);
  
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
