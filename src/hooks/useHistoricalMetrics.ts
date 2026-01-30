/**
 * ============================================
 * HISTORICAL METRICS HOOK
 * ============================================
 * 
 * Fetches historical metric snapshots for a specific date.
 * Used by Home page to display past days' metrics.
 * Data comes from daily_metric_snapshots table.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, isToday, parseISO } from "date-fns";

export interface HistoricalMetrics {
  date: string;
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
  s1: number | null;
  s2: number | null;
  ae: number | null;
  ra: number | null;
  ct: number | null;
  inScore: number | null;
}

interface UseHistoricalMetricsOptions {
  date: string; // Format: yyyy-MM-dd
}

export function useHistoricalMetrics({ date }: UseHistoricalMetricsOptions) {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["historical-metrics", user?.id, date],
    queryFn: async (): Promise<HistoricalMetrics | null> => {
      if (!user?.id) return null;

      const { data: snapshot, error } = await supabase
        .from("daily_metric_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .eq("snapshot_date", date)
        .maybeSingle();

      if (error) throw error;
      if (!snapshot) return null;

      return {
        date: snapshot.snapshot_date,
        readiness: snapshot.readiness != null ? Number(snapshot.readiness) : null,
        sharpness: snapshot.sharpness != null ? Number(snapshot.sharpness) : null,
        recovery: snapshot.recovery != null ? Number(snapshot.recovery) : null,
        reasoningQuality: snapshot.reasoning_quality != null ? Number(snapshot.reasoning_quality) : null,
        s1: snapshot.s1 != null ? Number(snapshot.s1) : null,
        s2: snapshot.s2 != null ? Number(snapshot.s2) : null,
        ae: snapshot.ae != null ? Number(snapshot.ae) : null,
        ra: snapshot.ra != null ? Number(snapshot.ra) : null,
        ct: snapshot.ct != null ? Number(snapshot.ct) : null,
        inScore: snapshot.in_score != null ? Number(snapshot.in_score) : null,
      };
    },
    enabled: !!user?.id && !!date,
    staleTime: 5 * 60_000,
  });

  return {
    metrics: data,
    isLoading,
    error,
    hasData: !!data,
  };
}

// Helper to get date string for N days ago
export function getDateNDaysAgo(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

// Helper to check if a date string is today
export function isDateToday(dateStr: string): boolean {
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

// Helper to get formatted display label for a date
export function getDateDisplayLabel(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const today = new Date();
    
    if (isToday(date)) {
      return "Today";
    }
    
    const yesterday = subDays(today, 1);
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    }
    
    // Show day name + date for older dates
    return format(date, "EEE d MMM");
  } catch {
    return dateStr;
  }
}
