import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  buildPassiveFeaturePayload,
  PASSIVE_FEATURE_SCHEMA_VERSION,
  type PassiveDeviceUsagePoint,
  type PassiveFeaturePayload,
} from "@/lib/passiveCoachFeatures";

interface LooseResult {
  data?: unknown;
  error: { message?: string; code?: string } | null;
}

interface LooseQuery extends PromiseLike<LooseResult> {
  select(columns: string): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  gte(column: string, value: string): LooseQuery;
  order(column: string, options: { ascending: boolean }): LooseQuery;
  limit(count: number): LooseQuery;
  upsert(values: Record<string, unknown>, options: { onConflict: string }): LooseQuery;
}

const looseSupabase = supabase as unknown as {
  from(table: string): LooseQuery;
};

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> =>
        row !== null && typeof row === "object" && !Array.isArray(row),
      )
    : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDeviceUsage(value: unknown): PassiveDeviceUsagePoint[] {
  return records(value).flatMap((row) => {
    const date = stringValue(row.snapshot_date);
    const source = stringValue(row.source);
    const permissionState = stringValue(row.permission_state);
    const coverage = stringValue(row.coverage);
    if (
      !date ||
      (source !== "android_usage_stats" && source !== "ios_device_activity") ||
      (permissionState !== "granted" &&
        permissionState !== "limited" &&
        permissionState !== "denied" &&
        permissionState !== "unavailable") ||
      (coverage !== "attention_apps" && coverage !== "screen_time_categories")
    ) {
      return [];
    }
    return [{
      date,
      attentionUsageMin: numberValue(row.attention_usage_min),
      activeAppCount: numberValue(row.active_app_count),
      lastAttentionUseAt: stringValue(row.last_attention_use_at),
      permissionState,
      confidence: numberValue(row.confidence),
      source,
      coverage,
    }];
  });
}

export interface AdaptivePassiveFeatureState {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  AE: number;
  RA: number;
  CT: number;
  IN: number;
  S1: number;
  S2: number;
  physioComponent: number | null;
  isLoading: boolean;
}

/**
 * Collects the user's longitudinal inputs and writes one versioned daily
 * snapshot for the shadow model. It never returns an active recommendation.
 */
export function useAdaptivePassiveFeatures(
  current: AdaptivePassiveFeatureState,
): {
  payload: PassiveFeaturePayload | null;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const userId = user?.id;
  const featureDate = format(new Date(), "yyyy-MM-dd");
  const sinceDate = format(subDays(new Date(), 14), "yyyy-MM-dd");
  const sinceTimestamp = subDays(new Date(), 14).toISOString();
  const persistedHashRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const sourceQuery = useQuery({
    queryKey: ["adaptive-passive-sources", userId, sinceDate],
    queryFn: async () => {
      if (!userId) return null;

      const [
        metricResult,
        gameResult,
        reasonResult,
        detoxResult,
        walkingResult,
        phoneResult,
        wearableResult,
        productResult,
        deviceResult,
      ] = await Promise.all([
        supabase
          .from("daily_metric_snapshots")
          .select("snapshot_date, sharpness, readiness, recovery, reasoning_quality, ae, ra, ct, in_score, s1, s2")
          .eq("user_id", userId)
          .gte("snapshot_date", sinceDate)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("game_sessions")
          .select("completed_at, duration_seconds, score")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", sinceTimestamp)
          .order("completed_at", { ascending: true })
          .limit(300),
        supabase
          .from("reason_sessions")
          .select("started_at, duration_seconds, background_interrupts, is_valid_for_rq")
          .eq("user_id", userId)
          .gte("started_at", sinceTimestamp)
          .order("started_at", { ascending: true })
          .limit(300),
        supabase
          .from("detox_completions")
          .select("completed_at, duration_minutes")
          .eq("user_id", userId)
          .gte("completed_at", sinceTimestamp)
          .order("completed_at", { ascending: true })
          .limit(200),
        supabase
          .from("walking_sessions")
          .select("completed_at, started_at, duration_minutes, status")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("started_at", sinceTimestamp)
          .order("started_at", { ascending: true })
          .limit(200),
        supabase
          .from("phone_health_snapshots")
          .select("date, sleep_min, bedtime_dev_min, steps, active_min, pickups, phi, confidence, source")
          .eq("user_id", userId)
          .gte("date", sinceDate)
          .order("date", { ascending: true }),
        supabase
          .from("wearable_snapshots")
          .select("date, hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, activity_score, source")
          .eq("user_id", userId)
          .gte("date", sinceDate)
          .order("date", { ascending: true }),
        looseSupabase
          .from("product_usage_events")
          .select("occurred_at")
          .eq("user_id", userId)
          .gte("occurred_at", sinceTimestamp)
          .order("occurred_at", { ascending: true })
          .limit(1500),
        looseSupabase
          .from("device_usage_snapshots")
          .select("snapshot_date, source, coverage, attention_usage_min, active_app_count, last_attention_use_at, permission_state, confidence")
          .eq("user_id", userId)
          .gte("snapshot_date", sinceDate)
          .order("snapshot_date", { ascending: true })
          .limit(30),
      ]);

      const errors = [
        metricResult.error,
        gameResult.error,
        reasonResult.error,
        detoxResult.error,
        walkingResult.error,
        phoneResult.error,
        wearableResult.error,
        productResult.error,
        deviceResult.error,
      ].filter(Boolean);
      if (errors.length > 0) {
        console.warn("[AdaptiveCoach] Some passive sources are unavailable:", errors);
      }

      return {
        metricRows: metricResult.data ?? [],
        gameRows: gameResult.data ?? [],
        reasonRows: reasonResult.data ?? [],
        detoxRows: detoxResult.data ?? [],
        walkingRows: walkingResult.data ?? [],
        phoneRows: phoneResult.data ?? [],
        wearableRows: wearableResult.data ?? [],
        productRows: productResult.data,
        deviceRows: deviceResult.data,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const isLoading = current.isLoading || sourceQuery.isLoading;

  const payload = useMemo(() => {
    if (!userId || isLoading || !sourceQuery.data) return null;
    const source = sourceQuery.data;
    const metricHistory = source.metricRows
      .filter((row) => row.snapshot_date !== featureDate)
      .map((row) => ({
        date: row.snapshot_date,
        sharpness: row.sharpness,
        readiness: row.readiness,
        recovery: row.recovery,
        reasoningQuality: row.reasoning_quality,
        AE: row.ae,
        RA: row.ra,
        CT: row.ct,
        IN: row.in_score,
        S1: row.s1,
        S2: row.s2,
      }));
    metricHistory.push({
      date: featureDate,
      sharpness: current.sharpness,
      readiness: current.readiness,
      recovery: current.recovery,
      reasoningQuality: current.reasoningQuality,
      AE: current.AE,
      RA: current.RA,
      CT: current.CT,
      IN: current.IN,
      S1: current.S1,
      S2: current.S2,
    });

    return buildPassiveFeaturePayload({
      featureDate,
      currentMetrics: {
        sharpness: current.sharpness,
        readiness: current.readiness,
        recovery: current.recovery,
        reasoningQuality: current.reasoningQuality,
        AE: current.AE,
        RA: current.RA,
        CT: current.CT,
        IN: current.IN,
        S1: current.S1,
        S2: current.S2,
        physioComponent: current.physioComponent,
      },
      metricHistory,
      games: source.gameRows.map((row) => ({
        completedAt: row.completed_at,
        durationSeconds: Number(row.duration_seconds),
        score: Number(row.score),
      })),
      reasonSessions: source.reasonRows.map((row) => ({
        startedAt: row.started_at,
        durationSeconds: Number(row.duration_seconds),
        backgroundInterrupts: Number(row.background_interrupts),
        isValidForRq: row.is_valid_for_rq,
      })),
      recoverySessions: [
        ...source.detoxRows.map((row) => ({
          completedAt: row.completed_at,
          durationMinutes: Number(row.duration_minutes),
        })),
        ...source.walkingRows.map((row) => ({
          completedAt: row.completed_at ?? row.started_at,
          durationMinutes: Number(row.duration_minutes),
        })),
      ],
      productEvents: records(source.productRows).flatMap((row) => {
        const occurredAt = stringValue(row.occurred_at);
        return occurredAt ? [{ occurredAt }] : [];
      }),
      phoneHealth: source.phoneRows.map((row) => ({
        date: row.date,
        sleepMin: row.sleep_min,
        bedtimeDeviationMin: row.bedtime_dev_min,
        steps: row.steps,
        activeMinutes: row.active_min,
        pickups: row.pickups,
        phi: row.phi,
        confidence: row.confidence,
        source: row.source,
      })),
      wearable: source.wearableRows.map((row) => ({
        date: row.date,
        hrvMs: row.hrv_ms,
        restingHr: row.resting_hr,
        sleepDurationMin: row.sleep_duration_min,
        sleepEfficiency: row.sleep_efficiency,
        activityScore: row.activity_score,
        source: row.source,
      })),
      deviceUsage: parseDeviceUsage(source.deviceRows),
      primaryOutcome: user.primaryOutcome ?? null,
    });
  }, [current, featureDate, isLoading, sourceQuery.data, user, userId]);

  useEffect(() => {
    if (!userId || !payload) return;
    const payloadHash = `${userId}:${featureDate}:${JSON.stringify(payload)}`;
    if (persistedHashRef.current === payloadHash) return;
    persistedHashRef.current = payloadHash;

    void (async () => {
      const { error } = await looseSupabase
        .from("adaptive_daily_feature_snapshots")
        .upsert({
          user_id: userId,
          feature_date: featureDate,
          schema_version: PASSIVE_FEATURE_SCHEMA_VERSION,
          metrics: payload.metrics as Json,
          behavior: payload.behavior as Json,
          health: payload.health as Json,
          device_usage: payload.deviceUsage as Json,
          availability: payload.availability as Json,
        }, { onConflict: "user_id,feature_date,schema_version" });

      if (error) {
        console.error("[AdaptiveCoach] Passive feature persistence failed:", error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["adaptive-coach-feature-status", userId] });
    })();
  }, [featureDate, payload, queryClient, userId]);

  return { payload, isLoading };
}
