/**
 * useGameInsight
 *
 * Returns the optional "Cognitive Insight" payload for the post-session
 * report (UnifiedGameResults). Pulls the user's last N completed sessions
 * for a given game_type and computes:
 *   - vsAverage: delta of current score vs personal 7-session avg (in score units, %-style)
 *   - trend: last N scores including the current session (oldest → newest) for sparkline
 *   - metricImpact: estimated lift on the routed metric, derived from XP awarded
 *   - calibrationNote: short premium copy
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GameSkill } from "@/components/games/UnifiedGameResults";

type GameType = "S1-AE" | "S1-RA" | "S2-CT" | "S2-IN";

const SKILL_TO_METRIC: Record<GameSkill, "Sharpness" | "Readiness" | "RQ" | "Thinking"> = {
  AE: "Sharpness",
  RA: "Sharpness",
  CT: "RQ",
  IN: "Thinking",
};

interface Args {
  gameType: GameType;
  skill: GameSkill;
  currentScore: number; // 0-100
  xpAwarded: number;
}

export function useGameInsight({ gameType, skill, currentScore, xpAwarded }: Args) {
  const { user } = useAuth();
  const userId = user?.id;

  const { data } = useQuery({
    queryKey: ["game-insight", userId, gameType],
    queryFn: async () => {
      if (!userId) return [] as number[];
      const { data, error } = await supabase
        .from("game_sessions")
        .select("score, completed_at")
        .eq("user_id", userId)
        .eq("game_type", gameType)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(7);
      if (error) return [];
      // oldest → newest, exclude the just-recorded current session if duplicated
      return (data || []).map((r) => Number(r.score) || 0).reverse();
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const history = data || [];

  // 7-day personal average (excluding current session's contribution to avoid bias)
  const priorScores = history.length > 1 ? history.slice(0, -1) : history;
  const avg =
    priorScores.length > 0
      ? priorScores.reduce((a, b) => a + b, 0) / priorScores.length
      : null;

  const vsAverage =
    avg !== null
      ? { delta: Math.round(currentScore - avg), unit: "%", label: "vs your 7-session avg" }
      : undefined;

  // Trend: last 7 sessions (or fewer); ensure current session is the last point
  const trend =
    history.length >= 2
      ? history.slice(-7)
      : undefined;

  // Estimated metric lift: rough proxy from XP (45 XP ≈ +1.0 point on metric)
  const metricImpact =
    xpAwarded > 0
      ? { metric: SKILL_TO_METRIC[skill], delta: Math.round((xpAwarded / 45) * 10) / 10 }
      : undefined;

  const calibrationNote =
    priorScores.length >= 3
      ? "Difficulty adapts to your level. Recent sessions excluded to prevent perceptual fatigue."
      : "Difficulty adapts to your level as more sessions accumulate.";

  return { vsAverage, trend, metricImpact, calibrationNote };
}
