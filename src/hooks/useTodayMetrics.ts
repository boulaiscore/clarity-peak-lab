/**
 * Hook that computes Today's metrics (Sharpness, Readiness, Recovery)
 * using the cognitive engine formulas.
 * 
 * v2.0: Uses the Recovery v2 daily snapshot model instead of weekly aggregates.
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
 * 3. Compute combined Health + wearable Recovery target and daily state
 * 4. Compute Sharpness and Readiness from capacity and daily state
 * 5. Apply Readiness decay if consecutive low REC days >= 3
 * 
 * SHARPNESS blends its Recovery modifier with the passive daily-state modifier
 * according to observed signal coverage.
 * READINESS blends app-only Readiness with 60% daily state + 40% cognitive state
 * according to observed signal coverage, then applies low-Recovery decay.
 * RECOVERY = Daily recalibration toward the Health + wearable target (or 50)
 * 
 * DATA SOURCES:
 * - Cognitive States (AE, RA, CT, IN): from user_cognitive_metrics table
 * - Recovery: from user_cognitive_metrics (rec_value, rec_last_ts, has_recovery_baseline)
 * - Wearable Data: from wearable_snapshots table
 * - Attention aggregates: from device_usage_snapshots (never app names/content)
 * - Schedule density: from calendar_context_snapshots (never event content)
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
  calculateReadinessCognitiveComponent,
  calculatePhysioComponent,
  calculatePhysioEstimate,
  calculateReadinessDecay,
  clamp,
} from "@/lib/cognitiveEngine";
import {
  calculateDailyRecoveryTarget,
  getCurrentRecovery,
  resolveRecoveryForMetrics,
  RecoveryState,
} from "@/lib/recoveryV2";
import { format, subDays } from "date-fns";
import {
  buildDailyPassiveState,
  calculateRelativeLoadEstimate,
  type DailyPassiveState,
} from "@/lib/dailyPassiveState";

export interface UseTodayMetricsResult {
  // Today metrics (0-100)
  sharpness: number;
  readiness: number;
  recovery: number;
  /** Raw recovery value - null if not initialized (for snapshots) */
  recoveryRaw: number | null;
  /** True when the displayed REC input is predicted from today's target. */
  recoveryEstimated: boolean;
  
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
  /** Confidence-adjusted wearable estimate; partial inputs are supported. */
  physioComponent: number | null;
  /** Cognitive component used by context-aware Readiness. */
  readinessCognitiveComponent: number;
  /** Canonical daily state from Health, wearable, attention and schedule. */
  dailyState: number;
  signalCoverage: number;
  signalCoverageLevel: DailyPassiveState["level"];
  signalUpdatedAt: string | null;
  signalSources: DailyPassiveState["sources"];
  
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
  const today = format(new Date(), "yyyy-MM-dd");
  const passiveHistoryStart = format(subDays(new Date(), 14), "yyyy-MM-dd");
  
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

  // Use the same daily Recovery target as the action and gating flows.
  const { data: phoneHealthSnapshot, isLoading: phoneHealthLoading } = useQuery({
    queryKey: ["phone-health-daily-context", userId, today],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("phone_health_snapshots")
        .select("target_rec, phi, confidence, sleep_min, updated_at")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
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
        .select("hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, updated_at")
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

  const { data: passiveContext, isLoading: passiveContextLoading } = useQuery({
    queryKey: ["today-passive-context", userId, passiveHistoryStart],
    queryFn: async () => {
      if (!userId) return { deviceRows: [], calendarRows: [] };

      const [deviceResult, calendarResult] = await Promise.all([
        supabase
          .from("device_usage_snapshots")
          .select("snapshot_date, attention_usage_min, active_app_count, permission_state, confidence, updated_at")
          .eq("user_id", userId)
          .gte("snapshot_date", passiveHistoryStart)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("calendar_context_snapshots")
          .select("snapshot_date, busy_minutes, meeting_count, permission_state, confidence, updated_at")
          .eq("user_id", userId)
          .gte("snapshot_date", passiveHistoryStart)
          .order("snapshot_date", { ascending: true }),
      ]);

      if (deviceResult.error) {
        console.warn("[useTodayMetrics] Attention context unavailable:", deviceResult.error);
      }
      if (calendarResult.error) {
        console.warn("[useTodayMetrics] Schedule context unavailable:", calendarResult.error);
      }

      return {
        deviceRows: deviceResult.data ?? [],
        calendarRows: calendarResult.data ?? [],
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
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
  const allLoaded = !statesLoading && !recoveryV2Loading && !phoneHealthLoading &&
    !wearableLoading && !passiveContextLoading && !decayLoading;
  
  // Use ref to cache last valid result (prevents flicker during refetch)
  const cachedResultRef = useRef<UseTodayMetricsResult | null>(null);
  const cachedUserIdRef = useRef<string | undefined>(userId);
  if (cachedUserIdRef.current !== userId) {
    cachedResultRef.current = null;
    cachedUserIdRef.current = userId;
  }
  
  const freshResult = useMemo((): UseTodayMetricsResult => {
    // Calculate Physio component (if wearable data available)
    const physioInput = wearableSnapshot ? {
      hrvMs: wearableSnapshot.hrv_ms ?? null,
      restingHr: wearableSnapshot.resting_hr ?? null,
      sleepDurationMin: wearableSnapshot.sleep_duration_min ?? null,
      sleepEfficiency: wearableSnapshot.sleep_efficiency ?? null,
    } : null;
    const physioEstimate = calculatePhysioEstimate(physioInput);
    const physioComponent = calculatePhysioComponent(physioInput);
    // Phone Health and wearable snapshots can expose the same sleep-duration
    // observation. Keep the standalone wearable score intact for display, but
    // exclude duplicate duration from the context used by Recovery/Daily State.
    const contextPhysioEstimate = calculatePhysioEstimate(physioInput, {
      includeSleepDuration: phoneHealthSnapshot?.sleep_min == null,
    });
    const readinessCognitiveComponent = calculateReadinessCognitiveComponent(states);
    const recoveryTarget = calculateDailyRecoveryTarget(
      phoneHealthSnapshot?.target_rec,
      contextPhysioEstimate,
    );
    // Recovery uses the same combined Health + wearable target as actions and gating.
    const recoveryRawValue = recoveryV2State
      ? getCurrentRecovery(recoveryV2State, recoveryTarget)
      : null;
    const recovery = resolveRecoveryForMetrics(recoveryRawValue, recoveryTarget);
    const recoveryEstimated = recoveryRawValue === null;
    const isRecoveryInitialized = recoveryV2State?.hasRecoveryBaseline ?? false;

    const deviceRows = passiveContext?.deviceRows ?? [];
    const currentDevice = deviceRows.find((row) => row.snapshot_date === today && row.permission_state === "granted");
    const previousDevice = deviceRows.filter((row) => row.snapshot_date !== today && row.permission_state === "granted");
    const attentionMinutes = calculateRelativeLoadEstimate({
      current: currentDevice?.attention_usage_min,
      history: previousDevice.map((row) => row.attention_usage_min),
      sourceConfidence: currentDevice?.confidence ?? 0,
      minimumBaseline: 30,
    });
    const attentionApps = calculateRelativeLoadEstimate({
      current: currentDevice?.active_app_count,
      history: previousDevice.map((row) => row.active_app_count),
      sourceConfidence: currentDevice?.confidence ?? 0,
      minimumBaseline: 2,
    });
    const attentionScore = attentionMinutes.score === null && attentionApps.score === null
      ? null
      : 0.75 * (attentionMinutes.score ?? 50) + 0.25 * (attentionApps.score ?? 50);
    const attentionConfidence = Math.max(attentionMinutes.confidence, attentionApps.confidence);

    const calendarRows = passiveContext?.calendarRows ?? [];
    const currentCalendar = calendarRows.find((row) => row.snapshot_date === today && row.permission_state === "granted");
    const previousCalendar = calendarRows.filter((row) => row.snapshot_date !== today && row.permission_state === "granted");
    const scheduleBusy = calculateRelativeLoadEstimate({
      current: currentCalendar?.busy_minutes,
      history: previousCalendar.map((row) => row.busy_minutes),
      sourceConfidence: currentCalendar?.confidence ?? 0,
      minimumBaseline: 30,
    });
    const scheduleMeetings = calculateRelativeLoadEstimate({
      current: currentCalendar?.meeting_count,
      history: previousCalendar.map((row) => row.meeting_count),
      sourceConfidence: currentCalendar?.confidence ?? 0,
      minimumBaseline: 1,
    });
    const scheduleScore = scheduleBusy.score === null && scheduleMeetings.score === null
      ? null
      : 0.75 * (scheduleBusy.score ?? 50) + 0.25 * (scheduleMeetings.score ?? 50);
    const scheduleConfidence = Math.max(scheduleBusy.confidence, scheduleMeetings.confidence);

    const passiveState = buildDailyPassiveState([
      {
        id: "health",
        label: "Health",
        score: phoneHealthSnapshot?.phi ?? null,
        confidence: phoneHealthSnapshot?.confidence ?? 0,
        updatedAt: phoneHealthSnapshot?.updated_at ?? null,
      },
      {
        id: "wearable",
        label: "Wearable",
        score: contextPhysioEstimate?.rawScore ?? null,
        confidence: contextPhysioEstimate?.confidence ?? 0,
        updatedAt: wearableSnapshot?.updated_at ?? null,
      },
      {
        id: "attention",
        label: "Attention",
        score: attentionScore,
        confidence: attentionConfidence,
        updatedAt: currentDevice?.updated_at ?? null,
      },
      {
        id: "schedule",
        label: "Schedule",
        score: scheduleScore,
        confidence: scheduleConfidence,
        updatedAt: currentCalendar?.updated_at ?? null,
      },
    ]);
    const dailyStateContext = {
      score: passiveState.score,
      coverage: passiveState.coverage,
    };
    
    // Calculate Sharpness
    const sharpness = calculateSharpness(states, recovery, dailyStateContext);
    
    // Calculate base Readiness
    const baseReadiness = calculateReadiness(states, recovery, dailyStateContext);
    
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
      recoveryEstimated,
      readinessDecay,
      consecutiveLowRecDays,
      hasWearableData: physioEstimate !== null,
      isRecoveryInitialized,
      AE: states.AE,
      RA: states.RA,
      CT: states.CT,
      IN: states.IN,
      S1,
      S2,
      physioComponent,
      readinessCognitiveComponent,
      dailyState: passiveState.score,
      signalCoverage: passiveState.coverage,
      signalCoverageLevel: passiveState.level,
      signalUpdatedAt: passiveState.updatedAt,
      signalSources: passiveState.sources,
      isLoading: !allLoaded,
    };
  }, [states, S1, S2, recoveryV2State, phoneHealthSnapshot, wearableSnapshot, passiveContext, today, decayData, rollingStart, allLoaded]);
  
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
