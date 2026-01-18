/**
 * ============================================
 * NEUROLOOP PRO – S1 DIFFICULTY HOOK v1.0
 * ============================================
 * 
 * Unified hook for S1 game difficulty.
 * Fetches required metrics and computes difficulty options.
 * 
 * Used by: S1AEGameSelector, S1RAGameSelector, game runners
 */

import { useMemo } from "react";
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
}

export function useS1Difficulty(): UseS1DifficultyResult {
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
  
  const isLoading = metricsLoading || tcLoading || progressLoading;
  
  // Compute difficulty result
  const result = useMemo((): S1DifficultyResult => {
    const input: S1DifficultyInput = {
      recovery: recovery ?? 50,
      sharpness: sharpness ?? 50,
      readiness: readiness ?? 50,
      weeklyXP: weeklyXP ?? 0,
      trainingCapacity: trainingCapacity ?? 100,
    };
    
    return computeS1Difficulty(input);
  }, [recovery, sharpness, readiness, weeklyXP, trainingCapacity]);
  
  return {
    ...result,
    isLoading,
    isError: false,
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
} {
  const result = useS1Difficulty();
  
  return {
    difficulty: result.recommended,
    options: result.options,
    isLoading: result.isLoading,
    safetyModeActive: result.safetyModeActive,
  };
}
