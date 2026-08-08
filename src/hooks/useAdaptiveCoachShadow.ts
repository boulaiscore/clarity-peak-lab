import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert } from "@/integrations/supabase/types";
import {
  ADAPTIVE_COACH_MODEL_VERSION,
  ADAPTIVE_COACH_OUTCOME_WINDOW_DAYS,
  type CoachActionKey,
  type CoachCalibrationOutcome,
  type CoachGameObservation,
  type CoachReason,
  type CoachSkill,
  type CoachValidationRecord,
  evaluateCoachValidation,
  generateCoachShadowPredictions,
} from "@/lib/adaptiveCoach";
import { trackProductEvent } from "@/lib/productAnalytics";

const COACH_QUERY_KEY = "adaptive-coach-predictions";

function isCoachSkill(value: string): value is CoachSkill {
  return value === "AE" || value === "RA" || value === "CT" || value === "IN";
}

function isCoachAction(value: string): value is CoachActionKey {
  return value === "train_ae" || value === "train_ra" || value === "train_ct" || value === "train_in";
}

function parseReasons(value: Json): CoachReason[] {
  if (!value || Array.isArray(value) || typeof value !== "object") return [];
  const reasons = value.reasons;
  if (!Array.isArray(reasons)) return [];

  return reasons.flatMap((reason) => {
    if (!reason || Array.isArray(reason) || typeof reason !== "object") return [];
    const { code, label, evidence, strength } = reason;
    if (
      typeof code !== "string" ||
      typeof label !== "string" ||
      typeof evidence !== "string" ||
      typeof strength !== "number"
    ) {
      return [];
    }
    return [{ code, label, evidence, strength } as CoachReason];
  });
}

/**
 * Generates one immutable daily candidate set. The hook deliberately has no
 * return value that can be consumed by training UI, keeping shadow predictions
 * separated from active recommendations.
 */
export function useAdaptiveCoachShadowRecorder(): void {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const attemptedKeyRef = useRef<string | null>(null);
  const {
    AE,
    RA,
    CT,
    IN,
    sharpness,
    readiness,
    recovery,
    isRecoveryInitialized,
    isLoading: metricsLoading,
  } = useTodayMetrics();

  const { data: existingToday, isLoading: existingLoading, isError: existingError } = useQuery({
    queryKey: [COACH_QUERY_KEY, "today", userId, today, ADAPTIVE_COACH_MODEL_VERSION],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("adaptive_coach_predictions")
        .select("id")
        .eq("user_id", userId)
        .eq("prediction_date", today)
        .eq("model_version", ADAPTIVE_COACH_MODEL_VERSION);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const { data: recentSessions, isLoading: sessionsLoading, isError: sessionsError } = useQuery({
    queryKey: [COACH_QUERY_KEY, "game-history", userId],
    queryFn: async (): Promise<CoachGameObservation[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("game_sessions")
        .select("skill_routed, score, completed_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(80);
      if (error) throw error;

      return (data ?? []).flatMap((session) => {
        if (!isCoachSkill(session.skill_routed) || !Number.isFinite(Number(session.score))) return [];
        return [{
          skill: session.skill_routed,
          score: Number(session.score),
          completedAt: new Date(session.completed_at),
        }];
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const { data: calibrationOutcomes, isLoading: calibrationLoading, isError: calibrationError } = useQuery({
    queryKey: [COACH_QUERY_KEY, "calibration", userId, ADAPTIVE_COACH_MODEL_VERSION],
    queryFn: async (): Promise<CoachCalibrationOutcome[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("adaptive_coach_predictions")
        .select("action_key, predicted_delta, observed_delta")
        .eq("user_id", userId)
        .eq("model_version", ADAPTIVE_COACH_MODEL_VERSION)
        .eq("outcome_status", "observed")
        .eq("is_evaluable", true)
        .not("observed_delta", "is", null)
        .order("evaluated_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      return (data ?? []).flatMap((row) => {
        if (!isCoachAction(row.action_key) || row.observed_delta == null) return [];
        return [{
          actionKey: row.action_key,
          predictedDelta: Number(row.predicted_delta),
          observedDelta: Number(row.observed_delta),
        }];
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const predictions = useMemo(() => generateCoachShadowPredictions(
    {
      states: { AE, RA, CT, IN },
      sharpness,
      readiness,
      recovery,
      recoveryInitialized: isRecoveryInitialized,
    },
    recentSessions ?? [],
    calibrationOutcomes ?? [],
  ), [
    AE,
    RA,
    CT,
    IN,
    sharpness,
    readiness,
    recovery,
    isRecoveryInitialized,
    recentSessions,
    calibrationOutcomes,
  ]);

  useEffect(() => {
    const attemptKey = userId ? `${userId}:${today}:${ADAPTIVE_COACH_MODEL_VERSION}` : null;
    const loading = metricsLoading || existingLoading || sessionsLoading || calibrationLoading;
    if (
      !userId ||
      !attemptKey ||
      loading ||
      existingError ||
      sessionsError ||
      calibrationError ||
      (existingToday?.length ?? 0) > 0 ||
      attemptedKeyRef.current === attemptKey
    ) {
      return;
    }

    attemptedKeyRef.current = attemptKey;
    const predictedAt = new Date();
    const expiresAt = addDays(predictedAt, ADAPTIVE_COACH_OUTCOME_WINDOW_DAYS).toISOString();

    void (async () => {
      const payload: TablesInsert<"adaptive_coach_predictions">[] = predictions.map((prediction) => ({
        user_id: userId,
        prediction_date: today,
        predicted_at: predictedAt.toISOString(),
        expires_at: expiresAt,
        mode: "shadow",
        model_version: ADAPTIVE_COACH_MODEL_VERSION,
        action_key: prediction.actionKey,
        target_skill: prediction.targetSkill,
        candidate_rank: prediction.rank,
        is_top_candidate: prediction.isTopCandidate,
        is_evaluable: prediction.isEvaluable,
        baseline_score: prediction.baselineScore,
        predicted_score: prediction.predictedScore,
        predicted_delta: prediction.predictedDelta,
        priority_score: prediction.priorityScore,
        confidence: prediction.confidence,
        features: prediction.features as unknown as Json,
        explanation: {
          forecast_target: "next_same_skill_game_score_delta",
          outcome_window_days: ADAPTIVE_COACH_OUTCOME_WINDOW_DAYS,
          reasons: prediction.reasons as unknown as Json,
          formula: "rolling baseline + recent trend + state fit + regression + shrunk personal residual",
          limitation: "Predictive association only; not a causal training-effect estimate.",
        } as Json,
      }));

      const { error } = await supabase
        .from("adaptive_coach_predictions")
        .upsert(payload, {
          onConflict: "user_id,prediction_date,action_key,model_version",
          ignoreDuplicates: true,
        });

      if (error) {
        attemptedKeyRef.current = null;
        console.error("[AdaptiveCoach] Shadow prediction persistence failed:", error);
        return;
      }

      trackProductEvent("coach_shadow_predictions_generated", {
        modelVersion: ADAPTIVE_COACH_MODEL_VERSION,
        candidateCount: payload.length,
        evaluableCount: payload.filter((row) => row.is_evaluable).length,
      });
      await queryClient.invalidateQueries({ queryKey: [COACH_QUERY_KEY] });
    })();
  }, [
    userId,
    today,
    metricsLoading,
    existingLoading,
    sessionsLoading,
    calibrationLoading,
    existingError,
    sessionsError,
    calibrationError,
    existingToday,
    predictions,
    queryClient,
  ]);
}

export interface AdaptiveCoachLatestOutcome {
  actionKey: CoachActionKey;
  predictedAt: string;
  outcomeAt: string;
  predictedScore: number;
  outcomeScore: number;
  predictedDelta: number;
  observedDelta: number;
  confidence: number;
  reasons: CoachReason[];
}

export function useAdaptiveCoachValidation() {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: [COACH_QUERY_KEY, "validation", userId, ADAPTIVE_COACH_MODEL_VERSION],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("adaptive_coach_predictions")
        .select("action_key, predicted_at, outcome_at, predicted_score, outcome_score, predicted_delta, observed_delta, confidence, explanation, is_evaluable, outcome_status")
        .eq("user_id", userId)
        .eq("model_version", ADAPTIVE_COACH_MODEL_VERSION)
        .order("predicted_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const result = useMemo(() => {
    const rows = query.data ?? [];
    const validationRecords: CoachValidationRecord[] = rows.flatMap((row) => {
      if (
        row.outcome_status !== "observed" ||
        !row.is_evaluable ||
        !isCoachAction(row.action_key) ||
        row.observed_delta == null
      ) {
        return [];
      }
      return [{
        actionKey: row.action_key,
        predictedDelta: Number(row.predicted_delta),
        observedDelta: Number(row.observed_delta),
      }];
    });

    const latestRow = rows.find((row) =>
      row.outcome_status === "observed" &&
      isCoachAction(row.action_key) &&
      row.outcome_at != null &&
      row.outcome_score != null &&
      row.observed_delta != null,
    );
    const latestOutcome: AdaptiveCoachLatestOutcome | null = latestRow && isCoachAction(latestRow.action_key)
      ? {
          actionKey: latestRow.action_key,
          predictedAt: latestRow.predicted_at,
          outcomeAt: latestRow.outcome_at as string,
          predictedScore: Number(latestRow.predicted_score),
          outcomeScore: Number(latestRow.outcome_score),
          predictedDelta: Number(latestRow.predicted_delta),
          observedDelta: Number(latestRow.observed_delta),
          confidence: Number(latestRow.confidence),
          reasons: parseReasons(latestRow.explanation),
        }
      : null;

    return {
      validation: evaluateCoachValidation(validationRecords),
      latestOutcome,
      totalPredictions: rows.length,
      observedPredictions: rows.filter((row) => row.outcome_status === "observed").length,
    };
  }, [query.data]);

  return {
    ...result,
    modelVersion: ADAPTIVE_COACH_MODEL_VERSION,
    isLoading: query.isLoading,
    error: query.error,
  };
}
