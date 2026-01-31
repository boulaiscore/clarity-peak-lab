/**
 * ============================================
 * COGNITIVE AGE HOOK (v1.1)
 * ============================================
 * 
 * Slow-moving metric updated weekly.
 * Reads from user_cognitive_age_weekly + user_cognitive_baselines.
 * Computes live regression_risk from daily snapshots.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format, differenceInDays, parseISO } from "date-fns";

// ==========================================
// TYPES
// ==========================================

export interface CognitiveAgeData {
  // Weekly snapshot (slow-moving)
  cognitiveAge: number | null;
  score90d: number | null;
  score30d: number | null;
  rq30d: number | null;
  rq90d: number | null;
  improvementPoints: number | null;
  weekStart: string | null;
  
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
const STREAK_LOW_MAX = 9;
const STREAK_MEDIUM_MAX = 20;

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

  // 2) Fetch baseline data
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

  // 3) Fetch recent daily snapshots for live regression calculation
  const { data: recentSnapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ["daily-snapshots-30d", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("snapshot_date, ae, ra, ct, in_score, s2")
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .order("snapshot_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // 4) Calculate live regression risk from daily data
  const liveRegressionData = useMemo(() => {
    if (!recentSnapshots || !baseline?.baseline_score_90d) {
      return { risk: "low" as const, streak: 0 };
    }

    const baselineScore = Number(baseline.baseline_score_90d);
    const threshold = baselineScore - REGRESSION_THRESHOLD_POINTS;

    // Calculate daily skill averages and count consecutive days below threshold
    let streak = 0;
    
    for (const snapshot of recentSnapshots) {
      const skills = [snapshot.ae, snapshot.ra, snapshot.ct, snapshot.in_score, snapshot.s2]
        .filter((v): v is number => v !== null)
        .map(Number);
      
      if (skills.length === 0) {
        // No data for this day - break streak
        break;
      }
      
      const dailyAvg = skills.reduce((a, b) => a + b, 0) / skills.length;
      
      if (dailyAvg <= threshold) {
        streak++;
      } else {
        // Day above threshold - break streak
        break;
      }
    }

    let risk: "low" | "medium" | "high" = "low";
    if (streak >= STREAK_MEDIUM_MAX + 1) {
      risk = "high";
    } else if (streak >= STREAK_LOW_MAX + 1) {
      risk = "medium";
    }

    return { risk, streak };
  }, [recentSnapshots, baseline]);

  // 5) Compose final data
  const cognitiveAgeData: CognitiveAgeData = useMemo(() => {
    const chronoAge = baseline?.chrono_age_at_onboarding 
      ? Number(baseline.chrono_age_at_onboarding)
      : (user?.age ?? 30);
    
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
      
      // Baseline
      chronoAgeAtOnboarding: chronoAge,
      baselineScore90d: baseline?.baseline_score_90d 
        ? Number(baseline.baseline_score_90d) 
        : null,
      baselineRq90d: baseline?.baseline_rq_90d 
        ? Number(baseline.baseline_rq_90d) 
        : null,
      isBaselineCalibrated: isCalibrated,
      
      // Regression (use live calculation, fallback to weekly snapshot)
      regressionRisk: liveRegressionData.risk,
      regressionStreakDays: liveRegressionData.streak,
      regressionTriggered: weeklySnapshot?.regression_triggered ?? false,
      capApplied: weeklySnapshot?.cap_applied ?? false,
      
      // UI helpers
      isCalibrating: !isCalibrated,
      delta: cogAge !== null ? cogAge - chronoAge : 0,
      daysUntilNextUpdate: daysUntilSunday,
    };
  }, [weeklySnapshot, baseline, liveRegressionData, user?.age]);

  return {
    data: cognitiveAgeData,
    isLoading: weeklyLoading || baselineLoading || snapshotsLoading,
    hasWeeklyData: !!weeklySnapshot,
    hasBaseline: !!baseline,
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
