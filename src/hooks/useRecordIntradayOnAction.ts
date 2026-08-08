/**
 * Records a post-action snapshot using the same canonical engines and source
 * columns used by the live Today and Monitor tabs.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { getCurrentRecovery, type RecoveryState } from "@/lib/recoveryV2";
import {
  calculatePhysioComponent,
  calculateReadiness,
  calculateReadinessDecay,
  calculateSharpness,
  clamp,
  deriveEffectiveCognitiveStates,
} from "@/lib/cognitiveEngine";
import { calculateRQ, type TaskCompletion } from "@/lib/reasoningQuality";
import { getMediumPeriodStartDate } from "@/lib/temporalWindows";

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

    const [gamesResult, tasksResult, customResult] = await Promise.all([
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
        .eq("source", "custom")
        .eq("is_valid_for_rq", true)
        .gte("started_at", sevenDaysAgo.toISOString())
        .not("ended_at", "is", null),
    ]);

    const firstError = gamesResult.error || tasksResult.error || customResult.error;
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

    const customWeightedMinutes = (customResult.data ?? []).reduce((total, reasonSession) => {
      return total + ((reasonSession.duration_seconds ?? 0) / 60) * (reasonSession.weight ?? 1);
    }, 0);

    return calculateRQ({
      S2,
      s2GameScores,
      taskCompletions,
      customWeightedMinutes,
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
      const [metricsResult, phoneResult, wearableResult] = await Promise.all([
        supabase
          .from("user_cognitive_metrics")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("phone_health_snapshots")
          .select("target_rec")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("wearable_snapshots")
          .select("hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle(),
      ]);

      const firstError = metricsResult.error || phoneResult.error || wearableResult.error;
      if (firstError) throw firstError;
      const metrics = metricsResult.data;
      if (!metrics) throw new Error("Cognitive metrics are not initialized");

      const derived = deriveEffectiveCognitiveStates(metrics, user?.age ?? 35, now);
      const recoveryState: RecoveryState = {
        recValue: metrics.rec_value,
        recLastTs: metrics.rec_last_ts,
        hasRecoveryBaseline: metrics.has_recovery_baseline ?? false,
      };
      const recovery = getCurrentRecovery(recoveryState, phoneResult.data?.target_rec ?? null);
      const recoveryForFormula = recovery ?? 0;

      const wearable = wearableResult.data;
      const physioComponent = wearable ? calculatePhysioComponent({
        hrvMs: wearable.hrv_ms,
        restingHr: wearable.resting_hr,
        sleepDurationMin: wearable.sleep_duration_min,
        sleepEfficiency: wearable.sleep_efficiency,
      }) : null;

      const rollingStart = getMediumPeriodStartDate();
      const currentDecayApplied = metrics.readiness_decay_week_start === rollingStart
        ? (metrics.readiness_decay_applied ?? 0)
        : 0;
      const readinessDecay = calculateReadinessDecay({
        consecutiveLowRecDays: metrics.low_rec_streak_days ?? 0,
        currentDecayApplied,
      });

      const sharpness = calculateSharpness(derived.states, recoveryForFormula);
      const readiness = clamp(
        calculateReadiness(derived.states, recoveryForFormula, physioComponent) - readinessDecay,
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
