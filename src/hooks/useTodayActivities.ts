import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay } from "date-fns";

export type ActivityKey = "games" | "quality" | "detox" | "walk" | "work";

export interface TodayActivity {
  id: string;
  key: ActivityKey;
  label: string;
  /** Primary metric value (e.g., "12.4" minutes). */
  tileValue: string;
  /** Session start time (ISO). */
  startedAt: string;
  /** Session end time (ISO). */
  endedAt: string;
}

interface GameActivityRow {
  id: string;
  started_at: string | null;
  completed_at: string;
  duration_seconds: number;
}

interface QualityActivityRow {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  content_type: string;
}

interface RecoveryActivityRow {
  id: string;
  started_at: string | null;
  completed_at: string;
  duration_minutes: number;
}

const fmtMin = (m: number) => (m >= 10 ? Math.round(m).toString() : m.toFixed(1));

export function useTodayActivities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["today-activities", user?.id],
    queryFn: async (): Promise<TodayActivity[]> => {
      if (!user?.id) return [];

      const todayStart = startOfDay(new Date()).toISOString();

      const [gamesRes, qualityRes, detoxRes, walkRes, workRes] = await Promise.all([
        supabase
          .from("game_sessions")
          .select("id, started_at, completed_at, duration_seconds")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
        supabase
          .from("reason_sessions")
          .select("id, started_at, ended_at, duration_seconds, content_type")
          .eq("user_id", user.id)
          .gte("started_at", todayStart)
          .not("ended_at", "is", null),
        supabase
          .from("detox_completions")
          .select("id, started_at, completed_at, duration_minutes")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
        supabase
          .from("walking_sessions")
          .select("id, started_at, completed_at, duration_minutes")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
        supabase
          .from("daily_work_recommendations")
          .select("id, started_at, ended_at, planned_duration_minutes")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("ended_at", todayStart),
      ]);

      const rows: TodayActivity[] = [];

      ((gamesRes.data ?? []) as unknown as GameActivityRow[]).forEach((r) => {
        const min = (Number(r.duration_seconds) || 0) / 60;
        rows.push({
          id: `g-${r.id}`,
          key: "games",
          label: "Cognitive Drill",
          tileValue: fmtMin(min),
          startedAt: r.started_at || r.completed_at,
          endedAt: r.completed_at,
        });
      });

      ((qualityRes.data ?? []) as unknown as QualityActivityRow[]).forEach((r) => {
        const min = (Number(r.duration_seconds) || 0) / 60;
        const isPodcast = r.content_type === "podcast";
        rows.push({
          id: `q-${r.id}`,
          key: "quality",
          label: isPodcast ? "Listening" : "Reading",
          tileValue: fmtMin(min),
          startedAt: r.started_at,
          endedAt: r.ended_at,
        });
      });

      ((detoxRes.data ?? []) as unknown as RecoveryActivityRow[]).forEach((r) => {
        const min = Number(r.duration_minutes) || 0;
        rows.push({
          id: `d-${r.id}`,
          key: "detox",
          label: "Detox",
          tileValue: fmtMin(min),
          startedAt: r.started_at || r.completed_at,
          endedAt: r.completed_at,
        });
      });

      ((walkRes.data ?? []) as unknown as RecoveryActivityRow[]).forEach((r) => {
        const min = Number(r.duration_minutes) || 0;
        rows.push({
          id: `w-${r.id}`,
          key: "walk",
          label: "Walking",
          tileValue: fmtMin(min),
          startedAt: r.started_at || r.completed_at,
          endedAt: r.completed_at,
        });
      });

      (workRes.data || []).forEach((r) => {
        if (!r.started_at || !r.ended_at) return;
        const actualMinutes = Math.max(
          1,
          (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 60_000,
        );
        rows.push({
          id: `work-${r.id}`,
          key: "work",
          label: "Work Block",
          tileValue: fmtMin(actualMinutes || r.planned_duration_minutes),
          startedAt: r.started_at,
          endedAt: r.ended_at,
        });
      });

      // Sort by end time descending (most recent first — WHOOP style)
      rows.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
      return rows;
    },
    staleTime: 60_000,
  });
}
