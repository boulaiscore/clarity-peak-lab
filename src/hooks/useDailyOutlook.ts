import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useMobileCognitiveRhythm } from "@/hooks/useMobileCognitiveRhythm";
import type { PassiveFeaturePayload } from "@/lib/passiveCoachFeatures";
import {
  deriveDailyOutlook,
  type DailyOutlook,
  type DailyOutlookBehaviorContext,
  type DailyOutlookHealthSignals,
  type DailyOutlookInput,
} from "@/lib/dailyOutlook";
import { supabase } from "@/integrations/supabase/client";
import { trackProductEvent } from "@/lib/productAnalytics";

interface DailyOutlookHookInput {
  sharpness: number;
  readiness: number;
  recovery: number;
  reasoningQuality: number;
  signalCoverage: number;
  activeSourceCount: number;
  passiveFeatures: PassiveFeaturePayload | null;
  isLoading: boolean;
}

interface GeneratedCopy {
  headline: string;
  summary: string;
  copySource: "ai" | "deterministic";
  modelVersion: string | null;
}

interface LooseResult {
  data?: unknown;
  error: { message?: string; code?: string } | null;
}

interface LooseFilter extends PromiseLike<LooseResult> {
  eq(column: string, value: unknown): LooseFilter;
  maybeSingle(): PromiseLike<LooseResult>;
}

interface LooseTable {
  select(columns: string): LooseFilter;
  upsert(values: Record<string, unknown>, options: { onConflict: string }): PromiseLike<LooseResult>;
  update(values: Record<string, unknown>): LooseFilter;
}

const looseSupabase = supabase as unknown as { from(table: string): LooseTable };

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function healthSignalsFromPayload(
  payload: PassiveFeaturePayload | null,
): DailyOutlookHealthSignals | null {
  const health = record(payload?.health);
  const phone = record(health?.phone);
  const wearable = record(health?.wearable);
  const sleepDurationMin = finiteNumber(wearable?.sleepDurationMin) ?? finiteNumber(phone?.sleepMin);
  const sleepEfficiency = finiteNumber(wearable?.sleepEfficiency);
  const hrvMs = finiteNumber(wearable?.hrvMs);
  const restingHr = finiteNumber(wearable?.restingHr);
  const steps = finiteNumber(phone?.steps);
  const activeMinutes = finiteNumber(phone?.activeMinutes);
  const observedDates = [nonEmptyString(phone?.date), nonEmptyString(wearable?.date)]
    .filter((value): value is string => value !== null)
    .sort();
  const sources = [...new Set([
    nonEmptyString(wearable?.source),
    nonEmptyString(phone?.source),
  ].filter((value): value is string => value !== null))];

  if ([sleepDurationMin, sleepEfficiency, hrvMs, restingHr, steps, activeMinutes]
    .every((value) => value === null)) {
    return null;
  }

  return {
    sleepDurationMin,
    sleepEfficiency,
    hrvMs,
    restingHr,
    steps,
    activeMinutes,
    observedDate: observedDates.at(-1)?.slice(0, 10) ?? null,
    sources,
  };
}

function behaviorContextFromPayload(
  payload: PassiveFeaturePayload | null,
): DailyOutlookBehaviorContext | null {
  if (!payload) return null;
  const behavior = record(payload.behavior);
  const values: DailyOutlookBehaviorContext = {
    metricTrendPerDay: finiteNumber(payload.coachContext.metricTrendPerDay),
    cognitiveActivityDays7d: finiteNumber(behavior?.cognitiveActivityDays7d),
    gameSessions7d: finiteNumber(behavior?.gameSessions7d),
    qualityTimeMinutes7d: finiteNumber(behavior?.qualityTimeMinutes7d),
    recoveryMinutes7d: finiteNumber(behavior?.recoveryMinutes7d),
  };
  return Object.values(values).some((value) => value !== null) ? values : null;
}

function isStorageUnavailable(error: LooseResult["error"]): boolean {
  return Boolean(error && /daily_outlooks|PGRST205|42P01|schema cache/i.test(error.message ?? ""));
}

export function useDailyOutlook(input: DailyOutlookHookInput) {
  const { user } = useAuth();
  const subscription = useSubscription();
  const queryClient = useQueryClient();
  const { rhythm, isLoading: rhythmLoading } = useMobileCognitiveRhythm();
  const today = format(new Date(), "yyyy-MM-dd");
  const shownRef = useRef<string | null>(null);
  const canPersonalize = subscription.tier !== "free";
  const personalizationLoading = canPersonalize && rhythmLoading;
  const healthSignals = useMemo(
    () => healthSignalsFromPayload(input.passiveFeatures),
    [input.passiveFeatures],
  );
  const behaviorContext = useMemo(
    () => behaviorContextFromPayload(input.passiveFeatures),
    [input.passiveFeatures],
  );

  const policyInput = useMemo<DailyOutlookInput>(() => ({
    sharpness: input.sharpness,
    readiness: input.readiness,
    recovery: input.recovery,
    reasoningQuality: input.reasoningQuality,
    healthScore: input.passiveFeatures?.coachContext.healthScore ?? null,
    healthSignals,
    attentionLoadRatio: input.passiveFeatures?.coachContext.attentionLoadRatio ?? null,
    scheduleLoadRatio: input.passiveFeatures?.coachContext.scheduleLoadRatio ?? null,
    signalCoverage: input.signalCoverage,
    primaryOutcome: user?.primaryOutcome ?? "focus",
    workType: user?.workType ?? null,
    behaviorContext,
    canPersonalize,
    rhythm: canPersonalize ? rhythm : null,
  }), [
    canPersonalize,
    behaviorContext,
    input.passiveFeatures,
    input.readiness,
    input.reasoningQuality,
    input.recovery,
    input.sharpness,
    input.signalCoverage,
    healthSignals,
    rhythm,
    user?.primaryOutcome,
    user?.workType,
  ]);

  const deterministicOutlook = useMemo(
    () => deriveDailyOutlook(policyInput),
    [policyInput],
  );

  const stateSnapshot = useMemo(() => ({
    metrics: {
      sharpness: Math.round(input.sharpness * 10) / 10,
      readiness: Math.round(input.readiness * 10) / 10,
      recovery: Math.round(input.recovery * 10) / 10,
      reasoningQuality: Math.round(input.reasoningQuality * 10) / 10,
    },
    passive: {
      healthScore: policyInput.healthScore ?? null,
      healthSignals,
      attentionLoadRatio: policyInput.attentionLoadRatio ?? null,
      scheduleLoadRatio: policyInput.scheduleLoadRatio ?? null,
      signalCoverage: input.signalCoverage,
      activeSourceCount: input.activeSourceCount,
    },
    personal: {
      workType: user?.workType ?? null,
      primaryOutcome: user?.primaryOutcome ?? "focus",
    },
    behavior: behaviorContext,
    pattern: {
      status: canPersonalize ? rhythm.status : "locked",
      observedDays: canPersonalize ? rhythm.observedDays : 0,
      openWindow: canPersonalize ? rhythm.openWindow : null,
      topDriver: canPersonalize ? rhythm.topDriver : null,
      attentionLoad: canPersonalize ? rhythm.attentionLoad : null,
      scheduleLoad: canPersonalize ? rhythm.scheduleLoad : null,
    },
  }), [
    canPersonalize,
    behaviorContext,
    input.activeSourceCount,
    input.readiness,
    input.reasoningQuality,
    input.recovery,
    input.sharpness,
    input.signalCoverage,
    healthSignals,
    policyInput.attentionLoadRatio,
    policyInput.healthScore,
    policyInput.scheduleLoadRatio,
    rhythm.observedDays,
    rhythm.openWindow,
    rhythm.topDriver,
    rhythm.attentionLoad,
    rhythm.scheduleLoad,
    rhythm.status,
    user?.primaryOutcome,
    user?.workType,
  ]);

  const generatedCopyQuery = useQuery({
    queryKey: [
      "daily-outlook-copy",
      user?.id,
      today,
      deterministicOutlook.policyVersion,
      deterministicOutlook.action.key,
      deterministicOutlook.headline,
      deterministicOutlook.healthSignals,
      stateSnapshot,
    ],
    queryFn: async (): Promise<GeneratedCopy | null> => {
      const { data, error } = await supabase.functions.invoke("generate-daily-outlook", {
        body: {
          outlookDate: today,
          outlook: {
            ...deterministicOutlook,
            stateSnapshot,
          },
        },
      });
      if (error) throw error;
      const payload = record(data);
      if (!payload || typeof payload.headline !== "string" || typeof payload.summary !== "string") return null;
      return {
        headline: payload.headline,
        summary: payload.summary,
        copySource: payload.copySource === "ai" ? "ai" : "deterministic",
        modelVersion: typeof payload.modelVersion === "string" ? payload.modelVersion : null,
      };
    },
    enabled: Boolean(
      user?.id &&
      subscription.isPro &&
      !subscription.loading &&
      !input.isLoading &&
      !personalizationLoading,
    ),
    staleTime: 24 * 60 * 60_000,
    retry: false,
  });

  const copy = generatedCopyQuery.data;
  const outlook = useMemo<DailyOutlook>(() => copy ? {
    ...deterministicOutlook,
    headline: copy.headline,
    summary: copy.summary,
  } : deterministicOutlook, [copy, deterministicOutlook]);
  const copySource = copy?.copySource ?? "deterministic";

  const persistOutlook = useCallback(async () => {
    if (!user?.id) return false;
    const { error } = await looseSupabase.from("daily_outlooks").upsert({
      user_id: user.id,
      outlook_date: today,
      policy_version: outlook.policyVersion,
      plan_id: subscription.tier,
      headline: outlook.headline,
      summary: outlook.summary,
      intensity: outlook.intensity,
      window_label: outlook.windowLabel,
      primary_action: outlook.action,
      evidence: outlook.evidence,
      state_snapshot: stateSnapshot,
      confidence: outlook.confidence,
      copy_source: copySource,
      model_version: copy?.modelVersion ?? null,
    }, { onConflict: "user_id,outlook_date,policy_version" });
    if (error && !isStorageUnavailable(error)) {
      console.warn("[DailyOutlook] Persistence unavailable:", error);
    }
    return !error;
  }, [copy?.modelVersion, copySource, outlook, stateSnapshot, subscription.tier, today, user?.id]);

  const recordQuery = useQuery({
    queryKey: ["daily-outlook-record", user?.id, today, outlook.policyVersion],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await looseSupabase
        .from("daily_outlooks")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("outlook_date", today)
        .eq("policy_version", outlook.policyVersion)
        .maybeSingle();
      if (error) {
        if (!isStorageUnavailable(error)) console.warn("[DailyOutlook] Read unavailable:", error);
        return null;
      }
      return record(data);
    },
    enabled: Boolean(user?.id && !input.isLoading),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!user?.id || input.isLoading || personalizationLoading || subscription.loading) return;
    void persistOutlook().then((persisted) => {
      if (persisted) void queryClient.invalidateQueries({ queryKey: ["daily-outlook-record", user.id] });
    });

    const shownKey = `${user.id}:${today}:${outlook.policyVersion}`;
    if (shownRef.current !== shownKey) {
      shownRef.current = shownKey;
      trackProductEvent("daily_outlook_shown", {
        actionKey: outlook.action.key,
        confidence: outlook.confidence,
        copySource,
        planId: subscription.tier,
      });
    }
  }, [
    copySource,
    input.isLoading,
    outlook.action.key,
    outlook.confidence,
    outlook.policyVersion,
    persistOutlook,
    queryClient,
    personalizationLoading,
    subscription.loading,
    subscription.tier,
    today,
    user?.id,
  ]);

  const updateLifecycle = useCallback(async (values: Record<string, unknown>) => {
    if (!user?.id) return;
    await persistOutlook();
    const { error } = await looseSupabase
      .from("daily_outlooks")
      .update(values)
      .eq("user_id", user.id)
      .eq("outlook_date", today)
      .eq("policy_version", outlook.policyVersion);
    if (error && !isStorageUnavailable(error)) console.warn("[DailyOutlook] Update unavailable:", error);
    await queryClient.invalidateQueries({ queryKey: ["daily-outlook-record", user.id] });
  }, [outlook.policyVersion, persistOutlook, queryClient, today, user?.id]);

  const markOpened = useCallback(() => {
    trackProductEvent("daily_outlook_opened", {
      actionKey: outlook.action.key,
      confidence: outlook.confidence,
      copySource,
    });
    void updateLifecycle({ status: "opened", opened_at: new Date().toISOString() });
  }, [copySource, outlook.action.key, outlook.confidence, updateLifecycle]);

  const activateAction = useCallback(() => {
    trackProductEvent("daily_outlook_action_started", {
      actionKey: outlook.action.key,
      actionKind: outlook.action.kind,
      metricCode: outlook.action.metricCode,
      copySource,
    });
  }, [copySource, outlook.action.key, outlook.action.kind, outlook.action.metricCode]);

  return {
    outlook,
    copySource,
    coachName: user?.name?.trim().split(/\s+/)[0] || null,
    isLoading: input.isLoading || subscription.loading || personalizationLoading,
    isGeneratingCopy: generatedCopyQuery.isLoading,
    markOpened,
    activateAction,
  };
}
