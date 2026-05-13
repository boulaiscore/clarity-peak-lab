/**
 * useAcuteRecoveryBoost
 *
 * Reads today's acute_recovery_boost events from `intraday_metric_events`,
 * exposes the active residual boost (with 30s polling for live decay/countdown),
 * and provides `applyBoost` to write a new event.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ACUTE_BOOST,
  AcuteBoostEvent,
  computeInitialBoost,
  evaluateAvailability,
  getActiveResidualBoost,
  perceivedDeltaFromChecks,
} from "@/lib/recovery/acuteBoost";
import type { Json } from "@/integrations/supabase/types";

interface ApplyBoostInput {
  durationSeconds: number;
  preMentalNoise: number;
  postMentalNoise: number;
  preCognitiveFatigue: number;
  postCognitiveFatigue: number;
  preReadinessToClear: number;
  postReadinessToClear: number;
}

export interface UseAcuteRecoveryBoostResult {
  /** Live residual boost in REC points (0 when none / decayed) */
  activeBoost: number;
  /** Minutes remaining until residual boost decays to 0 (0 when inactive) */
  remainingMinutes: number;
  /** True when activeBoost > 0 */
  isActive: boolean;
  /** Number of acute boosts applied today (including decayed ones) */
  usedToday: number;
  /** Whether a new boost can be applied right now */
  canApply: boolean;
  /** ISO timestamp when next boost becomes available (null if available now) */
  nextAvailableAt: string | null;
  /** Reason when canApply === false */
  unavailableReason: "cooldown" | "daily_limit" | null;
  /** Loading state for the boost query */
  isLoading: boolean;
  /** Apply a new boost based on a completed Recharging session */
  applyBoost: (input: ApplyBoostInput) => Promise<{ initialBoost: number } | null>;
  isApplying: boolean;
}

function startOfTodayLocalISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useAcuteRecoveryBoost(): UseAcuteRecoveryBoostResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());

  // Tick every 30s for live decay & countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["acute-recovery-boost", userId],
    queryFn: async (): Promise<AcuteBoostEvent[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("intraday_metric_events")
        .select("event_timestamp, event_details")
        .eq("user_id", userId)
        .eq("event_type", ACUTE_BOOST.EVENT_TYPE)
        .gte("event_timestamp", startOfTodayLocalISO())
        .order("event_timestamp", { ascending: false });

      if (error) {
        console.error("[useAcuteRecoveryBoost] query error", error);
        return [];
      }
      return (data ?? []).map((row) => {
        const details = (row.event_details as { initial_boost?: number } | null) ?? {};
        return {
          appliedAt: row.event_timestamp as string,
          initialBoost: Number(details.initial_boost ?? 0),
        };
      });
    },
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { boost, remainingMinutes, isActive } = useMemo(() => {
    const { boost: b, sourceEvent } = getActiveResidualBoost(events, now);
    if (b <= 0 || !sourceEvent) return { boost: 0, remainingMinutes: 0, isActive: false };
    const elapsedMin =
      (now.getTime() - new Date(sourceEvent.appliedAt).getTime()) / 60_000;
    const remaining = Math.max(0, ACUTE_BOOST.TOTAL_DURATION_MIN - elapsedMin);
    return { boost: b, remainingMinutes: remaining, isActive: true };
  }, [events, now]);

  const availability = useMemo(
    () => evaluateAvailability(events, now),
    [events, now]
  );

  const mutation = useMutation({
    mutationFn: async (input: ApplyBoostInput) => {
      if (!userId) return null;

      const durationMinutes = Math.max(1, Math.round(input.durationSeconds / 60));
      const perceivedDelta = perceivedDeltaFromChecks(input);
      const initialBoost = computeInitialBoost(durationMinutes, perceivedDelta);
      const appliedAt = new Date();
      const expiresAt = new Date(
        appliedAt.getTime() + ACUTE_BOOST.TOTAL_DURATION_MIN * 60_000
      );

      const today = appliedAt.toISOString().slice(0, 10);

      const eventDetails = {
        initial_boost: initialBoost,
        duration_minutes: durationMinutes,
        perceived_delta_01: Math.round(perceivedDelta * 1000) / 1000,
        half_life_minutes: ACUTE_BOOST.HALF_LIFE_MIN,
        total_duration_minutes: ACUTE_BOOST.TOTAL_DURATION_MIN,
        expires_at: expiresAt.toISOString(),
        kind: "fast_recover_acute_reset",
      } as Json;

      const { error } = await supabase.from("intraday_metric_events").insert([
        {
          user_id: userId,
          event_date: today,
          event_timestamp: appliedAt.toISOString(),
          event_type: ACUTE_BOOST.EVENT_TYPE,
          // IMPORTANT: leave metric values null so this event does NOT pollute
          // intraday charts or trend visualizations. This is a display-layer
          // boost only.
          readiness: null,
          sharpness: null,
          recovery: null,
          reasoning_quality: null,
          event_details: eventDetails,
        },
      ]);

      if (error) {
        console.error("[useAcuteRecoveryBoost] insert error", error);
        throw error;
      }

      return { initialBoost };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acute-recovery-boost", userId] });
    },
  });

  const applyBoost = useCallback(
    async (input: ApplyBoostInput) => {
      return mutation.mutateAsync(input);
    },
    [mutation]
  );

  return {
    activeBoost: boost,
    remainingMinutes,
    isActive,
    usedToday: availability.usedToday,
    canApply: availability.canApply,
    nextAvailableAt: availability.nextAvailableAt,
    unavailableReason: availability.canApply
      ? null
      : (availability.reason as "cooldown" | "daily_limit"),
    isLoading,
    applyBoost,
    isApplying: mutation.isPending,
  };
}
