/**
 * ============================================
 * INTRADAY METRIC HISTORY HOOK
 * ============================================
 * 
 * Reconstructs metric values throughout the current day
 * by fetching events (game sessions, detox, walking) and
 * applying the Recovery v2.0 decay model between events.
 * 
 * Returns data points at each event timestamp + "now" point.
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
}

interface EventRecord {
  timestamp: string;
  type: 'game' | 'detox' | 'walking';
  recoveryDelta?: number; // For detox/walking: minutes contributed
}

// Recovery decay formula: REC × 2^(-Δt_hours / 72)
function applyRecoveryDecay(recValue: number, hoursElapsed: number): number {
  return recValue * Math.pow(2, -hoursElapsed / 72);
}

// Recovery gain from activity: 0.12 × (detox_min + 0.5 × walk_min)
function calculateRecoveryGain(detoxMinutes: number, walkMinutes: number): number {
  return 0.12 * (detoxMinutes + 0.5 * walkMinutes);
}

export function useIntradayMetricHistory() {
  const { user } = useAuth();
  const todayMetrics = useTodayMetrics();
  const { rq: currentRQ, isLoading: rqLoading } = useReasoningQuality();
  
  const todayStart = startOfDay(new Date());
  const todayStr = format(todayStart, "yyyy-MM-dd");
  const now = new Date();

  // Fetch today's game sessions
  const { data: gameSessions, isLoading: gamesLoading } = useQuery({
    queryKey: ["intraday-games", user?.id, todayStr],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("completed_at, score, xp_awarded, skill_routed")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", todayStart.toISOString())
        .order("completed_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Fetch today's detox sessions (completed)
  const { data: detoxSessions, isLoading: detoxLoading } = useQuery({
    queryKey: ["intraday-detox", user?.id, todayStr],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("detox_sessions")
        .select("end_time, duration_minutes, walking_minutes")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("end_time", todayStart.toISOString())
        .order("end_time", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Fetch today's walking sessions (completed)
  const { data: walkingSessions, isLoading: walkingLoading } = useQuery({
    queryKey: ["intraday-walking", user?.id, todayStr],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("walking_sessions")
        .select("completed_at, duration_minutes")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", todayStart.toISOString())
        .order("completed_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Fetch midnight recovery value (snapshot from yesterday or baseline)
  const { data: midnightRecovery, isLoading: midnightLoading } = useQuery({
    queryKey: ["intraday-midnight-recovery", user?.id, todayStr],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Try yesterday's snapshot first
      const yesterday = format(new Date(todayStart.getTime() - 86400000), "yyyy-MM-dd");
      const { data: snapshot } = await supabase
        .from("daily_metric_snapshots")
        .select("recovery, sharpness, readiness, reasoning_quality")
        .eq("user_id", user.id)
        .eq("snapshot_date", yesterday)
        .maybeSingle();
      
      if (snapshot?.recovery != null) {
        return {
          recovery: Number(snapshot.recovery),
          sharpness: snapshot.sharpness != null ? Number(snapshot.sharpness) : null,
          readiness: snapshot.readiness != null ? Number(snapshot.readiness) : null,
          reasoningQuality: snapshot.reasoning_quality != null ? Number(snapshot.reasoning_quality) : null,
        };
      }
      
      // Fallback to RRI baseline
      const { data: metrics } = await supabase
        .from("user_cognitive_metrics")
        .select("rec_value")
        .eq("user_id", user.id)
        .maybeSingle();
      
      return {
        recovery: metrics?.rec_value != null ? Number(metrics.rec_value) : null,
        sharpness: null,
        readiness: null,
        reasoningQuality: null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  const isLoading = gamesLoading || detoxLoading || walkingLoading || midnightLoading || todayMetrics.isLoading || rqLoading;

  // Reconstruct intraday timeline
  const history: IntradayDataPoint[] = useMemo(() => {
    if (isLoading) return [];
    
    // Collect all events with timestamps
    const events: Array<{
      timestamp: Date;
      type: 'game' | 'detox' | 'walking' | 'midnight' | 'now';
      recoveryDelta?: number;
    }> = [];
    
    // Add midnight point
    events.push({ timestamp: todayStart, type: 'midnight' });
    
    // Add game events
    gameSessions?.forEach(session => {
      if (session.completed_at) {
        events.push({
          timestamp: parseISO(session.completed_at),
          type: 'game',
        });
      }
    });
    
    // Add detox events with recovery contribution
    detoxSessions?.forEach(session => {
      if (session.end_time) {
        const detoxMin = session.duration_minutes ?? 0;
        const walkMin = session.walking_minutes ?? 0;
        events.push({
          timestamp: parseISO(session.end_time),
          type: 'detox',
          recoveryDelta: calculateRecoveryGain(detoxMin, walkMin),
        });
      }
    });
    
    // Add walking events (standalone, not part of detox)
    walkingSessions?.forEach(session => {
      if (session.completed_at) {
        events.push({
          timestamp: parseISO(session.completed_at),
          type: 'walking',
          recoveryDelta: calculateRecoveryGain(0, session.duration_minutes ?? 0),
        });
      }
    });
    
    // Add current time point
    events.push({ timestamp: now, type: 'now' });
    
    // Sort by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Remove duplicates (events within 1 minute of each other)
    const dedupedEvents = events.filter((event, index) => {
      if (index === 0) return true;
      const prevEvent = events[index - 1];
      return Math.abs(event.timestamp.getTime() - prevEvent.timestamp.getTime()) > 60000;
    });
    
    // Reconstruct metric values at each point
    const dataPoints: IntradayDataPoint[] = [];
    
    // Get midnight values
    const midnightRec = midnightRecovery?.recovery ?? todayMetrics.recovery;
    
    // For Sharpness/Readiness/RQ: since they only change with games (XP),
    // we use a simplified approach - current values for all points
    // (In production, we'd need to track XP deltas per game)
    const baseSharpness = todayMetrics.sharpness;
    const baseReadiness = todayMetrics.readiness;
    const baseRQ = currentRQ; // Use actual RQ from useReasoningQuality
    
    let currentRecovery = midnightRec;
    let lastTimestamp = todayStart;
    
    dedupedEvents.forEach((event) => {
      // Apply decay since last event
      const hoursSinceLastEvent = (event.timestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
      
      if (event.type !== 'midnight' && currentRecovery != null) {
        currentRecovery = applyRecoveryDecay(currentRecovery, hoursSinceLastEvent);
      }
      
      // Apply recovery gain if applicable
      if (event.recoveryDelta && currentRecovery != null) {
        currentRecovery = Math.min(100, currentRecovery + event.recoveryDelta);
      }
      
      // For "now", use actual current metrics
      const isNow = event.type === 'now';
      const recovery = isNow ? todayMetrics.recovery : currentRecovery;
      
      dataPoints.push({
        timestamp: event.timestamp.toISOString(),
        hour: format(event.timestamp, "HH:mm"),
        sharpness: baseSharpness,
        readiness: baseReadiness,
        recovery: recovery != null ? Math.round(recovery * 10) / 10 : null,
        reasoningQuality: baseRQ,
        isNow,
      });
      
      lastTimestamp = event.timestamp;
    });
    
    return dataPoints;
  }, [
    isLoading,
    gameSessions,
    detoxSessions,
    walkingSessions,
    midnightRecovery,
    todayMetrics,
    currentRQ,
    todayStart,
    now,
  ]);

  return {
    history,
    isLoading,
    hasEvents: history.length > 2, // More than just midnight + now
  };
}
