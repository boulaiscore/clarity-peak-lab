/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY EFFECTIVE HOOK
 * ============================================
 * 
 * Provides REC_effective for gating and difficulty decisions.
 * 
 * Rules:
 * - IF real recovery data exists (REC_raw > 0): use REC_raw
 * - ELSE: use RRI (Recovery Readiness Init) if valid
 * 
 * REC_effective is used ONLY for:
 * - Games gating (System 1 vs System 2 access)
 * - Difficulty suggestion
 * - UX feedback (locks, hints, warnings)
 * 
 * REC_effective MUST NOT be used for:
 * - Sharpness base calculation
 * - SCI (Cognitive Network Score)
 * - Cognitive Age
 * - Skill values (AE, RA, CT, IN)
 * - Any decay logic
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { isRRIValid } from "@/lib/recoveryReadinessInit";

export interface UseRecoveryEffectiveResult {
  /** The effective recovery value for gating (0-100) */
  recoveryEffective: number;
  
  /** True if using RRI (initial estimate), false if using real recovery data */
  isUsingRRI: boolean;
  
  /** The raw recovery value from detox/walk (may be 0) */
  recoveryRaw: number;
  
  /** The RRI value from onboarding (if set) */
  rriValue: number | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Whether user has completed their first recovery activity */
  hasRealRecoveryData: boolean;
}

export function useRecoveryEffective(): UseRecoveryEffectiveResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  
  // Get raw recovery from useTodayMetrics
  const { 
    recovery: recoveryRaw, 
    weeklyDetoxMinutes, 
    weeklyWalkMinutes,
    isLoading: metricsLoading 
  } = useTodayMetrics();
  
  // Fetch RRI data from profile
  const { data: rriData, isLoading: rriLoading } = useQuery({
    queryKey: ["rri-data", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("rri_value, rri_set_at")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("[useRecoveryEffective] Error fetching RRI:", error);
        return null;
      }
      
      console.log("[useRecoveryEffective] RRI data from DB:", data);
      return data as { rri_value: number | null; rri_set_at: string | null } | null;
    },
    enabled: !!userId,
    staleTime: 60_000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  const isLoading = metricsLoading || rriLoading;
  
  // Determine if real recovery data exists
  // Real data = any detox or walking minutes this week
  const hasRealRecoveryData = (weeklyDetoxMinutes > 0 || weeklyWalkMinutes > 0);
  
  // Compute effective recovery
  const result = useMemo((): Omit<UseRecoveryEffectiveResult, 'isLoading'> => {
    const rriValue = rriData?.rri_value ?? null;
    const rriSetAt = rriData?.rri_set_at ?? null;
    const rriValid = rriValue !== null && isRRIValid(rriSetAt);
    
    console.log("[useRecoveryEffective] Computing:", {
      hasRealRecoveryData,
      rriValue,
      rriValid,
      recoveryRaw,
      weeklyDetoxMinutes,
      weeklyWalkMinutes,
    });
    
    // Rule: If real recovery data exists, use it
    if (hasRealRecoveryData) {
      console.log("[useRecoveryEffective] Using REC_raw:", recoveryRaw);
      return {
        recoveryEffective: recoveryRaw,
        isUsingRRI: false,
        recoveryRaw,
        rriValue,
        hasRealRecoveryData: true,
      };
    }
    
    // No real data - use RRI if valid
    if (rriValid && rriValue !== null) {
      console.log("[useRecoveryEffective] Using RRI:", rriValue);
      return {
        recoveryEffective: rriValue,
        isUsingRRI: true,
        recoveryRaw,
        rriValue,
        hasRealRecoveryData: false,
      };
    }
    
    // No RRI either - default to recoveryRaw (which will be 0)
    console.log("[useRecoveryEffective] No RRI, using raw:", recoveryRaw);
    return {
      recoveryEffective: recoveryRaw,
      isUsingRRI: false,
      recoveryRaw,
      rriValue,
      hasRealRecoveryData: false,
    };
  }, [recoveryRaw, hasRealRecoveryData, rriData, weeklyDetoxMinutes, weeklyWalkMinutes]);
  
  return {
    ...result,
    isLoading,
  };
}
