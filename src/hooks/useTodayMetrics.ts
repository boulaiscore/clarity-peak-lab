/**
 * Hook that computes Today's metrics (Sharpness, Readiness, Recovery)
 * using the new cognitive engine formulas.
 * 
 * ⚠️ CRITICAL: This hook follows the MANDATORY computation order (Section D):
 * 
 * 1. Load persistent skills: AE, RA, CT, IN (from useCognitiveStates)
 * 2. Compute aggregates: S1 = (AE+RA)/2, S2 = (CT+IN)/2 (from useCognitiveStates)
 * 3. Compute Recovery: REC = min(100, (detox + 0.5×walk) / target × 100)
 * 4. Compute Sharpness and Readiness from skill values and Recovery
 * 
 * METRICS READ ONLY FROM PERSISTENT SKILL STATE:
 * - NEVER from per-session game data (accuracy, reaction time, score)
 * - NEVER from baseline session records
 * 
 * SHARPNESS = 0.50×S1 + 0.30×AE + 0.20×S2, modulated by Recovery
 * READINESS = 0.35×REC + 0.35×S2 + 0.30×AE (without wearable)
 * RECOVERY = min(100, (detox_min + 0.5×walk_min) / target × 100)
 * 
 * DATA SOURCES:
 * - Cognitive States (AE, RA, CT, IN): from user_cognitive_metrics table
 * - Detox Minutes: from detox_completions table (weekly aggregate)
 * - Walking Minutes: from walking_sessions table (weekly aggregate)
 * - Wearable Data: from wearable_snapshots table
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { startOfWeek, format } from "date-fns";
import {
  calculateSharpness,
  calculateReadiness,
  calculateRecovery,
  calculatePhysioComponent,
} from "@/lib/cognitiveEngine";

export interface UseTodayMetricsResult {
  // Today metrics (0-100)
  sharpness: number;
  readiness: number;
  recovery: number;
  
  // Underlying cognitive states
  AE: number;
  RA: number;
  CT: number;
  IN: number;
  S1: number;
  S2: number;
  
  // Recovery breakdown (minutes)
  weeklyDetoxMinutes: number;
  weeklyWalkMinutes: number;
  detoxTarget: number;
  
  // Status
  hasWearableData: boolean;
  isLoading: boolean;
}

function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

export function useTodayMetrics(): UseTodayMetricsResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const weekStart = getCurrentWeekStart();
  const today = new Date().toISOString().split("T")[0];
  
  const { states, S1, S2, isLoading: statesLoading } = useCognitiveStates();
  
  // Fetch weekly detox minutes from detox_completions
  const { data: detoxData, isLoading: detoxLoading } = useQuery({
    queryKey: ["weekly-detox-minutes", userId, weekStart],
    queryFn: async () => {
      if (!userId) return { totalMinutes: 0 };
      
      const { data, error } = await supabase
        .from("detox_completions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .eq("week_start", weekStart);
      
      if (error) throw error;
      
      const totalMinutes = (data || []).reduce((sum, c) => sum + (c.duration_minutes || 0), 0);
      return { totalMinutes };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Fetch weekly walking minutes from walking_sessions
  const { data: walkingData, isLoading: walkingLoading } = useQuery({
    queryKey: ["weekly-walking-minutes", userId, weekStart],
    queryFn: async () => {
      if (!userId) return { totalMinutes: 0 };
      
      const { data, error } = await supabase
        .from("walking_sessions")
        .select("duration_minutes, status, completed_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", `${weekStart}T00:00:00`);
      
      if (error) throw error;
      
      const totalMinutes = (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      return { totalMinutes };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Fetch today's wearable snapshot
  const { data: wearableSnapshot, isLoading: wearableLoading } = useQuery({
    queryKey: ["wearable-snapshot", userId, today],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("wearable_snapshots")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  
  const weeklyDetoxMinutes = detoxData?.totalMinutes ?? 0;
  const weeklyWalkMinutes = walkingData?.totalMinutes ?? 0;
  
  // Get detox target from training plan
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  const detoxTarget = plan?.detox?.weeklyMinutes ?? 60;
  
  const result = useMemo(() => {
    // Calculate Recovery (REC)
    const recovery = calculateRecovery({
      weeklyDetoxMinutes,
      weeklyWalkMinutes,
      detoxTarget,
    });
    
    // Calculate Physio component (if wearable data available)
    const physioComponent = wearableSnapshot ? calculatePhysioComponent({
      hrvMs: wearableSnapshot.hrv_ms ?? null,
      restingHr: wearableSnapshot.resting_hr ?? null,
      sleepDurationMin: wearableSnapshot.sleep_duration_min ?? null,
      sleepEfficiency: wearableSnapshot.sleep_efficiency ?? null,
    }) : null;
    
    // Calculate Sharpness
    const sharpness = calculateSharpness(states, recovery);
    
    // Calculate Readiness
    const readiness = calculateReadiness(states, recovery, physioComponent);
    
    return {
      sharpness,
      readiness,
      recovery,
      hasWearableData: !!wearableSnapshot,
    };
  }, [states, weeklyDetoxMinutes, weeklyWalkMinutes, detoxTarget, wearableSnapshot]);
  
  return {
    ...result,
    AE: states.AE,
    RA: states.RA,
    CT: states.CT,
    IN: states.IN,
    S1,
    S2,
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
    detoxTarget,
    isLoading: statesLoading || detoxLoading || walkingLoading || wearableLoading,
  };
}
