/**
 * Hook that computes Today's metrics (Sharpness, Readiness, Recovery)
 * using the new cognitive engine formulas.
 * 
 * SHARPNESS = 0.50×S1 + 0.30×AE + 0.20×S2, modulated by Recovery
 * READINESS = 0.35×REC + 0.35×S2 + 0.30×AE (without wearable)
 * RECOVERY = min(100, (detox_min + 0.5×walk_min) / target × 100)
 */

import { useMemo } from "react";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useWeeklyDetoxXP } from "@/hooks/useDetoxProgress";
import { useTodayWalkingMinutes } from "@/hooks/useWalkingTracker";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import {
  calculateSharpness,
  calculateReadiness,
  calculateRecovery,
  calculatePhysioComponent,
  TodayMetrics,
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

export function useTodayMetrics(): UseTodayMetricsResult {
  const { user } = useAuth();
  const { states, S1, S2, isLoading: statesLoading } = useCognitiveStates();
  
  // Get weekly detox minutes
  const { data: detoxData, isLoading: detoxLoading } = useWeeklyDetoxXP();
  const weeklyDetoxMinutes = detoxData?.totalMinutes ?? 0;
  
  // Get walking minutes
  const { data: walkingMinutes = 0, isLoading: walkingLoading } = useTodayWalkingMinutes();
  // NOTE: Walking is currently per-day, but spec says weekly. 
  // For now we use 0 for weekly walk until we have weekly aggregation
  const weeklyWalkMinutes = walkingMinutes; // TODO: Aggregate weekly
  
  // Get wearable data for physio component
  const { wearableSnapshot } = useCognitiveReadiness();
  
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
    isLoading: statesLoading || detoxLoading || walkingLoading,
  };
}
