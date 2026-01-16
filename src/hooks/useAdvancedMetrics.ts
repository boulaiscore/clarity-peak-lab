/**
 * Hook for advanced cognitive metrics:
 * - Dual-Process Integration
 * - Cognitive Network (SCI)
 * - Cognitive Age
 * 
 * v1.4: Now includes decay adjustments:
 * - SCI decays if REC < 40 or no training for 7 days
 * - Dual-Process decays if S1/S2 XP imbalance
 * - Cognitive Age regresses if performance drops ≥10 pts for 21+ days
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { startOfWeek, format, differenceInDays, parseISO } from "date-fns";
import {
  calculateDualProcessBalance,
  getDualProcessLevel,
  calculateSCI,
  getSCILevel,
  getSCIStatusText,
  calculateCognitiveAge,
  calculateSCIDecay,
  calculateDualProcessDecay,
  calculateCognitiveAgeRegression,
  clamp,
  SCIResult,
  CognitiveAgeResult,
} from "@/lib/cognitiveEngine";

export interface UseAdvancedMetricsResult {
  // Dual-Process Integration (0-100) - with decay
  dualProcessScore: number;
  dualProcessLevel: "elite" | "good" | "unbalanced";
  dualProcessDecay: number;
  
  // Cognitive Network (SCI) - with decay
  sci: SCIResult;
  sciLevel: "elite" | "high" | "moderate" | "developing" | "early";
  sciStatusText: string;
  sciDecay: number;
  
  // Cognitive Age - with regression
  cognitiveAge: CognitiveAgeResult;
  cognitiveAgeRegression: number;
  
  // Tracking data
  daysSinceLastTraining: number;
  
  // Loading state
  isLoading: boolean;
}

function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

export function useAdvancedMetrics(): UseAdvancedMetricsResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const weekStart = getCurrentWeekStart();
  
  const { states, S1, S2, baseline, isLoading: statesLoading } = useCognitiveStates();
  const { recovery, isLoading: metricsLoading } = useTodayMetrics();
  const { 
    weeklyGamesXP, 
    isLoading: progressLoading 
  } = useWeeklyProgress();
  
  // Get targets from training plan
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  
  // Fetch last training date for SCI decay
  const { data: lastTrainingData, isLoading: trainingLoading } = useQuery({
    queryKey: ["last-training-date", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: gameData } = await supabase
        .from("game_sessions")
        .select("completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const { data: gymData } = await supabase
        .from("neuro_gym_sessions")
        .select("completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!gameData?.completed_at && !gymData?.completed_at) return null;
      if (!gameData?.completed_at) return gymData?.completed_at;
      if (!gymData?.completed_at) return gameData?.completed_at;
      
      return gameData.completed_at > gymData.completed_at 
        ? gameData.completed_at 
        : gymData.completed_at;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  
  // Fetch weekly XP by system for dual-process decay
  const { data: weeklyXPData, isLoading: xpLoading } = useQuery({
    queryKey: ["weekly-system-xp", userId, weekStart],
    queryFn: async () => {
      if (!userId) return { s1XP: 0, s2XP: 0 };
      
      const { data } = await supabase
        .from("game_sessions")
        .select("xp_awarded, system_type")
        .eq("user_id", userId)
        .gte("completed_at", `${weekStart}T00:00:00`);
      
      let s1XP = 0;
      let s2XP = 0;
      
      (data || []).forEach((session) => {
        if (session.system_type === "S1") {
          s1XP += session.xp_awarded || 0;
        } else {
          s2XP += session.xp_awarded || 0;
        }
      });
      
      return { s1XP, s2XP };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Fetch decay tracking data
  const { data: decayData, isLoading: decayLoading } = useQuery({
    queryKey: ["decay-tracking-advanced", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data } = await supabase
        .from("user_cognitive_metrics")
        .select(`
          sci_decay_applied,
          sci_decay_week_start,
          dual_process_decay_applied,
          dual_process_decay_week_start,
          performance_avg_window_start_value,
          consecutive_performance_drop_days
        `)
        .eq("user_id", userId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  const result = useMemo(() => {
    const today = new Date();
    
    // Calculate days since last training
    let daysSinceLastTraining = 30; // Default to max if no training
    if (lastTrainingData) {
      const lastDate = parseISO(lastTrainingData);
      daysSinceLastTraining = differenceInDays(today, lastDate);
    }
    
    // Base Dual-Process Integration
    const baseDualProcessScore = calculateDualProcessBalance(S1, S2);
    
    // Calculate dual-process decay
    const dpDecayWeekStart = decayData?.dual_process_decay_week_start;
    const currentDPDecayApplied = 
      dpDecayWeekStart === weekStart 
        ? (decayData?.dual_process_decay_applied ?? 0) 
        : 0;
    
    const dualProcessDecay = calculateDualProcessDecay({
      weeklyS1XP: weeklyXPData?.s1XP ?? 0,
      weeklyS2XP: weeklyXPData?.s2XP ?? 0,
      currentDecayApplied: currentDPDecayApplied,
    });
    
    const dualProcessScore = clamp(baseDualProcessScore - dualProcessDecay, 0, 100);
    const dualProcessLevel = getDualProcessLevel(dualProcessScore);
    
    // Calculate base SCI
    const baseSCI = calculateSCI(
      states,
      {
        weeklyGamesXP: weeklyGamesXP ?? 0,
        xpTargetWeek: plan.xpTargetWeek,
      },
      recovery
    );
    
    // Calculate SCI decay
    const sciDecayWeekStart = decayData?.sci_decay_week_start;
    const currentSCIDecayApplied = 
      sciDecayWeekStart === weekStart 
        ? (decayData?.sci_decay_applied ?? 0) 
        : 0;
    
    const sciDecay = calculateSCIDecay({
      recovery,
      daysSinceLastTraining,
      currentDecayApplied: currentSCIDecayApplied,
    });
    
    // Apply SCI decay
    const sci: SCIResult = {
      ...baseSCI,
      total: clamp(baseSCI.total - sciDecay, 0, 100),
    };
    
    const sciLevel = getSCILevel(sci.total);
    const sciStatusText = getSCIStatusText(sci.total);
    
    // Calculate base Cognitive Age
    const baseCognitiveAge = calculateCognitiveAge(states, baseline);
    
    // Calculate cognitive age regression
    const cognitiveAgeRegression = calculateCognitiveAgeRegression({
      currentPerformanceAvg: baseCognitiveAge.performanceAvg,
      windowStartPerformanceAvg: decayData?.performance_avg_window_start_value 
        ? Number(decayData.performance_avg_window_start_value) 
        : null,
      consecutiveDropDays: decayData?.consecutive_performance_drop_days ?? 0,
    });
    
    // Apply cognitive age regression
    const cognitiveAge: CognitiveAgeResult = {
      ...baseCognitiveAge,
      cognitiveAge: baseCognitiveAge.cognitiveAge + cognitiveAgeRegression,
      delta: baseCognitiveAge.delta - cognitiveAgeRegression,
    };
    
    return {
      dualProcessScore,
      dualProcessLevel,
      dualProcessDecay,
      sci,
      sciLevel,
      sciStatusText,
      sciDecay,
      cognitiveAge,
      cognitiveAgeRegression,
      daysSinceLastTraining,
    };
  }, [states, S1, S2, baseline, recovery, weeklyGamesXP, plan, lastTrainingData, weeklyXPData, decayData, weekStart]);
  
  return {
    ...result,
    isLoading: statesLoading || metricsLoading || progressLoading || trainingLoading || xpLoading || decayLoading,
  };
}
