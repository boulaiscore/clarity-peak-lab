import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { App as CapacitorApp } from "@capacitor/app";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import AppBlocker, { isNativeAndroid } from "@/lib/capacitor/appBlocker";
import { aggregateAttentionUsage } from "@/lib/deviceUsageAggregation";
import { supabase } from "@/integrations/supabase/client";

interface LooseResult {
  data?: unknown;
  error: { message?: string; code?: string } | null;
}

type LooseMutation = PromiseLike<LooseResult>;

interface LooseTable {
  upsert(
    values: Record<string, unknown>,
    options: { onConflict: string },
  ): LooseMutation;
}

const looseSupabase = supabase as unknown as {
  from(table: string): LooseTable;
};

/**
 * Syncs an Android-only daily aggregate after the user has explicitly granted
 * Usage Access. Native app identities are reduced on-device and never sent to
 * Supabase. Web and iOS are safe no-ops.
 */
export function useDeviceUsageSync(): void {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const attemptedRef = useRef<string | null>(null);
  const [resumeTick, setResumeTick] = useState(0);

  useEffect(() => {
    if (!isNativeAndroid()) return;
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;

    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive && !disposed) setResumeTick((value) => value + 1);
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, []);

  useEffect(() => {
    if (!userId || !isNativeAndroid()) return;

    const snapshotDate = format(new Date(), "yyyy-MM-dd");
    const attemptKey = `${userId}:${snapshotDate}:${resumeTick}`;
    if (attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;

    void (async () => {
      try {
        const permission = await AppBlocker.hasUsageAccessPermission();
        if (!permission.granted) {
          attemptedRef.current = null;
          return;
        }

        let aggregate;
        try {
          const nativeAggregate = await AppBlocker.getUsageAggregate();
          aggregate = {
            attentionUsageMin: nativeAggregate.attentionUsageMin,
            activeAppCount: nativeAggregate.activeAppCount,
            lastAttentionUseAt: nativeAggregate.lastAttentionUseAt
              ? new Date(nativeAggregate.lastAttentionUseAt).toISOString()
              : null,
          };
        } catch {
          // Backward-compatible fallback for native shells built before the
          // aggregate-only plugin method was added.
          const { stats } = await AppBlocker.getUsageStats();
          aggregate = aggregateAttentionUsage(stats);
        }
        const { error } = await looseSupabase
          .from("device_usage_snapshots")
          .upsert({
            user_id: userId,
            snapshot_date: snapshotDate,
            source: "android_usage_stats",
            coverage: "attention_apps",
            attention_usage_min: aggregate.attentionUsageMin,
            active_app_count: aggregate.activeAppCount,
            last_attention_use_at: aggregate.lastAttentionUseAt,
            permission_state: "granted",
            confidence: 0.85,
          }, { onConflict: "user_id,snapshot_date,source" });

        if (error) {
          attemptedRef.current = null;
          console.error("[DeviceUsage] Aggregate sync failed:", error);
          return;
        }

        await queryClient.invalidateQueries({ queryKey: ["device-usage-snapshots", userId] });
        await queryClient.invalidateQueries({ queryKey: ["adaptive-passive-sources", userId] });
      } catch (error) {
        attemptedRef.current = null;
        console.error("[DeviceUsage] Native usage read failed:", error);
      }
    })();
  }, [queryClient, resumeTick, userId]);
}
