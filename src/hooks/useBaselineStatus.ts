/**
 * Hook to check if user has completed baseline calibration
 * Updated for v1.3 baseline engine with demographic + calibration baselines
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CalibrationStatus } from "@/lib/baselineEngine";

export interface BaselineStatus {
  isCalibrated: boolean;
  calibrationStatus: CalibrationStatus;
  baselineCapturedAt: string | null;
  isEstimated: boolean;
  
  // Effective baselines (floor for decay)
  AE0_eff: number | null;
  RA0_eff: number | null;
  CT0_eff: number | null;
  IN0_eff: number | null;
  
  // Calibration baselines (if completed)
  AE0_cal: number | null;
  RA0_cal: number | null;
  CT0_cal: number | null;
  IN0_cal: number | null;
  
  // Demographic baselines
  AE0_demo: number | null;
  RA0_demo: number | null;
  CT0_demo: number | null;
  IN0_demo: number | null;
  
  // Legacy accessors (mapped to effective)
  AE0: number | null;
  RA0: number | null;
  CT0: number | null;
  IN0: number | null;
  
  isLoading: boolean;
}

export function useBaselineStatus(): BaselineStatus {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ["baseline-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select(`
          baseline_captured_at,
          calibration_status,
          baseline_is_estimated,
          baseline_eff_focus,
          baseline_eff_fast_thinking,
          baseline_eff_reasoning,
          baseline_eff_slow_thinking,
          baseline_cal_focus,
          baseline_cal_fast_thinking,
          baseline_cal_reasoning,
          baseline_cal_slow_thinking,
          baseline_demo_focus,
          baseline_demo_fast_thinking,
          baseline_demo_reasoning,
          baseline_demo_slow_thinking,
          baseline_focus,
          baseline_fast_thinking,
          baseline_reasoning,
          baseline_slow_thinking
        `)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });
  
  // Get calibration status with fallback logic
  const calibrationStatus: CalibrationStatus = 
    (data?.calibration_status as CalibrationStatus) ?? 
    (data?.baseline_captured_at ? "completed" : "not_started");
  
  // Use effective baseline, fallback to legacy baseline columns
  const AE0_eff = data?.baseline_eff_focus ?? data?.baseline_focus ?? null;
  const RA0_eff = data?.baseline_eff_fast_thinking ?? data?.baseline_fast_thinking ?? null;
  const CT0_eff = data?.baseline_eff_reasoning ?? data?.baseline_reasoning ?? null;
  const IN0_eff = data?.baseline_eff_slow_thinking ?? data?.baseline_slow_thinking ?? null;
  
  return {
    isCalibrated: !!data?.baseline_captured_at,
    calibrationStatus,
    baselineCapturedAt: data?.baseline_captured_at ?? null,
    isEstimated: data?.baseline_is_estimated ?? true,
    
    // Effective baselines
    AE0_eff,
    RA0_eff,
    CT0_eff,
    IN0_eff,
    
    // Calibration baselines
    AE0_cal: data?.baseline_cal_focus ?? null,
    RA0_cal: data?.baseline_cal_fast_thinking ?? null,
    CT0_cal: data?.baseline_cal_reasoning ?? null,
    IN0_cal: data?.baseline_cal_slow_thinking ?? null,
    
    // Demographic baselines
    AE0_demo: data?.baseline_demo_focus ?? null,
    RA0_demo: data?.baseline_demo_fast_thinking ?? null,
    CT0_demo: data?.baseline_demo_reasoning ?? null,
    IN0_demo: data?.baseline_demo_slow_thinking ?? null,
    
    // Legacy accessors (mapped to effective)
    AE0: AE0_eff,
    RA0: RA0_eff,
    CT0: CT0_eff,
    IN0: IN0_eff,
    
    isLoading,
  };
}
