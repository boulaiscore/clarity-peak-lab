// src/hooks/useReportData.ts
/**
 * ============================================
 * NEUROLOOP PRO – REPORT DATA HOOK v2.1
 * ============================================
 * 
 * v2.1: Use getMediumPeriodStart() for consistent 7-day rolling window
 *       (aligned with temporal windows system, no timezone drift)
 * 
 * v2.0 BUGFIX: Switched from neuro_gym_sessions to game_sessions
 *       as the single source of truth for session tracking.
 *       Added explicit sessions_last_7d count for consistency
 *       with weekly XP calculations from exercise_completions.
 * 
 * Data sources:
 * - game_sessions: Session count tracking (gating + report)
 * - exercise_completions: XP ledger (weekly progress)
 * - user_cognitive_metrics: Aggregated metrics + total_sessions
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { getMediumPeriodStart } from "@/lib/temporalWindows";

type Area = "focus" | "reasoning" | "creativity";

type UserCognitiveMetrics = {
  user_id: string;
  fast_thinking: number;
  slow_thinking: number;
  baseline_fast_thinking: number | null;
  baseline_slow_thinking: number | null;

  focus_stability: number;
  reasoning_accuracy: number;
  creativity: number;
  clarity_score: number;
  decision_quality: number;
  bias_resistance: number;
  philosophical_reasoning: number;

  baseline_focus: number | null;
  baseline_reasoning: number | null;
  baseline_creativity: number | null;

  cognitive_performance_score: number | null;
  cognitive_readiness_score: number | null;

  experience_points: number | null;
  cognitive_level: number | null;
  total_sessions: number;

  baseline_cognitive_age?: number | null;

  physio_component_score?: number | null;
  readiness_classification?: string | null;
  
  spatial_reasoning: number;
  visual_processing: number;
  reaction_speed: number;
};

type Profile = {
  user_id: string;
  name?: string | null;
  training_goals?: string[] | null;
  session_duration?: string | null;
  daily_time_commitment?: string | null;
  work_type?: string | null;
  education_level?: string | null;
  degree_discipline?: string | null;
};

/**
 * v2.0: GameSession type matches game_sessions table (single source of truth)
 */
type GameSession = {
  id: string;
  user_id: string;
  system_type: string;        // "S1" | "S2"
  skill_routed: string;       // "AE" | "RA" | "CT" | "IN"
  game_type: string;          // "S1-AE" | "S1-RA" | "S2-CT" | "S2-IN"
  gym_area: string;
  thinking_mode: string;      // "fast" | "slow"
  xp_awarded: number;
  score: number;
  completed_at: string;
  game_name?: string | null;
};

type Badge = {
  id: string;
  user_id: string;
  badge_id: string;
  badge_name: string;
  badge_description?: string | null;
  badge_category: string;
  earned_at?: string;
};

type WearableSnapshot = {
  id: string;
  user_id: string;
  created_at: string;
  hrv_ms?: number | null;
  sleep_efficiency?: number | null;
  sleep_duration_min?: number | null;
  resting_hr?: number | null;
  activity_score?: number | null;
};

type ReportAggregates = {
  sessionsByArea: Record<Area, number>;
  avgScoreByArea: Record<Area, number>;
  accuracyRatePct: number;
  preferredDuration?: string;
  mostUsedExercises: { exerciseId: string; count: number }[];
  topExercisesByArea: Record<Area, { exerciseId: string; count: number }[]>;
  last30DaysHeatmap: { date: string; count: number }[];
  // v2.0: Explicit 7-day session count for alignment with weekly XP
  sessionsLast7d: number;
};

function safeAvg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function modeString(values: string[]) {
  if (!values.length) return undefined;
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function topN(items: string[], n: number) {
  const m = new Map<string, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([exerciseId, count]) => ({ exerciseId, count }));
}

/**
 * Map gym_area from game_sessions to Area type
 */
function mapGymAreaToArea(gymArea: string): Area | null {
  const areaMap: Record<string, Area> = {
    focus: "focus",
    reasoning: "reasoning",
    creativity: "creativity",
  };
  return areaMap[gymArea.toLowerCase()] ?? null;
}

export function useReportData(userId: string) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UserCognitiveMetrics | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [wearable, setWearable] = useState<WearableSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // v2.0: Fetch from game_sessions instead of neuro_gym_sessions
        const [mRes, pRes, sRes, bRes, wRes] = await Promise.all([
          supabase.from("user_cognitive_metrics").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
          supabase
            .from("game_sessions")
            .select("*")
            .eq("user_id", userId)
            .order("completed_at", { ascending: false })
            .limit(2000),
          supabase.from("user_badges").select("*").eq("user_id", userId).order("earned_at", { ascending: false }),
          supabase
            .from("wearable_snapshots")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (mRes.error) throw mRes.error;
        if (pRes.error) throw pRes.error;
        if (sRes.error) throw sRes.error;
        if (bRes.error) throw bRes.error;
        // wRes può essere null senza errore

        if (!cancelled) {
          setMetrics(mRes.data);
          setProfile(pRes.data);
          setSessions(sRes.data ?? []);
          setBadges(bRes.data ?? []);
          setWearable(wRes.data ?? null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const aggregates: ReportAggregates | null = useMemo(() => {
    if (!sessions) return null;

    const areas: Area[] = ["focus", "reasoning", "creativity"];

    const sessionsByArea: Record<Area, number> = { focus: 0, reasoning: 0, creativity: 0 };
    const scoresByArea: Record<Area, number[]> = { focus: [], reasoning: [], creativity: [] };

    let totalCorrect = 0;
    let totalQuestions = 0;

    const durations: string[] = [];
    const allExercises: string[] = [];

    const exercisesByArea: Record<Area, string[]> = { focus: [], reasoning: [], creativity: [] };

    // v2.1: Use getMediumPeriodStart for consistent rolling window (no timezone drift)
    const today = new Date();
    const sevenDaysAgo = getMediumPeriodStart(today);
    const cutoff30d = subDays(today, 30);
    const heat = new Map<string, number>();
    let sessionsLast7d = 0;

    for (const s of sessions) {
      const areaKey = mapGymAreaToArea(s.gym_area);
      const completedDate = new Date(s.completed_at);
      
      // Count sessions by area
      if (areaKey && areas.includes(areaKey)) {
        sessionsByArea[areaKey] += 1;
        scoresByArea[areaKey].push(s.score ?? 0);
      }

      // Accumulate score for accuracy (using score as percentage)
      totalCorrect += Math.round((s.score ?? 0) / 10); // Approximate from score
      totalQuestions += 10; // Normalized per session

      if (s.thinking_mode) durations.push(s.thinking_mode);

      // Track game types as "exercises"
      if (s.game_type) {
        allExercises.push(s.game_type);
        if (areaKey && areas.includes(areaKey)) {
          exercisesByArea[areaKey].push(s.game_type);
        }
      }

      // v2.0: Count sessions in 7-day window
      if (completedDate >= sevenDaysAgo) {
        sessionsLast7d++;
      }

      // Heatmap for last 30 days
      if (completedDate >= cutoff30d) {
        const key = completedDate.toISOString().slice(0, 10);
        heat.set(key, (heat.get(key) ?? 0) + 1);
      }
    }

    const avgScoreByArea: Record<Area, number> = {
      focus: safeAvg(scoresByArea.focus),
      reasoning: safeAvg(scoresByArea.reasoning),
      creativity: safeAvg(scoresByArea.creativity),
    };

    const accuracyRatePct = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    const preferredDuration = modeString(durations);

    const mostUsedExercises = topN(allExercises, 5);

    const topExercisesByArea: Record<Area, { exerciseId: string; count: number }[]> = {
      focus: topN(exercisesByArea.focus, 3),
      reasoning: topN(exercisesByArea.reasoning, 3),
      creativity: topN(exercisesByArea.creativity, 3),
    };

    const last30DaysHeatmap = [...heat.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return {
      sessionsByArea,
      avgScoreByArea,
      accuracyRatePct,
      preferredDuration,
      mostUsedExercises,
      topExercisesByArea,
      last30DaysHeatmap,
      sessionsLast7d, // v2.0: Explicit 7-day count
    };
  }, [sessions]);

  // v2.0: Dev guardrail - warn if XP exists but sessions missing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && aggregates && metrics) {
      const weeklyGamesXP = metrics.experience_points ?? 0; // Approximate
      if (weeklyGamesXP > 0 && aggregates.sessionsLast7d === 0) {
        console.warn(
          "[Data Mismatch] XP ledger has entries but session ledger is empty for last 7 days. " +
          "Check game completion flow in useRecordGameSession."
        );
      }
    }
  }, [aggregates, metrics]);

  return { loading, error, metrics, profile, sessions, badges, wearable, aggregates };
}
