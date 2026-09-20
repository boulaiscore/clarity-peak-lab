import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPerformanceTrend,
  type PerformanceWindow,
} from "@/lib/performanceTrend";

export function usePerformanceTrend(windowDays: PerformanceWindow) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["performance-trend", user?.id, windowDays],
    queryFn: async () => {
      if (!user?.id) return buildPerformanceTrend([], [], windowDays);

      const startDate = format(subDays(new Date(), windowDays - 1), "yyyy-MM-dd");
      const startTimestamp = startOfDay(subDays(new Date(), windowDays - 1)).toISOString();
      const [sessionsResult, healthResult] = await Promise.all([
        supabase
          .from("game_sessions")
          .select("completed_at, score, quality_score, difficulty")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("completed_at", startTimestamp)
          .order("completed_at", { ascending: true }),
        supabase
          .from("phone_health_snapshots")
          .select("date, sleep_min")
          .eq("user_id", user.id)
          .gte("date", startDate)
          .order("date", { ascending: true }),
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (healthResult.error) {
        console.warn("[PerformanceTrend] Sleep history unavailable", healthResult.error);
      }

      return buildPerformanceTrend(
        (sessionsResult.data ?? []).map((row) => ({
          completedAt: row.completed_at,
          score: Number(row.score),
          qualityScore: row.quality_score != null ? Number(row.quality_score) : null,
          difficulty: row.difficulty,
        })),
        (healthResult.data ?? []).map((row) => ({
          date: row.date,
          sleepMin: row.sleep_min,
        })),
        windowDays,
      );
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });
}