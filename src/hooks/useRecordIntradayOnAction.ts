/**
 * Records a post-action snapshot using the same canonical engines and source
 * columns used by the live Today and Monitor tabs.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import {
  calculateDailyRecoveryTarget,
  getCurrentRecovery,
  resolveRecoveryForMetrics,
  type RecoveryState,
} from "@/lib/recoveryV2";
import {
  calculatePhysioEstimate,
  calculateReadiness,
  calculateReadinessDecay,
  calculateSharpness,
  clamp,
  deriveEffectiveCognitiveStates,
} from "@/lib/cognitiveEngine";
import { buildDailyPassiveState, calculateRelativeLoadEstimate } from "@/lib/dailyPassiveState";
import { calculateDigitalAttentionEstimate } from "@/lib/digitalFragmentation";
import { calculateRQ, type TaskCompletion } from "@/lib/reasoningQuality";
import { getMediumPeriodStartDate } from "@/lib/temporalWindows";

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

export type IntradayEventType =
  | "decay"
  | "task"
  | "game"
  | "detox"
  | "walking"
  | "app_open";

export function useRecordIntradayOnAction() {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const queryClient = useQueryClient();

  const fetchLiveReasoningQuality = useCallback(async (
    S2: number,
    lastS2GameAt: string | null | undefined,
    lastTaskAt: string | null | undefined,
  ): Promise<number> => {
    if (!userId) return 50;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [gamesResult, tasksResult, sessionResult] = await Promise.all([
      supabase
        .from("game_sessions")
        .select("score, completed_at")
        .eq("user_id", userId)
        .eq("system_type", "S2")
        .order("completed_at", { ascending: false })
        .limit(10),
      supabase
        .from("exercise_completions")
        .select("exercise_id, completed_at")
        .eq("user_id", userId)
        .like("exercise_id", "content-%")
        .gte("completed_at", sevenDaysAgo.toISOString()),
      supabase
        .from("reason_sessions")
        .select("duration_seconds, weight")
        .eq("user_id", userId)
        .eq("is_valid_for_rq", true)
        .gte("started_at", sevenDaysAgo.toISOString())
        .not("ended_at", "is", null),
    ]);

    const firstError = gamesResult.error || tasksResult.error || sessionResult.error;
    if (firstError) throw firstError;

    const s2GameScores = (gamesResult.data ?? [])
      .filter((game) => game.score !== null)
      .map((game) => Number(game.score))
      .reverse();

    const taskCompletions: TaskCompletion[] = (tasksResult.data ?? []).map((task) => {
      const type = task.exercise_id.split("-")[1] as TaskCompletion["type"] | undefined;
      return {
        type: type === "podcast" || type === "book" ? type : "article",
        completedAt: parseISO(task.completed_at),
      };
    });

    const sessionWeightedMinutes = (sessionResult.data ?? []).reduce((total, reasonSession) => {
      return total + ((reasonSession.duration_seconds ?? 0) / 60) * (reasonSession.weight ?? 1);
    }, 0);

    return calculateRQ({
      S2,
      s2GameScores,
      taskCompletions,
      sessionWeightedMinutes,
      lastS2GameAt: lastS2GameAt ? parseISO(lastS2GameAt) : null,
      lastTaskAt: lastTaskAt ? parseISO(lastTaskAt) : null,
    }).rq;
  }, [userId]);

  const recordMetricsSnapshot = useCallback(async (
    eventType: IntradayEventType,
    eventDetails?: Record<string, unknown>,
    delayMs = 100,
  ) => {
    if (!userId) return;
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      const now = new Date();
      const today = format(now, "yyyy-MM-dd");
      const passiveHistoryStart = format(subDays(now, 14), "yyyy-MM-dd");
      const [metricsResult, phoneResult, wearableResult, deviceResult, calendarResult] = await Promise.all([
        supabase
          .from("user_cognitive_metrics")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("phone_health_snapshots")
          .select("target_rec, phi, confidence, sleep_min, updated_at")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("wearable_snapshots")
          .select("hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, updated_at")
          .eq("user_id", userId)
          .eq("date", today)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
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

      const firstError = metricsResult.error || phoneResult.error || wearableResult.error;
      if (firstError) throw firstError;
      if (deviceResult.error || calendarResult.error) {
        console.warn("[useRecordIntradayOnAction] Passive context partially unavailable", {
          attention: deviceResult.error,
          schedule: calendarResult.error,
        });
      }
      const metrics = metricsResult.data;
      if (!metrics) throw new Error("Cognitive metrics are not initialized");

      const derived = deriveEffectiveCognitiveStates(metrics, user?.age ?? 35, now);
      const recoveryState: RecoveryState = {
        recValue: metrics.rec_value,
        recLastTs: metrics.rec_last_ts,
        hasRecoveryBaseline: metrics.has_recovery_baseline ?? false,
      };
      const wearable = wearableResult.data;
      const physioEstimate = wearable ? calculatePhysioEstimate({
        hrvMs: wearable.hrv_ms,
        restingHr: wearable.resting_hr,
        sleepDurationMin: wearable.sleep_duration_min,
        sleepEfficiency: wearable.sleep_efficiency,
      }, {
        includeSleepDuration: phoneResult.data?.sleep_min == null,
      }) : null;
      const recoveryTarget = calculateDailyRecoveryTarget(
        phoneResult.data?.target_rec,
        physioEstimate,
      );
      const recovery = getCurrentRecovery(recoveryState, recoveryTarget);
      const recoveryForFormula = resolveRecoveryForMetrics(recovery, recoveryTarget);

      const deviceRows = deviceResult.data ?? [];
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

      const calendarRows = calendarResult.data ?? [];
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

      const passiveState = buildDailyPassiveState([
        {
          id: "health",
          label: "Health",
          score: phoneResult.data?.phi ?? null,
          confidence: phoneResult.data?.confidence ?? 0,
          updatedAt: phoneResult.data?.updated_at ?? null,
        },
        {
          id: "wearable",
          label: "Wearable",
          score: physioEstimate?.rawScore ?? null,
          confidence: physioEstimate?.confidence ?? 0,
          updatedAt: wearable?.updated_at ?? null,
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
          confidence: Math.max(scheduleBusy.confidence, scheduleMeetings.confidence),
          updatedAt: currentCalendar?.updated_at ?? null,
        },
      ]);
      const dailyStateContext = { score: passiveState.score, coverage: passiveState.coverage };

      const rollingStart = getMediumPeriodStartDate();
      const currentDecayApplied = metrics.readiness_decay_week_start === rollingStart
        ? (metrics.readiness_decay_applied ?? 0)
        : 0;
      const readinessDecay = calculateReadinessDecay({
        consecutiveLowRecDays: metrics.low_rec_streak_days ?? 0,
        currentDecayApplied,
      });

      const sharpness = calculateSharpness(derived.states, recoveryForFormula, dailyStateContext);
      const readiness = clamp(
        calculateReadiness(derived.states, recoveryForFormula, dailyStateContext) - readinessDecay,
        0,
        100,
      );

      let reasoningQuality = metrics.reasoning_quality;
      try {
        reasoningQuality = await fetchLiveReasoningQuality(
          derived.S2,
          metrics.last_s2_game_at,
          metrics.last_task_at,
        );
      } catch (error) {
        console.warn("[useRecordIntradayOnAction] Live RQ failed; using persisted RQ", error);
      }

      const eventPayload = {
        user_id: userId,
        event_date: today,
        event_timestamp: now.toISOString(),
        event_type: eventType,
        readiness: Math.round(readiness * 10) / 10,
        sharpness: Math.round(sharpness * 10) / 10,
        recovery: recovery == null ? null : Math.round(recovery * 10) / 10,
        reasoning_quality: reasoningQuality == null
          ? null
          : Math.round(reasoningQuality * 10) / 10,
        event_details: (eventDetails ?? null) as Json,
      };

      const { error } = await supabase.from("intraday_metric_events").insert([eventPayload]);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["intraday-events", userId] });
    } catch (error) {
      console.error("[useRecordIntradayOnAction] Failed to record snapshot:", error);
    }
  }, [fetchLiveReasoningQuality, queryClient, user?.age, userId]);

  return { recordMetricsSnapshot };
}
