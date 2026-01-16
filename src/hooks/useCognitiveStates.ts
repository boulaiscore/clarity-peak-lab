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

import { useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetrics } from "@/hooks/useExercises";
import { format, startOfWeek, parseISO, differenceInDays } from "date-fns";
import {
  CognitiveStates,
  CognitiveAgeBaseline,
  mapDatabaseToCognitiveStates,
  mapDatabaseToBaseline,
  calculateSystemScores,
  calculateSkillDecay,
  clamp,
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
    // Map database columns to cognitive states (raw, no decay)
    const rawStates = mapDatabaseToCognitiveStates(rawMetrics ? {
      focus_stability: rawMetrics.focus_stability,
      fast_thinking: rawMetrics.fast_thinking,
      reasoning_accuracy: rawMetrics.reasoning_accuracy,
      slow_thinking: rawMetrics.slow_thinking,
    } : null);
    
    // Get baseline for Cognitive Age
    const chronologicalAge = user?.age ?? 35;
    const baseline = mapDatabaseToBaseline(rawMetrics ? {
      baseline_focus: rawMetrics.baseline_focus,
      baseline_fast_thinking: rawMetrics.baseline_fast_thinking,
      baseline_reasoning: rawMetrics.baseline_reasoning,
      baseline_slow_thinking: rawMetrics.baseline_slow_thinking,
      baseline_cognitive_age: rawMetrics.baseline_cognitive_age,
    } : null, chronologicalAge);
    
    // Calculate skill decay based on last XP dates
    const today = new Date();
    
    const parseXpDate = (dateStr: string | null | undefined): Date | null => {
      if (!dateStr) return null;
      try {
        return parseISO(dateStr);
      } catch {
        return null;
      }
    };
    
    // Get last XP timestamps from rawMetrics (new columns with _at suffix)
    const lastAeXpDate = parseXpDate((rawMetrics as any)?.last_ae_xp_at);
    const lastRaXpDate = parseXpDate((rawMetrics as any)?.last_ra_xp_at);
    const lastCtXpDate = parseXpDate((rawMetrics as any)?.last_ct_xp_at);
    const lastInXpDate = parseXpDate((rawMetrics as any)?.last_in_xp_at);
    
    const aeDecay = calculateSkillDecay({
      lastXpDate: lastAeXpDate,
      currentValue: rawStates.AE,
      baselineValue: baseline.baselineAE,
      today,
    });
    
    const raDecay = calculateSkillDecay({
      lastXpDate: lastRaXpDate,
      currentValue: rawStates.RA,
      baselineValue: baseline.baselineRA,
      today,
    });
    
    const ctDecay = calculateSkillDecay({
      lastXpDate: lastCtXpDate,
      currentValue: rawStates.CT,
      baselineValue: baseline.baselineCT,
      today,
    });
    
    const inDecay = calculateSkillDecay({
      lastXpDate: lastInXpDate,
      currentValue: rawStates.IN,
      baselineValue: baseline.baselineIN,
      today,
    });
    
    // Apply decay to states
    const states: CognitiveStates = {
      AE: clamp(rawStates.AE - aeDecay, 0, 100),
      RA: clamp(rawStates.RA - raDecay, 0, 100),
      CT: clamp(rawStates.CT - ctDecay, 0, 100),
      IN: clamp(rawStates.IN - inDecay, 0, 100),
    };
    
    // Calculate derived system scores from decayed states
    const { S1, S2 } = calculateSystemScores(states);
    
    return { 
      states, 
      rawStates,
      skillDecay: { aeDecay, raDecay, ctDecay, inDecay },
      S1, 
      S2, 
      baseline 
    };
  }, [rawMetrics, user?.age]);
  
  return {
    ...result,
    rawMetrics,
    isLoading: isLoading || createInitialMetrics.isPending,
  };
}
