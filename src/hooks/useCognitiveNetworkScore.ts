import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { supabase } from "@/integrations/supabase/client";
import { getMediumPeriodStart, getMediumPeriodStartDate } from "@/lib/temporalWindows";
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

interface UseCognitiveNetworkScoreResult {
  sci: SCIBreakdown | null;
  statusText: string;
  level: "elite" | "high" | "moderate" | "developing" | "early";
  bottleneck: BottleneckResult | null;
  isLoading: boolean;
}

// v2.0: Use rolling 7-day window instead of calendar week
function getRollingPeriodStart(): string {
  return getMediumPeriodStartDate();
}

/**
 * Hook to calculate the Synthesized Cognitive Index (SCI)
 * v1.4: Aggregates data from:
 * - user_cognitive_metrics (raw cognitive scores)
 * - weekly XP tracking (games only - tasks don't contribute)
 * - weekly detox + walking data (recovery factor)
 */
export function useCognitiveNetworkScore(): UseCognitiveNetworkScoreResult {
  const { user } = useAuth();
  // v2.0: Use rolling 7-day window
  const rollingStart = getRollingPeriodStart();
  
  // Fetch cognitive metrics
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics(user?.id);
  
  // Fetch weekly progress (games only in v1.3)
  const { 
    weeklyGamesXP, 
    isLoading: progressLoading 
  } = useWeeklyProgress();
  
  // Fetch weekly detox data
  const { data: detoxData, isLoading: detoxLoading } = useWeeklyDetoxXP();
  
  // Fetch weekly walking minutes for correct REC formula - v2.0: rolling window
  const { data: walkingData, isLoading: walkingLoading } = useQuery({
    queryKey: ["weekly-walking-minutes-sci", user?.id, rollingStart],
    queryFn: async () => {
      if (!user?.id) return { totalMinutes: 0 };
      
      // v2.0: Use rolling 7-day window - query by completed_at
      const rollingStartDate = getMediumPeriodStart();
      const { data, error } = await supabase
        .from("walking_sessions")
        .select("duration_minutes, status, completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", rollingStartDate.toISOString());
      
      if (error) throw error;
      
      const totalMinutes = (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      return { totalMinutes };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const isLoading = metricsLoading || progressLoading || detoxLoading || walkingLoading;

  const result = useMemo(() => {
    if (!metrics) {
      return {
        sci: null,
        statusText: "Loading...",
        level: "early" as const,
        bottleneck: null,
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

    // Prepare recovery input (v1.4: includes walking)
    const recoveryInput: RecoveryInput = {
      weeklyDetoxMinutes: detoxData?.totalMinutes ?? 0,
      weeklyWalkMinutes: walkingData?.totalMinutes ?? 0,
      detoxTarget: targets.detoxMinutes,
    };

    // Calculate SCI
    const sci = calculateSCI(cognitiveInput, behavioralInput, recoveryInput);
    const statusText = getSCIStatusText(sci.total);
    const level = getSCILevel(sci.total);
    const bottleneck = identifyBottleneck(sci);

    return { sci, statusText, level, bottleneck };
  }, [metrics, weeklyGamesXP, detoxData, walkingData, user?.trainingPlan]);

  return {
    ...result,
    isLoading,
  };
}
