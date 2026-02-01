/**
 * ============================================
 * COGNITIVE AGE IMPACT HOOK
 * ============================================
 * 
 * Calculates per-variable contributions to Cognitive Age.
 * Each variable (AE, RA, CT, IN, S2) contributes 20% to the score.
 * This hook computes the delta from baseline for each variable.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";

// ==========================================
// TYPES
// ==========================================

export type VariableKey = "ae" | "ra" | "ct" | "in" | "s2";

export interface VariableContribution {
  key: VariableKey;
  label: string;
  fullLabel: string;
  currentValue: number;
  baselineValue: number;
  delta: number;           // currentValue - baselineValue
  contribution: number;    // delta × 0.20
  percentOfTotal: number;  // % of total contribution (0-100)
  status: "positive" | "neutral" | "negative";
  color: string;
}

export interface TrendDataPoint {
  date: string;
  dateLabel: string;
  ae: number | null;
  ra: number | null;
  ct: number | null;
  in: number | null;
  s2: number | null;
}

// ==========================================
// CONSTANTS
// ==========================================

const VARIABLE_WEIGHT = 0.20;

export const VARIABLE_CONFIG: Record<VariableKey, { label: string; fullLabel: string; color: string }> = {
  ae: { label: "AE", fullLabel: "Focus Stability", color: "hsl(210, 100%, 60%)" },
  ra: { label: "RA", fullLabel: "Fast Thinking", color: "hsl(280, 70%, 60%)" },
  ct: { label: "CT", fullLabel: "Reasoning Accuracy", color: "hsl(340, 80%, 60%)" },
  in: { label: "IN", fullLabel: "Slow Thinking", color: "hsl(45, 95%, 55%)" },
  s2: { label: "S2", fullLabel: "Reasoning Quality", color: "hsl(174, 72%, 45%)" },
};

// ==========================================
// MAIN HOOK
// ==========================================

export function useCognitiveAgeImpact() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  // 1) Fetch baseline data
  const { data: baseline, isLoading: baselineLoading } = useQuery({
    queryKey: ["cognitive-baselines-impact", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_cognitive_baselines")
        .select("baseline_score_90d, is_baseline_calibrated")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // 2) Fetch 90d daily snapshots for current values + baseline per-variable calculation
  const { data: snapshots90d, isLoading: snapshotsLoading } = useQuery({
    queryKey: ["daily-snapshots-90d-impact", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("snapshot_date, ae, ra, ct, in_score, s2")
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .order("snapshot_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // 3) Calculate per-variable baselines (first 21 days average)
  const variableBaselines = useMemo(() => {
    if (!snapshots90d || snapshots90d.length < 7) return null;

    // Use first 21 snapshots as baseline (matching calibration logic)
    const baselineSnapshots = snapshots90d.slice(0, 21);
    
    const calcAvg = (values: (number | null)[]) => {
      const valid = values.filter((v): v is number => v !== null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 50;
    };

    return {
      ae: calcAvg(baselineSnapshots.map(s => s.ae ? Number(s.ae) : null)),
      ra: calcAvg(baselineSnapshots.map(s => s.ra ? Number(s.ra) : null)),
      ct: calcAvg(baselineSnapshots.map(s => s.ct ? Number(s.ct) : null)),
      in: calcAvg(baselineSnapshots.map(s => s.in_score ? Number(s.in_score) : null)),
      s2: calcAvg(baselineSnapshots.map(s => s.s2 ? Number(s.s2) : null)),
    };
  }, [snapshots90d]);

  // 4) Calculate current values (90d rolling average)
  const currentValues = useMemo(() => {
    if (!snapshots90d || snapshots90d.length === 0) return null;

    const calcAvg = (values: (number | null)[]) => {
      const valid = values.filter((v): v is number => v !== null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 50;
    };

    return {
      ae: calcAvg(snapshots90d.map(s => s.ae ? Number(s.ae) : null)),
      ra: calcAvg(snapshots90d.map(s => s.ra ? Number(s.ra) : null)),
      ct: calcAvg(snapshots90d.map(s => s.ct ? Number(s.ct) : null)),
      in: calcAvg(snapshots90d.map(s => s.in_score ? Number(s.in_score) : null)),
      s2: calcAvg(snapshots90d.map(s => s.s2 ? Number(s.s2) : null)),
    };
  }, [snapshots90d]);

  // 5) Calculate contributions
  const contributions = useMemo((): VariableContribution[] => {
    if (!variableBaselines || !currentValues) return [];

    const keys: VariableKey[] = ["ae", "ra", "ct", "in", "s2"];
    
    const rawContributions = keys.map(key => {
      const current = currentValues[key];
      const baseline = variableBaselines[key];
      const delta = current - baseline;
      const contribution = delta * VARIABLE_WEIGHT;
      
      let status: "positive" | "neutral" | "negative" = "neutral";
      if (delta > 2) status = "positive";
      else if (delta < -2) status = "negative";

      return {
        key,
        label: VARIABLE_CONFIG[key].label,
        fullLabel: VARIABLE_CONFIG[key].fullLabel,
        currentValue: current,
        baselineValue: baseline,
        delta,
        contribution,
        percentOfTotal: 0, // Will be calculated after
        status,
        color: VARIABLE_CONFIG[key].color,
      };
    });

    // Sort by contribution (descending)
    rawContributions.sort((a, b) => b.contribution - a.contribution);

    // Calculate percent of total (based on absolute values)
    const maxAbsContribution = Math.max(...rawContributions.map(c => Math.abs(c.contribution)), 0.01);
    
    return rawContributions.map(c => ({
      ...c,
      percentOfTotal: (Math.abs(c.contribution) / maxAbsContribution) * 100,
    }));
  }, [variableBaselines, currentValues]);

  // 6) Calculate total improvement points
  const totalImprovementPoints = useMemo(() => {
    return contributions.reduce((sum, c) => sum + c.contribution, 0);
  }, [contributions]);

  // 7) Prepare trend data for chart
  const trendData = useMemo((): TrendDataPoint[] => {
    if (!snapshots90d) return [];

    const cutoffDate = format(subDays(new Date(), timeRange), "yyyy-MM-dd");
    const filteredSnapshots = snapshots90d.filter(s => s.snapshot_date >= cutoffDate);

    return filteredSnapshots.map(s => ({
      date: s.snapshot_date,
      dateLabel: format(new Date(s.snapshot_date), timeRange <= 7 ? "EEE" : "MMM d"),
      ae: s.ae ? Number(s.ae) : null,
      ra: s.ra ? Number(s.ra) : null,
      ct: s.ct ? Number(s.ct) : null,
      in: s.in_score ? Number(s.in_score) : null,
      s2: s.s2 ? Number(s.s2) : null,
    }));
  }, [snapshots90d, timeRange]);

  return {
    contributions,
    totalImprovementPoints,
    trendData,
    timeRange,
    setTimeRange,
    isLoading: baselineLoading || snapshotsLoading,
    hasEnoughData: (snapshots90d?.length ?? 0) >= 7,
    isCalibrated: baseline?.is_baseline_calibrated ?? false,
  };
}
