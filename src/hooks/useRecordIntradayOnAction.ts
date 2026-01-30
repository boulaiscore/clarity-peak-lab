/**
 * ============================================
 * INTRADAY EVENT RECORDER FOR ACTIONS
 * ============================================
 * 
 * Provides a simple function to record intraday metric events
 * after actions like game completion, task completion, or recovery actions.
 * 
 * This hook gathers the current live metrics and records them
 * to the intraday_metric_events table.
 */

import { useCallback } from "react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { useRecordIntradayEvent, IntradayEventType } from "@/hooks/useRecordIntradayEvent";

export function useRecordIntradayOnAction() {
  const todayMetrics = useTodayMetrics();
  const { rq: currentRQ } = useReasoningQuality();
  const { recordEvent } = useRecordIntradayEvent();

  const recordMetricsSnapshot = useCallback(
    (eventType: IntradayEventType, eventDetails?: Record<string, unknown>) => {
      // Get current live values
      const readiness = todayMetrics.readiness;
      const sharpness = todayMetrics.sharpness;
      const recovery = todayMetrics.recovery;
      const reasoningQuality = currentRQ;

      // Only record if we have at least one valid metric
      if (readiness === null && sharpness === null && recovery === null && reasoningQuality === null) {
        console.warn("[useRecordIntradayOnAction] No valid metrics available, skipping event");
        return;
      }

      recordEvent({
        eventType,
        readiness,
        sharpness,
        recovery: recovery != null ? Math.round(recovery * 10) / 10 : null,
        reasoningQuality: reasoningQuality != null ? Math.round(reasoningQuality * 10) / 10 : null,
        eventDetails,
      });
    },
    [todayMetrics, currentRQ, recordEvent]
  );

  return { recordMetricsSnapshot };
}
