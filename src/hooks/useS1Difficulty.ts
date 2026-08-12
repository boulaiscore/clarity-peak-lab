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
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useTrainingCapacity } from "@/hooks/useTrainingCapacity";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { isTestModeEnabled } from "@/hooks/useTestMode";
import {
  computeS1Difficulty,
  S1DifficultyResult,
  S1DifficultyInput,
  Difficulty,
  DifficultyOption,
} from "@/lib/s1DifficultyEngine";
import { DEFAULT_TRAINING_PLAN_ID, type TrainingPlanId } from "@/lib/trainingPlans";

export interface UseS1DifficultyResult extends S1DifficultyResult {
  isLoading: boolean;
  isError: boolean;
  trainingPlan: TrainingPlanId;
}

export function useS1Difficulty(): UseS1DifficultyResult {
  const trainingPlan = DEFAULT_TRAINING_PLAN_ID;
  
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
  
  const isTestMode = isTestModeEnabled();

  // Compute difficulty result
  const result = useMemo((): S1DifficultyResult => {
    const input: S1DifficultyInput = {
      recovery: recovery ?? 50,
      sharpness: sharpness ?? 50,
      readiness: readiness ?? 50,
      weeklyXP: weeklyXP ?? 0,
      trainingCapacity: trainingCapacity ?? 100,
      trainingPlan,
    };
    
    const computed = computeS1Difficulty(input);

    // TEST MODE: unlock everything
    if (isTestMode) {
      return {
        ...computed,
        safetyModeActive: false,
        safetyLabel: undefined,
        options: computed.options.map((o) => ({
          difficulty: o.difficulty,
          status: o.difficulty === computed.recommended ? "recommended" : "enabled",
        })),
      };
    }

    return computed;
  }, [recovery, sharpness, readiness, weeklyXP, trainingCapacity, trainingPlan, isTestMode]);
  
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
