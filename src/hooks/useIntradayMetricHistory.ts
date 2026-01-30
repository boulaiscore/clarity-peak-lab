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
  taskType?: 'podcast' | 'book' | 'article'; // For task completions
}

// Task base RQ contributions (before decay)
const TASK_RQ_BASE: Record<string, number> = {
  podcast: 5.0,
  book: 5.5,
  article: 3.5,
};

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

  const isLoading = gamesLoading || detoxLoading || walkingLoading || tasksLoading || midnightLoading || todayMetrics.isLoading || rqLoading;

  // Reconstruct intraday timeline
  const history: IntradayDataPoint[] = useMemo(() => {
    if (isLoading) return [];
    
    // Collect all events with timestamps
    const events: Array<{
      timestamp: Date;
      type: 'game' | 'detox' | 'walking' | 'task' | 'midnight' | 'now';
      recoveryDelta?: number;
      taskType?: 'podcast' | 'book' | 'article';
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
        // Parse task type from exercise_id (e.g., "content-podcast-123")
        const parts = task.exercise_id.split("-");
        const taskType = parts[1] as 'podcast' | 'book' | 'article';
        if (taskType && TASK_RQ_BASE[taskType]) {
          events.push({
            timestamp: parseISO(task.completed_at),
            type: 'task',
            taskType,
          });
        }
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
    
    // Get midnight values from snapshot
    const midnightRec = midnightRecovery?.recovery ?? todayMetrics.recovery;
    const midnightSharpness = midnightRecovery?.sharpness ?? todayMetrics.sharpness;
    const midnightReadiness = midnightRecovery?.readiness ?? todayMetrics.readiness;
    const midnightRQ = midnightRecovery?.reasoningQuality ?? null;
    
    // Calculate how much RQ was gained today from tasks
    // This is the delta between current RQ and midnight RQ
    const totalTaskRQGainToday = todayTaskCompletions?.reduce((sum, task) => {
      const parts = task.exercise_id.split("-");
      const taskType = parts[1] as 'podcast' | 'book' | 'article';
      // Full contribution for tasks completed today (no decay yet)
      return sum + (TASK_RQ_BASE[taskType] || 0) * 0.20; // 0.20 weight from RQ formula
    }, 0) || 0;
    
    // Estimate midnight RQ if not available from snapshot
    const estimatedMidnightRQ = midnightRQ ?? (currentRQ != null ? currentRQ - totalTaskRQGainToday : null);
    
    let currentRecovery = midnightRec;
    let currentRQValue = estimatedMidnightRQ;
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
      
      // Apply RQ gain from task completions
      if (event.type === 'task' && event.taskType && currentRQValue != null) {
        const taskContribution = (TASK_RQ_BASE[event.taskType] || 0) * 0.20;
        currentRQValue = Math.min(100, currentRQValue + taskContribution);
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
