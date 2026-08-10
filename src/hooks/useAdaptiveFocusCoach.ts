import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import type { AdaptiveCoachPassiveState } from "@/hooks/useAdaptiveCoachShadow";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  FOCUS_INTEGRITY_MODEL_VERSION,
  evaluateFocusIntegrityValidation,
  generateFocusIntegrityForecast,
  type FocusIntegrityObservationPoint,
  type FocusIntegrityValidationRecord,
} from "@/lib/focusIntegrity";
import { trackProductEvent } from "@/lib/productAnalytics";

const FOCUS_QUERY_KEY = "adaptive-focus";

interface LooseResult {
  data?: unknown;
  error: unknown;
}

interface LooseQuery extends PromiseLike<LooseResult> {
  select(columns: string): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  order(column: string, options: { ascending: boolean }): LooseQuery;
  limit(count: number): LooseQuery;
  upsert(
    values: Record<string, unknown>,
    options: { onConflict: string; ignoreDuplicates?: boolean },
  ): LooseQuery;
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

export function useAdaptiveFocusShadowRecorder({
  passiveFeatures,
  isLoading,
}: AdaptiveCoachPassiveState): void {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const targetDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const attemptedRef = useRef<string | null>(null);

  const existingQuery = useQuery({
    queryKey: [FOCUS_QUERY_KEY, "today", userId, today, FOCUS_INTEGRITY_MODEL_VERSION],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await looseSupabase
        .from("adaptive_focus_forecasts")
        .select("id")
        .eq("user_id", userId)
        .eq("forecast_date", today)
        .eq("model_version", FOCUS_INTEGRITY_MODEL_VERSION)
        .limit(1);
      if (error) throw error;
      return records(data);
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const historyQuery = useQuery({
    queryKey: [FOCUS_QUERY_KEY, "observations", userId],
    queryFn: async (): Promise<FocusIntegrityObservationPoint[]> => {
      if (!userId) return [];
      const { data, error } = await looseSupabase
        .from("passive_focus_observations")
        .select("observation_date, score, is_evaluable")
        .eq("user_id", userId)
        .eq("is_evaluable", true)
        .order("observation_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return records(data).flatMap((row) => {
        const date = stringValue(row.observation_date);
        const score = numberValue(row.score);
        return date && score !== null ? [{ date, score }] : [];
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const forecast = useMemo(() => {
    if (!passiveFeatures) return null;
    const current = passiveFeatures.metrics.current;
    if (!current || Array.isArray(current) || typeof current !== "object") return null;
    const currentMetrics = current as Record<string, unknown>;
    const sharpness = numberValue(currentMetrics.sharpness);
    const readiness = numberValue(currentMetrics.readiness);
    const recovery = numberValue(currentMetrics.recovery);
    if (sharpness === null || readiness === null || recovery === null) return null;

    return generateFocusIntegrityForecast({
      sharpness,
      readiness,
      recovery,
      healthScore: passiveFeatures.coachContext.healthScore,
      attentionLoadRatio: passiveFeatures.coachContext.attentionLoadRatio,
      passiveCoverage: passiveFeatures.coachContext.dataCoverage,
      history: historyQuery.data ?? [],
    });
  }, [historyQuery.data, passiveFeatures]);

  useEffect(() => {
    const attemptKey = userId
      ? `${userId}:${today}:${FOCUS_INTEGRITY_MODEL_VERSION}`
      : null;
    if (
      !userId ||
      !attemptKey ||
      !forecast ||
      !passiveFeatures ||
      isLoading ||
      existingQuery.isLoading ||
      historyQuery.isLoading ||
      existingQuery.isError ||
      historyQuery.isError ||
      (existingQuery.data?.length ?? 0) > 0 ||
      attemptedRef.current === attemptKey
    ) {
      return;
    }

    attemptedRef.current = attemptKey;
    void (async () => {
      const { error } = await looseSupabase
        .from("adaptive_focus_forecasts")
        .upsert({
          user_id: userId,
          forecast_date: today,
          target_date: targetDate,
          predicted_at: new Date().toISOString(),
          mode: "shadow",
          model_version: FOCUS_INTEGRITY_MODEL_VERSION,
          is_evaluable: forecast.isEvaluable,
          baseline_score: forecast.baselineScore,
          predicted_score: forecast.predictedScore,
          predicted_delta: forecast.predictedDelta,
          confidence: forecast.confidence,
          features: forecast.features as unknown as Json,
          explanation: {
            target: "next_day_focus_integrity",
            reasons: forecast.reasons,
            boundary: "Sustained-attention proxy; not intelligence, work quality or productivity.",
          } as Json,
        }, {
          onConflict: "user_id,forecast_date,model_version",
          ignoreDuplicates: true,
        });

      if (error) {
        attemptedRef.current = null;
        console.warn("[AdaptiveCoach] Focus forecast unavailable:", error);
        return;
      }

      trackProductEvent("coach_focus_shadow_forecast_generated", {
        modelVersion: FOCUS_INTEGRITY_MODEL_VERSION,
        evaluable: forecast.isEvaluable,
        historyDays: forecast.features.historyDays,
      });
      await queryClient.invalidateQueries({ queryKey: [FOCUS_QUERY_KEY] });
    })();
  }, [
    existingQuery.data,
    existingQuery.isError,
    existingQuery.isLoading,
    forecast,
    historyQuery.isError,
    historyQuery.isLoading,
    isLoading,
    passiveFeatures,
    queryClient,
    targetDate,
    today,
    userId,
  ]);
}

export interface AdaptiveFocusLatestOutcome {
  targetDate: string;
  predictedScore: number;
  observedScore: number;
  predictedDelta: number;
  observedDelta: number;
}

export function useAdaptiveFocusValidation() {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: [FOCUS_QUERY_KEY, "validation", userId, FOCUS_INTEGRITY_MODEL_VERSION],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await looseSupabase
        .from("adaptive_focus_forecasts")
        .select("target_date, predicted_score, observed_score, predicted_delta, observed_delta, is_evaluable, outcome_status")
        .eq("user_id", userId)
        .eq("model_version", FOCUS_INTEGRITY_MODEL_VERSION)
        .order("target_date", { ascending: false })
        .limit(120);
      if (error) throw error;
      return records(data);
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const result = useMemo(() => {
    const rows = query.data ?? [];
    const validationRecords: FocusIntegrityValidationRecord[] = rows.flatMap((row) => {
      const predictedDelta = numberValue(row.predicted_delta);
      const observedDelta = numberValue(row.observed_delta);
      return row.outcome_status === "observed" &&
        row.is_evaluable === true &&
        predictedDelta !== null &&
        observedDelta !== null
        ? [{ predictedDelta, observedDelta }]
        : [];
    });
    const latest = rows.find((row) =>
      row.outcome_status === "observed" &&
      numberValue(row.predicted_score) !== null &&
      numberValue(row.observed_score) !== null &&
      numberValue(row.predicted_delta) !== null &&
      numberValue(row.observed_delta) !== null,
    );
    const latestOutcome: AdaptiveFocusLatestOutcome | null = latest
      ? {
          targetDate: stringValue(latest.target_date) ?? "",
          predictedScore: numberValue(latest.predicted_score) as number,
          observedScore: numberValue(latest.observed_score) as number,
          predictedDelta: numberValue(latest.predicted_delta) as number,
          observedDelta: numberValue(latest.observed_delta) as number,
        }
      : null;

    return {
      validation: evaluateFocusIntegrityValidation(validationRecords),
      latestOutcome,
      totalForecasts: rows.length,
      observedForecasts: rows.filter((row) => row.outcome_status === "observed").length,
    };
  }, [query.data]);

  return {
    ...result,
    modelVersion: FOCUS_INTEGRITY_MODEL_VERSION,
    isLoading: query.isLoading,
    error: query.error,
  };
}
