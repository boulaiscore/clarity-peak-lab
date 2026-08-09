import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { trackProductEvent } from "@/lib/productAnalytics";
import {
  generateDailyWorkRecommendation,
  WORK_COACH_POLICY_VERSION,
  type PrimaryOutcome,
  type WorkRecommendationInput,
} from "@/lib/workCoach";

type WorkRecommendationRow = Database["public"]["Tables"]["daily_work_recommendations"]["Row"];
type WorkRecommendationUpdate = Database["public"]["Tables"]["daily_work_recommendations"]["Update"];

export interface WorkOutcomePayload {
  outcomeAchieved: "yes" | "partly" | "no";
  qualityRating: number;
  effortRating: number;
}

function isPrimaryOutcome(value: string | null | undefined): value is PrimaryOutcome {
  return value === "decide" || value === "focus" || value === "reason";
}

function getLegacyPrimaryOutcome(): PrimaryOutcome | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("looma_primary_outcome");
  return isPrimaryOutcome(stored) ? stored : null;
}

const LOCAL_WORK_PREFIX = "looma_daily_work_v1";

function getLocalKey(userId: string, date: string): string {
  return `${LOCAL_WORK_PREFIX}:${userId}:${date}:${WORK_COACH_POLICY_VERSION}`;
}

function readLocalRow(key: string): WorkRecommendationRow | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as WorkRecommendationRow | null;
  } catch {
    return null;
  }
}

function writeLocalRow(key: string, row: WorkRecommendationRow | null): void {
  if (typeof window === "undefined") return;
  if (row) localStorage.setItem(key, JSON.stringify(row));
  else localStorage.removeItem(key);
}

export function useDailyWorkRecommendation(
  input: Omit<WorkRecommendationInput, "primaryOutcome">,
  enabled = true,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const recommendationDate = format(new Date(), "yyyy-MM-dd");
  const localKey = user?.id ? getLocalKey(user.id, recommendationDate) : null;
  const [localRecord, setLocalRecord] = useState<WorkRecommendationRow | null>(() =>
    localKey ? readLocalRow(localKey) : null,
  );
  const reconcileAttemptRef = useRef<string | null>(null);
  const primaryOutcome = user?.primaryOutcome ?? getLegacyPrimaryOutcome() ?? "focus";
  const recommendation = useMemo(
    () => generateDailyWorkRecommendation({ ...input, primaryOutcome }),
    [input, primaryOutcome],
  );

  const queryKey = useMemo(() => [
    "daily-work-recommendation",
    user?.id,
    recommendationDate,
    WORK_COACH_POLICY_VERSION,
  ] as const, [recommendationDate, user?.id]);

  const ensureDailyRow = useCallback(async (): Promise<WorkRecommendationRow> => {
    if (!user?.id) throw new Error("Sign in is required to save a work outcome.");

    const { data: existing, error: readError } = await supabase
      .from("daily_work_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .eq("recommendation_date", recommendationDate)
      .eq("policy_version", WORK_COACH_POLICY_VERSION)
      .maybeSingle();

    if (readError) throw readError;
    if (existing) return existing;

    const now = new Date().toISOString();
    const stateSnapshot: Json = {
      sharpness: Math.round(input.sharpness * 10) / 10,
      readiness: Math.round(input.readiness * 10) / 10,
      recovery: Math.round(input.recovery * 10) / 10,
      reasoning_quality: Math.round(input.reasoningQuality * 10) / 10,
      recovery_initialized: input.recoveryInitialized,
      wearable_data_available: input.hasWearableData,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("daily_work_recommendations")
      .insert({
        user_id: user.id,
        recommendation_date: recommendationDate,
        generated_at: now,
        shown_at: now,
        policy_version: WORK_COACH_POLICY_VERSION,
        primary_outcome: recommendation.primaryOutcome,
        action_key: recommendation.actionKey,
        intensity: recommendation.intensity,
        title: recommendation.title,
        rationale: recommendation.rationale,
        planned_duration_minutes: recommendation.plannedDurationMinutes,
        state_snapshot: stateSnapshot,
        status: "recommended",
      })
      .select("*")
      .single();

    if (!insertError && inserted) {
      trackProductEvent("work_recommendation_shown", {
        actionKey: recommendation.actionKey,
        intensity: recommendation.intensity,
        durationMinutes: recommendation.plannedDurationMinutes,
        policyVersion: WORK_COACH_POLICY_VERSION,
      });
      return inserted;
    }

    // A second mounted Home can race the first insert. Recover by reading the
    // immutable daily row instead of surfacing a false sync error.
    if (insertError?.code === "23505") {
      const { data: racedRow, error: racedReadError } = await supabase
        .from("daily_work_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .eq("recommendation_date", recommendationDate)
        .eq("policy_version", WORK_COACH_POLICY_VERSION)
        .single();
      if (racedReadError) throw racedReadError;
      return racedRow;
    }

    throw insertError ?? new Error("Could not save today's recommendation.");
  }, [input, recommendation, recommendationDate, user?.id]);

  const query = useQuery({
    queryKey,
    queryFn: ensureDailyRow,
    enabled: !!user?.id && enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  useEffect(() => {
    setLocalRecord(localKey ? readLocalRow(localKey) : null);
  }, [localKey]);

  const buildLocalBase = useCallback((): WorkRecommendationRow => {
    if (!user?.id) throw new Error("Sign in is required to save a work outcome.");
    const now = new Date().toISOString();
    return {
      id: `local-${crypto.randomUUID()}`,
      user_id: user.id,
      recommendation_date: recommendationDate,
      generated_at: now,
      shown_at: now,
      policy_version: WORK_COACH_POLICY_VERSION,
      primary_outcome: recommendation.primaryOutcome,
      action_key: recommendation.actionKey,
      intensity: recommendation.intensity,
      title: recommendation.title,
      rationale: recommendation.rationale,
      planned_duration_minutes: recommendation.plannedDurationMinutes,
      state_snapshot: {
        sharpness: Math.round(input.sharpness * 10) / 10,
        readiness: Math.round(input.readiness * 10) / 10,
        recovery: Math.round(input.recovery * 10) / 10,
        reasoning_quality: Math.round(input.reasoningQuality * 10) / 10,
        recovery_initialized: input.recoveryInitialized,
        wearable_data_available: input.hasWearableData,
      },
      status: "recommended",
      started_at: null,
      ended_at: null,
      outcome_achieved: null,
      quality_rating: null,
      effort_rating: null,
      outcome_submitted_at: null,
      created_at: now,
      updated_at: now,
    };
  }, [input, recommendation, recommendationDate, user?.id]);

  const updateRow = useCallback(async (
    updates: WorkRecommendationUpdate,
  ): Promise<WorkRecommendationRow> => {
    try {
      const current = query.data ?? await ensureDailyRow();
      const { data, error } = await supabase
        .from("daily_work_recommendations")
        .update(updates)
        .eq("id", current.id)
        .eq("user_id", current.user_id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      // Mobile/offline sessions must not lose the user's real-work outcome.
      // Keep a private local queue and reconcile it when cloud access returns.
      if (!localKey) throw error;
      const fallback = localRecord ?? query.data ?? buildLocalBase();
      const queued = {
        ...fallback,
        ...updates,
        updated_at: new Date().toISOString(),
      } as WorkRecommendationRow;
      setLocalRecord(queued);
      writeLocalRow(localKey, queued);
      return queued;
    }
  }, [buildLocalBase, ensureDailyRow, localKey, localRecord, query.data]);

  useEffect(() => {
    if (!query.data || !localRecord || !localKey) return;
    const attemptKey = `${query.data.id}:${localRecord.updated_at}`;
    if (reconcileAttemptRef.current === attemptKey) return;
    reconcileAttemptRef.current = attemptKey;

    const queuedUpdates: WorkRecommendationUpdate = {
      status: localRecord.status,
      started_at: localRecord.started_at,
      ended_at: localRecord.ended_at,
      outcome_achieved: localRecord.outcome_achieved,
      quality_rating: localRecord.quality_rating,
      effort_rating: localRecord.effort_rating,
      outcome_submitted_at: localRecord.outcome_submitted_at,
    };

    void supabase
      .from("daily_work_recommendations")
      .update(queuedUpdates)
      .eq("id", query.data.id)
      .eq("user_id", query.data.user_id)
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          reconcileAttemptRef.current = null;
          return;
        }
        writeLocalRow(localKey, null);
        setLocalRecord(null);
        queryClient.setQueryData(queryKey, data);
      });
  }, [localKey, localRecord, query.data, queryClient, queryKey]);

  const startMutation = useMutation({
    mutationFn: () => updateRow({
      status: "started",
      started_at: new Date().toISOString(),
      ended_at: null,
    }),
    onSuccess: async (row) => {
      trackProductEvent("work_block_started", {
        actionKey: row.action_key,
        durationMinutes: row.planned_duration_minutes,
        policyVersion: row.policy_version,
      });
      if (!row.id.startsWith("local-")) queryClient.setQueryData(queryKey, row);
    },
  });

  const outcomeMutation = useMutation({
    mutationFn: (payload: WorkOutcomePayload) => {
      const now = new Date().toISOString();
      return updateRow({
        status: "completed",
        ended_at: now,
        outcome_achieved: payload.outcomeAchieved,
        quality_rating: payload.qualityRating,
        effort_rating: payload.effortRating,
        outcome_submitted_at: now,
      });
    },
    onSuccess: async (row) => {
      trackProductEvent("work_outcome_logged", {
        actionKey: row.action_key,
        outcomeAchieved: row.outcome_achieved ?? "unknown",
        qualityRating: row.quality_rating ?? 0,
        effortRating: row.effort_rating ?? 0,
        policyVersion: row.policy_version,
      });
      if (!row.id.startsWith("local-")) queryClient.setQueryData(queryKey, row);
      await queryClient.invalidateQueries({ queryKey: ["today-activities", user?.id] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: () => updateRow({
      status: "dismissed",
      ended_at: new Date().toISOString(),
    }),
    onSuccess: (row) => {
      trackProductEvent("work_recommendation_dismissed", {
        actionKey: row.action_key,
        policyVersion: row.policy_version,
      });
      if (!row.id.startsWith("local-")) queryClient.setQueryData(queryKey, row);
    },
  });

  const abandonMutation = useMutation({
    mutationFn: () => updateRow({
      status: "abandoned",
      ended_at: new Date().toISOString(),
    }),
    onSuccess: async (row) => {
      trackProductEvent("work_block_abandoned", {
        actionKey: row.action_key,
        policyVersion: row.policy_version,
      });
      if (!row.id.startsWith("local-")) queryClient.setQueryData(queryKey, row);
      await queryClient.invalidateQueries({ queryKey: ["today-activities", user?.id] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => updateRow({
      status: "recommended",
      started_at: null,
      ended_at: null,
      outcome_achieved: null,
      quality_rating: null,
      effort_rating: null,
      outcome_submitted_at: null,
    }),
    onSuccess: (row) => {
      if (!row.id.startsWith("local-")) queryClient.setQueryData(queryKey, row);
    },
  });

  return {
    recommendation,
    record: localRecord ?? query.data ?? null,
    status: localRecord?.status ?? query.data?.status ?? "recommended",
    isLoading: query.isLoading,
    syncError: query.error,
    syncPending: !!localRecord,
    start: startMutation.mutateAsync,
    submitOutcome: outcomeMutation.mutateAsync,
    dismiss: dismissMutation.mutateAsync,
    abandon: abandonMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isMutating:
      startMutation.isPending ||
      outcomeMutation.isPending ||
      dismissMutation.isPending ||
      abandonMutation.isPending ||
      restoreMutation.isPending,
  };
}
