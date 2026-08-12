import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { App as CapacitorApp } from "@capacitor/app";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import AppBlocker, { isNativeAndroid } from "@/lib/capacitor/appBlocker";
import IosDeviceUsage, { isNativeIos } from "@/lib/capacitor/iosDeviceUsage";
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
 * Syncs a daily mobile aggregate after the user has granted the platform's
 * protected usage permission. Native app identities never enter this layer.
 */
export function useDeviceUsageSync(): void {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const attemptedRef = useRef<string | null>(null);
  const [resumeTick, setResumeTick] = useState(0);

  useEffect(() => {
    if (!isNativeAndroid() && !isNativeIos()) return;
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
    if (!userId || (!isNativeAndroid() && !isNativeIos())) return;

    const snapshotDate = format(new Date(), "yyyy-MM-dd");
    const attemptKey = `${userId}:${snapshotDate}:${resumeTick}`;
    if (attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;

    void (async () => {
      try {
        const permissionGranted = isNativeAndroid()
          ? (await AppBlocker.hasUsageAccessPermission()).granted
          : await IosDeviceUsage.getPermissionStatus().then(
              (result) => result.state === "granted" && result.selectionReady,
            );
        if (!permissionGranted) {
          attemptedRef.current = null;
          return;
        }

        let aggregate: {
          attentionUsageMin: number;
          activeAppCount: number;
          lastAttentionUseAt: string | null;
          confidence: number;
          attentionSessionCount: number | null;
          attentionSwitchCount: number | null;
          briefSessionCount: number | null;
        };
        if (isNativeIos()) {
          const nativeAggregate = await IosDeviceUsage.getUsageAggregate();
          aggregate = {
            attentionUsageMin: nativeAggregate.attentionUsageMin,
            activeAppCount: nativeAggregate.activeAppCount,
            lastAttentionUseAt: nativeAggregate.lastAttentionUseAt
              ? new Date(nativeAggregate.lastAttentionUseAt).toISOString()
              : null,
            confidence: nativeAggregate.confidence,
            attentionSessionCount: nativeAggregate.attentionSessionCount,
            attentionSwitchCount: nativeAggregate.attentionSwitchCount,
            briefSessionCount: nativeAggregate.briefSessionCount,
          };
        } else {
          try {
            const nativeAggregate = await AppBlocker.getUsageAggregate();
            aggregate = {
              attentionUsageMin: nativeAggregate.attentionUsageMin,
              activeAppCount: nativeAggregate.activeAppCount,
              lastAttentionUseAt: nativeAggregate.lastAttentionUseAt
                ? new Date(nativeAggregate.lastAttentionUseAt).toISOString()
                : null,
              confidence: 0.85,
              attentionSessionCount: nativeAggregate.attentionSessionCount,
              attentionSwitchCount: nativeAggregate.attentionSwitchCount,
              briefSessionCount: nativeAggregate.briefSessionCount,
            };
          } catch {
            const fallback = aggregateAttentionUsage((await AppBlocker.getUsageStats()).stats);
            aggregate = { ...fallback, confidence: 0.75 };
          }
        }
        const ios = isNativeIos();
        const { error } = await looseSupabase
          .from("device_usage_snapshots")
          .upsert({
            user_id: userId,
            snapshot_date: snapshotDate,
            source: ios ? "ios_device_activity" : "android_usage_stats",
            coverage: ios ? "screen_time_categories" : "attention_apps",
            attention_usage_min: aggregate.attentionUsageMin,
            active_app_count: aggregate.activeAppCount,
            last_attention_use_at: aggregate.lastAttentionUseAt,
            attention_session_count: aggregate.attentionSessionCount,
            attention_switch_count: aggregate.attentionSwitchCount,
            brief_session_count: aggregate.briefSessionCount,
            permission_state: "granted",
            confidence: aggregate.confidence,
          }, { onConflict: "user_id,snapshot_date,source" });

        if (error) {
          attemptedRef.current = null;
          console.error("[DeviceUsage] Aggregate sync failed:", error);
          return;
        }

        await queryClient.invalidateQueries({ queryKey: ["device-usage-snapshots", userId] });
        await queryClient.invalidateQueries({ queryKey: ["today-passive-context", userId] });
        await queryClient.invalidateQueries({ queryKey: ["today-metrics", userId] });
        await queryClient.invalidateQueries({ queryKey: ["adaptive-passive-sources", userId] });
      } catch (error) {
        attemptedRef.current = null;
        console.error("[DeviceUsage] Native usage read failed:", error);
      }
    })();
  }, [queryClient, resumeTick, userId]);
}
