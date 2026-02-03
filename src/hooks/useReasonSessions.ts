/**
 * Hook for Reason Sessions (Reading/Listening) - Strava-style tracking
 * 
 * Tracks timed sessions with:
 * - LOOMA curated content OR custom items
 * - Duration-based weighted scoring
 * - Anti-cheat soft (background detection)
 * - RQ contribution via hybrid formula
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay, subDays } from "date-fns";

// Types
export type SessionType = "reading" | "listening";
export type SessionSource = "looma_list" | "custom";
export type ProofLevel = "timer_only" | "timer_foreground";

export interface ReasonSession {
  id: string;
  user_id: string;
  session_type: SessionType;
  source: SessionSource;
  item_id: string | null;
  custom_title: string | null;
  custom_author: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  weight: number;
  proof_level: ProofLevel;
  background_interrupts: number;
  is_valid_for_rq: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewReasonSession {
  session_type: SessionType;
  source: SessionSource;
  item_id?: string;
  custom_title?: string;
  custom_author?: string;
  weight?: number;
}

export interface CompleteSessionData {
  sessionId: string;
  ended_at: string;
  duration_seconds: number;
  proof_level: ProofLevel;
  background_interrupts: number;
  is_valid_for_rq: boolean;
}

// Constants
const MIN_VALID_DURATION_SECONDS = 5 * 60; // 5 minutes minimum for RQ

// Weight calculation for custom items
export function calculateCustomWeight(difficulty: number, focus: number): number {
  // Both inputs 1-5, output 0.8-1.6
  // Formula: base 0.8 + (avg(difficulty, focus) - 1) / 4 * 0.8
  const avg = (difficulty + focus) / 2;
  const weight = 0.8 + ((avg - 1) / 4) * 0.8;
  return Math.round(weight * 100) / 100;
}

// Default weights for LOOMA list items by type
export const LOOMA_ITEM_WEIGHTS: Record<string, number> = {
  podcast: 1.0,
  book: 1.4,
  article: 1.2,
  reading: 1.2,
};

// Start a new reason session
export function useStartReasonSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: NewReasonSession): Promise<ReasonSession> => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("reason_sessions")
        .insert({
          user_id: user.id,
          session_type: session.session_type,
          source: session.source,
          item_id: session.item_id || null,
          custom_title: session.custom_title || null,
          custom_author: session.custom_author || null,
          weight: session.weight || 1.0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ReasonSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reason-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-reason-session"] });
    },
  });
}

// Complete a reason session
export function useCompleteReasonSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CompleteSessionData): Promise<ReasonSession> => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Check if duration meets minimum threshold
      const isValid = data.duration_seconds >= MIN_VALID_DURATION_SECONDS;
      
      const { data: session, error } = await supabase
        .from("reason_sessions")
        .update({
          ended_at: data.ended_at,
          duration_seconds: data.duration_seconds,
          proof_level: data.proof_level,
          background_interrupts: data.background_interrupts,
          is_valid_for_rq: isValid && data.is_valid_for_rq,
        })
        .eq("id", data.sessionId)
        .eq("user_id", user.id)
        .select()
        .single();
      
      if (error) throw error;
      return session as ReasonSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reason-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-reason-session"] });
      queryClient.invalidateQueries({ queryKey: ["reason-session-stats"] });
      queryClient.invalidateQueries({ queryKey: ["hybrid-rq-data"] });
    },
  });
}

// Get active (incomplete) reason session
export function useActiveReasonSession() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["active-reason-session", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("reason_sessions")
        .select("*")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as ReasonSession | null;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Check every 30s for sync across devices
  });
}

// Get reason sessions for a date range
export function useReasonSessions(days: number = 7) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["reason-sessions", user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from("reason_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("started_at", startDate.toISOString())
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false });
      
      if (error) throw error;
      return data as ReasonSession[];
    },
    enabled: !!user?.id,
  });
}

// Get aggregated stats for Reading Load dashboard
export interface ReasonSessionStats {
  today: { totalMinutes: number; weightedMinutes: number; sessions: number };
  week: { totalMinutes: number; weightedMinutes: number; sessions: number };
  month: { totalMinutes: number; weightedMinutes: number; sessions: number };
  byType: {
    reading: { minutes: number; sessions: number };
    listening: { minutes: number; sessions: number };
  };
  avgWeight: number;
  validForRQ: number;
}

export function useReasonSessionStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["reason-session-stats", user?.id],
    queryFn: async (): Promise<ReasonSessionStats> => {
      if (!user?.id) {
        return getEmptyStats();
      }
      
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data, error } = await supabase
        .from("reason_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("started_at", thirtyDaysAgo.toISOString())
        .not("ended_at", "is", null);
      
      if (error) throw error;
      
      const sessions = (data || []) as ReasonSession[];
      return calculateStats(sessions);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

function getEmptyStats(): ReasonSessionStats {
  return {
    today: { totalMinutes: 0, weightedMinutes: 0, sessions: 0 },
    week: { totalMinutes: 0, weightedMinutes: 0, sessions: 0 },
    month: { totalMinutes: 0, weightedMinutes: 0, sessions: 0 },
    byType: {
      reading: { minutes: 0, sessions: 0 },
      listening: { minutes: 0, sessions: 0 },
    },
    avgWeight: 1.0,
    validForRQ: 0,
  };
}

function calculateStats(sessions: ReasonSession[]): ReasonSessionStats {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = subDays(now, 7);
  
  const stats = getEmptyStats();
  let totalWeight = 0;
  let weightCount = 0;
  
  for (const session of sessions) {
    const startedAt = new Date(session.started_at);
    const minutes = session.duration_seconds / 60;
    const weightedMinutes = minutes * session.weight;
    
    // Month (all sessions in query are within 30 days)
    stats.month.totalMinutes += minutes;
    stats.month.weightedMinutes += weightedMinutes;
    stats.month.sessions++;
    
    // Week
    if (startedAt >= weekStart) {
      stats.week.totalMinutes += minutes;
      stats.week.weightedMinutes += weightedMinutes;
      stats.week.sessions++;
    }
    
    // Today
    if (startedAt >= todayStart) {
      stats.today.totalMinutes += minutes;
      stats.today.weightedMinutes += weightedMinutes;
      stats.today.sessions++;
    }
    
    // By type
    if (session.session_type === "reading") {
      stats.byType.reading.minutes += minutes;
      stats.byType.reading.sessions++;
    } else {
      stats.byType.listening.minutes += minutes;
      stats.byType.listening.sessions++;
    }
    
    // Valid for RQ
    if (session.is_valid_for_rq) {
      stats.validForRQ++;
    }
    
    totalWeight += session.weight;
    weightCount++;
  }
  
  stats.avgWeight = weightCount > 0 ? totalWeight / weightCount : 1.0;
  
  return stats;
}

// Abort an active session without saving
export function useAbortReasonSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("reason_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reason-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["active-reason-session"] });
    },
  });
}

// Get data for hybrid RQ calculation
// Combines LOOMA list completions + custom session weighted minutes
export function useHybridRQData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["hybrid-rq-data", user?.id],
    queryFn: async () => {
      if (!user?.id) return { loomaCompletions: 0, customWeightedMinutes: 0 };
      
      const sevenDaysAgo = subDays(new Date(), 7);
      
      // Get LOOMA list completions (existing system)
      const { data: completions, error: completionsError } = await supabase
        .from("exercise_completions")
        .select("exercise_id, completed_at")
        .eq("user_id", user.id)
        .like("exercise_id", "content-%")
        .gte("completed_at", sevenDaysAgo.toISOString());
      
      if (completionsError) throw completionsError;
      
      // Get custom reason sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("reason_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("source", "custom")
        .eq("is_valid_for_rq", true)
        .gte("started_at", sevenDaysAgo.toISOString())
        .not("ended_at", "is", null);
      
      if (sessionsError) throw sessionsError;
      
      // Calculate LOOMA completions score (existing logic)
      let loomaCompletions = (completions || []).length;
      
      // Calculate custom weighted minutes
      let customWeightedMinutes = 0;
      for (const session of (sessions || []) as ReasonSession[]) {
        const minutes = session.duration_seconds / 60;
        customWeightedMinutes += minutes * session.weight;
      }
      
      return {
        loomaCompletions,
        customWeightedMinutes,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });
}
