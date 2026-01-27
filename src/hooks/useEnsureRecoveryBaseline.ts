/**
 * ============================================
 * NEUROLOOP PRO – ENSURE RECOVERY BASELINE
 * ============================================
 *
 * Guarantees that a logged-in user has an initialized Recovery v2 baseline.
 *
 * Problem solved:
 * - New accounts can have no row in `user_cognitive_metrics` yet.
 * - In that case Recovery reads as null/0 and UI can show 0%.
 *
 * This hook:
 * 1) Checks if user_cognitive_metrics exists for the user
 * 2) If missing or not initialized, initializes baseline using RRI (or default)
 *
 * NOTE: This is intentionally client-side to avoid touching reserved backend schemas.
 */

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  calculateRRI,
  initializeRecoveryBaseline,
} from "@/lib/recoveryV2";

export function useEnsureRecoveryBaseline() {
  const { user, session } = useAuth();
  const userId = user?.id ?? session?.user?.id;
  const hasUser = !!userId;
  const ranRef = useRef(false);

  const { data: metricsRow, isLoading: metricsLoading } = useQuery({
    queryKey: ["ensure-recovery-baseline", "metrics", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("user_id, has_recovery_baseline")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[useEnsureRecoveryBaseline] Error fetching metrics row:", error);
        return null;
      }

      return data as { user_id: string; has_recovery_baseline: boolean | null } | null;
    },
    enabled: hasUser,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const { data: rriRow, isLoading: rriLoading } = useQuery({
    queryKey: ["ensure-recovery-baseline", "rri", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("rri_value, rri_sleep_hours, rri_detox_hours, rri_mental_state")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return null;
      return data as {
        rri_value: number | null;
        rri_sleep_hours: string | null;
        rri_detox_hours: string | null;
        rri_mental_state: string | null;
      } | null;
    },
    enabled: hasUser,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      // Compute RRI (or null -> initializeRecoveryBaseline will pick a safe default)
      let rriValue: number | null = null;
      if (rriRow) {
        if (typeof rriRow.rri_value === "number") {
          rriValue = rriRow.rri_value;
        } else if (rriRow.rri_sleep_hours || rriRow.rri_detox_hours || rriRow.rri_mental_state) {
          rriValue = calculateRRI(
            rriRow.rri_sleep_hours,
            rriRow.rri_detox_hours,
            rriRow.rri_mental_state
          );
        }
      }

      const baseline = initializeRecoveryBaseline(rriValue);

      // If row doesn't exist -> INSERT. If exists but not initialized -> UPDATE.
      if (!metricsRow) {
        const { error } = await supabase.from("user_cognitive_metrics").insert({
          user_id: userId,
          rec_value: baseline.newRecValue,
          rec_last_ts: baseline.newRecLastTs,
          has_recovery_baseline: true,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        console.log("[useEnsureRecoveryBaseline] Inserted recovery baseline:", baseline.newRecValue);
        return;
      }

      if (!metricsRow.has_recovery_baseline) {
        const { error } = await supabase
          .from("user_cognitive_metrics")
          .update({
            rec_value: baseline.newRecValue,
            rec_last_ts: baseline.newRecLastTs,
            has_recovery_baseline: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) throw error;
        console.log("[useEnsureRecoveryBaseline] Updated recovery baseline:", baseline.newRecValue);
      }
    },
  });

  useEffect(() => {
    if (!hasUser) return;
    if (metricsLoading || rriLoading) return;
    if (ranRef.current) return;

    const needsInit = !metricsRow || !metricsRow.has_recovery_baseline;
    if (!needsInit) {
      ranRef.current = true;
      return;
    }

    ranRef.current = true;
    bootstrapMutation.mutate();
  }, [hasUser, metricsLoading, rriLoading, metricsRow, bootstrapMutation]);

  return {
    isBootstrapping:
      hasUser && (metricsLoading || rriLoading || bootstrapMutation.isPending),
  };
}
