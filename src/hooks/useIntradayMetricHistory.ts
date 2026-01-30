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
  type: 'game' | 'detox' | 'walking' | 'task';
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

  // Fetch today's task completions (for RQ changes)
  const { data: todayTaskCompletions, isLoading: tasksLoading } = useQuery({
    queryKey: ["intraday-tasks", user?.id, todayStr],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("completed_at, exercise_id")
        .eq("user_id", user.id)
        .like("exercise_id", "content-%")
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
      
      // Try yesterday's snapshot first - get the latest one (last updated)
      const yesterday = format(new Date(todayStart.getTime() - 86400000), "yyyy-MM-dd");
      const { data: snapshot } = await supabase
        .from("daily_metric_snapshots")
        .select("recovery, sharpness, readiness, reasoning_quality, created_at")
        .eq("user_id", user.id)
        .eq("snapshot_date", yesterday)
        .order("created_at", { ascending: false })
        .limit(1)
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

  const isLoading = gamesLoading || detoxLoading || walkingLoading || tasksLoading || midnightLoading || todayMetrics.isLoading || rqLoading;

  // Reconstruct intraday timeline
  const history: IntradayDataPoint[] = useMemo(() => {
    if (isLoading) return [];
    
    // Collect all events with timestamps
    const events: Array<{
      timestamp: Date;
      type: 'game' | 'detox' | 'walking' | 'task' | 'midnight' | 'now';
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
    
    // Add task completion events (for RQ changes)
    todayTaskCompletions?.forEach(task => {
      if (task.completed_at && task.exercise_id) {
        events.push({
          timestamp: parseISO(task.completed_at),
          type: 'task',
        });
      }
    });
    
    // Add current time point
    events.push({ timestamp: now, type: 'now' });
    
    // Sort by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Remove duplicates (events within 1 minute of each other, keep the more important one)
    const dedupedEvents = events.filter((event, index) => {
      if (index === 0) return true;
      const prevEvent = events[index - 1];
      const timeDiff = Math.abs(event.timestamp.getTime() - prevEvent.timestamp.getTime());
      if (timeDiff <= 60000) {
        // Keep task events as they affect RQ
        return event.type === 'task' || event.type === 'now';
      }
      return true;
    });
    
    // Reconstruct metric values at each point
    const dataPoints: IntradayDataPoint[] = [];
    
    // Get midnight values from snapshot (yesterday's end-of-day values)
    const midnightRec = midnightRecovery?.recovery ?? null;
    const midnightSharpness = midnightRecovery?.sharpness ?? null;
    const midnightReadiness = midnightRecovery?.readiness ?? null;
    const midnightRQ = midnightRecovery?.reasoningQuality ?? null;
    
    // Count task completions to track RQ progression
    const taskEvents = dedupedEvents.filter(e => e.type === 'task');
    let taskIndex = 0;
    
    // If we have tasks today, calculate the RQ delta per task
    // RQ progression: starts at midnight value, ends at current value
    // Each task adds an equal portion of the total delta
    const totalTasksToday = taskEvents.length;
    const rqDeltaPerTask = totalTasksToday > 0 && midnightRQ != null && currentRQ != null
      ? (currentRQ - midnightRQ) / totalTasksToday
      : 0;
    
    let currentRecovery = midnightRec;
    let currentRQValue = midnightRQ;
    let lastTimestamp = todayStart;
    
    dedupedEvents.forEach((event) => {
      // Apply recovery decay since last event
      const hoursSinceLastEvent = (event.timestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
      
      if (event.type !== 'midnight' && currentRecovery != null) {
        currentRecovery = applyRecoveryDecay(currentRecovery, hoursSinceLastEvent);
      }
      
      // Apply recovery gain if applicable
      if (event.recoveryDelta && currentRecovery != null) {
        currentRecovery = Math.min(100, currentRecovery + event.recoveryDelta);
      }
      
      // Apply RQ gain from task completions (proportional to actual delta)
      if (event.type === 'task' && currentRQValue != null) {
        currentRQValue = currentRQValue + rqDeltaPerTask;
        taskIndex++;
      }
      
      // For "now", use actual current metrics for accuracy
      const isNow = event.type === 'now';
      const recovery = isNow ? todayMetrics.recovery : currentRecovery;
      const sharpness = isNow ? todayMetrics.sharpness : midnightSharpness;
      const readiness = isNow ? todayMetrics.readiness : midnightReadiness;
      const rq = isNow ? currentRQ : currentRQValue;
      
      dataPoints.push({
        timestamp: event.timestamp.toISOString(),
        hour: format(event.timestamp, "HH:mm"),
        sharpness,
        readiness,
        recovery: recovery != null ? Math.round(recovery * 10) / 10 : null,
        reasoningQuality: rq != null ? Math.round(rq * 10) / 10 : null,
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
    todayTaskCompletions,
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
