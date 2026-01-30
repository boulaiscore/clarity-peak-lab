/**
 * ============================================
 * INTRADAY METRIC HISTORY HOOK
 * ============================================
 * 
 * v2.0: Now reads from intraday_metric_events table
 * which contains real-time recorded events instead of
 * reconstructing/estimating values.
 * 
 * Events are logged when:
 * - Decay is applied (app foreground)
 * - Task is completed
 * - Game is completed
 * - Detox/Walking session is completed
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { format, startOfDay, parseISO } from "date-fns";

export interface IntradayDataPoint {
  timestamp: string;      // ISO timestamp
  hour: string;           // "09:15" format for display
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
  isNow: boolean;         // Flag to highlight current time
  eventType?: string;     // Type of event that triggered this point
}

export function useIntradayMetricHistory() {
  const { user } = useAuth();
  const todayMetrics = useTodayMetrics();
  const { rq: currentRQ, isLoading: rqLoading } = useReasoningQuality();
  
  const todayStart = startOfDay(new Date());
  const todayStr = format(todayStart, "yyyy-MM-dd");
  const now = new Date();

  // Fetch today's intraday events from the database
  const { data: intradayEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["intraday-events", user?.id, todayStr],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("intraday_metric_events" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("event_date", todayStr)
        .order("event_timestamp", { ascending: true });
      
      if (error) {
        console.error("[useIntradayMetricHistory] Error fetching events:", error);
        throw error;
      }
      
      // Type assertion for new table not yet in types
      return (data || []) as unknown as Array<{
        id: string;
        event_timestamp: string;
        event_type: string;
        readiness: number | null;
        sharpness: number | null;
        recovery: number | null;
        reasoning_quality: number | null;
        event_details: Record<string, unknown> | null;
      }>;
    },
    enabled: !!user?.id,
    staleTime: 30_000, // Refresh more frequently for real-time feel
    refetchInterval: 60_000, // Auto-refresh every minute
  });

  const isLoading = eventsLoading || todayMetrics.isLoading || rqLoading;

  // Convert events to chart data points
  const history: IntradayDataPoint[] = useMemo(() => {
    if (isLoading) return [];
    
    const dataPoints: IntradayDataPoint[] = [];
    
    // Add all recorded events
    intradayEvents?.forEach((event) => {
      const timestamp = parseISO(event.event_timestamp);
      
      dataPoints.push({
        timestamp: event.event_timestamp,
        hour: format(timestamp, "HH:mm"),
        readiness: event.readiness,
        sharpness: event.sharpness,
        recovery: event.recovery != null ? Math.round(event.recovery * 10) / 10 : null,
        reasoningQuality: event.reasoning_quality != null ? Math.round(event.reasoning_quality * 10) / 10 : null,
        isNow: false,
        eventType: event.event_type,
      });
    });
    
    // Always add current "now" point with live metrics
    const nowPoint: IntradayDataPoint = {
      timestamp: now.toISOString(),
      hour: format(now, "HH:mm"),
      readiness: todayMetrics.readiness,
      sharpness: todayMetrics.sharpness,
      recovery: todayMetrics.recovery != null ? Math.round(todayMetrics.recovery * 10) / 10 : null,
      reasoningQuality: currentRQ != null ? Math.round(currentRQ * 10) / 10 : null,
      isNow: true,
    };
    
    // Check if last event is very close to now (within 2 minutes) - don't duplicate
    const lastEvent = dataPoints[dataPoints.length - 1];
    if (lastEvent) {
      const lastEventTime = parseISO(lastEvent.timestamp).getTime();
      const nowTime = now.getTime();
      const timeDiff = nowTime - lastEventTime;
      
      // If last event was more than 2 minutes ago, add "now" point
      if (timeDiff > 2 * 60 * 1000) {
        dataPoints.push(nowPoint);
      } else {
        // Update last point to be the "now" point with current values
        lastEvent.isNow = true;
        lastEvent.readiness = todayMetrics.readiness;
        lastEvent.sharpness = todayMetrics.sharpness;
        lastEvent.recovery = todayMetrics.recovery != null ? Math.round(todayMetrics.recovery * 10) / 10 : null;
        lastEvent.reasoningQuality = currentRQ != null ? Math.round(currentRQ * 10) / 10 : null;
      }
    } else {
      // No events today, just show current point
      dataPoints.push(nowPoint);
    }
    
    return dataPoints;
  }, [
    isLoading,
    intradayEvents,
    todayMetrics,
    currentRQ,
    now,
  ]);

  return {
    history,
    isLoading,
    hasEvents: (intradayEvents?.length ?? 0) > 0,
  };
}
