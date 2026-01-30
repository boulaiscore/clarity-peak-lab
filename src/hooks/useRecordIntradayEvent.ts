/**
 * ============================================
 * INTRADAY EVENT RECORDING HOOK
 * ============================================
 * 
 * Records real-time metric events to the database.
 * Every time metrics change (decay, task, game, detox, walking),
 * this hook logs the exact values at that moment.
 */

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export type IntradayEventType = 
  | 'decay'       // Automatic decay applied
  | 'task'        // Task completed (podcast, book, article)
  | 'game'        // Game session completed
  | 'detox'       // Detox session completed
  | 'walking'     // Walking session completed
  | 'app_open';   // App opened/foregrounded

interface RecordEventParams {
  eventType: IntradayEventType;
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
  eventDetails?: Record<string, unknown>;
}

export function useRecordIntradayEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: RecordEventParams) => {
      if (!user?.id) {
        console.warn("[useRecordIntradayEvent] No user ID, skipping event");
        return null;
      }

      const today = format(new Date(), "yyyy-MM-dd");

      // Use raw query to avoid type issues with new table
      const { error } = await supabase
        .from("intraday_metric_events" as any)
        .insert({
          user_id: user.id,
          event_date: today,
          event_timestamp: new Date().toISOString(),
          event_type: params.eventType,
          readiness: params.readiness,
          sharpness: params.sharpness,
          recovery: params.recovery,
          reasoning_quality: params.reasoningQuality,
          event_details: params.eventDetails ?? null,
        } as any);

      if (error) {
        console.error("[useRecordIntradayEvent] Error recording event:", error);
        throw error;
      }

      console.log(`[useRecordIntradayEvent] Recorded ${params.eventType} event:`, {
        recovery: params.recovery,
        sharpness: params.sharpness,
        readiness: params.readiness,
        rq: params.reasoningQuality,
      });

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate intraday history to refresh charts
      queryClient.invalidateQueries({ queryKey: ["intraday-events"] });
    },
  });

  const recordEvent = useCallback(
    (params: RecordEventParams) => {
      mutation.mutate(params);
    },
    [mutation]
  );

  return {
    recordEvent,
    isRecording: mutation.isPending,
  };
}
