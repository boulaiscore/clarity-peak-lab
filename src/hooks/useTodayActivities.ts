import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay } from "date-fns";

export type ActivityKey = "games" | "quality" | "detox" | "walk";

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

const fmtMin = (m: number) => (m >= 10 ? Math.round(m).toString() : m.toFixed(1));

export function useTodayActivities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["today-activities", user?.id],
    queryFn: async (): Promise<TodayActivity[]> => {
      if (!user?.id) return [];

      const todayStart = startOfDay(new Date()).toISOString();

      const [gamesRes, qualityRes, detoxRes, walkRes] = await Promise.all([
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
      ]);

      const rows: TodayActivity[] = [];

      (gamesRes.data || []).forEach((r: any) => {
        const min = (Number(r.duration_seconds) || 0) / 60;
        rows.push({
          id: `g-${r.id}`,
          key: "games",
          label: "Cognitive Game",
          tileValue: fmtMin(min),
          startedAt: r.started_at || r.completed_at,
          endedAt: r.completed_at,
        });
      });

      (qualityRes.data || []).forEach((r: any) => {
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

      (detoxRes.data || []).forEach((r: any) => {
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

      (walkRes.data || []).forEach((r: any) => {
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

      // Sort by end time descending (most recent first — WHOOP style)
      rows.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
      return rows;
    },
    staleTime: 60_000,
  });
}
