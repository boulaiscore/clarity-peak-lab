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

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useAuth } from "@/contexts/AuthContext";
import { getMediumPeriodStartDate } from "@/lib/temporalWindows";
import {
  calculateSharpnessBreakdown,
  calculateReadinessBreakdown,
  calculateReadinessCognitiveComponent,
  calculatePhysioComponent,
  calculatePhysioEstimate,
  calculateReadinessDecay,
  clamp,
  type ReadinessBreakdown,
  type SharpnessBreakdown,
} from "@/lib/cognitiveEngine";
import {
  calculateDailyRecoveryTarget,
  getCurrentRecovery,
  resolveRecoveryForMetrics,
} from "@/lib/recoveryV2";
import { format, subDays } from "date-fns";
import {
  buildDailyPassiveState,
  calculateRelativeLoadEstimate,
  type DailyPassiveState,
} from "@/lib/dailyPassiveState";
import {
  calculateDigitalAttentionEstimate,
  type DigitalAttentionEstimate,
} from "@/lib/digitalFragmentation";
import {
  usePhoneHealthDailyContext,
  useWearableDailySnapshot,
} from "@/hooks/useDailyRecoveryInputs";

// Stale-types shim: these columns were added by migration 20260812183000_digital_fragmentation
// and will be regenerated in src/integrations/supabase/types.ts on the next schema pull.
type DeviceUsageSnapshotRow = {
  snapshot_date: string;
  attention_usage_min: number | null;
  active_app_count: number | null;
  attention_session_count: number | null;
  attention_switch_count: number | null;
  brief_session_count: number | null;
  permission_state: string;
  confidence: number;
  updated_at: string;
};

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
  /** Privacy-safe digital load and fragmentation measured against personal history. */
  digitalAttention: DigitalAttentionEstimate;
  sharpnessBreakdown: SharpnessBreakdown;
  readinessBreakdown: ReadinessBreakdown;
  
  // Status
  hasWearableData: boolean;
  isRecoveryInitialized: boolean;
  /** True while Recovery's optional Health/wearable target is still refreshing. */
  isRecoverySyncing: boolean;
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
  const [passiveContextReady, setPassiveContextReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPassiveContextReady(true), 250);
    return () => window.clearTimeout(timeoutId);
  }, []);
  
  const { states, S1, S2, rawMetrics, isLoading: statesLoading } = useCognitiveStates();

  // Recovery and readiness decay live on the already-fetched cognitive row.
  // Reusing it removes two duplicate Supabase requests from every Home mount.
  const recoveryV2State = useMemo(() => rawMetrics ? {
    recValue: rawMetrics.rec_value,
    recLastTs: rawMetrics.rec_last_ts,
    hasRecoveryBaseline: rawMetrics.has_recovery_baseline ?? false,
  } : null, [rawMetrics]);

  const { data: phoneHealthSnapshot, isLoading: phoneHealthLoading } =
    usePhoneHealthDailyContext(userId, today);
  
  // REMOVED: Old weekly detox/walking minutes queries
  // Recovery is now calculated using the v2.0 continuous decay model
  
  const { data: wearableSnapshot, isLoading: wearableLoading } =
    useWearableDailySnapshot(userId, today);

  const { data: passiveContext } = useQuery({
    queryKey: ["today-passive-context", userId, passiveHistoryStart],
    queryFn: async () => {
      if (!userId) return { deviceRows: [], calendarRows: [] };

      const [deviceResult, calendarResult] = await Promise.all([
        supabase
          .from("device_usage_snapshots")
          .select("snapshot_date, attention_usage_min, active_app_count, attention_session_count, attention_switch_count, brief_session_count, permission_state, confidence, updated_at")
          .eq("user_id", userId)
          .gte("snapshot_date", passiveHistoryStart)
          .order("snapshot_date", { ascending: true })
          .returns<DeviceUsageSnapshotRow[]>(),
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
    enabled: !!userId && passiveContextReady,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const decayData = rawMetrics ? {
    low_rec_streak_days: rawMetrics.low_rec_streak_days,
    readiness_decay_applied: rawMetrics.readiness_decay_applied,
    readiness_decay_week_start: rawMetrics.readiness_decay_week_start,
  } : null;

  // The cognitive row is sufficient for a correct baseline display. Health and
  // wearable inputs enrich the daily state progressively and must never hold
  // the Home screen behind several independent network requests.
  const displayReady = !statesLoading;
  
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
    const digitalAttention = calculateDigitalAttentionEstimate({
      current: currentDevice ? {
        attentionUsageMin: currentDevice.attention_usage_min,
        activeAppCount: currentDevice.active_app_count,
        attentionSessionCount: currentDevice.attention_session_count,
        attentionSwitchCount: currentDevice.attention_switch_count,
        briefSessionCount: currentDevice.brief_session_count,
      } : null,
      history: previousDevice.map((row) => ({
        attentionUsageMin: row.attention_usage_min,
        activeAppCount: row.active_app_count,
        attentionSessionCount: row.attention_session_count,
        attentionSwitchCount: row.attention_switch_count,
        briefSessionCount: row.brief_session_count,
      })),
      sourceConfidence: currentDevice?.confidence ?? 0,
    });

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
        label: "Digital attention",
        score: digitalAttention.score,
        confidence: digitalAttention.confidence,
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
    const sharpnessBreakdown = calculateSharpnessBreakdown(states, recovery, dailyStateContext);
    const sharpness = sharpnessBreakdown.total;
    
    // Calculate base Readiness
    const readinessBreakdown = calculateReadinessBreakdown(states, recovery, dailyStateContext);
    const baseReadiness = readinessBreakdown.total;
    
    // Calculate Readiness decay (using low_rec_streak_days from daily snapshot)
    // v2.0: Compare against rolling period instead of calendar week
    const consecutiveLowRecDays = decayData?.low_rec_streak_days ?? 0;
    const readinessDecayWeekStart = decayData?.readiness_decay_week_start;
    const currentDecayApplied = 
      readinessDecayWeekStart === rollingStart 
        ? (decayData?.readiness_decay_applied ?? 0) 
        : 0;
    
    const nominalReadinessDecay = calculateReadinessDecay({
      consecutiveLowRecDays,
      currentDecayApplied,
    });
    
    // Apply Readiness decay
    const readiness = clamp(baseReadiness - nominalReadinessDecay, 0, 100);
    // Expose the exact visible adjustment. This keeps the Home breakdown
    // additive even if the 0-point floor limits the nominal rule.
    const readinessDecay = baseReadiness - readiness;
    
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
      isRecoverySyncing: phoneHealthLoading || wearableLoading,
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
      digitalAttention,
      sharpnessBreakdown,
      readinessBreakdown,
      isLoading: !displayReady,
    };
  }, [states, S1, S2, recoveryV2State, phoneHealthSnapshot, phoneHealthLoading, wearableSnapshot, wearableLoading, passiveContext, today, decayData, rollingStart, displayReady]);
  
  // Update the display cache as soon as core metrics are available. Optional
  // sources update the same result in place when their requests resolve.
  if (displayReady) {
    cachedResultRef.current = freshResult;
  }
  
  // STABILITY: Return cached result while loading to prevent flicker
  if (!displayReady && cachedResultRef.current) {
    return {
      ...cachedResultRef.current,
      isLoading: true,
    };
  }
  
  return freshResult;
}
