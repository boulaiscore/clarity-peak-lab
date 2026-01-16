import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { 
  calculateSCI, 
  getSCIStatusText, 
  getSCILevel,
  getTargetsForPlan,
  type SCIBreakdown,
  type CognitiveMetricsInput,
  type BehavioralEngagementInput,
  type RecoveryInput,
} from "@/lib/cognitiveNetworkScore";

interface UseCognitiveNetworkScoreResult {
  sci: SCIBreakdown | null;
  statusText: string;
  level: "elite" | "high" | "moderate" | "developing" | "early";
  isLoading: boolean;
}

/**
 * Hook to calculate the Synthesized Cognitive Index (SCI)
 * v1.3: Aggregates data from:
 * - user_cognitive_metrics (raw cognitive scores)
 * - weekly XP tracking (games only - tasks don't contribute)
 * - weekly detox data (recovery factor)
 */
export function useCognitiveNetworkScore(): UseCognitiveNetworkScoreResult {
  const { user } = useAuth();
  
  // Fetch cognitive metrics
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics(user?.id);
  
  // Fetch weekly progress (games only in v1.3)
  const { 
    weeklyGamesXP, 
    isLoading: progressLoading 
  } = useWeeklyProgress();
  
  // Fetch weekly detox data
  const { data: detoxData, isLoading: detoxLoading } = useWeeklyDetoxXP();

  const isLoading = metricsLoading || progressLoading || detoxLoading;

  const result = useMemo(() => {
    if (!metrics) {
      return {
        sci: null,
        statusText: "Loading...",
        level: "early" as const,
      };
    }

    // Get training plan targets
    const trainingPlan = user?.trainingPlan || "expert";
    const targets = getTargetsForPlan(trainingPlan);

    // Prepare cognitive metrics input (v1.3 format)
    const cognitiveInput: CognitiveMetricsInput = {
      focus_stability: metrics.focus_stability ?? 50,      // AE
      fast_thinking: metrics.fast_thinking ?? 50,          // RA
      reasoning_accuracy: metrics.reasoning_accuracy ?? 50, // CT
      slow_thinking: metrics.slow_thinking ?? 50,          // IN
    };

    // Prepare behavioral engagement input (v1.3: games only)
    const behavioralInput: BehavioralEngagementInput = {
      weeklyGamesXP: weeklyGamesXP ?? 0,
      xpTargetWeek: targets.xpTargetWeek,
    };

    // Prepare recovery input
    const recoveryInput: RecoveryInput = {
      weeklyDetoxMinutes: detoxData?.totalMinutes ?? 0,
      detoxTarget: targets.detoxMinutes,
    };

    // Calculate SCI
    const sci = calculateSCI(cognitiveInput, behavioralInput, recoveryInput);
    const statusText = getSCIStatusText(sci.total);
    const level = getSCILevel(sci.total);

    return { sci, statusText, level };
  }, [metrics, weeklyGamesXP, detoxData, user?.trainingPlan]);

  return {
    ...result,
    isLoading,
  };
}
