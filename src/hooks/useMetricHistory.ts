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
import {
  REC_HALF_LIFE_HOURS,
  SKILL_DECAY_THRESHOLD_DAYS,
  SKILL_DECAY_INTERVAL_DAYS,
  SKILL_DECAY_BASE_POINTS,
  SKILL_DECAY_INTERVAL_POINTS,
  SKILL_DECAY_MAX_POINTS,
} from "@/lib/decayConstants";

// Per-day Recovery decay multiplier from continuous half-life model.
const REC_DAILY_DECAY_MULTIPLIER = Math.pow(0.5, 24 / REC_HALF_LIFE_HOURS);

/**
 * Skill-style inactivity decay (Sharpness / Readiness / RQ).
 * No decay for the first SKILL_DECAY_THRESHOLD_DAYS of inactivity, then
 * SKILL_DECAY_BASE_POINTS at the threshold and SKILL_DECAY_INTERVAL_POINTS
 * every SKILL_DECAY_INTERVAL_DAYS thereafter, capped at SKILL_DECAY_MAX_POINTS.
 */
function skillInactivityDecayPoints(daysInactive: number): number {
  if (daysInactive < SKILL_DECAY_THRESHOLD_DAYS) return 0;
  const intervals = Math.floor(
    (daysInactive - SKILL_DECAY_THRESHOLD_DAYS) / SKILL_DECAY_INTERVAL_DAYS
  );
  return Math.min(
    SKILL_DECAY_MAX_POINTS,
    SKILL_DECAY_BASE_POINTS + intervals * SKILL_DECAY_INTERVAL_POINTS
  );
}

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
  days?: number; // Default 30 — size of returned (rendered) window
  forwardFill?: boolean; // If true, missing days are filled with last known value
  lookbackDays?: number; // Extra days fetched before window to seed forward-fill (default 60)
}

export function useMetricHistory(options: UseMetricHistoryOptions = {}) {
  const { user } = useAuth();
  const { days = 30, forwardFill = false, lookbackDays = 60 } = options;

  const fetchDays = forwardFill ? days + lookbackDays : days;

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ["metric-history", user?.id, days, forwardFill, lookbackDays],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), fetchDays), "yyyy-MM-dd");

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

  // Transform + (optionally) forward-fill so charts render a continuous trend
  // even on days the user didn't open the app. The carried value reflects
  // the user's last recorded cognitive state until a fresher snapshot exists.
  const history: MetricDataPoint[] = useMemo(() => {
    if (!rawData) return [];

    const byDate = new Map<string, typeof rawData[number]>();
    rawData.forEach((row) => byDate.set(row.snapshot_date, row));

    const windowStart = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

    if (!forwardFill) {
      return rawData
        .filter((r) => r.snapshot_date >= windowStart)
        .map((row) => ({
          date: row.snapshot_date,
          readiness: row.readiness != null ? Number(row.readiness) : null,
          sharpness: row.sharpness != null ? Number(row.sharpness) : null,
          recovery: row.recovery != null ? Number(row.recovery) : null,
          reasoningQuality: row.reasoning_quality != null ? Number(row.reasoning_quality) : null,
          s1: row.s1 != null ? Number(row.s1) : null,
          s2: row.s2 != null ? Number(row.s2) : null,
        }));
    }

    // Walk full fetched range, carrying forward last seen value per metric.
    let last: MetricDataPoint = {
      date: "",
      readiness: null,
      sharpness: null,
      recovery: null,
      reasoningQuality: null,
      s1: null,
      s2: null,
    };

    const filled: MetricDataPoint[] = [];
    for (let i = fetchDays - 1; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      const row = byDate.get(dateStr);
      if (row) {
        last = {
          date: dateStr,
          readiness: row.readiness != null ? Number(row.readiness) : last.readiness,
          sharpness: row.sharpness != null ? Number(row.sharpness) : last.sharpness,
          recovery: row.recovery != null ? Number(row.recovery) : last.recovery,
          reasoningQuality: row.reasoning_quality != null ? Number(row.reasoning_quality) : last.reasoningQuality,
          s1: row.s1 != null ? Number(row.s1) : last.s1,
          s2: row.s2 != null ? Number(row.s2) : last.s2,
        };
      }
      if (dateStr >= windowStart) {
        filled.push({ ...last, date: dateStr });
      }
    }

    return filled;
  }, [rawData, days, forwardFill, fetchDays]);

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
