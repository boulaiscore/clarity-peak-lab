import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CANONICAL_METRIC_FORMULA_VERSION } from "@/lib/dataLineage";
import {
  deriveWeeklyInsight,
  type InsightDay,
  type InsightHealthDay,
  type WeeklyInsightResult,
} from "@/lib/weeklyInsights";

const LOOKBACK_DAYS = 45;

function lookbackStart(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - LOOKBACK_DAYS);
  return d.toISOString().slice(0, 10);
}

export function useWeeklyInsight(): { result: WeeklyInsightResult | null; isLoading: boolean } {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-insight-history", user?.id, today],
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const since = lookbackStart();

      const [snapshots, health] = await Promise.all([
        supabase
          .from("daily_metric_snapshots")
          .select("snapshot_date, sharpness, readiness, reasoning_quality, recovery, did_training, formula_version")
          .eq("user_id", user!.id)
          .eq("formula_version", CANONICAL_METRIC_FORMULA_VERSION)
          .gte("snapshot_date", since)
          .lt("snapshot_date", today)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("phone_health_snapshots")
          .select("date, sleep_min, steps, active_min, bedtime_dev_min")
          .eq("user_id", user!.id)
          .gte("date", since)
          .lt("date", today)
          .order("date", { ascending: true }),
      ]);

      const days: InsightDay[] = (snapshots.data ?? []).map((row) => ({
        date: row.snapshot_date,
        sharpness: row.sharpness,
        readiness: row.readiness,
        reasoningQuality: row.reasoning_quality,
        recovery: row.recovery,
        didTraining: row.did_training,
      }));

      const healthDays: InsightHealthDay[] = (health.data ?? []).map((row) => ({
        date: row.date,
        sleepMin: row.sleep_min,
        steps: row.steps,
        activeMin: row.active_min,
        bedtimeDevMin: row.bedtime_dev_min,
      }));

      return { days, healthDays };
    },
  });

  const result = useMemo(() => {
    if (!data) return null;
    return deriveWeeklyInsight(data.days, data.healthDays);
  }, [data]);

  return { result, isLoading };
}
