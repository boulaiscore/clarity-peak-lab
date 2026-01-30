/**
 * ============================================
 * INTRADAY EVENT RECORDER FOR ACTIONS
 * ============================================
 * 
 * v2.0: Refactored to properly capture post-action metrics.
 * 
 * Problem: React hooks capture stale values at call time.
 * Solution: Use queryClient.fetchQuery to get fresh values
 * AFTER the action's side effects have completed.
 * 
 * This hook is called AFTER mutations complete to ensure
 * we're capturing the new metric values, not the old ones.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import type { IntradayEventType } from "@/hooks/useRecordIntradayEvent";
import { getCurrentRecovery, RecoveryState } from "@/lib/recoveryV2";
import {
  calculateSharpness,
  calculateReadiness,
  clamp,
} from "@/lib/cognitiveEngine";
import { calculateRQ, type TaskCompletion } from "@/lib/reasoningQuality";

export function useRecordIntradayOnAction() {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const queryClient = useQueryClient();

  const fetchLiveReasoningQuality = useCallback(async (): Promise<number | null> => {
    if (!userId) return null;

    // 1) S2 inputs + decay tracking dates
    const { data: metricsRow, error: metricsErr } = await supabase
      .from("user_cognitive_metrics")
      .select("critical_thinking_score, creativity, last_s2_game_at, last_task_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (metricsErr) throw metricsErr;

    const CT = metricsRow?.critical_thinking_score ?? 50;
    const IN = metricsRow?.creativity ?? 50;
    const S2 = (CT + IN) / 2;

    const lastS2GameAt = metricsRow?.last_s2_game_at ? parseISO(metricsRow.last_s2_game_at) : null;
    const lastTaskAt = metricsRow?.last_task_at ? parseISO(metricsRow.last_task_at) : null;

    // 2) Last 10 S2 game scores (chronological)
    const { data: s2Games, error: s2Err } = await supabase
      .from("game_sessions")
      .select("score, completed_at")
      .eq("user_id", userId)
      .eq("system_type", "S2")
      .order("completed_at", { ascending: false })
      .limit(10);

    if (s2Err) throw s2Err;

    const s2GameScores = (s2Games ?? [])
      .filter((g) => g.score !== null)
      .map((g) => Number(g.score))
      .reverse();

    // 3) Last 7 days of task completions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: tasks, error: tasksErr } = await supabase
      .from("exercise_completions")
      .select("exercise_id, completed_at")
      .eq("user_id", userId)
      .like("exercise_id", "content-%")
      .gte("completed_at", sevenDaysAgo.toISOString());

    if (tasksErr) throw tasksErr;

    const taskCompletions: TaskCompletion[] = (tasks ?? []).map((t) => {
      const parts = t.exercise_id.split("-");
      const type = (parts[1] as TaskCompletion["type"]) || "article";
      return {
        type,
        completedAt: parseISO(t.completed_at),
      };
    });

    // 4) Compute live RQ with the same engine as the UI
    const rqResult = calculateRQ({
      S2,
      s2GameScores,
      taskCompletions,
      lastS2GameAt,
      lastTaskAt,
    });

    return Math.round(rqResult.rq * 10) / 10;
  }, [userId]);

  /**
   * Records a metric snapshot AFTER an action completes.
   * This fetches fresh data from the cache/server to ensure
   * we capture the post-action values.
   * 
   * @param eventType - Type of event (task, game, decay, etc.)
   * @param eventDetails - Optional metadata about the event
   * @param delayMs - Optional delay before recording (for cache updates)
   */
  const recordMetricsSnapshot = useCallback(
    async (
      eventType: IntradayEventType, 
      eventDetails?: Record<string, unknown>,
      delayMs: number = 100
    ) => {
      console.log("[useRecordIntradayOnAction] 🎯 Called with:", { eventType, eventDetails, userId });
      
      if (!userId) {
        console.error("[useRecordIntradayOnAction] ❌ No user ID, skipping event");
        return;
      }

      // Small delay to allow cache invalidations to propagate
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      try {
        // Fetch fresh cognitive states from cache or server
        const cognitiveStates = queryClient.getQueryData<{
          reasoning_accuracy: number;
          fast_thinking: number;
          critical_thinking_score: number;
          creativity: number;
        }>(["cognitive-states", userId]);

        // Fetch fresh recovery state
        const recoveryState = queryClient.getQueryData<RecoveryState>(
          ["recovery-v2-state", userId]
        );

        // If cache is stale, refetch directly from DB
        let AE = cognitiveStates?.fast_thinking ?? 50;
        let RA = cognitiveStates?.reasoning_accuracy ?? 50;
        let CT = cognitiveStates?.critical_thinking_score ?? 50;
        let IN = cognitiveStates?.creativity ?? 50;

        if (!cognitiveStates) {
          const { data } = await supabase
            .from("user_cognitive_metrics")
            .select("fast_thinking, reasoning_accuracy, critical_thinking_score, creativity, rec_value, rec_last_ts, has_recovery_baseline, reasoning_quality")
            .eq("user_id", userId)
            .maybeSingle();

          if (data) {
            AE = data.fast_thinking ?? 50;
            RA = data.reasoning_accuracy ?? 50;
            CT = data.critical_thinking_score ?? 50;
            IN = data.creativity ?? 50;
          }
        }

        // Calculate current metrics
        const states = { AE, RA, CT, IN };
        const recovery = recoveryState ? getCurrentRecovery(recoveryState) : null;
        const recoveryValue = recovery ?? 0;

        const sharpness = calculateSharpness(states, recoveryValue);
        const readiness = calculateReadiness(states, recoveryValue, null);

        // Get RQ (LIVE) - required for correct intraday charts.
        // Using persisted RQ here causes new profiles (and some edge cases) to show a flat line
        // because persisted RQ may be null or already at the final value.
        let reasoningQuality: number | null = null;

        try {
          reasoningQuality = await fetchLiveReasoningQuality();
        } catch (e) {
          console.warn("[useRecordIntradayOnAction] Live RQ calc failed, falling back to persisted:", e);

          // Fallback: persisted value (better than nothing, but may flatten the chart)
          const cachedRQ = queryClient.getQueryData<{ reasoning_quality: number | null }>(
            ["reasoning-quality-persisted", userId]
          );

          if (cachedRQ?.reasoning_quality != null) {
            reasoningQuality = cachedRQ.reasoning_quality;
          } else {
            const { data } = await supabase
              .from("user_cognitive_metrics")
              .select("reasoning_quality")
              .eq("user_id", userId)
              .maybeSingle();

            reasoningQuality = data?.reasoning_quality ?? null;
          }
        }

        // Record the event
        const today = format(new Date(), "yyyy-MM-dd");
        const eventPayload = {
          user_id: userId,
          event_date: today,
          event_timestamp: new Date().toISOString(),
          event_type: eventType,
          readiness: readiness != null ? Math.round(readiness * 10) / 10 : null,
          sharpness: sharpness != null ? Math.round(sharpness * 10) / 10 : null,
          recovery: recovery != null ? Math.round(recovery * 10) / 10 : null,
          reasoning_quality: reasoningQuality,
          event_details: (eventDetails ?? null) as Json,
        };

        console.log("[useRecordIntradayOnAction] 📝 Inserting event:", eventPayload);

        const { data: insertedData, error } = await supabase
          .from("intraday_metric_events")
          .insert([eventPayload])
          .select();

        if (error) {
          console.error("[useRecordIntradayOnAction] ❌ Error recording event:", error);
          return;
        }

        console.log("[useRecordIntradayOnAction] ✅ Inserted successfully:", insertedData);

        console.log(`[useRecordIntradayOnAction] ✅ Recorded ${eventType}:`, {
          readiness: readiness?.toFixed(1),
          sharpness: sharpness?.toFixed(1),
          recovery: recovery?.toFixed(1),
          rq: reasoningQuality?.toFixed(1),
        });

        // Invalidate intraday history to refresh charts
        queryClient.invalidateQueries({ queryKey: ["intraday-events"] });

      } catch (err) {
        console.error("[useRecordIntradayOnAction] Error:", err);
      }
    },
    [userId, queryClient]
  );

  return { recordMetricsSnapshot };
}
