/**
 * ============================================
 * NEUROLOOP PRO – METRIC DECAY HOOK
 * ============================================
 * 
 * Central hook for calculating all decay adjustments.
 * Uses compute-on-read approach - decay is calculated when metrics are accessed.
 * 
 * DECAY RULES IMPLEMENTED:
 * 1. Skill Inactivity: AE, RA, CT, IN decay if no XP for 30+ days
 * 2. Readiness Decay: If REC < 40 for 3+ consecutive days
 * 3. SCI Decay: If low recovery or no training for 7 days
 * 4. Dual-Process Decay: If S1/S2 XP imbalance over 7 days
 * 5. Cognitive Age Regression: If performance drops ≥10 pts for 21+ days
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format, differenceInDays, parseISO } from "date-fns";
import {
  calculateSkillDecay,
  calculateReadinessDecay,
  calculateSCIDecay,
  calculateDualProcessDecay,
  calculateCognitiveAgeRegression,
  isRecoveryLow,
  SkillDecayInput,
} from "@/lib/cognitiveEngine";
import { LOW_RECOVERY_THRESHOLD } from "@/lib/decayConstants";

export interface DecayAdjustments {
  // Skill decay (points to subtract from current values)
  aeDecay: number;
  raDecay: number;
  ctDecay: number;
  inDecay: number;
  
  // Readiness decay (points to subtract)
  readinessDecay: number;
  
  // SCI decay (points to subtract)
  sciDecay: number;
  
  // Dual-process decay (points to subtract from balance)
  dualProcessDecay: number;
  
  // Cognitive age regression (years to add)
  cognitiveAgeRegression: number;
  
  // Tracking data
  consecutiveLowRecDays: number;
  daysSinceLastTraining: number;
}

export interface UseMetricDecayResult {
  adjustments: DecayAdjustments;
  isLoading: boolean;
}

function getCurrentWeekStart(): string {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(weekStart, "yyyy-MM-dd");
}

export function useMetricDecay(
  recovery: number,
  currentStates: { AE: number; RA: number; CT: number; IN: number },
  baseline: { baselineAE: number; baselineRA: number; baselineCT: number; baselineIN: number },
  currentPerformanceAvg: number
): UseMetricDecayResult {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = getCurrentWeekStart();
  
  // Fetch decay tracking data from user_cognitive_metrics
  // NOTE: Using type cast because these columns are new and types.ts may not be updated yet
  const { data: decayData, isLoading: decayLoading } = useQuery({
    queryKey: ["decay-tracking", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select(`
          last_ae_xp_at,
          last_ra_xp_at,
          last_ct_xp_at,
          last_in_xp_at,
          low_rec_streak_days,
          rec_snapshot_date,
          readiness_decay_applied,
          readiness_decay_week_start,
          sci_decay_applied,
          sci_decay_week_start,
          dual_process_decay_applied,
          dual_process_decay_week_start,
          performance_avg_window_start_value,
          performance_avg_window_start_date,
          consecutive_performance_drop_days
        `)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Cast to expected shape since types may be stale
      return data as {
        last_ae_xp_at: string | null;
        last_ra_xp_at: string | null;
        last_ct_xp_at: string | null;
        last_in_xp_at: string | null;
        low_rec_streak_days: number | null;
        rec_snapshot_date: string | null;
        readiness_decay_applied: number | null;
        readiness_decay_week_start: string | null;
        sci_decay_applied: number | null;
        sci_decay_week_start: string | null;
        dual_process_decay_applied: number | null;
        dual_process_decay_week_start: string | null;
        performance_avg_window_start_value: number | null;
        performance_avg_window_start_date: string | null;
        consecutive_performance_drop_days: number | null;
      } | null;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  // Fetch last training date
  const { data: lastTrainingData, isLoading: trainingLoading } = useQuery({
    queryKey: ["last-training-date", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Check game_sessions for most recent training
      const { data: gameData, error: gameError } = await supabase
        .from("game_sessions")
        .select("completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (gameError) throw gameError;
      
      // Also check neuro_gym_sessions
      const { data: gymData, error: gymError } = await supabase
        .from("neuro_gym_sessions")
        .select("completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (gymError) throw gymError;
      
      // Get most recent of both
      const gameDateStr = gameData?.completed_at;
      const gymDateStr = gymData?.completed_at;
      
      if (!gameDateStr && !gymDateStr) return null;
      if (!gameDateStr) return gymDateStr;
      if (!gymDateStr) return gameDateStr;
      
      return gameDateStr > gymDateStr ? gameDateStr : gymDateStr;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  
  // Fetch weekly XP by system
  const { data: weeklyXPData, isLoading: xpLoading } = useQuery({
    queryKey: ["weekly-system-xp", userId, weekStart],
    queryFn: async () => {
      if (!userId) return { s1XP: 0, s2XP: 0 };
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("xp_awarded, system_type")
        .eq("user_id", userId)
        .gte("completed_at", `${weekStart}T00:00:00`);
      
      if (error) throw error;
      
      let s1XP = 0;
      let s2XP = 0;
      
      (data || []).forEach((session) => {
        if (session.system_type === "S1") {
          s1XP += session.xp_awarded || 0;
        } else {
          s2XP += session.xp_awarded || 0;
        }
      });
      
      return { s1XP, s2XP };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
  
  const adjustments = useMemo((): DecayAdjustments => {
    const defaultAdjustments: DecayAdjustments = {
      aeDecay: 0,
      raDecay: 0,
      ctDecay: 0,
      inDecay: 0,
      readinessDecay: 0,
      sciDecay: 0,
      dualProcessDecay: 0,
      cognitiveAgeRegression: 0,
      consecutiveLowRecDays: 0,
      daysSinceLastTraining: 0,
    };
    
    if (!decayData) return defaultAdjustments;
    
    // Calculate days since last training
    let daysSinceLastTraining = 0;
    if (lastTrainingData) {
      const lastTrainingDate = parseISO(lastTrainingData);
      daysSinceLastTraining = differenceInDays(today, lastTrainingDate);
    } else {
      // If no training ever, assume max days
      daysSinceLastTraining = 30;
    }
    
    // Get consecutive low REC days from the daily snapshot (updated by useDailyRecoverySnapshot)
    const consecutiveLowRecDays = decayData.low_rec_streak_days ?? 0;
    
    // Calculate skill decay using timestamp columns
    const buildSkillInput = (
      lastXpDateStr: string | null,
      currentValue: number,
      baselineValue: number
    ): SkillDecayInput => ({
      lastXpDate: lastXpDateStr ? parseISO(lastXpDateStr) : null,
      currentValue,
      baselineValue,
      today,
    });
    
    const aeDecay = calculateSkillDecay(
      buildSkillInput(decayData.last_ae_xp_at, currentStates.AE, baseline.baselineAE)
    );
    const raDecay = calculateSkillDecay(
      buildSkillInput(decayData.last_ra_xp_at, currentStates.RA, baseline.baselineRA)
    );
    const ctDecay = calculateSkillDecay(
      buildSkillInput(decayData.last_ct_xp_at, currentStates.CT, baseline.baselineCT)
    );
    const inDecay = calculateSkillDecay(
      buildSkillInput(decayData.last_in_xp_at, currentStates.IN, baseline.baselineIN)
    );
    
    // Calculate readiness decay - check if week reset needed
    const readinessDecayWeekStart = decayData.readiness_decay_week_start;
    const currentReadinessDecayApplied = 
      readinessDecayWeekStart === weekStart 
        ? (decayData.readiness_decay_applied ?? 0) 
        : 0;
    
    const readinessDecay = calculateReadinessDecay({
      consecutiveLowRecDays,
      currentDecayApplied: currentReadinessDecayApplied,
    });
    
    // Calculate SCI decay
    const sciDecayWeekStart = decayData.sci_decay_week_start;
    const currentSCIDecayApplied = 
      sciDecayWeekStart === weekStart 
        ? (decayData.sci_decay_applied ?? 0) 
        : 0;
    
    const sciDecay = calculateSCIDecay({
      recovery,
      daysSinceLastTraining,
      currentDecayApplied: currentSCIDecayApplied,
    });
    
    // Calculate dual-process decay
    const dpDecayWeekStart = decayData.dual_process_decay_week_start;
    const currentDPDecayApplied = 
      dpDecayWeekStart === weekStart 
        ? (decayData.dual_process_decay_applied ?? 0) 
        : 0;
    
    const dualProcessDecay = calculateDualProcessDecay({
      weeklyS1XP: weeklyXPData?.s1XP ?? 0,
      weeklyS2XP: weeklyXPData?.s2XP ?? 0,
      currentDecayApplied: currentDPDecayApplied,
    });
    
    // Calculate cognitive age regression
    const cognitiveAgeRegression = calculateCognitiveAgeRegression({
      currentPerformanceAvg,
      windowStartPerformanceAvg: decayData.performance_avg_window_start_value 
        ? Number(decayData.performance_avg_window_start_value) 
        : null,
      consecutiveDropDays: decayData.consecutive_performance_drop_days ?? 0,
    });
    
    return {
      aeDecay,
      raDecay,
      ctDecay,
      inDecay,
      readinessDecay,
      sciDecay,
      dualProcessDecay,
      cognitiveAgeRegression,
      consecutiveLowRecDays,
      daysSinceLastTraining,
    };
  }, [decayData, lastTrainingData, weeklyXPData, recovery, currentStates, baseline, currentPerformanceAvg, today, weekStart]);
  
  return {
    adjustments,
    isLoading: decayLoading || trainingLoading || xpLoading,
  };
}

/**
 * Hook to update decay tracking state in the database.
 * Called when computing metrics to keep tracking data fresh.
 */
export function useUpdateDecayTracking() {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  
  const updateTracking = async (
    recovery: number,
    performanceAvg: number
  ) => {
    if (!userId) return;
    
    const today = format(new Date(), "yyyy-MM-dd");
    const weekStart = getCurrentWeekStart();
    
    // Fetch current tracking state
    const { data: current, error: fetchError } = await supabase
      .from("user_cognitive_metrics")
      .select(`
        consecutive_low_rec_days,
        last_low_rec_check_date,
        readiness_decay_applied,
        readiness_decay_week_start,
        sci_decay_applied,
        sci_decay_week_start,
        performance_avg_window_start_value,
        performance_avg_window_start_date,
        consecutive_performance_drop_days
      `)
      .eq("user_id", userId)
      .maybeSingle();
    
    if (fetchError || !current) return;
    
    const updates: Record<string, unknown> = {
      last_decay_calculation_date: today,
    };
    
    // Update consecutive low REC days
    if (current.last_low_rec_check_date !== today) {
      if (isRecoveryLow(recovery)) {
        updates.consecutive_low_rec_days = (current.consecutive_low_rec_days ?? 0) + 1;
      } else {
        updates.consecutive_low_rec_days = 0;
      }
      updates.last_low_rec_check_date = today;
    }
    
    // Reset weekly decay counters if new week
    if (current.readiness_decay_week_start !== weekStart) {
      updates.readiness_decay_applied = 0;
      updates.readiness_decay_week_start = weekStart;
    }
    if (current.sci_decay_week_start !== weekStart) {
      updates.sci_decay_applied = 0;
      updates.sci_decay_week_start = weekStart;
    }
    
    // Track performance drop window for cognitive age
    const windowStartValue = current.performance_avg_window_start_value 
      ? Number(current.performance_avg_window_start_value) 
      : null;
    
    if (windowStartValue === null) {
      // Initialize window
      updates.performance_avg_window_start_value = performanceAvg;
      updates.performance_avg_window_start_date = today;
      updates.consecutive_performance_drop_days = 0;
    } else {
      const drop = windowStartValue - performanceAvg;
      if (drop >= 10) {
        // Performance has dropped significantly
        updates.consecutive_performance_drop_days = 
          (current.consecutive_performance_drop_days ?? 0) + 1;
      } else {
        // Performance recovered - reset window
        updates.performance_avg_window_start_value = performanceAvg;
        updates.performance_avg_window_start_date = today;
        updates.consecutive_performance_drop_days = 0;
      }
    }
    
    // Apply updates
    await supabase
      .from("user_cognitive_metrics")
      .update(updates)
      .eq("user_id", userId);
  };
  
  return { updateTracking };
}
