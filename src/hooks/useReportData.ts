// src/hooks/useReportData.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // adattalo al tuo progetto

type Area = "focus" | "reasoning" | "creativity";

type UserCognitiveMetrics = {
  user_id: string;
  fast_thinking: number;
  slow_thinking: number;
  baseline_fast_thinking: number;
  baseline_slow_thinking: number;

  focus_stability: number;
  reasoning_accuracy: number;
  creativity: number;
  clarity_score: number;
  decision_quality: number;
  bias_resistance: number;
  philosophical_reasoning: number;

  baseline_focus: number;
  baseline_reasoning: number;
  baseline_creativity: number;

  cognitive_performance_score: number;
  cognitive_readiness_score: number;

  experience_points: number;
  cognitive_level: number;
  total_sessions: number;

  // opzionali se presenti
  baseline_cognitive_age?: number;
  cognitive_age?: number;

  // wearable-derived
  physio_component_score?: number;
  readiness_classification?: string;
};

type Profile = {
  user_id: string;
  name?: string;
  training_goals: string[]; // ["fast_thinking"] | ["slow_thinking"] | ["fast_thinking","slow_thinking"]
  session_duration?: string; // es. "2min"
  daily_time_commitment?: number; // minuti
  work_type?: string;
  education_level?: string;
  degree_discipline?: string;
};

type NeuroGymSession = {
  id: string;
  user_id: string;
  area: Area;
  duration_option: string; // "30s" | "2min" | ...
  exercises_used: string[]; // ids esercizi
  score: number;
  correct_answers: number;
  total_questions: number;
  is_daily_training: boolean;
  completed_at: string; // ISO
};

type Badge = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description?: string;
  earned_at?: string;
};

type WearableSnapshot = {
  id: string;
  user_id: string;
  created_at: string;
  hrv_ms?: number;
  sleep_efficiency?: number;
  sleep_duration_min?: number;
  resting_hr?: number;
  activity_score?: number;
};

type ReportAggregates = {
  sessionsByArea: Record<Area, number>;
  avgScoreByArea: Record<Area, number>;
  accuracyRatePct: number;
  preferredDuration?: string;
  mostUsedExercises: { exerciseId: string; count: number }[];
  topExercisesByArea: Record<Area, { exerciseId: string; count: number }[]>;
  last30DaysHeatmap: { date: string; count: number }[]; // opzionale per mini-heatmap
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
          supabase.from("user_cognitive_metrics").select("*").eq("user_id", userId).single(),
          supabase.from("profiles").select("*").eq("user_id", userId).single(),
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
      sessionsByArea[s.area] += 1;
      scoresByArea[s.area].push(s.score ?? 0);

      totalCorrect += s.correct_answers ?? 0;
      totalQuestions += s.total_questions ?? 0;

      if (s.duration_option) durations.push(s.duration_option);

      const ex = Array.isArray(s.exercises_used) ? s.exercises_used : [];
      for (const id of ex) {
        allExercises.push(id);
        exercisesByArea[s.area].push(id);
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
