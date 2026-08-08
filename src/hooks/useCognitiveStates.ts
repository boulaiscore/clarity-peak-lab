/**
 * Central hook for fetching and computing cognitive states.
 * 
 * Returns:
 * - AE, RA, CT, IN (the 4 base cognitive states)
 * - S1, S2 (derived system scores)
 * - Baseline values for Cognitive Age calculation
 * 
 * v1.4: Now includes decay adjustments for skill inactivity.
 * Skills decay if no XP received for 30+ consecutive days.
 * 
 * DATA SOURCE: user_cognitive_metrics table
 * 
 * COLUMN MAPPING:
 * - AE (Attentional Efficiency) ← focus_stability
 * - RA (Rapid Association) ← fast_thinking
 * - CT (Critical Thinking) ← reasoning_accuracy
 * - IN (Insight) ← slow_thinking
 */

import { useMemo, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import {
  CognitiveStates,
  CognitiveAgeBaseline,
  deriveEffectiveCognitiveStates,
} from "@/lib/cognitiveEngine";

export interface UseCognitiveStatesResult {
  // Base states (0-100) - WITH decay applied
  states: CognitiveStates;
  
  // Raw states without decay (for baseline comparison)
  rawStates: CognitiveStates;
  
  // Decay amounts
  skillDecay: {
    aeDecay: number;
    raDecay: number;
    ctDecay: number;
    inDecay: number;
  };
  
  // Derived system scores
  S1: number;
  S2: number;
  
  // Baseline for Cognitive Age
  baseline: CognitiveAgeBaseline;
  
  // Raw metrics from database
  rawMetrics: ReturnType<typeof useUserMetrics>["data"];
  
  // Loading state
  isLoading: boolean;
}

export function useCognitiveStates(): UseCognitiveStatesResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: rawMetrics, isLoading } = useUserMetrics(user?.id);
  
  // Create initial metrics record if none exists
  const createInitialMetrics = useMutation({
    mutationFn: async (userId: string) => {
      // Check if record already exists
      const { data: existing } = await supabase
        .from("user_cognitive_metrics")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (existing) return existing;
      
      // Create new record with defaults
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .insert({
          user_id: userId,
          focus_stability: 50,      // AE
          fast_thinking: 50,        // RA
          reasoning_accuracy: 50,   // CT
          slow_thinking: 50,        // IN
          total_sessions: 0,
        })
        .select()
        .single();
      
      if (error) {
        console.error("[useCognitiveStates] Error creating metrics:", error);
        throw error;
      }
      
      console.log("[useCognitiveStates] Created initial metrics for user:", userId);
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
    },
  });
  
  // Auto-create metrics if user exists but no metrics record
  useEffect(() => {
    if (user?.id && !isLoading && rawMetrics === null) {
      createInitialMetrics.mutate(user.id);
    }
  }, [user?.id, isLoading, rawMetrics]);
  
  // Use ref to cache last valid result (prevents flicker during refetch/loading)
  // IMPORTANT: This ref persists across renders but resets on page refresh
  // For better stability, we also check if rawMetrics has data before computing
  const cachedResultRef = useRef<{
    states: CognitiveStates;
    rawStates: CognitiveStates;
    skillDecay: { aeDecay: number; raDecay: number; ctDecay: number; inDecay: number };
    S1: number;
    S2: number;
    baseline: CognitiveAgeBaseline;
  } | null>(null);
  const cachedUserIdRef = useRef<string | undefined>(user?.id);
  if (cachedUserIdRef.current !== user?.id) {
    cachedResultRef.current = null;
    cachedUserIdRef.current = user?.id;
  }
  
  const result = useMemo(() => {
    // If still loading, prefer cached values
    if (isLoading && cachedResultRef.current) {
      return cachedResultRef.current;
    }
    
    // If no rawMetrics yet, return cached or stable defaults
    if (!rawMetrics) {
      if (cachedResultRef.current) {
        return cachedResultRef.current;
      }
      // Return stable defaults only if no cache exists
      const defaultStates: CognitiveStates = { AE: 50, RA: 50, CT: 50, IN: 50 };
      const defaultBaseline: CognitiveAgeBaseline = {
        baselineCognitiveAge: user?.age ?? 35,
        baselineAE: 50,
        baselineRA: 50,
        baselineCT: 50,
        baselineIN: 50,
      };
      return {
        states: defaultStates,
        rawStates: defaultStates,
        skillDecay: { aeDecay: 0, raDecay: 0, ctDecay: 0, inDecay: 0 },
        S1: 50,
        S2: 50,
        baseline: defaultBaseline,
      };
    }
    
    const chronologicalAge = user?.age ?? 35;
    const computedResult = deriveEffectiveCognitiveStates(
      rawMetrics,
      chronologicalAge,
      new Date(),
    );
    
    // Cache this valid result
    cachedResultRef.current = computedResult;
    
    return computedResult;
  }, [rawMetrics, user?.age]);
  
  return {
    ...result,
    rawMetrics,
    isLoading: isLoading || createInitialMetrics.isPending,
  };
}
