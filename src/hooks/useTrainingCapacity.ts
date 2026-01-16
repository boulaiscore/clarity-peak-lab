/**
 * ============================================
 * NEUROLOOP PRO – TRAINING CAPACITY HOOK
 * ============================================
 * 
 * Manages dynamic Training Capacity (TC) - the user's "cognitive maximal".
 * TC grows slowly with consistent training and recovery, decays with inactivity.
 * Optimal Range is dynamically calculated as 60-85% of TC.
 */

import { useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { startOfWeek, format, differenceInDays, parseISO } from "date-fns";
import {
  initializeTrainingCapacity,
  updateTrainingCapacity,
  getDynamicOptimalRange,
  DynamicOptimalRange,
} from "@/lib/cognitiveEngine";
import {
  TC_FLOOR,
  TC_PLAN_CAPS,
  TC_UPGRADE_HINT_THRESHOLD,
} from "@/lib/decayConstants";
import { TrainingPlanId } from "@/lib/trainingPlans";

export type TCTrend = "up" | "down" | "stable";

export interface UseTrainingCapacityResult {
  trainingCapacity: number;
  optimalRange: DynamicOptimalRange;
  planCap: number;
  shouldSuggestUpgrade: boolean;
  isLoading: boolean;
  tcTrend: TCTrend;
  tcDelta: number;
}

function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

export function useTrainingCapacity(): UseTrainingCapacityResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const planId = (user?.trainingPlan || "expert") as TrainingPlanId;
  const planCap = TC_PLAN_CAPS[planId] ?? 200;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = getCurrentWeekStart();
  const queryClient = useQueryClient();
  
  // Get cognitive states for initialization
  const { states, isLoading: statesLoading } = useCognitiveStates();
  
  // Fetch current TC data
  const { data: tcData, isLoading: tcLoading } = useQuery({
    queryKey: ["training-capacity", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("training_capacity, tc_last_updated_at, last_xp_at, tc_previous_value")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      return data as {
        training_capacity: number | null;
        tc_last_updated_at: string | null;
        last_xp_at: string | null;
        tc_previous_value: number | null;
      } | null;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Fetch weekly XP
  const { data: weeklyXPData, isLoading: xpLoading } = useQuery({
    queryKey: ["weekly-xp-for-tc", userId, weekStart],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("xp_awarded")
        .eq("user_id", userId)
        .gte("completed_at", `${weekStart}T00:00:00`);
      
      if (error) throw error;
      
      return (data || []).reduce((sum, s) => sum + (s.xp_awarded || 0), 0);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Fetch weekly recovery average (from detox + walk)
  const { data: weeklyRecData, isLoading: recLoading } = useQuery({
    queryKey: ["weekly-rec-for-tc", userId, weekStart],
    queryFn: async () => {
      if (!userId) return 50; // Default if no data
      
      // Get weekly detox minutes
      const { data: detoxData, error: detoxError } = await supabase
        .from("detox_sessions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .gte("completed_at", `${weekStart}T00:00:00`);
      
      if (detoxError) throw detoxError;
      
      const detoxMinutes = (detoxData || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      // Get weekly walk minutes
      const { data: walkData, error: walkError } = await supabase
        .from("walking_sessions")
        .select("duration_minutes")
        .eq("user_id", userId)
        .gte("completed_at", `${weekStart}T00:00:00`);
      
      if (walkError) throw walkError;
      
      const walkMinutes = (walkData || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      // Calculate REC% (target is plan-based, use 840 as default)
      const target = 840;
      const recInput = detoxMinutes + 0.5 * walkMinutes;
      const rec = Math.min(100, (recInput / target) * 100);
      
      return Math.round(rec);
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  
  // Mutation to initialize TC
  const initializeTCMutation = useMutation({
    mutationFn: async (initialTC: number) => {
      if (!userId) return;
      
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          training_capacity: initialTC,
          tc_last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-capacity", userId] });
    },
  });
  
  // Mutation to update TC (stores previous value for trend calculation)
  const updateTCMutation = useMutation({
    mutationFn: async ({ newTC, previousTC }: { newTC: number; previousTC: number }) => {
      if (!userId) return;
      
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          training_capacity: newTC,
          tc_last_updated_at: new Date().toISOString(),
          tc_previous_value: previousTC,
        })
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-capacity", userId] });
    },
  });
  
  // Effect to initialize or update TC
  useEffect(() => {
    if (!userId || statesLoading || tcLoading || xpLoading || recLoading) return;
    if (initializeTCMutation.isPending || updateTCMutation.isPending) return;
    
    const currentTC = tcData?.training_capacity;
    const lastUpdated = tcData?.tc_last_updated_at;
    const lastXpAt = tcData?.last_xp_at;
    
    // Initialize TC if null
    if (currentTC === null || currentTC === undefined) {
      const initialTC = initializeTrainingCapacity(states, planCap);
      initializeTCMutation.mutate(initialTC);
      return;
    }
    
    // Check if update is needed (once per day max)
    if (lastUpdated) {
      const lastUpdateDate = format(parseISO(lastUpdated), "yyyy-MM-dd");
      if (lastUpdateDate === todayStr) {
        // Already updated today
        return;
      }
    }
    
    // Calculate days since last XP
    let daysSinceLastXP = 0;
    if (lastXpAt) {
      daysSinceLastXP = differenceInDays(today, parseISO(lastXpAt));
    } else {
      daysSinceLastXP = 7; // Assume inactive if no XP ever
    }
    
    // Update TC
    const newTC = updateTrainingCapacity({
      currentTC,
      weeklyXP: weeklyXPData ?? 0,
      avgREC: weeklyRecData ?? 50,
      daysSinceLastXP,
      planCap,
    });
    
    // Only update if TC changed significantly
    if (Math.abs(newTC - currentTC) >= 0.1) {
      updateTCMutation.mutate({ newTC, previousTC: currentTC });
    } else {
      // Just update the timestamp (keep previous value as-is for stable trend)
      updateTCMutation.mutate({ newTC: currentTC, previousTC: tcData?.tc_previous_value ?? currentTC });
    }
  }, [
    userId,
    tcData,
    states,
    weeklyXPData,
    weeklyRecData,
    planCap,
    todayStr,
    statesLoading,
    tcLoading,
    xpLoading,
    recLoading,
  ]);
  
  // Compute final values including trend
  const result = useMemo((): UseTrainingCapacityResult => {
    const tc = tcData?.training_capacity ?? TC_FLOOR;
    const previousTC = tcData?.tc_previous_value ?? tc;
    const optimalRange = getDynamicOptimalRange(tc, planCap);
    
    // Show upgrade hint if optMax >= 90% of planCap
    const shouldSuggestUpgrade = optimalRange.max >= planCap * TC_UPGRADE_HINT_THRESHOLD;
    
    // Calculate trend
    const tcDelta = tc - previousTC;
    let tcTrend: TCTrend = "stable";
    if (tcDelta > 0.5) {
      tcTrend = "up";
    } else if (tcDelta < -0.5) {
      tcTrend = "down";
    }
    
    return {
      trainingCapacity: tc,
      optimalRange,
      planCap,
      shouldSuggestUpgrade,
      isLoading: tcLoading || statesLoading,
      tcTrend,
      tcDelta,
    };
  }, [tcData, planCap, tcLoading, statesLoading]);
  
  return result;
}
