import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay } from "date-fns";

const DURATION_MINUTES: Record<string, number> = {
  "30s": 0.5, "1min": 1, "90s": 1.5, "2min": 2, "3min": 3, "5min": 5, "7min": 7,
};

export interface TodayActivity {
  key: "train" | "quality" | "recover";
  label: string;
  minutes: number;
  sessions: number;
}

export function useTodayActivities() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["today-activities", user?.id],
    queryFn: async (): Promise<TodayActivity[]> => {
      if (!user?.id) return defaults();
      const todayStart = startOfDay(new Date()).toISOString();

      const [trainRes, qualityRes, recoverRes] = await Promise.all([
        supabase
          .from("neuro_gym_sessions")
          .select("duration_option")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
        supabase
          .from("reason_sessions")
          .select("duration_seconds")
          .eq("user_id", user.id)
          .gte("started_at", todayStart)
          .not("ended_at", "is", null),
        supabase
          .from("detox_completions")
          .select("duration_minutes")
          .eq("user_id", user.id)
          .gte("completed_at", todayStart),
      ]);

      const trainMinutes = (trainRes.data || []).reduce(
        (s, r: any) => s + (DURATION_MINUTES[r.duration_option as string] ?? 2),
        0,
      );
      const qualityMinutes = (qualityRes.data || []).reduce(
        (s, r: any) => s + (Number(r.duration_seconds) || 0) / 60,
        0,
      );
      const recoverMinutes = (recoverRes.data || []).reduce(
        (s, r: any) => s + (Number(r.duration_minutes) || 0),
        0,
      );

      return [
        { key: "train", label: "Train", minutes: trainMinutes, sessions: trainRes.data?.length ?? 0 },
        { key: "quality", label: "Quality Time", minutes: qualityMinutes, sessions: qualityRes.data?.length ?? 0 },
        { key: "recover", label: "Recover", minutes: recoverMinutes, sessions: recoverRes.data?.length ?? 0 },
      ];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

function defaults(): TodayActivity[] {
  return [
    { key: "train", label: "Train", minutes: 0, sessions: 0 },
    { key: "quality", label: "Quality Time", minutes: 0, sessions: 0 },
    { key: "recover", label: "Recover", minutes: 0, sessions: 0 },
  ];
}
