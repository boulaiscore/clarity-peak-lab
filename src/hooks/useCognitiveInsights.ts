/**
 * useCognitiveInsights - Generates decision-making insights based on cognitive state
 * 
 * Prioritizes insights for professional decision-making rather than training suggestions.
 * Combines real-time state with long-term trend data for comprehensive guidance.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format, differenceInDays, parseISO } from "date-fns";

export type InsightType = "peak" | "good" | "caution" | "avoid";
export type InsightCategory = "state" | "trend";

export interface CognitiveInsight {
  headline: string;
  body: string;
  type: InsightType;
  category: InsightCategory;
}

export interface UseCognitiveInsightsResult {
  primaryInsight: CognitiveInsight;
  secondaryInsight: CognitiveInsight | null;
  decisionReadiness: InsightType;
  isLoading: boolean;
}

interface MetricsInput {
  sharpness: number;
  readiness: number;
  recovery: number;
  rq: number;
}

interface CognitiveAgeTrend {
  delta: number | null; // Difference from chronological age (negative = younger)
  weeklyChange: number | null; // Change over last 7 days
  isImproving: boolean;
}

/**
 * Generate primary insight based on current cognitive state
 * Ordered by priority - first matching condition wins
 */
function generatePrimaryInsight(metrics: MetricsInput): CognitiveInsight {
  const { sharpness, readiness, recovery, rq } = metrics;

  // Priority 1: Critical recovery warning
  if (recovery < 35) {
    return {
      headline: "Cognitive overload — avoid important decisions",
      body: "Your cognitive reserve is depleted. Major decisions made now are more likely to be flawed. Defer strategic choices until you've recovered.",
      type: "avoid",
      category: "state",
    };
  }

  // Priority 2: Low recovery + low RQ
  if (recovery < 50 && rq < 45) {
    return {
      headline: "Mental capacity limited — postpone complex analysis",
      body: "Both your recovery and reasoning depth are below optimal. Stick to routine tasks and avoid negotiations or evaluations requiring nuance.",
      type: "avoid",
      category: "state",
    };
  }

  // Priority 3: Peak state - all systems aligned
  if (sharpness >= 75 && readiness >= 75 && rq >= 60) {
    return {
      headline: "Peak state — optimal for strategic decisions",
      body: "Your processing speed, endurance, and reasoning depth are aligned. This is your best window for negotiations, complex analysis, and high-stakes decisions.",
      type: "peak",
      category: "state",
    };
  }

  // Priority 4: Strong clarity
  if (sharpness >= 70 && readiness >= 70) {
    return {
      headline: "Strong clarity — tackle your hardest problems",
      body: "Your cognitive systems are performing well. Good conditions for difficult work that requires sustained focus and rapid judgment.",
      type: "good",
      category: "state",
    };
  }

  // Priority 5: High reasoning quality
  if (rq >= 65 && recovery >= 55) {
    return {
      headline: "High reasoning quality — ideal for deep analysis",
      body: "Your reasoning depth is strong and you have adequate reserve. Prioritize work requiring careful evaluation and nuanced thinking.",
      type: "good",
      category: "state",
    };
  }

  // Priority 6: Quick bursts only
  if (sharpness >= 70 && readiness < 55) {
    return {
      headline: "Quick bursts available — short decisions only",
      body: "Your processing speed is high but endurance is limited. Make rapid decisions effectively, but avoid marathon sessions.",
      type: "caution",
      category: "state",
    };
  }

  // Priority 7: Endurance without sharpness
  if (readiness >= 70 && sharpness < 55) {
    return {
      headline: "Endurance good, clarity moderate — routine tasks preferred",
      body: "You can sustain effort but processing speed is reduced. Handle routine work smoothly, but save complex decisions for peak days.",
      type: "caution",
      category: "state",
    };
  }

  // Priority 8: Low RQ with decent recovery
  if (rq < 40 && recovery >= 55) {
    return {
      headline: "Reasoning depth limited — avoid complex evaluations",
      body: "Your analytical capacity is below baseline. Avoid decisions requiring deep reasoning or detecting subtle issues.",
      type: "caution",
      category: "state",
    };
  }

  // Default: Stable baseline
  return {
    headline: "Stable baseline — proceed with normal workload",
    body: "Your cognitive state is balanced. Standard work and moderate decisions are fine. No special adjustments needed.",
    type: "good",
    category: "state",
  };
}

/**
 * Generate secondary insight based on long-term trends
 */
function generateSecondaryInsight(
  cognitiveAgeTrend: CognitiveAgeTrend | null,
  recentRQTrend: number | null,
  avgRecovery7d: number | null
): CognitiveInsight | null {
  // Priority 1: Cognitive age improvement
  if (cognitiveAgeTrend && cognitiveAgeTrend.delta !== null && cognitiveAgeTrend.delta < -0.5) {
    const yearsYounger = Math.abs(cognitiveAgeTrend.delta).toFixed(1);
    return {
      headline: `Cognitive Age: ${yearsYounger} years younger than baseline`,
      body: "Sustained training is reducing your cognitive age. This reflects improved processing and reasoning capacity.",
      type: "peak",
      category: "trend",
    };
  }

  // Priority 2: RQ growth trend
  if (recentRQTrend !== null && recentRQTrend > 5) {
    return {
      headline: "Reasoning depth expanding steadily",
      body: "Your reasoning quality has been building over the past week. Deep work capacity is improving.",
      type: "good",
      category: "trend",
    };
  }

  // Priority 3: Good recovery management
  if (avgRecovery7d !== null && avgRecovery7d >= 60) {
    return {
      headline: "Cognitive reserve well-managed",
      body: "Your recovery has been consistently strong this week. You're maintaining sustainable cognitive load.",
      type: "good",
      category: "trend",
    };
  }

  // Priority 4: Cognitive age regression warning
  if (cognitiveAgeTrend && cognitiveAgeTrend.delta !== null && cognitiveAgeTrend.delta > 0.5) {
    return {
      headline: "Cognitive Age trend: slight regression",
      body: "Your cognitive age has increased slightly. Consider prioritizing recovery and consistent training.",
      type: "caution",
      category: "trend",
    };
  }

  return null;
}

export function useCognitiveInsights(metrics: MetricsInput): UseCognitiveInsightsResult {
  const { user } = useAuth();

  // Fetch cognitive age trend data
  const { data: cognitiveAgeTrend, isLoading: ageLoading } = useQuery({
    queryKey: ["cognitive-age-trend", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get latest weekly cognitive age data
      const { data: weeklyData, error } = await supabase
        .from("user_cognitive_age_weekly")
        .select("cognitive_age, week_start")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(4);

      if (error || !weeklyData?.length) return null;

      // Get user's chronological age
      const { data: profile } = await supabase
        .from("profiles")
        .select("birth_date, age")
        .eq("user_id", user.id)
        .maybeSingle();

      const chronoAge = profile?.age ?? 35; // Fallback to 35
      const latestCogAge = weeklyData[0]?.cognitive_age;
      
      if (latestCogAge === null || latestCogAge === undefined) return null;

      // Calculate delta (negative = younger)
      const delta = latestCogAge - chronoAge;
      
      // Calculate weekly change if we have prior data
      let weeklyChange: number | null = null;
      if (weeklyData.length >= 2 && weeklyData[1]?.cognitive_age !== null) {
        weeklyChange = latestCogAge - weeklyData[1].cognitive_age;
      }

      return {
        delta,
        weeklyChange,
        isImproving: delta < 0 || (weeklyChange !== null && weeklyChange < 0),
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Fetch RQ trend (compare today vs 7 days ago)
  const { data: rqTrend, isLoading: rqLoading } = useQuery({
    queryKey: ["rq-trend-7d", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("reasoning_quality, snapshot_date")
        .eq("user_id", user.id)
        .gte("snapshot_date", sevenDaysAgo)
        .order("snapshot_date", { ascending: true });

      if (error || !data || data.length < 2) return null;

      const oldestRQ = data[0]?.reasoning_quality;
      const newestRQ = data[data.length - 1]?.reasoning_quality;

      if (oldestRQ === null || newestRQ === null) return null;

      return newestRQ - oldestRQ;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Fetch average recovery over last 7 days
  const { data: avgRecovery, isLoading: recoveryLoading } = useQuery({
    queryKey: ["avg-recovery-7d", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("recovery")
        .eq("user_id", user.id)
        .gte("snapshot_date", sevenDaysAgo);

      if (error || !data || data.length === 0) return null;

      const validRecoveries = data
        .map((d) => d.recovery)
        .filter((r): r is number => r !== null);

      if (validRecoveries.length === 0) return null;

      return validRecoveries.reduce((a, b) => a + b, 0) / validRecoveries.length;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const result = useMemo(() => {
    const primaryInsight = generatePrimaryInsight(metrics);
    const secondaryInsight = generateSecondaryInsight(
      cognitiveAgeTrend ?? null,
      rqTrend ?? null,
      avgRecovery ?? null
    );

    return {
      primaryInsight,
      secondaryInsight,
      decisionReadiness: primaryInsight.type,
      isLoading: ageLoading || rqLoading || recoveryLoading,
    };
  }, [metrics, cognitiveAgeTrend, rqTrend, avgRecovery, ageLoading, rqLoading, recoveryLoading]);

  return result;
}
