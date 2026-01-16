/**
 * ============================================
 * NEUROLOOP PRO – GAMES GATING HOOK v1.3
 * ============================================
 * 
 * Enforces game availability based on:
 * - Cognitive metrics (Sharpness, Readiness, Recovery)
 * - Daily caps (S1: 3/day, S2: 1/day)
 * - Weekly caps (per plan)
 * - Plan-specific S2 threshold modifiers
 * 
 * NO OVERRIDE ALLOWED FOR GAMES.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { 
  GameType, 
  GameAvailability, 
  GamesCaps,
  TrainingPlanModifiers,
  getAllGamesAvailability,
  getGameTypeFromArea,
} from "@/lib/gamesGating";
import { startOfDay, subDays, format } from "date-fns";

export type GatingStatus = "ENABLED" | "WITHHELD" | "PROTECTION";

export type WithholdReasonCode = 
  | "RECOVERY_TOO_LOW"
  | "SHARPNESS_TOO_LOW"
  | "SHARPNESS_TOO_HIGH"
  | "READINESS_TOO_LOW"
  | "READINESS_OUT_OF_RANGE"
  | "CAP_REACHED_DAILY_S1"
  | "CAP_REACHED_DAILY_S2"
  | "CAP_REACHED_WEEKLY_S2"
  | "CAP_REACHED_WEEKLY_IN"
  | "SUPERHUMAN_REC_REQUIRED";

export interface GameGatingResult {
  type: GameType;
  status: GatingStatus;
  reasonCode: WithholdReasonCode | null;
  details: {
    currentValue: number;
    requiredValue: number;
    metric: string;
  } | null;
  unlockActions: string[];
}

export interface UseGamesGatingResult {
  // Game availability by type
  games: Record<GameType, GameGatingResult>;
  
  // Caps tracking
  caps: {
    s1Today: number;
    s1TodayMax: number;
    s2Today: number;
    s2TodayMax: number;
    s2Week: number;
    s2WeekMax: number;
    insightWeek: number;
    insightWeekMax: number;
  };
  
  // Metrics snapshot
  metrics: {
    sharpness: number;
    readiness: number;
    recovery: number;
  };
  
  // Helper function
  checkGame: (gymArea: string, thinkingMode: string) => GameGatingResult;
  
  // Loading state
  isLoading: boolean;
}

export function useGamesGating(): UseGamesGatingResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  
  // Get today's cognitive metrics
  const { sharpness, readiness, recovery, isLoading: metricsLoading } = useTodayMetrics();
  
  // Get plan configuration
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  const gatingModifiers = plan.gamesGating;
  
  // Calculate date ranges
  const todayStart = format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss");
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss");
  
  // Fetch today's game sessions count by system type
  const { data: todayCounts, isLoading: todayLoading } = useQuery({
    queryKey: ["game-sessions-today", userId, todayStart],
    queryFn: async () => {
      if (!userId) return { s1: 0, s2: 0 };
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("system_type")
        .eq("user_id", userId)
        .gte("completed_at", todayStart);
      
      if (error) throw error;
      
      let s1 = 0;
      let s2 = 0;
      (data || []).forEach((session: { system_type: string }) => {
        if (session.system_type === "S1") s1++;
        else if (session.system_type === "S2") s2++;
      });
      
      return { s1, s2 };
    },
    enabled: !!userId,
    staleTime: 30_000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
  
  // Fetch 7-day S2 and Insight counts
  const { data: weeklyCounts, isLoading: weeklyLoading } = useQuery({
    queryKey: ["game-sessions-weekly", userId, sevenDaysAgo],
    queryFn: async () => {
      if (!userId) return { s2Total: 0, insightTotal: 0 };
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("game_type")
        .eq("user_id", userId)
        .gte("completed_at", sevenDaysAgo);
      
      if (error) throw error;
      
      let s2Total = 0;
      let insightTotal = 0;
      (data || []).forEach((session: { game_type: string }) => {
        if (session.game_type === "S2-CT" || session.game_type === "S2-IN") {
          s2Total++;
        }
        if (session.game_type === "S2-IN") {
          insightTotal++;
        }
      });
      
      return { s2Total, insightTotal };
    },
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  
  // Build caps object
  const caps: GamesCaps = useMemo(() => ({
    s1DailyUsed: todayCounts?.s1 ?? 0,
    s1DailyMax: 3, // Fixed across all plans
    s2DailyUsed: todayCounts?.s2 ?? 0,
    s2DailyMax: 1, // Fixed across all plans
    insightWeeklyUsed: weeklyCounts?.insightTotal ?? 0,
    insightWeeklyMax: gatingModifiers.insightMaxPerWeek,
  }), [todayCounts, weeklyCounts, gatingModifiers]);
  
  // Build plan modifiers for gating function
  const planModifiers: TrainingPlanModifiers = useMemo(() => ({
    s2ThresholdModifier: gatingModifiers.s2ThresholdModifier,
    requireRecForS2: gatingModifiers.requireRecForS2,
    insightMaxPerWeek: gatingModifiers.insightMaxPerWeek,
  }), [gatingModifiers]);
  
  // Compute game availability
  const gamesAvailability = useMemo(() => {
    return getAllGamesAvailability(
      sharpness,
      readiness,
      recovery,
      caps,
      planModifiers
    );
  }, [sharpness, readiness, recovery, caps, planModifiers]);
  
  // Transform to GameGatingResult format with reason codes
  const games = useMemo(() => {
    const result: Record<GameType, GameGatingResult> = {} as Record<GameType, GameGatingResult>;
    
    for (const [gameType, availability] of Object.entries(gamesAvailability) as [GameType, GameAvailability][]) {
      const reasonCode = determineReasonCode(
        gameType, 
        availability, 
        caps, 
        planId,
        gatingModifiers.requireRecForS2,
        recovery
      );
      
      // Determine status
      let status: GatingStatus = "ENABLED";
      if (!availability.enabled) {
        // PROTECTION is for system-level blocks (Superhuman REC requirement, caps)
        if (reasonCode === "SUPERHUMAN_REC_REQUIRED" || reasonCode?.startsWith("CAP_")) {
          status = "PROTECTION";
        } else {
          status = "WITHHELD";
        }
      }
      
      // Get first threshold for details
      const firstThreshold = availability.thresholds[0];
      
      result[gameType] = {
        type: gameType,
        status,
        reasonCode,
        details: firstThreshold ? {
          currentValue: firstThreshold.current,
          requiredValue: firstThreshold.required,
          metric: firstThreshold.metric,
        } : null,
        unlockActions: availability.unlockActions,
      };
    }
    
    return result;
  }, [gamesAvailability, caps, planId, gatingModifiers, recovery]);
  
  // Helper function to check a specific game by area and mode
  const checkGame = (gymArea: string, thinkingMode: string): GameGatingResult => {
    const gameType = getGameTypeFromArea(gymArea, thinkingMode);
    return games[gameType];
  };
  
  return {
    games,
    caps: {
      s1Today: caps.s1DailyUsed,
      s1TodayMax: caps.s1DailyMax,
      s2Today: caps.s2DailyUsed,
      s2TodayMax: caps.s2DailyMax,
      s2Week: weeklyCounts?.s2Total ?? 0,
      s2WeekMax: gatingModifiers.s2MaxPerWeek,
      insightWeek: caps.insightWeeklyUsed,
      insightWeekMax: caps.insightWeeklyMax,
    },
    metrics: {
      sharpness,
      readiness,
      recovery,
    },
    checkGame,
    isLoading: metricsLoading || todayLoading || weeklyLoading,
  };
}

/**
 * Determine the most relevant reason code for a withheld game
 */
function determineReasonCode(
  gameType: GameType,
  availability: GameAvailability,
  caps: GamesCaps,
  planId: TrainingPlanId,
  requireRecForS2: number,
  recovery: number
): WithholdReasonCode | null {
  if (availability.enabled) return null;
  
  const isS2Game = gameType === "S2-CT" || gameType === "S2-IN";
  const isInsight = gameType === "S2-IN";
  
  // Priority 1: Caps (most restrictive)
  if (gameType === "S1-AE" || gameType === "S1-RA") {
    if (caps.s1DailyUsed >= caps.s1DailyMax) {
      return "CAP_REACHED_DAILY_S1";
    }
  }
  
  if (isS2Game) {
    if (caps.s2DailyUsed >= caps.s2DailyMax) {
      return "CAP_REACHED_DAILY_S2";
    }
  }
  
  if (isInsight) {
    if (caps.insightWeeklyUsed >= caps.insightWeeklyMax) {
      return "CAP_REACHED_WEEKLY_IN";
    }
  }
  
  // Priority 2: Superhuman REC requirement for S2
  if (isS2Game && planId === "superhuman" && recovery < requireRecForS2) {
    return "SUPERHUMAN_REC_REQUIRED";
  }
  
  // Priority 3: Metric thresholds
  for (const threshold of availability.thresholds) {
    if (threshold.metric === "Recovery") {
      return "RECOVERY_TOO_LOW";
    }
    if (threshold.metric === "Sharpness") {
      // S1-AE uses maxSharpness (current > required means too high)
      if (gameType === "S1-AE" && threshold.current > threshold.required) {
        return "SHARPNESS_TOO_HIGH";
      }
      return "SHARPNESS_TOO_LOW";
    }
    if (threshold.metric === "Readiness") {
      // S2-IN has a range check
      if (isInsight && availability.withheldReason?.includes("too high")) {
        return "READINESS_OUT_OF_RANGE";
      }
      return "READINESS_TOO_LOW";
    }
  }
  
  return null;
}

/**
 * Hook to record a game session completion
 */
export function useRecordGameSession() {
  const { user } = useAuth();
  
  return async (params: {
    gameType: GameType;
    gymArea: string;
    thinkingMode: "fast" | "slow";
    xpAwarded: number;
    score: number;
  }) => {
    if (!user?.id) {
      console.error("[GameSession] No user ID, cannot record session");
      return null;
    }
    
    // Derive system_type and skill_routed from gameType
    const systemType = params.gameType.startsWith("S1") ? "S1" : "S2";
    const skillRouted = params.gameType.split("-")[1] as "AE" | "RA" | "CT" | "IN";
    
    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        user_id: user.id,
        system_type: systemType,
        skill_routed: skillRouted,
        game_type: params.gameType,
        gym_area: params.gymArea,
        thinking_mode: params.thinkingMode,
        xp_awarded: params.xpAwarded,
        score: params.score,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error("[GameSession] Failed to record:", error);
      throw error;
    }
    
    console.log("[GameSession] Recorded:", data);
    return data;
  };
}
