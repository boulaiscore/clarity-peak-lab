/**
 * Central hook for fetching and computing cognitive states.
 * 
 * Returns:
 * - AE, RA, CT, IN (the 4 base cognitive states)
 * - S1, S2 (derived system scores)
 * - Baseline values for Cognitive Age calculation
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import {
  CognitiveStates,
  DerivedSystemScores,
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
  const { data: rawMetrics, isLoading } = useUserMetrics(user?.id);
  
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
    isLoading,
  };
}
