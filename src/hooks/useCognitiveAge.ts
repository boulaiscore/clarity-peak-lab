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
import { subDays, format, parseISO, differenceInDays } from "date-fns";

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

  // 3b) Fetch user profile for birth_date
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-birthdate", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("birth_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // 4) Fetch recent daily snapshots for live performance calculation
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
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // 4b) Fetch 180-day snapshots for long-term average
  const { data: snapshots180d } = useQuery({
    queryKey: ["daily-snapshots-180d", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), 180), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("snapshot_date, ae, ra, ct, in_score")
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .order("snapshot_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
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

  // 6b) Calculate live Cognitive Age during calibration
  const liveCalibrationAge = useMemo(() => {
    // If already calibrated and has weekly data, don't use live calculation
    if (baseline?.is_baseline_calibrated && weeklySnapshot?.cognitive_age) {
      return null;
    }

    // Calculate current real age
    let currentRealAge: number;
    if (profile?.birth_date) {
      const birthDate = parseISO(profile.birth_date);
      const today = new Date();
      const ageInDays = differenceInDays(today, birthDate);
      currentRealAge = Math.round((ageInDays / 365.25) * 10) / 10;
    } else {
      currentRealAge = baseline?.chrono_age_at_onboarding 
        ? Number(baseline.chrono_age_at_onboarding)
        : 30;
    }

    // Need at least one snapshot to calculate
    if (!recentSnapshots || recentSnapshots.length === 0) {
      return { cognitiveAge: currentRealAge, perf30d: null, perf180d: null };
    }

    // Calculate current performance (latest snapshot)
    const latestSnapshot = recentSnapshots[0];
    const skills = [latestSnapshot.ae, latestSnapshot.ra, latestSnapshot.ct, latestSnapshot.in_score]
      .filter((v): v is number => v !== null)
      .map(Number);
    
    if (skills.length === 0) {
      return { cognitiveAge: currentRealAge, perf30d: null, perf180d: null };
    }

    // perf = 0.25 × (AE + RA + CT + IN)
    const currentPerf = skills.reduce((a, b) => a + b, 0) * 0.25;

    // Calculate 30-day average
    const perf30dValues = recentSnapshots.map(s => {
      const vals = [s.ae, s.ra, s.ct, s.in_score].filter((v): v is number => v !== null).map(Number);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) * 0.25 : null;
    }).filter((v): v is number => v !== null);
    
    const perf30d = perf30dValues.length > 0 
      ? perf30dValues.reduce((a, b) => a + b, 0) / perf30dValues.length 
      : null;

    // Calculate 180-day average (or use all available data as baseline)
    let perf180d: number | null = null;
    if (snapshots180d && snapshots180d.length > 0) {
      const perf180dValues = snapshots180d.map(s => {
        const vals = [s.ae, s.ra, s.ct, s.in_score].filter((v): v is number => v !== null).map(Number);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) * 0.25 : null;
      }).filter((v): v is number => v !== null);
      
      perf180d = perf180dValues.length > 0 
        ? perf180dValues.reduce((a, b) => a + b, 0) / perf180dValues.length 
        : null;
    }

    // Use baseline if available, otherwise use 50 as neutral baseline
    // During calibration, use 50 (population average) as reference point
    // This allows showing improvement even from the first session
    const calibrationBaseline = baseline?.baseline_score_90d 
      ? Number(baseline.baseline_score_90d)
      : 50; // Always use 50 as neutral baseline during calibration

    // Calculate improvement points
    // Each 10 points above baseline = -1 year cognitive age
    // Each 10 points below baseline = +1 year cognitive age
    const perfDiff = currentPerf - calibrationBaseline;
    const improvementPoints = perfDiff / 10; // 10 points = 1 year

    // Calculate cognitive age
    const cognitiveAge = Math.round((currentRealAge - improvementPoints) * 10) / 10;

    return { 
      cognitiveAge, 
      perf30d: perf30d ? Math.round(perf30d * 10) / 10 : null, 
      perf180d: perf180d ? Math.round(perf180d * 10) / 10 : null,
      currentPerf: Math.round(currentPerf * 10) / 10,
      calibrationBaseline: Math.round(calibrationBaseline * 10) / 10,
      improvementPoints: Math.round(improvementPoints * 10) / 10
    };
  }, [recentSnapshots, snapshots180d, baseline, profile, weeklySnapshot]);

  // 7) Compose final data
  const cognitiveAgeData: CognitiveAgeData = useMemo(() => {
    // Calculate current real age from birth_date (with 1 decimal precision)
    let currentRealAge: number;
    if (profile?.birth_date) {
      const birthDate = parseISO(profile.birth_date);
      const today = new Date();
      const ageInDays = differenceInDays(today, birthDate);
      currentRealAge = Math.round((ageInDays / 365.25) * 10) / 10; // 1 decimal precision
    } else {
      // Fallback to chrono_age_at_onboarding if no birth_date
      currentRealAge = baseline?.chrono_age_at_onboarding 
        ? Number(baseline.chrono_age_at_onboarding)
        : 30;
    }
    
    const isCalibrated = baseline?.is_baseline_calibrated ?? false;
    
    // Use weekly snapshot if calibrated and available, otherwise use live calculation
    let cogAge: number | null;
    let perf30d: number | null;
    let perf180d: number | null;
    
    if (isCalibrated && weeklySnapshot?.cognitive_age) {
      // Use stable weekly data
      cogAge = Math.round(Number(weeklySnapshot.cognitive_age) * 10) / 10;
      perf30d = weeklySnapshot?.perf_short_30d ? Number(weeklySnapshot.perf_short_30d) : null;
      perf180d = weeklySnapshot?.perf_long_180d ? Number(weeklySnapshot.perf_long_180d) : null;
    } else if (liveCalibrationAge) {
      // Use live calculation during calibration
      cogAge = liveCalibrationAge.cognitiveAge;
      perf30d = liveCalibrationAge.perf30d;
      perf180d = liveCalibrationAge.perf180d;
    } else {
      // Fallback: cognitive age = real age
      cogAge = currentRealAge;
      perf30d = null;
      perf180d = null;
    }
    
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
      
      // v2 fields - use live calculation during calibration
      perf30d: perf30d,
      perf180d: perf180d,
      paceOfAgingX: weeklySnapshot?.pace_of_aging_x ? Number(weeklySnapshot.pace_of_aging_x) : null,
      engagementIndex: weeklySnapshot?.engagement_index ? Number(weeklySnapshot.engagement_index) : null,
      sessions30d: weeklySnapshot?.sessions_30d ?? 0,
      regressionPenaltyYears: weeklySnapshot?.regression_penalty_years ?? 0,
      preRegressionWarning,
      
      // Baseline - now using dynamic current real age
      chronoAgeAtOnboarding: currentRealAge,
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
      delta: cogAge !== null ? Math.round((cogAge - currentRealAge) * 10) / 10 : 0,
      daysUntilNextUpdate: daysUntilSunday,
    };
  }, [weeklySnapshot, baseline, profile, liveRegressionData, preRegressionWarning, liveCalibrationAge]);

  return {
    data: cognitiveAgeData,
    isLoading: weeklyLoading || baselineLoading || profileLoading || dailyLoading || snapshotsLoading,
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
