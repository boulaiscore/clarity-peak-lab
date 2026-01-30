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
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import type { IntradayEventType } from "@/hooks/useRecordIntradayEvent";
import { getCurrentRecovery, RecoveryState } from "@/lib/recoveryV2";
import {
  calculateSharpness,
  calculateReadiness,
  clamp,
} from "@/lib/cognitiveEngine";

export function useRecordIntradayOnAction() {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const queryClient = useQueryClient();

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

        // Get RQ - for task/game events we need the LIVE calculated value, not persisted
        // Since RQ depends on task completions (7d window), we must recalculate
        // For simplicity, we fetch the persisted value from DB which is the closest we have
        // The live calculation happens in useReasoningQuality hook which isn't available here
        // Note: This may lag behind the true live RQ, but ensures data consistency
        let reasoningQuality: number | null = null;
        
        // First check cache with correct key
        const cachedRQ = queryClient.getQueryData<{ reasoning_quality: number | null }>(
          ["reasoning-quality-persisted", userId]
        );
        
        if (cachedRQ?.reasoning_quality != null) {
          reasoningQuality = cachedRQ.reasoning_quality;
        } else {
          // Fallback: fetch from DB
          const { data } = await supabase
            .from("user_cognitive_metrics")
            .select("reasoning_quality")
            .eq("user_id", userId)
            .maybeSingle();
          
          reasoningQuality = data?.reasoning_quality ?? null;
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
          reasoning_quality: reasoningQuality != null ? Math.round(reasoningQuality * 10) / 10 : null,
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
