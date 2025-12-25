// src/hooks/useReportData.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

type NeuroGymSession = {
  id: string;
  user_id: string;
  area: string;
  duration_option: string;
  exercises_used: string[];
  score: number;
  correct_answers: number;
  total_questions: number;
  is_daily_training: boolean | null;
  completed_at: string;
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

export function useReportData(userId: string) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UserCognitiveMetrics | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<NeuroGymSession[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [wearable, setWearable] = useState<WearableSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const [mRes, pRes, sRes, bRes, wRes] = await Promise.all([
          supabase.from("user_cognitive_metrics").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
          supabase
            .from("neuro_gym_sessions")
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

    // heatmap ultimi 30 giorni (opzionale)
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 30);
    const heat = new Map<string, number>();

    for (const s of sessions) {
      const areaKey = s.area as Area;
      if (areas.includes(areaKey)) {
        sessionsByArea[areaKey] += 1;
        scoresByArea[areaKey].push(s.score ?? 0);
      }

      totalCorrect += s.correct_answers ?? 0;
      totalQuestions += s.total_questions ?? 0;

      if (s.duration_option) durations.push(s.duration_option);

      const ex = Array.isArray(s.exercises_used) ? s.exercises_used : [];
      for (const id of ex) {
        allExercises.push(id);
        if (areas.includes(areaKey)) {
          exercisesByArea[areaKey].push(id);
        }
      }

      const d = new Date(s.completed_at);
      if (d >= cutoff) {
        const key = d.toISOString().slice(0, 10);
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
    };
  }, [sessions]);

  return { loading, error, metrics, profile, sessions, badges, wearable, aggregates };
}
