/**
 * ============================================
 * NEUROLOOP PRO – GAMES GATING HOOK v1.7
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
 * v1.6: Improved persistence reliability:
 *       - Session validation before saving
 *       - Retry logic for transient failures
 *       - Toast feedback for save confirmation
 *       - Detailed logging for debugging
 * 
 * v1.7: Anti-Repetition + Quality Bonus integration:
 *       - Records combo hashes for anti-repetition
 *       - Stores quality scores and bonus flags
 *       - Supports quality bonus XP calculation
 * 
 * NO OVERRIDE ALLOWED FOR GAMES.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { useIntradayEvents } from "@/contexts/IntradayEventsContext";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
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
import { recordComboHash } from "@/lib/antiRepetitionEngine";
import { startOfDay, startOfWeek, subDays, format } from "date-fns";
import { toast } from "sonner";

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
  recoveryV2: number | null;
  
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
    recoveryV2,
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
    staleTime: 60_000, // Refresh every 60 seconds (was 30s)
    refetchOnWindowFocus: false, // Prevent flicker during games
    refetchOnMount: false,
    placeholderData: { s1: 0, s2: 0 },
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
    staleTime: 120_000, // 2 minutes
    refetchOnWindowFocus: false, // Prevent flicker during games
    refetchOnMount: false,
    placeholderData: { s2Total: 0, insightTotal: 0 },
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
    recoveryV2,
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
 * v1.7 MANUAL-COMPLIANCE UPDATE:
 * - Skill delta = XP × 0.5 (NO score scaling)
 * - Updates only if status='completed' AND xpAwarded > 0
 * - Tracks session duration via startedAt + durationSeconds
 * - Aborted sessions recorded for analytics but don't affect metrics
 * 
 * Updates XP timestamps in user_cognitive_metrics:
 * - last_xp_at (global) - updated only when xpAwarded > 0
 * - last_{skill}_xp_at - updated for the routed skill only when xpAwarded > 0
 * - last_session_at - updated for any completed session
 * 
 * Also updates the routed skill value using Δskill = XP × 0.5 (Manual-compliant)
 * 
 * This prevents skill decay for 30 days after training that skill.
 */
export function useRecordGameSession() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  
  return useCallback(async (params: {
    gameType: GameType;
    gymArea: string;
    thinkingMode: "fast" | "slow";
    xpAwarded: number;
    score: number;
    // v1.7: New required/optional params for duration + status tracking
    startedAt?: string | null;        // ISO timestamp when session started
    durationSeconds: number;          // Required, must be >= 0
    status?: 'completed' | 'aborted'; // Default 'completed'
    difficulty?: 'easy' | 'medium' | 'hard'; // Difficulty level
    // AE Guidance Engine metrics (optional)
    gameName?: "orbit_lock" | "triage_sprint" | "focus_switch" | "flash_connect" | "semantic_drift" | "constellation_snap" | "causal_ledger" | "counterfactual_audit" | "socratic_cross_exam" | "signal_vs_noise" | "hidden_rule_lab" | "counterexample_forge";
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
    // v1.7: Anti-repetition + quality bonus params
    comboHash?: string;
    qualityScore?: number;
    bonusApplied?: boolean;
    antiRepetitionTriggered?: boolean;
  }) => {
    // v1.6: Enhanced user validation
    const userId = user?.id;
    if (!userId) {
      console.error("[GameSession] No user ID available, cannot record session");
      toast.error("Session not saved - please log in again");
      return null;
    }
    
    // v1.6: Validate session is still active
    const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionCheck?.session) {
      console.error("[GameSession] Session expired or invalid:", sessionError);
      toast.error("Session expired - please log in again");
      return null;
    }
    
    // v1.7: Validate durationSeconds
    const durationSeconds = Math.max(0, Math.floor(params.durationSeconds ?? 0));
    const sessionStatus = params.status ?? 'completed';
    
    console.log("[GameSession] Starting save for user:", userId, "Game:", params.gameType, "Status:", sessionStatus, "Duration:", durationSeconds);
    
    // Derive system_type and skill_routed from gameType
    const systemType = params.gameType.startsWith("S1") ? "S1" : "S2";
    const skillRouted = params.gameType.split("-")[1] as "AE" | "RA" | "CT" | "IN";
    const nowUtc = new Date().toISOString();
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    
    // v1.6: Retry logic for transient failures
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // 1. Insert game session ALWAYS (for gating/caps tracking + analytics)
        //    Both completed and aborted sessions are recorded
        const { data, error } = await supabase
          .from("game_sessions")
          .insert({
            user_id: userId,
            system_type: systemType,
            skill_routed: skillRouted,
            game_type: params.gameType,
            gym_area: params.gymArea,
            thinking_mode: params.thinkingMode,
            xp_awarded: params.xpAwarded,
            score: params.score,
            // v1.7: New duration + status tracking
            started_at: params.startedAt ?? null,
            completed_at: nowUtc,
            duration_seconds: durationSeconds,
            status: sessionStatus,
            difficulty: params.difficulty ?? null,
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
            // v1.7: Quality + anti-repetition tracking
            quality_score: params.qualityScore ?? null,
            bonus_applied: params.bonusApplied ?? false,
            anti_repetition_triggered: params.antiRepetitionTriggered ?? false,
          })
          .select()
          .single();
        
        if (error) {
          console.error(`[GameSession] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
          lastError = error;
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            continue;
          }
          throw error;
        }
        
        console.log("[GameSession] Game session inserted:", data.id, "Status:", sessionStatus);
        
        // v1.7: If aborted, stop here - don't update XP/skills/exercise_completions
        if (sessionStatus === 'aborted') {
          console.log("[GameSession] Aborted session recorded, skipping metrics update");
          queryClient.invalidateQueries({ queryKey: ["game-sessions-today"] });
          queryClient.invalidateQueries({ queryKey: ["game-sessions-weekly"] });
          return data;
        }
        
        // v1.7: Record combo hash for anti-repetition (if provided)
        if (params.comboHash && params.gameName) {
          recordComboHash(
            userId,
            params.gameName,
            params.comboHash,
            params.difficulty ?? "medium",
            params.qualityScore,
            params.bonusApplied,
            params.antiRepetitionTriggered ? 1 : 0,
            false
          ).catch((err) => {
            console.warn("[GameSession] Failed to record combo hash:", err);
          });
        }
        
        // 2. Insert into exercise_completions ONLY if completed AND xpAwarded > 0
        if (params.xpAwarded > 0) {
          const exerciseId = `game-${params.gameType}-${data.id}`;
          const { error: completionError } = await supabase
            .from("exercise_completions")
            .insert({
              user_id: userId,
              exercise_id: exerciseId,
              gym_area: params.gymArea,
              thinking_mode: params.thinkingMode,
              difficulty: params.difficulty ?? "medium",
              xp_earned: params.xpAwarded,
              score: params.score,
              week_start: weekStart,
            });
          
          if (completionError) {
            console.error("[GameSession] Failed to insert exercise_completion:", completionError);
          } else {
            console.log("[GameSession] Inserted exercise_completion:", exerciseId);
          }
        }
        
        // 3. Update skill value, XP timestamps, AND total_sessions
        //    ONLY if completed AND xpAwarded > 0
        const skillXpColumn = `last_${skillRouted.toLowerCase()}_xp_at` as
          "last_ae_xp_at" | "last_ra_xp_at" | "last_ct_xp_at" | "last_in_xp_at";
        
        const SKILL_TO_COLUMN: Record<string, string> = {
          AE: "focus_stability",
          RA: "fast_thinking",
          CT: "reasoning_accuracy",
          IN: "slow_thinking",
        };
        const targetColumn = SKILL_TO_COLUMN[skillRouted];
        
        const { data: currentMetrics } = await supabase
          .from("user_cognitive_metrics")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (currentMetrics) {
          const currentValue = (currentMetrics as any)[targetColumn] || 50;
          const currentTotalSessions = (currentMetrics as any).total_sessions ?? 0;
          
          // v1.7: Build metrics update conditionally
          const metricsUpdate: Record<string, string | number> = {
            // Always update last_session_at for completed sessions
            last_session_at: nowUtc,
          };
          
          // v1.7: MANUAL-COMPLIANT: Only update skills/XP timestamps if xpAwarded > 0
          if (params.xpAwarded > 0) {
            // v1.7 BUGFIX: Remove score scaling! Delta = XP × 0.5 only (Manual-compliant)
            const delta = params.xpAwarded * 0.5;
            const newValue = Math.min(100, currentValue + delta);
            
            metricsUpdate.last_xp_at = nowUtc;
            metricsUpdate[skillXpColumn] = nowUtc;
            metricsUpdate[targetColumn] = Math.round(newValue * 10) / 10;
            // v1.7: Only increment total_sessions for XP-awarding sessions
            metricsUpdate.total_sessions = currentTotalSessions + 1;
            
            console.log(`[GameSession] Skill update: ${targetColumn} ${currentValue} → ${newValue} (delta: ${delta})`);
          } else {
            console.log("[GameSession] xpAwarded=0, only updating last_session_at");
          }
          
          const { error: updateError } = await supabase
            .from("user_cognitive_metrics")
            .update(metricsUpdate)
            .eq("user_id", userId);
          
          if (updateError) {
            console.error("[GameSession] Failed to update metrics:", updateError);
          } else {
            console.log(`[GameSession] Metrics updated:`, Object.keys(metricsUpdate).join(", "));
          }
        } else if (params.xpAwarded > 0) {
          // v1.7 BUGFIX: Remove score scaling for initial insert too!
          const delta = params.xpAwarded * 0.5;
          const initialValue = 50 + delta;
          
          await supabase
            .from("user_cognitive_metrics")
            .insert({
              user_id: userId,
              focus_stability: skillRouted === "AE" ? Math.round(initialValue * 10) / 10 : 50,
              fast_thinking: skillRouted === "RA" ? Math.round(initialValue * 10) / 10 : 50,
              reasoning_accuracy: skillRouted === "CT" ? Math.round(initialValue * 10) / 10 : 50,
              slow_thinking: skillRouted === "IN" ? Math.round(initialValue * 10) / 10 : 50,
              [skillXpColumn]: nowUtc,
              last_xp_at: nowUtc,
              last_session_at: nowUtc,
              total_sessions: 1,
            });
          
          console.log("[GameSession] Created new metrics record with total_sessions: 1");
        }
        
        // 4. Invalidate queries for real-time UI updates
        queryClient.invalidateQueries({ queryKey: ["weekly-exercise-xp"] });
        queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
        queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
        queryClient.invalidateQueries({ queryKey: ["games-xp-breakdown"] });
        queryClient.invalidateQueries({ queryKey: ["game-sessions-today"] });
        queryClient.invalidateQueries({ queryKey: ["game-sessions-weekly"] });
        queryClient.invalidateQueries({ queryKey: ["weekly-game-completions-v3"] });
        queryClient.invalidateQueries({ queryKey: ["games-history-system-breakdown"] });
        
        console.log("[GameSession] ✅ Session recorded successfully:", data.id);
        return data;
        
      } catch (error) {
        console.error(`[GameSession] Attempt ${attempt}/${MAX_RETRIES} error:`, error);
        lastError = error as Error;
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }
    
    // All retries failed
    console.error("[GameSession] All retries failed:", lastError);
    toast.error("Failed to save session - please try again");
    throw lastError;
  }, [user?.id, session, queryClient]);
}
