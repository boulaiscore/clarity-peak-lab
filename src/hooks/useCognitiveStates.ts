/**
 * Central hook for fetching and computing cognitive states.
 * 
 * Returns:
 * - AE, RA, CT, IN (the 4 base cognitive states)
 * - S1, S2 (derived system scores)
 * - Baseline values for Cognitive Age calculation
 * 
 * DATA SOURCE: user_cognitive_metrics table
 * 
 * COLUMN MAPPING:
 * - AE (Attentional Efficiency) ← focus_stability
 * - RA (Rapid Association) ← fast_thinking
 * - CT (Critical Thinking) ← reasoning_accuracy
 * - IN (Insight) ← slow_thinking
 */

import { useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import {
  CognitiveStates,
  CognitiveAgeBaseline,
  mapDatabaseToCognitiveStates,
  mapDatabaseToBaseline,
  calculateSystemScores,
} from "@/lib/cognitiveEngine";

export interface UseCognitiveStatesResult {
  // Base states (0-100)
  states: CognitiveStates;
  
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
    },
  });
  
  // Auto-create metrics if user exists but no metrics record
  useEffect(() => {
    if (user?.id && !isLoading && rawMetrics === null) {
      createInitialMetrics.mutate(user.id);
    }
  }, [user?.id, isLoading, rawMetrics]);
  
  const result = useMemo(() => {
    // Map database columns to cognitive states
    const states = mapDatabaseToCognitiveStates(rawMetrics ? {
      focus_stability: rawMetrics.focus_stability,
      fast_thinking: rawMetrics.fast_thinking,
      reasoning_accuracy: rawMetrics.reasoning_accuracy,
      slow_thinking: rawMetrics.slow_thinking,
    } : null);
    
    // Calculate derived system scores
    const { S1, S2 } = calculateSystemScores(states);
    
    // Get baseline for Cognitive Age
    const chronologicalAge = user?.age ?? 35;
    const baseline = mapDatabaseToBaseline(rawMetrics ? {
      baseline_focus: rawMetrics.baseline_focus,
      baseline_fast_thinking: rawMetrics.baseline_fast_thinking,
      baseline_reasoning: rawMetrics.baseline_reasoning,
      baseline_slow_thinking: rawMetrics.baseline_slow_thinking,
      baseline_cognitive_age: rawMetrics.baseline_cognitive_age,
    } : null, chronologicalAge);
    
    return { states, S1, S2, baseline };
  }, [rawMetrics, user?.age]);
  
  return {
    ...result,
    rawMetrics,
    isLoading: isLoading || createInitialMetrics.isPending,
  };
}
