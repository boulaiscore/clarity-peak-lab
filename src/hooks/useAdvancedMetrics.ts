/**
 * Hook for advanced cognitive metrics:
 * - Dual-Process Integration
 * - Cognitive Network (SCI)
 * - Cognitive Age
 * 
 * v1.3: SCI uses only games XP for behavioral engagement
 */

import { useMemo } from "react";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import {
  calculateDualProcessBalance,
  getDualProcessLevel,
  calculateSCI,
  getSCILevel,
  getSCIStatusText,
  calculateCognitiveAge,
  SCIResult,
  CognitiveAgeResult,
} from "@/lib/cognitiveEngine";

export interface UseAdvancedMetricsResult {
  // Dual-Process Integration (0-100)
  dualProcessScore: number;
  dualProcessLevel: "elite" | "good" | "unbalanced";
  
  // Cognitive Network (SCI)
  sci: SCIResult;
  sciLevel: "elite" | "high" | "moderate" | "developing" | "early";
  sciStatusText: string;
  
  // Cognitive Age
  cognitiveAge: CognitiveAgeResult;
  
  // Loading state
  isLoading: boolean;
}

export function useAdvancedMetrics(): UseAdvancedMetricsResult {
  const { user } = useAuth();
  const { states, S1, S2, baseline, isLoading: statesLoading } = useCognitiveStates();
  const { recovery, isLoading: metricsLoading } = useTodayMetrics();
  const { 
    weeklyGamesXP, 
    isLoading: progressLoading 
  } = useWeeklyProgress();
  
  // Get targets from training plan
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  
  const result = useMemo(() => {
    // Calculate Dual-Process Integration
    const dualProcessScore = calculateDualProcessBalance(S1, S2);
    const dualProcessLevel = getDualProcessLevel(dualProcessScore);
    
    // v1.3: Calculate SCI with simplified behavioral engagement
    // BE = games XP only, no tasks XP
    const sci = calculateSCI(
      states,
      {
        weeklyGamesXP: weeklyGamesXP ?? 0,
        xpTargetWeek: plan.xpTargetWeek,
      },
      recovery
    );
    const sciLevel = getSCILevel(sci.total);
    const sciStatusText = getSCIStatusText(sci.total);
    
    // Calculate Cognitive Age
    const cognitiveAge = calculateCognitiveAge(states, baseline);
    
    return {
      dualProcessScore,
      dualProcessLevel,
      sci,
      sciLevel,
      sciStatusText,
      cognitiveAge,
    };
  }, [states, S1, S2, baseline, recovery, weeklyGamesXP, plan]);
  
  return {
    ...result,
    isLoading: statesLoading || metricsLoading || progressLoading,
  };
}
