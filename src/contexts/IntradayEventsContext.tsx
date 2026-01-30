/**
 * ============================================
 * INTRADAY EVENTS CONTEXT
 * ============================================
 * 
 * Centralized context for recording intraday metric events.
 * Used by various hooks and components to log when metrics change.
 * 
 * Events are recorded to intraday_metric_events table for
 * accurate daily charts in Analytics.
 */

import React, { createContext, useContext, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

export type IntradayEventType = 
  | 'decay'       // Automatic decay applied
  | 'task'        // Task completed (podcast, book, article)
  | 'game'        // Game session completed
  | 'detox'       // Detox session completed
  | 'walking'     // Walking session completed
  | 'app_open';   // App opened/foregrounded

interface MetricSnapshot {
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
}

interface RecordEventParams {
  eventType: IntradayEventType;
  metrics: MetricSnapshot;
  eventDetails?: Record<string, unknown>;
}

interface IntradayEventsContextValue {
  recordEvent: (params: RecordEventParams) => void;
  isRecording: boolean;
}

const IntradayEventsContext = createContext<IntradayEventsContextValue | null>(null);

export function IntradayEventsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastRecordedRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: RecordEventParams) => {
      if (!user?.id) {
        console.warn("[IntradayEvents] No user ID, skipping event");
        return null;
      }

      const now = new Date();
      const today = format(now, "yyyy-MM-dd");
      const timestamp = now.toISOString();

      // Debounce: don't record same event type within 30 seconds
      const dedupeKey = `${params.eventType}-${today}`;
      if (lastRecordedRef.current === dedupeKey) {
        const lastTime = parseInt(localStorage.getItem(`intraday-${dedupeKey}`) || "0", 10);
        if (Date.now() - lastTime < 30000) {
          console.log("[IntradayEvents] Debounced, skipping duplicate event");
          return null;
        }
      }

      const { error } = await supabase
        .from("intraday_metric_events")
        .insert([{
          user_id: user.id,
          event_date: today,
          event_timestamp: timestamp,
          event_type: params.eventType,
          readiness: params.metrics.readiness,
          sharpness: params.metrics.sharpness,
          recovery: params.metrics.recovery,
          reasoning_quality: params.metrics.reasoningQuality,
          event_details: (params.eventDetails ?? null) as Json,
        }]);

      if (error) {
        console.error("[IntradayEvents] Error recording event:", error);
        throw error;
      }

      // Update debounce tracking
      lastRecordedRef.current = dedupeKey;
      localStorage.setItem(`intraday-${dedupeKey}`, Date.now().toString());

      console.log(`[IntradayEvents] ✅ Recorded ${params.eventType} event:`, {
        recovery: params.metrics.recovery?.toFixed(1),
        sharpness: params.metrics.sharpness?.toFixed(1),
        readiness: params.metrics.readiness?.toFixed(1),
        rq: params.metrics.reasoningQuality?.toFixed(1),
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

  return (
    <IntradayEventsContext.Provider value={{ recordEvent, isRecording: mutation.isPending }}>
      {children}
    </IntradayEventsContext.Provider>
  );
}

export function useIntradayEvents() {
  const context = useContext(IntradayEventsContext);
  if (!context) {
    // Return a no-op version if not in provider (for safety)
    return {
      recordEvent: () => {},
      isRecording: false,
    };
  }
  return context;
}
