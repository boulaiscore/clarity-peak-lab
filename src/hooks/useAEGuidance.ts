/**
 * ============================================
 * NEUROLOOP PRO – AE GUIDANCE HOOK v1.3
 * ============================================
 * 
 * Fetches 7-day S1-AE session data and computes:
 * - Suggested game (Orbit Lock vs Triage Sprint)
 * - Forced difficulty (Easy/Medium/Hard)
 * 
 * Caches result once per day per user.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTrainingCapacity } from "@/hooks/useTrainingCapacity";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { format, subDays } from "date-fns";
import { TrainingPlanId } from "@/lib/trainingPlans";
import {
  computeAEGuidance,
  AEGuidanceResult,
  SessionAggregates,
  AEGameName,
  normalizeRTVariability,
  normalizeDegradationSlope,
  normalizeTimeInBand,
  normalizeSwitchLatency,
} from "@/lib/aeGuidanceEngine";

export interface UseAEGuidanceResult extends AEGuidanceResult {
  isLoading: boolean;
  isError: boolean;
}

interface RawSessionRow {
  id: string;
  game_type: string;
  game_name: string | null;
  completed_at: string;
  false_alarm_rate: number | null;
  hit_rate: number | null;
  rt_variability: number | null;
  degradation_slope: number | null;
  time_in_band_pct: number | null;
  switch_latency_avg: number | null;
  perseveration_rate: number | null;
}

export function useAEGuidance(): UseAEGuidanceResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const planId = (user?.trainingPlan || "expert") as TrainingPlanId;
  
  const { trainingCapacity, isLoading: tcLoading } = useTrainingCapacity();
  const { recovery, isLoading: metricsLoading } = useTodayMetrics();
  
  const today = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd'T'00:00:00");
  
  // Fetch 7-day S1-AE sessions with performance metrics
  const { data: sessions, isLoading: sessionsLoading, isError } = useQuery({
    queryKey: ["ae-guidance-sessions", userId, sevenDaysAgo],
    queryFn: async (): Promise<RawSessionRow[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select(`
          id,
          game_type,
          game_name,
          completed_at,
          false_alarm_rate,
          hit_rate,
          rt_variability,
          degradation_slope,
          time_in_band_pct,
          switch_latency_avg,
          perseveration_rate
        `)
        .eq("user_id", userId)
        .eq("game_type", "S1-AE")
        .gte("completed_at", sevenDaysAgo)
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as RawSessionRow[];
    },
    enabled: !!userId,
    staleTime: 5 * 60_000, // Cache for 5 minutes
    gcTime: 30 * 60_000,
    placeholderData: [],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  
  // Compute aggregates from sessions
  const aggregates = useMemo((): SessionAggregates => {
    if (!sessions || sessions.length === 0) {
      return {
        falseAlarmRateAvg: null,
        hitRateAvg: null,
        rtVariabilityAvgNorm: null,
        degradationSlopeAvgNorm: null,
        timeInBandPctAvg: null,
        switchLatencyAvgNorm: null,
        perseverationRateAvg: null,
        sessionCount: 0,
        lastGamePlayed: null,
        sessionsAtCurrentDifficulty: 0,
        lastUpgradeDate: null,
      };
    }
    
    // Calculate averages
    const validFalseAlarm = sessions.filter(s => s.false_alarm_rate !== null);
    const validHitRate = sessions.filter(s => s.hit_rate !== null);
    const validRTVar = sessions.filter(s => s.rt_variability !== null);
    const validDegradation = sessions.filter(s => s.degradation_slope !== null);
    const validTimeInBand = sessions.filter(s => s.time_in_band_pct !== null);
    const validSwitchLatency = sessions.filter(s => s.switch_latency_avg !== null);
    const validPerseveration = sessions.filter(s => s.perseveration_rate !== null);
    
    const falseAlarmRateAvg = validFalseAlarm.length > 0
      ? validFalseAlarm.reduce((sum, s) => sum + s.false_alarm_rate!, 0) / validFalseAlarm.length
      : null;
    
    const hitRateAvg = validHitRate.length > 0
      ? validHitRate.reduce((sum, s) => sum + s.hit_rate!, 0) / validHitRate.length
      : null;
    
    const rtVariabilityAvg = validRTVar.length > 0
      ? validRTVar.reduce((sum, s) => sum + s.rt_variability!, 0) / validRTVar.length
      : null;
    
    const degradationSlopeAvg = validDegradation.length > 0
      ? validDegradation.reduce((sum, s) => sum + s.degradation_slope!, 0) / validDegradation.length
      : null;
    
    const timeInBandPctAvg = validTimeInBand.length > 0
      ? validTimeInBand.reduce((sum, s) => sum + s.time_in_band_pct!, 0) / validTimeInBand.length
      : null;
    
    const switchLatencyAvg = validSwitchLatency.length > 0
      ? validSwitchLatency.reduce((sum, s) => sum + s.switch_latency_avg!, 0) / validSwitchLatency.length
      : null;
    
    const perseverationRateAvg = validPerseveration.length > 0
      ? validPerseveration.reduce((sum, s) => sum + s.perseveration_rate!, 0) / validPerseveration.length
      : null;
    
    // Determine last game played
    const lastSession = sessions[0];
    const lastGamePlayed: AEGameName | null = lastSession?.game_name 
      ? (lastSession.game_name as AEGameName)
      : null;
    
    // For simplicity, we don't track difficulty per session yet
    // This would require a difficulty column in game_sessions
    const sessionsAtCurrentDifficulty = sessions.length;
    
    return {
      falseAlarmRateAvg,
      hitRateAvg,
      rtVariabilityAvgNorm: rtVariabilityAvg !== null ? normalizeRTVariability(rtVariabilityAvg) : null,
      degradationSlopeAvgNorm: degradationSlopeAvg !== null ? normalizeDegradationSlope(degradationSlopeAvg) : null,
      timeInBandPctAvg: timeInBandPctAvg !== null ? normalizeTimeInBand(timeInBandPctAvg) : null,
      switchLatencyAvgNorm: switchLatencyAvg !== null ? normalizeSwitchLatency(switchLatencyAvg) : null,
      perseverationRateAvg,
      sessionCount: sessions.length,
      lastGamePlayed,
      sessionsAtCurrentDifficulty,
      lastUpgradeDate: null, // Would need to track this separately
    };
  }, [sessions]);
  
  // Compute guidance
  const guidance = useMemo((): AEGuidanceResult => {
    return computeAEGuidance({
      aggregates,
      trainingPlan: planId,
      trainingCapacity,
      recovery,
      currentDate: today,
    });
  }, [aggregates, planId, trainingCapacity, recovery, today]);
  
  const isLoading = sessionsLoading || tcLoading || metricsLoading;
  
  return {
    ...guidance,
    isLoading,
    isError,
  };
}

/**
 * Hook to get just the forced difficulty for a specific game
 * Useful when the UI only needs the difficulty, not the full guidance
 */
export function useForcedDifficulty() {
  const guidance = useAEGuidance();
  
  return {
    difficulty: guidance.forcedDifficulty,
    reasons: guidance.difficultyReasons,
    isLoading: guidance.isLoading,
  };
}
