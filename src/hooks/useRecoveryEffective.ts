/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY EFFECTIVE HOOK v2.0
 * ============================================
 * 
 * Provides REC_effective for gating and difficulty decisions.
 * 
 * v2.0 CHANGES:
 * - Uses new continuous decay model (rec_value, rec_last_ts)
 * - Falls back to RRI for new users without baseline
 * - Applies decay automatically on each read
 * 
 * REC_effective is used ONLY for:
 * - Games gating (System 1 vs System 2 access)
 * - Difficulty suggestion
 * - UX feedback (locks, hints, warnings)
 * 
 * REC_effective MUST NOT be used for:
 * - Sharpness base calculation (uses raw rec_value)
 * - SCI (Cognitive Network Score)
 * - Cognitive Age
 * - Skill values (AE, RA, CT, IN)
 * - Any decay logic
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEnsureRecoveryBaseline } from "@/hooks/useEnsureRecoveryBaseline";
import { getCurrentRecovery, hasValidRecoveryData, RecoveryState } from "@/lib/recoveryV2";
import { isRRIValid } from "@/lib/recoveryReadinessInit";
import { getMediumPeriodStart } from "@/lib/temporalWindows";

export interface UseRecoveryEffectiveResult {
  /** The effective recovery value for gating (0-100) */
  recoveryEffective: number;
  
  /** True if using RRI (initial estimate), false if using real recovery data */
  isUsingRRI: boolean;
  
  /** True if Recovery v2.0 is initialized (has_recovery_baseline) */
  isV2Initialized: boolean;
  
  /** The raw recovery value from v2 decay model (may be null) */
  recoveryV2: number | null;
  
  /** The RRI value from onboarding (if set) */
  rriValue: number | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Whether user has any recovery data */
  hasRecoveryData: boolean;
  
  /** Weekly minutes for UI breakdown */
  weeklyDetoxMinutes: number;
  weeklyWalkMinutes: number;
}

export function useRecoveryEffective(): UseRecoveryEffectiveResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const hasUser = !!userId;

  // Ensure new accounts are bootstrapped with a Recovery baseline.
  // This prevents the UI from ever falling back to 0 due to missing DB rows.
  const { isBootstrapping } = useEnsureRecoveryBaseline();
  
  // Fetch Recovery v2 state from user_cognitive_metrics
  const { data: v2State, isLoading: v2Loading } = useQuery({
    queryKey: ["recovery-v2-state", userId],
    queryFn: async (): Promise<RecoveryState | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("rec_value, rec_last_ts, has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("[useRecoveryEffective] Error fetching v2 state:", error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        recValue: data.rec_value as number | null,
        recLastTs: data.rec_last_ts as string | null,
        hasRecoveryBaseline: data.has_recovery_baseline ?? false,
      };
    },
    enabled: hasUser,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Fetch RRI data from profile (fallback)
  const { data: rriData, isLoading: rriLoading } = useQuery({
    queryKey: ["rri-data", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("rri_value, rri_set_at")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) return null;
      return data as { rri_value: number | null; rri_set_at: string | null } | null;
    },
    enabled: hasUser,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  // Fetch weekly breakdown for UI display (v2.0: still useful for breakdown)
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-recovery-breakdown", userId],
    queryFn: async () => {
      if (!userId) return { detoxMinutes: 0, walkMinutes: 0 };
      
      const rollingStartDate = getMediumPeriodStart();
      
      // Parallel queries for detox and walking
      const [detoxResult, walkResult] = await Promise.all([
        supabase
          .from("detox_completions")
          .select("duration_minutes")
          .eq("user_id", userId)
          .gte("completed_at", rollingStartDate.toISOString()),
        supabase
          .from("walking_sessions")
          .select("duration_minutes")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", rollingStartDate.toISOString()),
      ]);
      
      const detoxMinutes = (detoxResult.data || []).reduce(
        (sum, c) => sum + (c.duration_minutes || 0),
        0
      );
      const walkMinutes = (walkResult.data || []).reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );
      
      return { detoxMinutes, walkMinutes };
    },
    enabled: hasUser,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  
  // IMPORTANT: when userId is not resolved yet, React Query marks queries as not loading
  // (because they're disabled). We still want the UI to stay in a loading state instead
  // of falling back to 0%.
  const isLoading = !hasUser || isBootstrapping || v2Loading || rriLoading || weeklyLoading;
  const weeklyDetoxMinutes = weeklyData?.detoxMinutes ?? 0;
  const weeklyWalkMinutes = weeklyData?.walkMinutes ?? 0;
  
  // Compute effective recovery
  const result = useMemo((): Omit<UseRecoveryEffectiveResult, 'isLoading' | 'weeklyDetoxMinutes' | 'weeklyWalkMinutes'> => {
    const rriValue = rriData?.rri_value ?? null;
    const rriSetAt = rriData?.rri_set_at ?? null;
    const rriValid = rriValue !== null && isRRIValid(rriSetAt);
    
    // Check v2 state
    const isV2Initialized = v2State ? hasValidRecoveryData(v2State) : false;
    const recoveryV2 = v2State ? getCurrentRecovery(v2State) : null;
    
    console.log("[useRecoveryEffective v2] Computing:", {
      isV2Initialized,
      recoveryV2,
      rriValue,
      rriValid,
    });
    
    // PRIORITY 1: Use v2 recovery if initialized
    if (isV2Initialized && recoveryV2 !== null) {
      console.log("[useRecoveryEffective v2] Using REC v2:", recoveryV2);
      return {
        recoveryEffective: recoveryV2,
        isUsingRRI: false,
        isV2Initialized: true,
        recoveryV2,
        rriValue,
        hasRecoveryData: true,
      };
    }
    
    // PRIORITY 2: Use RRI if valid (new user without baseline)
    if (rriValid && rriValue !== null) {
      console.log("[useRecoveryEffective v2] Using RRI:", rriValue);
      return {
        recoveryEffective: rriValue,
        isUsingRRI: true,
        isV2Initialized: false,
        recoveryV2: null,
        rriValue,
        hasRecoveryData: false,
      };
    }
    
    // PRIORITY 3: No data - return 0 (UI will show fallback)
    console.log("[useRecoveryEffective v2] No recovery data");
    return {
      recoveryEffective: 0,
      isUsingRRI: false,
      isV2Initialized: false,
      recoveryV2: null,
      rriValue: null,
      hasRecoveryData: false,
    };
  }, [v2State, rriData]);
  
  return {
    ...result,
    isLoading,
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
  };
}
