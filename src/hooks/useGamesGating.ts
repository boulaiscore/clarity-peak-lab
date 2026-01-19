/**
 * ============================================
 * NEUROLOOP PRO – GAMES GATING HOOK v1.5
 * ============================================
 * 
 * Enforces game availability based on:
 * - Cognitive metrics (Sharpness, Readiness, Recovery)
 * - Daily caps (S1: 3/day, S2: 1/day)
 * - Weekly caps (per plan)
 * - Plan-specific S2 threshold modifiers
 * 
 * v1.5: useRecordGameSession now also inserts into exercise_completions
 *       so that weekly XP is correctly tracked by useWeeklyProgress.
 * 
 * NO OVERRIDE ALLOWED FOR GAMES.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { 
  GameType, 
  GameAvailability, 
  GamesCaps,
  TrainingPlanModifiers,
  getAllGamesAvailability,
  getGameTypeFromArea,
  isSafetyRuleActive,
} from "@/lib/gamesGating";
import { startOfDay, startOfWeek, subDays, format } from "date-fns";

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
  
  // Metrics snapshot (uses REC_effective for gating)
  metrics: {
    sharpness: number;
    readiness: number;
    recovery: number; // This is REC_effective, not REC_raw
  };
  
  // RRI (Recovery Readiness Init) status
  isUsingRRI: boolean;
  recoveryRaw: number;
  
  // Post-baseline safety rule
  safetyRuleActive: boolean;
  isCalibrated: boolean;
  
  // Helper function
  checkGame: (gymArea: string, thinkingMode: string) => GameGatingResult;
  
  // Loading state
  isLoading: boolean;
}

export function useGamesGating(): UseGamesGatingResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  
  // Get today's cognitive metrics (sharpness, readiness use REC_raw internally)
  const { sharpness, readiness, isLoading: metricsLoading } = useTodayMetrics();
  
  // Get effective recovery for gating (uses RRI until first real recovery data)
  const { 
    recoveryEffective, 
    isUsingRRI, 
    recoveryRaw,
    isLoading: recoveryLoading 
  } = useRecoveryEffective();
  
  // Get baseline status for safety rule
  const { isCalibrated, isLoading: baselineLoading } = useBaselineStatus();
  
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
  
  // Compute game availability with safety rule
  // IMPORTANT: Uses REC_effective (which may be RRI) for gating decisions
  const gamesAvailability = useMemo(() => {
    return getAllGamesAvailability(
      sharpness,
      readiness,
      recoveryEffective, // Use REC_effective for gating
      caps,
      planModifiers,
      isCalibrated // Pass calibration status for safety rule
    );
  }, [sharpness, readiness, recoveryEffective, caps, planModifiers, isCalibrated]);
  
  // Check if safety rule is active (pass sharpness for accurate detection)
  const safetyRuleActive = useMemo(() => {
    return isSafetyRuleActive(recoveryEffective, isCalibrated, gamesAvailability, sharpness);
  }, [recoveryEffective, isCalibrated, gamesAvailability, sharpness]);
  
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
        recoveryEffective
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
  }, [gamesAvailability, caps, planId, gatingModifiers, recoveryEffective]);
  
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
      recovery: recoveryEffective, // Return REC_effective for UI consistency
    },
    isUsingRRI,
    recoveryRaw,
    safetyRuleActive,
    isCalibrated,
    checkGame,
    isLoading: metricsLoading || recoveryLoading || todayLoading || weeklyLoading || baselineLoading,
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
 * Hook to record a game session completion.
 * 
 * v1.5: Now also inserts into exercise_completions so that weekly XP
 * metrics in useWeeklyProgress correctly count game XP.
 * 
 * Updates XP timestamps in user_cognitive_metrics:
 * - last_xp_at (global) - updated on every game completion
 * - last_{skill}_xp_at - updated for the routed skill only
 * 
 * Also updates the routed skill value using Δskill = XP × 0.5
 * 
 * This prevents skill decay for 30 days after training that skill.
 */
export function useRecordGameSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return async (params: {
    gameType: GameType;
    gymArea: string;
    thinkingMode: "fast" | "slow";
    xpAwarded: number;
    score: number;
    // AE Guidance Engine metrics (optional)
    gameName?: "orbit_lock" | "triage_sprint" | "focus_switch" | "flash_connect";
    falseAlarmRate?: number | null;
    hitRate?: number | null;
    rtVariability?: number | null;
    degradationSlope?: number | null;
    timeInBandPct?: number | null;
    // Focus Switch specific metrics
    switchLatencyAvg?: number | null;
    perseverationRate?: number | null;
    postSwitchErrorRate?: number | null;
    // Difficulty override tracking (v1.4)
    difficultyOverride?: boolean;
  }) => {
    if (!user?.id) {
      console.error("[GameSession] No user ID, cannot record session");
      return null;
    }
    
    // Derive system_type and skill_routed from gameType
    const systemType = params.gameType.startsWith("S1") ? "S1" : "S2";
    const skillRouted = params.gameType.split("-")[1] as "AE" | "RA" | "CT" | "IN";
    const nowUtc = new Date().toISOString();
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    
    // 1. Insert game session (for gating/caps tracking + AE guidance metrics)
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
        completed_at: nowUtc,
        // AE Guidance metrics (shared)
        game_name: params.gameName ?? null,
        degradation_slope: params.degradationSlope ?? null,
        // Triage Sprint metrics
        false_alarm_rate: params.falseAlarmRate ?? null,
        hit_rate: params.hitRate ?? null,
        rt_variability: params.rtVariability ?? null,
        // Orbit Lock metrics
        time_in_band_pct: params.timeInBandPct ?? null,
        // Focus Switch metrics
        switch_latency_avg: params.switchLatencyAvg ?? null,
        perseveration_rate: params.perseverationRate ?? null,
        post_switch_error_rate: params.postSwitchErrorRate ?? null,
        // Difficulty override tracking
        difficulty_override: params.difficultyOverride ?? false,
      })
      .select()
      .single();
    
    if (error) {
      console.error("[GameSession] Failed to record:", error);
      throw error;
    }
    
    // 2. Also insert into exercise_completions for weekly XP tracking
    // This ensures useWeeklyProgress counts game XP correctly
    const exerciseId = `game-${params.gameType}-${data.id}`;
    const { error: completionError } = await supabase
      .from("exercise_completions")
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        gym_area: params.gymArea,
        thinking_mode: params.thinkingMode,
        difficulty: "medium", // Games don't have traditional difficulty
        xp_earned: params.xpAwarded,
        score: params.score,
        week_start: weekStart,
      });
    
    if (completionError) {
      console.error("[GameSession] Failed to insert exercise_completion:", completionError);
      // Don't throw - game session was recorded, this is secondary
    } else {
      console.log("[GameSession] Inserted exercise_completion:", exerciseId);
    }
    
    // 3. Update skill value AND XP timestamps
    if (params.xpAwarded > 0) {
      // Build the update object for the specific skill
      const skillXpColumn = `last_${skillRouted.toLowerCase()}_xp_at` as
        "last_ae_xp_at" | "last_ra_xp_at" | "last_ct_xp_at" | "last_in_xp_at";
      
      // Map skill to database column
      const SKILL_TO_COLUMN: Record<string, string> = {
        AE: "focus_stability",
        RA: "fast_thinking",
        CT: "reasoning_accuracy",
        IN: "slow_thinking",
      };
      const targetColumn = SKILL_TO_COLUMN[skillRouted];
      
      // Get current metrics
      const { data: currentMetrics } = await supabase
        .from("user_cognitive_metrics")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (currentMetrics) {
        const currentValue = (currentMetrics as any)[targetColumn] || 50;
        
        // Apply score scaling: XP = baseXP × (score / 100)
        const scaledXP = params.xpAwarded * (params.score / 100);
        
        // Apply state update formula: Δstate = XP × 0.5, capped at 100
        const delta = scaledXP * 0.5;
        const newValue = Math.min(100, currentValue + delta);
        
        const xpTrackingUpdate: Record<string, string | number> = {
          last_xp_at: nowUtc,
          [skillXpColumn]: nowUtc,
          [targetColumn]: Math.round(newValue * 10) / 10,
        };
        
        const { error: updateError } = await supabase
          .from("user_cognitive_metrics")
          .update(xpTrackingUpdate)
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("[GameSession] Failed to update metrics:", updateError);
        } else {
          console.log(`[GameSession] Updated ${targetColumn}: ${currentValue} → ${newValue}, ${skillXpColumn} → ${nowUtc}`);
        }
      } else {
        // Create new metrics record if none exists
        const initialValue = 50 + (params.xpAwarded * (params.score / 100) * 0.5);
        const now = new Date().toISOString();
        
        await supabase
          .from("user_cognitive_metrics")
          .insert({
            user_id: user.id,
            focus_stability: skillRouted === "AE" ? Math.round(initialValue * 10) / 10 : 50,
            fast_thinking: skillRouted === "RA" ? Math.round(initialValue * 10) / 10 : 50,
            reasoning_accuracy: skillRouted === "CT" ? Math.round(initialValue * 10) / 10 : 50,
            slow_thinking: skillRouted === "IN" ? Math.round(initialValue * 10) / 10 : 50,
            [skillXpColumn]: now,
            last_xp_at: now,
          });
        
        console.log("[GameSession] Created new metrics record with initial skill value");
      }
    } else {
      console.log("[GameSession] No XP awarded, skipping metric updates");
    }
    
    // 4. Invalidate queries for real-time UI updates
    queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
    queryClient.invalidateQueries({ queryKey: ["user-metrics", user.id] });
    queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["games-xp-breakdown"] });
    queryClient.invalidateQueries({ queryKey: ["game-sessions-today"] });
    queryClient.invalidateQueries({ queryKey: ["game-sessions-weekly"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-game-completions-v3"] });
    queryClient.invalidateQueries({ queryKey: ["games-history-system-breakdown"] });
    
    console.log("[GameSession] Recorded:", data);
    return data;
  };
}
