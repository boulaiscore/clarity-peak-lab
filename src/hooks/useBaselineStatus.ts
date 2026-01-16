/**
 * Hook to check if user has completed baseline calibration
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BaselineStatus {
  isCalibrated: boolean;
  baselineCapturedAt: string | null;
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
        .select("baseline_captured_at, baseline_focus, baseline_fast_thinking, baseline_reasoning, baseline_slow_thinking")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });
  
  return {
    isCalibrated: !!data?.baseline_captured_at,
    baselineCapturedAt: data?.baseline_captured_at ?? null,
    AE0: data?.baseline_focus ?? null,
    RA0: data?.baseline_fast_thinking ?? null,
    CT0: data?.baseline_reasoning ?? null,
    IN0: data?.baseline_slow_thinking ?? null,
    isLoading,
  };
}
