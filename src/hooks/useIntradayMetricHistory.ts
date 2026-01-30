/**
 * ============================================
 * INTRADAY METRIC HISTORY HOOK
 * ============================================
 * 
 * v2.0: Now reads from intraday_metric_events table
 * which contains real-time recorded events instead of
 * reconstructing/estimating values.
 * 
 * v2.1: Added midnight baseline from previous day's last snapshot
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
import { format, startOfDay, parseISO, subDays } from "date-fns";

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
  const yesterdayStr = format(subDays(todayStart, 1), "yyyy-MM-dd");
  const now = new Date();

  // Fetch yesterday's last snapshot for midnight baseline
  const { data: midnightBaseline, isLoading: baselineLoading } = useQuery({
    queryKey: ["midnight-baseline", user?.id, yesterdayStr],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get the last snapshot from yesterday (end-of-day values)
      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("readiness, sharpness, recovery, reasoning_quality, created_at")
        .eq("user_id", user.id)
        .eq("snapshot_date", yesterdayStr)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("[useIntradayMetricHistory] Error fetching midnight baseline:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - doesn't change often
  });

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

  const isLoading = eventsLoading || baselineLoading || todayMetrics.isLoading || rqLoading;

  // Convert events to chart data points
  const history: IntradayDataPoint[] = useMemo(() => {
    if (isLoading) return [];
    
    const dataPoints: IntradayDataPoint[] = [];
    
    // 1. Add midnight baseline point (from yesterday's last snapshot)
    if (midnightBaseline) {
      dataPoints.push({
        timestamp: todayStart.toISOString(),
        hour: "00:00",
        readiness: midnightBaseline.readiness != null ? Math.round(midnightBaseline.readiness * 10) / 10 : null,
        sharpness: midnightBaseline.sharpness != null ? Math.round(midnightBaseline.sharpness * 10) / 10 : null,
        recovery: midnightBaseline.recovery != null ? Math.round(midnightBaseline.recovery * 10) / 10 : null,
        reasoningQuality: midnightBaseline.reasoning_quality != null ? Math.round(midnightBaseline.reasoning_quality * 10) / 10 : null,
        isNow: false,
        eventType: "midnight",
      });
    }
    
    // 2. Add all recorded intraday events
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
    
    // 3. Always add current "now" point with live metrics
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
    if (lastEvent && lastEvent.eventType !== "midnight") {
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
      // No events today (or only midnight), add current point
      dataPoints.push(nowPoint);
    }
    
    return dataPoints;
  }, [
    isLoading,
    intradayEvents,
    midnightBaseline,
    todayMetrics,
    currentRQ,
    now,
    todayStart,
  ]);

  return {
    history,
    isLoading,
    hasEvents: (intradayEvents?.length ?? 0) > 0,
    hasMidnightBaseline: !!midnightBaseline,
  };
}
