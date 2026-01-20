/**
 * ============================================
 * NEUROLOOP PRO – S1 DIFFICULTY HOOK v1.5
 * ============================================
 * 
 * Unified hook for S1 game difficulty.
 * Fetches required metrics and computes difficulty options.
 * 
 * v1.5 UPDATE: Now fetches user's training plan from profile
 * and passes it to the difficulty engine for plan-aware suggestions.
 * 
 * Used by: S1AEGameSelector, S1RAGameSelector, game runners
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useTrainingCapacity } from "@/hooks/useTrainingCapacity";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import {
  computeS1Difficulty,
  S1DifficultyResult,
  S1DifficultyInput,
  Difficulty,
  DifficultyOption,
} from "@/lib/s1DifficultyEngine";

export interface UseS1DifficultyResult extends S1DifficultyResult {
  isLoading: boolean;
  isError: boolean;
  trainingPlan: "light" | "expert" | "superhuman";
}

export function useS1Difficulty(): UseS1DifficultyResult {
  const { user } = useAuth();
  
  // Fetch user's training plan from profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-training-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('training_plan')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching training plan:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const trainingPlan = (profileData?.training_plan as "light" | "expert" | "superhuman") || "expert";
  
  // Fetch metrics from existing hooks
  const { 
    recovery, 
    sharpness, 
    readiness, 
    isLoading: metricsLoading 
  } = useTodayMetrics();
  
  const { 
    trainingCapacity, 
    isLoading: tcLoading 
  } = useTrainingCapacity();
  
  const { 
    rawGamesXP: weeklyXP, 
    isLoading: progressLoading 
  } = useCappedWeeklyProgress();
  
  const isLoading = metricsLoading || tcLoading || progressLoading || profileLoading;
  
  // Compute difficulty result
  const result = useMemo((): S1DifficultyResult => {
    const input: S1DifficultyInput = {
      recovery: recovery ?? 50,
      sharpness: sharpness ?? 50,
      readiness: readiness ?? 50,
      weeklyXP: weeklyXP ?? 0,
      trainingCapacity: trainingCapacity ?? 100,
      trainingPlan, // v1.5: Pass training plan to engine
    };
    
    return computeS1Difficulty(input);
  }, [recovery, sharpness, readiness, weeklyXP, trainingCapacity, trainingPlan]);
  
  return {
    ...result,
    isLoading,
    isError: false,
    trainingPlan,
  };
}

/**
 * Convenience hook for just getting difficulty info
 * Returns the recommended difficulty and loading state
 */
export function useS1RecommendedDifficulty(): {
  difficulty: Difficulty;
  options: DifficultyOption[];
  isLoading: boolean;
  safetyModeActive: boolean;
  trainingPlan: "light" | "expert" | "superhuman";
} {
  const result = useS1Difficulty();
  
  return {
    difficulty: result.recommended,
    options: result.options,
    isLoading: result.isLoading,
    safetyModeActive: result.safetyModeActive,
    trainingPlan: result.trainingPlan,
  };
}
