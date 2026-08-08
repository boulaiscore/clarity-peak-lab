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
import { subDays, format } from "date-fns";

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

/**
 * Generate primary insight based on current cognitive state
 * Ordered by priority - first matching condition wins
 */
function generatePrimaryInsight(metrics: MetricsInput): CognitiveInsight {
  const { sharpness, readiness, recovery, rq } = metrics;

  // Recommendations describe observed inputs, not predicted work outcomes.
  if (recovery < 35) {
    return {
      headline: "Low recovery inputs — create space before demanding work",
      body: "Today's recovery inputs are low. Consider a short reset and re-check; this signal does not predict the quality of a decision.",
      type: "avoid",
      category: "state",
    };
  }

  // Priority 2: Low recovery + low RQ
  if (recovery < 50 && rq < 45) {
    return {
      headline: "Lower signals today — reduce avoidable load",
      body: "Recovery and task performance are both below your target range. Try a lighter block first, then re-check before complex work.",
      type: "avoid",
      category: "state",
    };
  }

  // Priority 3: Peak state - all systems aligned
  if (sharpness >= 75 && readiness >= 75 && rq >= 60) {
    return {
      headline: "Strong combined signal — protect a focused work block",
      body: "Today's brief tasks and recovery inputs are aligned. This may be a useful window for demanding work; log the outcome so LOOMA can learn your pattern.",
      type: "peak",
      category: "state",
    };
  }

  // Priority 4: Strong clarity
  if (sharpness >= 70 && readiness >= 70) {
    return {
      headline: "Strong signal — use it for focused work",
      body: "Today's task performance and readiness inputs are elevated. Consider protecting time for work that needs sustained attention.",
      type: "good",
      category: "state",
    };
  }

  // Priority 5: High reasoning quality
  if (rq >= 65 && recovery >= 55) {
    return {
      headline: "Reasoning tasks are strong today",
      body: "Your recent reasoning-task performance is strong and recovery inputs are adequate. A deliberate analysis block may fit well here.",
      type: "good",
      category: "state",
    };
  }

  // Priority 6: Quick bursts only
  if (sharpness >= 70 && readiness < 55) {
    return {
      headline: "Sharp start, lower endurance signal",
      body: "Brief-task performance is strong while readiness inputs are lower. Favor a short focused block and check how you feel before extending it.",
      type: "caution",
      category: "state",
    };
  }

  // Priority 7: Endurance without sharpness
  if (readiness >= 70 && sharpness < 55) {
    return {
      headline: "Stable readiness, moderate task signal",
      body: "Your recovery inputs are supportive while brief-task performance is moderate. Start with structured work and reassess afterward.",
      type: "caution",
      category: "state",
    };
  }

  // Priority 8: Low RQ with decent recovery
  if (rq < 40 && recovery >= 55) {
    return {
      headline: "Reasoning tasks are below your target range",
      body: "Today's brief reasoning tasks were lower. Treat this as a prompt to slow down, use a checklist and verify important assumptions.",
      type: "caution",
      category: "state",
    };
  }

  // Default: Stable baseline
  return {
    headline: "Stable signal — follow your normal plan",
    body: "Today's task and recovery inputs are near their usual range. Log a work block to help LOOMA connect the signal with your experience.",
    type: "good",
    category: "state",
  };
}

/**
 * Generate secondary insight based on long-term trends
 */
function generateSecondaryInsight(
  recentRQTrend: number | null,
  avgRecovery7d: number | null
): CognitiveInsight | null {
  if (recentRQTrend !== null && recentRQTrend > 5) {
    return {
      headline: "Reasoning-task trend is rising",
      body: "Scores on LOOMA reasoning tasks increased this week. More observations are needed before connecting this change to work performance.",
      type: "good",
      category: "trend",
    };
  }

  if (avgRecovery7d !== null && avgRecovery7d >= 60) {
    return {
      headline: "Cognitive reserve well-managed",
      body: "Your recorded recovery inputs have been consistently strong this week.",
      type: "good",
      category: "trend",
    };
  }

  return null;
}

export function useCognitiveInsights(metrics: MetricsInput): UseCognitiveInsightsResult {
  const { user } = useAuth();

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
      rqTrend ?? null,
      avgRecovery ?? null
    );

    return {
      primaryInsight,
      secondaryInsight,
      decisionReadiness: primaryInsight.type,
      isLoading: rqLoading || recoveryLoading,
    };
  }, [metrics, rqTrend, avgRecovery, rqLoading, recoveryLoading]);

  return result;
}
