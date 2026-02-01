/**
 * ============================================
 * COGNITIVE AGE HOOK (v2)
 * ============================================
 * 
 * Slow-moving metric updated daily/weekly.
 * Reads from user_cognitive_age_weekly + user_cognitive_age_daily + user_cognitive_baselines.
 * 
 * v2 Changes:
 * - 4 variables (AE, RA, CT, IN) × 25% weight (no S2 double-counting)
 * - 180d main window for slow-moving age
 * - 30d window for Pace calculation
 * - Daily streak tracking for regression warnings
 * - Cumulative regression penalty (max 1/month)
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";

// ==========================================
// TYPES
// ==========================================

export interface PreRegressionWarning {
  streakDays: number;
  daysToRegression: number;
  message: string;
}

export interface CognitiveAgeData {
  // Weekly snapshot (slow-moving)
  cognitiveAge: number | null;
  score90d: number | null; // Now actually 180d for v2
  score30d: number | null;
  rq30d: number | null;
  rq90d: number | null;
  improvementPoints: number | null;
  weekStart: string | null;
  
  // v2 fields
  perf30d: number | null;
  perf180d: number | null;
  paceOfAgingX: number | null;
  engagementIndex: number | null;
  sessions30d: number;
  regressionPenaltyYears: number;
  preRegressionWarning: PreRegressionWarning | null;
  
  // Baseline info
  chronoAgeAtOnboarding: number | null;
  baselineScore90d: number | null;
  baselineRq90d: number | null;
  isBaselineCalibrated: boolean;
  
  // Regression tracking (live calculation)
  regressionRisk: "low" | "medium" | "high";
  regressionStreakDays: number;
  regressionTriggered: boolean;
  capApplied: boolean;
  
  // UI helpers
  isCalibrating: boolean;
  delta: number; // cognitiveAge - chronoAge (negative = younger)
  daysUntilNextUpdate: number | null;
}

// ==========================================
// CONSTANTS
// ==========================================

const REGRESSION_THRESHOLD_POINTS = 10;
const STREAK_WARNING_START = 14;
const STREAK_REGRESSION = 21;

// ==========================================
// MAIN HOOK
// ==========================================

export function useCognitiveAge() {
  const { user } = useAuth();

  // 1) Fetch latest weekly snapshot
  const { data: weeklySnapshot, isLoading: weeklyLoading } = useQuery({
    queryKey: ["cognitive-age-weekly", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_cognitive_age_weekly")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // 2) Fetch latest daily record (for real-time streak)
  const { data: dailyRecord, isLoading: dailyLoading } = useQuery({
    queryKey: ["cognitive-age-daily", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_cognitive_age_daily")
        .select("*")
        .eq("user_id", user.id)
        .order("calc_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // 3) Fetch baseline data
  const { data: baseline, isLoading: baselineLoading } = useQuery({
    queryKey: ["cognitive-baselines", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_cognitive_baselines")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // 4) Fallback: Fetch recent daily snapshots for live regression calculation if no daily record
  const { data: recentSnapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ["daily-snapshots-30d", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("snapshot_date, ae, ra, ct, in_score")
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .order("snapshot_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !dailyRecord,
    staleTime: 60_000,
  });

  // 5) Calculate live regression risk from daily data (fallback)
  const liveRegressionData = useMemo(() => {
    // Prefer daily record if available
    if (dailyRecord) {
      const streak = dailyRecord.regression_streak_days ?? 0;
      let risk: "low" | "medium" | "high" = "low";
      if (streak >= STREAK_REGRESSION) {
        risk = "high";
      } else if (streak >= STREAK_WARNING_START) {
        risk = "medium";
      }
      return { risk, streak };
    }

    // Fallback to calculating from snapshots
    if (!recentSnapshots || !baseline?.baseline_score_90d) {
      return { risk: "low" as const, streak: 0 };
    }

    const baselineScore = Number(baseline.baseline_score_90d);
    const threshold = baselineScore - REGRESSION_THRESHOLD_POINTS;

    let streak = 0;
    
    for (const snapshot of recentSnapshots) {
      // v2: Calculate perf without S2 (use only AE, RA, CT, IN)
      const skills = [snapshot.ae, snapshot.ra, snapshot.ct, snapshot.in_score]
        .filter((v): v is number => v !== null)
        .map(Number);
      
      if (skills.length === 0) {
        break;
      }
      
      const dailyAvg = skills.reduce((a, b) => a + b, 0) / skills.length;
      
      if (dailyAvg <= threshold) {
        streak++;
      } else {
        break;
      }
    }

    let risk: "low" | "medium" | "high" = "low";
    if (streak >= STREAK_REGRESSION) {
      risk = "high";
    } else if (streak >= STREAK_WARNING_START) {
      risk = "medium";
    }

    return { risk, streak };
  }, [recentSnapshots, baseline, dailyRecord]);

  // 6) Parse pre-regression warning from weekly data
  const preRegressionWarning = useMemo((): PreRegressionWarning | null => {
    if (!weeklySnapshot?.pre_regression_warning) return null;
    
    try {
      const warning = weeklySnapshot.pre_regression_warning as unknown;
      if (
        typeof warning === "object" && 
        warning !== null &&
        "streakDays" in warning &&
        "daysToRegression" in warning &&
        "message" in warning
      ) {
        return warning as PreRegressionWarning;
      }
    } catch {
      return null;
    }
    return null;
  }, [weeklySnapshot]);

  // 7) Compose final data
  const cognitiveAgeData: CognitiveAgeData = useMemo(() => {
    const chronoAge = baseline?.chrono_age_at_onboarding 
      ? Number(baseline.chrono_age_at_onboarding)
      : 30;
    
    const isCalibrated = baseline?.is_baseline_calibrated ?? false;
    
    const cogAge = weeklySnapshot?.cognitive_age 
      ? Number(weeklySnapshot.cognitive_age)
      : null;
    
    // Calculate days until next Sunday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

    return {
      // Weekly snapshot
      cognitiveAge: cogAge,
      score90d: weeklySnapshot?.score_90d ? Number(weeklySnapshot.score_90d) : null,
      score30d: weeklySnapshot?.score_30d ? Number(weeklySnapshot.score_30d) : null,
      rq30d: weeklySnapshot?.rq_30d ? Number(weeklySnapshot.rq_30d) : null,
      rq90d: weeklySnapshot?.rq_90d ? Number(weeklySnapshot.rq_90d) : null,
      improvementPoints: weeklySnapshot?.improvement_points 
        ? Number(weeklySnapshot.improvement_points) 
        : null,
      weekStart: weeklySnapshot?.week_start ?? null,
      
      // v2 fields
      perf30d: weeklySnapshot?.perf_short_30d ? Number(weeklySnapshot.perf_short_30d) : null,
      perf180d: weeklySnapshot?.perf_long_180d ? Number(weeklySnapshot.perf_long_180d) : null,
      paceOfAgingX: weeklySnapshot?.pace_of_aging_x ? Number(weeklySnapshot.pace_of_aging_x) : null,
      engagementIndex: weeklySnapshot?.engagement_index ? Number(weeklySnapshot.engagement_index) : null,
      sessions30d: weeklySnapshot?.sessions_30d ?? 0,
      regressionPenaltyYears: weeklySnapshot?.regression_penalty_years ?? 0,
      preRegressionWarning,
      
      // Baseline
      chronoAgeAtOnboarding: chronoAge,
      baselineScore90d: baseline?.baseline_score_90d 
        ? Number(baseline.baseline_score_90d) 
        : null,
      baselineRq90d: baseline?.baseline_rq_90d 
        ? Number(baseline.baseline_rq_90d) 
        : null,
      isBaselineCalibrated: isCalibrated,
      
      // Regression (use live calculation from daily record or snapshots)
      regressionRisk: liveRegressionData.risk,
      regressionStreakDays: liveRegressionData.streak,
      regressionTriggered: weeklySnapshot?.regression_triggered ?? false,
      capApplied: weeklySnapshot?.cap_applied ?? false,
      
      // UI helpers
      isCalibrating: !isCalibrated,
      delta: cogAge !== null ? cogAge - chronoAge : 0,
      daysUntilNextUpdate: daysUntilSunday,
    };
  }, [weeklySnapshot, baseline, liveRegressionData, preRegressionWarning]);

  return {
    data: cognitiveAgeData,
    isLoading: weeklyLoading || baselineLoading || dailyLoading || snapshotsLoading,
    hasWeeklyData: !!weeklySnapshot,
    hasBaseline: !!baseline,
    hasDailyData: !!dailyRecord,
  };
}

// ==========================================
// UTILITY: Get regression risk label
// ==========================================

export function getRegressionRiskLabel(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low":
      return "Stable";
    case "medium":
      return "At Risk";
    case "high":
      return "Regression Imminent";
    default:
      return "Unknown";
  }
}

export function getRegressionRiskColor(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low":
      return "text-emerald-500";
    case "medium":
      return "text-amber-500";
    case "high":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

// ==========================================
// UTILITY: Get pace label
// ==========================================

export function getPaceLabel(pace: number | null): string {
  if (pace === null) return "Calculating...";
  if (pace <= 0.9) return "Aging Slower";
  if (pace <= 1.1) return "Stable";
  return "Aging Faster";
}

export function getPaceColor(pace: number | null): string {
  if (pace === null) return "text-muted-foreground";
  if (pace <= 0.9) return "text-emerald-500";
  if (pace <= 1.1) return "text-muted-foreground";
  return "text-red-500";
}
