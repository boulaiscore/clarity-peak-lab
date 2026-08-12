import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { 
  calculateSCI, 
  getSCIStatusText, 
  getSCILevel,
  getTargetsForPlan,
  identifyBottleneck,
  type SCIBreakdown,
  type CognitiveMetricsInput,
  type BehavioralEngagementInput,
  type RecoveryInput,
  type BottleneckResult,
} from "@/lib/cognitiveNetworkScore";
import { DEFAULT_TRAINING_PLAN_ID } from "@/lib/trainingPlans";

interface UseCognitiveNetworkScoreResult {
  sci: SCIBreakdown | null;
  statusText: string;
  level: "elite" | "high" | "moderate" | "developing" | "early";
  bottleneck: BottleneckResult | null;
  isLoading: boolean;
}

/**
 * Hook to calculate the Synthesized Cognitive Index (SCI)
 * v2.0: Aggregates data from the same canonical sources as Today:
 * - effective cognitive states (including inactivity decay)
 * - weekly XP tracking (games only - tasks don't contribute)
 * - Recovery v2 (the same value shown in Today)
 */
export function useCognitiveNetworkScore(): UseCognitiveNetworkScoreResult {
  const { user, session } = useAuth();
  const activeUser = user ?? session?.user;
  
  const { states, isLoading: statesLoading } = useCognitiveStates();
  const { recovery, isLoading: todayMetricsLoading } = useTodayMetrics();
  
  // Fetch weekly progress (games only in v1.3)
  const { 
    weeklyGamesXP, 
    isLoading: progressLoading 
  } = useWeeklyProgress();
  
  const isLoading = statesLoading || todayMetricsLoading || progressLoading;

  const result = useMemo(() => {
    if (!activeUser) {
      return {
        sci: null,
        statusText: "Loading...",
        level: "early" as const,
        bottleneck: null,
      };
    }

    // Get training plan targets
    const targets = getTargetsForPlan(DEFAULT_TRAINING_PLAN_ID);

    // Prepare cognitive metrics input (v1.3 format)
    const cognitiveInput: CognitiveMetricsInput = {
      focus_stability: states.AE,
      fast_thinking: states.RA,
      reasoning_accuracy: states.CT,
      slow_thinking: states.IN,
    };

    // Prepare behavioral engagement input (v1.3: games only)
    const behavioralInput: BehavioralEngagementInput = {
      weeklyGamesXP: weeklyGamesXP ?? 0,
      xpTargetWeek: targets.xpTargetWeek,
    };

    // Prepare Recovery input from the canonical v2 engine.
    const recoveryInput: RecoveryInput = {
      recovery,
    };

    // Calculate SCI
    const sci = calculateSCI(cognitiveInput, behavioralInput, recoveryInput);
    const statusText = getSCIStatusText(sci.total);
    const level = getSCILevel(sci.total);
    const bottleneck = identifyBottleneck(sci);

    return { sci, statusText, level, bottleneck };
  }, [activeUser, states, weeklyGamesXP, recovery]);

  return {
    ...result,
    isLoading,
  };
}
