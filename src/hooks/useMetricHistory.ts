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
import { subDays, format } from "date-fns";
import {
  calculateDailyRecoveryTarget,
  recalibrateRecoveryForNewDay,
} from "@/lib/recoveryV2";
import { calculatePhysioEstimate } from "@/lib/cognitiveEngine";

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

      const [metricResult, phoneResult, wearableResult] = await Promise.all([
        supabase
          .from("daily_metric_snapshots")
          .select("snapshot_date, readiness, sharpness, recovery, reasoning_quality, s1, s2")
          .eq("user_id", user.id)
          .gte("snapshot_date", startDate)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("phone_health_snapshots")
          .select("date, target_rec, sleep_min")
          .eq("user_id", user.id)
          .gte("date", startDate)
          .order("date", { ascending: true }),
        supabase
          .from("wearable_snapshots")
          .select("date, hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency")
          .eq("user_id", user.id)
          .gte("date", startDate)
          .order("date", { ascending: true }),
      ]);

      if (metricResult.error) throw metricResult.error;
      // Passive history is an enhancement. A connector/table outage must not
      // make the canonical metric chart unavailable.
      if (phoneResult.error) console.warn("[MetricHistory] Phone Health history unavailable", phoneResult.error);
      if (wearableResult.error) console.warn("[MetricHistory] Wearable history unavailable", wearableResult.error);
      return {
        metrics: metricResult.data || [],
        phone: phoneResult.data || [],
        wearable: wearableResult.data || [],
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // Transform + (optionally) forward-fill so charts render a continuous trend
  // even on days the user didn't open the app. The carried value reflects
  // the user's last recorded cognitive state until a fresher snapshot exists.
  const history: MetricDataPoint[] = useMemo(() => {
    if (!rawData) return [];

    const byDate = new Map<string, typeof rawData.metrics[number]>();
    rawData.metrics.forEach((row) => byDate.set(row.snapshot_date, row));
    const phoneByDate = new Map(rawData.phone.map((row) => [row.date, row]));
    const wearableByDate = new Map(rawData.wearable.map((row) => [row.date, row]));
    const recoveryTargetForDate = (date: string): number => {
      const phone = phoneByDate.get(date);
      const wearable = wearableByDate.get(date);
      const estimate = calculatePhysioEstimate(wearable ? {
        hrvMs: wearable.hrv_ms,
        restingHr: wearable.resting_hr,
        sleepDurationMin: wearable.sleep_duration_min,
        sleepEfficiency: wearable.sleep_efficiency,
      } : null, {
        includeSleepDuration: phone?.sleep_min == null,
      });
      return calculateDailyRecoveryTarget(phone?.target_rec, estimate);
    };

    const windowStart = format(subDays(new Date(), days - 1), "yyyy-MM-dd");

    if (!forwardFill) {
      return rawData.metrics
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
    // Missing days are projections, not observations. Recovery uses the same
    // daily mean-reversion model as Home. Other derived metrics remain at the
    // last observed value: applying a second headline-level decay here would
    // duplicate the skill decay already owned by the canonical state engine.
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
        // Real snapshot: replace each available metric independently.
        last = {
          date: dateStr,
          readiness: row.readiness != null ? Number(row.readiness) : last.readiness,
          sharpness: row.sharpness != null ? Number(row.sharpness) : last.sharpness,
          recovery: row.recovery != null
            ? Number(row.recovery)
            : last.recovery != null
              ? recalibrateRecoveryForNewDay(last.recovery, recoveryTargetForDate(dateStr))
              : null,
          reasoningQuality:
            row.reasoning_quality != null ? Number(row.reasoning_quality) : last.reasoningQuality,
          s1: row.s1 != null ? Number(row.s1) : last.s1,
          s2: row.s2 != null ? Number(row.s2) : last.s2,
        };
      } else if (last.date) {
        // Gap day: project Recovery toward neutral when no historical daily
        // Health target is available. Never collapse missing data toward 0.
        if (last.recovery != null) {
          last = {
            ...last,
            recovery: recalibrateRecoveryForNewDay(
              last.recovery,
              recoveryTargetForDate(dateStr),
            ),
          };
        }
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
