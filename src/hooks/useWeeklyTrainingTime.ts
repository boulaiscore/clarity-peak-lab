import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format } from "date-fns";

// Map duration_option strings to minutes
const DURATION_MINUTES: Record<string, number> = {
  "30s": 0.5,
  "1min": 1,
  "90s": 1.5,
  "2min": 2,
  "3min": 3,
  "5min": 5,
  "7min": 7,
};

export function useWeeklyTrainingTime() {
  const { user } = useAuth();
  const userId = user?.id;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-training-time", userId, weekStartStr],
    queryFn: async () => {
      if (!userId) return { totalMinutes: 0, gamesMinutes: 0, detoxMinutes: 0 };

      // Fetch neuro gym sessions this week
      const [gymRes, detoxRes] = await Promise.all([
        supabase
          .from("neuro_gym_sessions")
          .select("duration_option, completed_at")
          .eq("user_id", userId)
          .gte("completed_at", weekStart.toISOString()),
        supabase
          .from("detox_completions")
          .select("duration_minutes, completed_at")
          .eq("user_id", userId)
          .gte("completed_at", weekStart.toISOString()),
      ]);

      // Calculate games time
      let gamesMinutes = 0;
      if (gymRes.data) {
        for (const session of gymRes.data) {
          const dur = session.duration_option as string;
          gamesMinutes += DURATION_MINUTES[dur] || 2; // default 2min if unknown
        }
      }

      // Calculate detox time
      let detoxMinutes = 0;
      if (detoxRes.data) {
        for (const session of detoxRes.data) {
          detoxMinutes += session.duration_minutes || 0;
        }
      }

      const totalMinutes = gamesMinutes + detoxMinutes;

      return { totalMinutes, gamesMinutes, detoxMinutes };
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    totalMinutes: data?.totalMinutes ?? 0,
    gamesMinutes: data?.gamesMinutes ?? 0,
    detoxMinutes: data?.detoxMinutes ?? 0,
    isLoading,
  };
}
