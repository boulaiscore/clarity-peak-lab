/**
 * ============================================
 * DAILY METRIC SNAPSHOT HOOK
 * ============================================
 * 
 * Records daily snapshots of derived metrics:
 * - Readiness
 * - Sharpness
 * - Recovery
 * - Reasoning Quality
 * 
 * Called once per day (idempotent).
 * Uses user's local date for day boundary detection.
 */

import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface DailyMetricSnapshotInput {
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoningQuality: number | null;
  s1?: number | null;
  s2?: number | null;
  ae?: number | null;
  ra?: number | null;
  ct?: number | null;
  inScore?: number | null;
}

function getUserLocalDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function useDailyMetricSnapshot() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if today's snapshot exists
  const { data: todaySnapshot, isLoading } = useQuery({
    queryKey: ["daily-metric-snapshot-today", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = getUserLocalDate();

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .eq("snapshot_date", today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Mutation to save today's snapshot
  const saveMutation = useMutation({
    mutationFn: async (input: DailyMetricSnapshotInput) => {
      if (!user?.id) throw new Error("No user");

      const today = getUserLocalDate();

      // Upsert: insert or update if exists
      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .upsert(
          {
            user_id: user.id,
            snapshot_date: today,
            readiness: input.readiness,
            sharpness: input.sharpness,
            recovery: input.recovery,
            reasoning_quality: input.reasoningQuality,
            s1: input.s1 ?? null,
            s2: input.s2 ?? null,
            ae: input.ae ?? null,
            ra: input.ra ?? null,
            ct: input.ct ?? null,
            in_score: input.inScore ?? null,
          },
          {
            onConflict: "user_id,snapshot_date",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-metric-snapshot-today"] });
      queryClient.invalidateQueries({ queryKey: ["metric-history"] });
    },
  });

  const saveSnapshot = useCallback(
    (input: DailyMetricSnapshotInput) => {
      return saveMutation.mutateAsync(input);
    },
    [saveMutation]
  );

  return {
    todaySnapshot,
    hasTodaySnapshot: !!todaySnapshot,
    isLoading,
    saveSnapshot,
    isSaving: saveMutation.isPending,
  };
}
