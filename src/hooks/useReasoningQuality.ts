/**
 * Hook for Reasoning Quality (RQ) metric
 * 
 * RQ measures the QUALITY and EFFICIENCY of reasoning (System 2).
 * It is NOT a skill, does NOT assign XP, and does NOT replace CT or IN.
 * 
 * Components:
 * - S2_Core = S2 = (CT + IN) / 2
 * - S2_Consistency = stability of S2 game scores
 * - Task_Priming = conceptual priming from tasks (podcasts, books, articles)
 * 
 * Updated once daily, with 7-day moving average for Task_Priming.
 */

import { useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { parseISO, startOfDay, differenceInDays } from "date-fns";
import {
  calculateRQ,
  RQResult,
  TaskCompletion,
} from "@/lib/reasoningQuality";

export interface UseReasoningQualityResult {
  // Main RQ value (0-100)
  rq: number;
  
  // Breakdown
  s2Core: number;
  s2Consistency: number;
  taskPriming: number;
  
  // Decay info
  decay: number;
  isDecaying: boolean;
  
  // Persistence
  isPersisted: boolean;
  lastUpdatedAt: Date | null;
  
  // Loading state
  isLoading: boolean;
  
  // Actions
  persistRQ: () => Promise<void>;
}

export function useReasoningQuality(): UseReasoningQualityResult {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  
  const { S2, isLoading: statesLoading } = useCognitiveStates();
  
  // Fetch persisted RQ and tracking dates
  const { data: persistedData, isLoading: persistedLoading } = useQuery({
    queryKey: ["reasoning-quality-persisted", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("reasoning_quality, rq_last_updated_at, last_s2_game_at, last_task_at")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Fetch last 10 S2 game scores
  const { data: s2GameScores, isLoading: scoresLoading } = useQuery({
    queryKey: ["s2-game-scores", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("score, completed_at")
        .eq("user_id", userId)
        .eq("system_type", "S2")
        .order("completed_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Return scores in chronological order (oldest first)
      return (data || [])
        .filter(s => s.score !== null)
        .map(s => Number(s.score))
        .reverse();
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  
  // Fetch last 7 days of task completions
  const { data: taskCompletions, isLoading: tasksLoading } = useQuery({
    queryKey: ["task-completions-7d", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("exercise_id, completed_at")
        .eq("user_id", userId)
        .like("exercise_id", "content-%")
        .gte("completed_at", sevenDaysAgo.toISOString());
      
      if (error) throw error;
      
      return (data || []).map((item): TaskCompletion => {
        // Parse task type from exercise_id (e.g., "content-podcast-123")
        const parts = item.exercise_id.split("-");
        const type = parts[1] as "podcast" | "book" | "article";
        
        return {
          type: type || "article",
          completedAt: parseISO(item.completed_at),
        };
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  
  // Persist RQ mutation
  const persistMutation = useMutation({
    mutationFn: async (rqResult: RQResult) => {
      if (!userId) throw new Error("No user");
      
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          reasoning_quality: rqResult.rq,
          rq_last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reasoning-quality-persisted"] });
    },
  });
  
  // Cached result ref to prevent flicker
  const cachedResultRef = useRef<RQResult | null>(null);
  
  const result = useMemo(() => {
    const isLoading = statesLoading || persistedLoading || scoresLoading || tasksLoading;
    
    if (isLoading && !cachedResultRef.current) {
      return {
        rq: 50,
        s2Core: 50,
        s2Consistency: 50,
        taskPriming: 0,
        decay: 0,
        isDecaying: false,
      };
    }
    
    // Parse dates
    const lastS2GameAt = persistedData?.last_s2_game_at 
      ? parseISO(persistedData.last_s2_game_at) 
      : null;
    const lastTaskAt = persistedData?.last_task_at 
      ? parseISO(persistedData.last_task_at) 
      : null;
    
    const computed = calculateRQ({
      S2,
      s2GameScores: s2GameScores || [],
      taskCompletions: taskCompletions || [],
      lastS2GameAt,
      lastTaskAt,
    });
    
    cachedResultRef.current = computed;
    return computed;
  }, [S2, s2GameScores, taskCompletions, persistedData, statesLoading, persistedLoading, scoresLoading, tasksLoading]);
  
  // Check if today's RQ is already persisted
  const isPersisted = useMemo(() => {
    if (!persistedData?.rq_last_updated_at) return false;
    
    const lastUpdated = parseISO(persistedData.rq_last_updated_at);
    const today = startOfDay(new Date());
    const updateDay = startOfDay(lastUpdated);
    
    return differenceInDays(today, updateDay) === 0;
  }, [persistedData?.rq_last_updated_at]);
  
  const persistRQ = async () => {
    await persistMutation.mutateAsync(result);
  };
  
  return {
    ...result,
    isPersisted,
    lastUpdatedAt: persistedData?.rq_last_updated_at 
      ? parseISO(persistedData.rq_last_updated_at) 
      : null,
    isLoading: statesLoading || persistedLoading || scoresLoading || tasksLoading,
    persistRQ,
  };
}
