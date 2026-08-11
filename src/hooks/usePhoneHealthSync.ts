/**
 * ============================================
 * LOOMA – PHONE HEALTH SYNC HOOK
 * ============================================
 *
 * Once per calendar day, on launch or foreground resume, reads base health
 * data from HealthKit / Health Connect and writes
 * a row to `phone_health_snapshots`. Used by the Recovery engine to
 * compute a dynamic daily target REC instead of a fixed baseline 50.
 *
 * No wearable required: works with phone-only data.
 * Free for all users (HRV / RHR remain wearable-premium).
 */

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { App as CapacitorApp } from "@capacitor/app";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  isNativePlatform,
  isHealthAvailable,
  checkPermissions,
  readSleep,
  readSteps,
  readActiveMinutes,
  readBedtimeHistory,
  aggregateSleepForDate,
  getPlatform,
} from "@/lib/capacitor/health";
import { computePHI, type PhoneHealthInputs } from "@/lib/phoneHealth";

export interface PhoneHealthSnapshot {
  id: string;
  user_id: string;
  date: string;
  sleep_min: number | null;
  bedtime_dev_min: number | null;
  steps: number | null;
  active_min: number | null;
  pickups: number | null;
  phi: number | null;
  target_rec: number | null;
  confidence: number | null;
  available_sources: string[] | null;
  source: string;
}

export function useTodayPhoneHealthSnapshot() {
  const { user } = useAuth();
  const userId = user?.id;
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["phone-health-snapshot", userId, today],
    queryFn: async (): Promise<PhoneHealthSnapshot | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("phone_health_snapshots")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if (error) {
        console.error("[usePhoneHealth] fetch error:", error);
        return null;
      }
      return (data as PhoneHealthSnapshot | null) ?? null;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

/**
 * App-level effect that triggers a daily sync from native health APIs.
 * Safe no-op on web.
 */
export function usePhoneHealthSync() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const ranTodayRef = useRef<string | null>(null);
  const [resumeTick, setResumeTick] = useState(0);

  useEffect(() => {
    if (!isNativePlatform()) return;
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
    if (!userId) return;
    if (!isNativePlatform()) return;

    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    if (ranTodayRef.current === today) return;
    ranTodayRef.current = today;

    void runSync(userId, today, queryClient).then((synced) => {
      // Retry after a later permission grant or when new Health data arrives.
      if (!synced && ranTodayRef.current === today) ranTodayRef.current = null;
    });
  }, [userId, queryClient, resumeTick]);
}

async function runSync(
  userId: string,
  today: string,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<boolean> {
  try {
    // Skip if already synced today
    const { data: existing } = await supabase
      .from("phone_health_snapshots")
      .select("id, phi")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();
    if (existing?.phi != null) return true;

    const available = await isHealthAvailable();
    if (!available) return false;

    // We no longer require sleep to be granted: PHI degrades gracefully
    // and we still want to capture steps / active minutes when available.
    await checkPermissions();

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const sleepStart = new Date(dayStart);
    sleepStart.setDate(sleepStart.getDate() - 1);
    sleepStart.setHours(20, 0, 0, 0);
    const sleepEnd = new Date(dayStart);
    sleepEnd.setHours(11, 0, 0, 0);

    // Use the last complete calendar day for movement. This avoids mixing a
    // full previous day with a partial current day when the app opens late.
    const movementStart = subDays(dayStart, 1);
    const movementEnd = dayStart;

    const [sleepRes, stepsRes, activeRes, bedtimeRes] = await Promise.all([
      readSleep(sleepStart.toISOString(), sleepEnd.toISOString()),
      readSteps(movementStart.toISOString(), movementEnd.toISOString()),
      readActiveMinutes(movementStart.toISOString(), movementEnd.toISOString()),
      readBedtimeHistory(7),
    ]);

    const sleepRecord = sleepRes.success
      ? aggregateSleepForDate(sleepRes.data ?? [])
      : null;
    const sleepMin = sleepRecord ? Math.round(sleepRecord.durationMin) : null;

    const steps = stepsRes.success ? stepsRes.data?.[0]?.steps ?? null : null;
    const activeMin = activeRes.success
      ? activeRes.data?.[0]?.minutes ?? null
      : null;

    const bedtimeDevMin = bedtimeRes.success
      ? bedtimeRes.data?.[0]?.deviationMin ?? null
      : null;

    const inputs: PhoneHealthInputs = {
      sleepMin,
      bedtimeDevMin,
      steps,
      activeMin,
      pickups: null, // future iOS extension
    };

    const result = computePHI(inputs);
    if (!result.hasData) return false;

    const source = getPlatform() === "ios" ? "healthkit" : "health_connect";

    const { error } = await supabase
      .from("phone_health_snapshots")
      .upsert(
        {
          user_id: userId,
          date: today,
          sleep_min: inputs.sleepMin,
          bedtime_dev_min: inputs.bedtimeDevMin,
          steps: inputs.steps,
          active_min: inputs.activeMin,
          pickups: inputs.pickups,
          phi: result.phi,
          target_rec: result.targetRec,
          confidence: result.confidence,
          available_sources: result.availableSources,
          source,
        },
        { onConflict: "user_id,date" }
      );

    if (error) {
      console.error("[usePhoneHealth] upsert error:", error);
      return false;
    }

    console.log("[usePhoneHealth] ✅ snapshot stored", {
      phi: result.phi,
      targetRec: result.targetRec,
    });

    queryClient.invalidateQueries({ queryKey: ["phone-health-snapshot", userId] });
    queryClient.invalidateQueries({ queryKey: ["recovery-v2-state", userId] });
    return true;
  } catch (err) {
    console.error("[usePhoneHealth] sync error:", err);
    return false;
  }
}
