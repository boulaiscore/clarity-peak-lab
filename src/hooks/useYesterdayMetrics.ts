/**
 * ============================================
 * YESTERDAY METRICS HOOK
 * ============================================
 * 
 * Fetches yesterday's metric snapshot to calculate daily delta.
 * Used by Home page to show percentage change vs previous day.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";

export interface YesterdayMetrics {
  sharpness: number | null;
  readiness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
}

export function useYesterdayMetrics(currentDate: string) {
  const { user } = useAuth();

  // Calculate yesterday's date based on the current viewing date
  const yesterdayDate = format(subDays(new Date(currentDate), 1), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["yesterday-metrics", user?.id, yesterdayDate],
    queryFn: async (): Promise<YesterdayMetrics | null> => {
      if (!user?.id) return null;

      const { data: snapshot, error } = await supabase
        .from("daily_metric_snapshots")
        .select("sharpness, readiness, recovery, reasoning_quality")
        .eq("user_id", user.id)
        .eq("snapshot_date", yesterdayDate)
        .maybeSingle();

      if (error) throw error;
      if (!snapshot) return null;

      return {
        sharpness: snapshot.sharpness != null ? Number(snapshot.sharpness) : null,
        readiness: snapshot.readiness != null ? Number(snapshot.readiness) : null,
        recovery: snapshot.recovery != null ? Number(snapshot.recovery) : null,
        reasoningQuality: snapshot.reasoning_quality != null ? Number(snapshot.reasoning_quality) : null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  return {
    yesterdayMetrics: data,
    isLoading,
  };
}

// Helper to format delta as percentage change string
export function formatDeltaPercent(current: number, previous: number | null): string | null {
  if (previous === null || previous === 0) return null;
  
  const delta = current - previous;
  if (delta === 0) return null; // No meaningful change
  
  const percentChange = (delta / previous) * 100;
  const sign = percentChange > 0 ? "+" : "";
  return `${sign}${Math.round(percentChange)}%`;
}
