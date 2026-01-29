/**
 * ============================================
 * METRIC HISTORY HOOK
 * ============================================
 * 
 * Fetches historical metric snapshots for analytics.
 * Supports configurable date ranges and granularity.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format, parseISO } from "date-fns";

export interface MetricDataPoint {
  date: string;
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
  s1?: number | null;
  s2?: number | null;
}

interface UseMetricHistoryOptions {
  days?: number; // Default 30
}

export function useMetricHistory(options: UseMetricHistoryOptions = {}) {
  const { user } = useAuth();
  const { days = 30 } = options;

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ["metric-history", user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("snapshot_date, readiness, sharpness, recovery, reasoning_quality, s1, s2")
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .order("snapshot_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // Transform to chart-friendly format
  const history: MetricDataPoint[] = useMemo(() => {
    if (!rawData) return [];

    return rawData.map((row) => ({
      date: row.snapshot_date,
      readiness: row.readiness != null ? Number(row.readiness) : null,
      sharpness: row.sharpness != null ? Number(row.sharpness) : null,
      recovery: row.recovery != null ? Number(row.recovery) : null,
      reasoningQuality: row.reasoning_quality != null ? Number(row.reasoning_quality) : null,
      s1: row.s1 != null ? Number(row.s1) : null,
      s2: row.s2 != null ? Number(row.s2) : null,
    }));
  }, [rawData]);

  // Calculate averages
  const averages = useMemo(() => {
    if (history.length === 0) {
      return {
        readiness: null,
        sharpness: null,
        recovery: null,
        reasoningQuality: null,
      };
    }

    const sum = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v !== null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    return {
      readiness: sum(history.map((h) => h.readiness)),
      sharpness: sum(history.map((h) => h.sharpness)),
      recovery: sum(history.map((h) => h.recovery)),
      reasoningQuality: sum(history.map((h) => h.reasoningQuality)),
    };
  }, [history]);

  // Calculate trends (last 7 days vs previous 7 days)
  const trends = useMemo(() => {
    if (history.length < 14) {
      return {
        readiness: null,
        sharpness: null,
        recovery: null,
        reasoningQuality: null,
      };
    }

    const last7 = history.slice(-7);
    const prev7 = history.slice(-14, -7);

    const avg = (arr: MetricDataPoint[], key: keyof Omit<MetricDataPoint, "date">) => {
      const valid = arr.map((h) => h[key]).filter((v): v is number => v !== null);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    const calcTrend = (key: keyof Omit<MetricDataPoint, "date">) => {
      const last = avg(last7, key);
      const prev = avg(prev7, key);
      if (last === null || prev === null) return null;
      return last - prev;
    };

    return {
      readiness: calcTrend("readiness"),
      sharpness: calcTrend("sharpness"),
      recovery: calcTrend("recovery"),
      reasoningQuality: calcTrend("reasoningQuality"),
    };
  }, [history]);

  return {
    history,
    averages,
    trends,
    isLoading,
    error,
    hasData: history.length > 0,
  };
}
