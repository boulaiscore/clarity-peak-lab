/**
 * ============================================
 * LOOMA – PHONE HEALTH SYNC HOOK
 * ============================================
 *
 * Once per calendar day (in the morning window 04:00–11:00 local),
 * reads base health data from HealthKit / Health Connect and writes
 * a row to `phone_health_snapshots`. Used by the Recovery engine to
 * compute a dynamic daily target REC instead of a fixed baseline 50.
 *
 * No wearable required: works with phone-only data.
 * Free for all users (HRV / RHR remain wearable-premium).
 */

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const SYNC_START_HOUR = 4;
const SYNC_END_HOUR = 11;

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

  useEffect(() => {
    if (!userId) return;
    if (!isNativePlatform()) return;

    const now = new Date();
    const hour = now.getHours();
    if (hour < SYNC_START_HOUR || hour > SYNC_END_HOUR) return;

    const today = format(now, "yyyy-MM-dd");
    if (ranTodayRef.current === today) return;
    ranTodayRef.current = today;

    void runSync(userId, today, queryClient);
  }, [userId, queryClient]);
}

async function runSync(
  userId: string,
  today: string,
  queryClient: ReturnType<typeof useQueryClient>
) {
  try {
    // Skip if already synced today
    const { data: existing } = await supabase
      .from("phone_health_snapshots")
      .select("id, phi")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();
    if (existing?.phi != null) return;

    const available = await isHealthAvailable();
    if (!available) return;

    const perms = await checkPermissions();
    const sleepGranted = perms.data?.[0]?.sleep === "granted";
    if (!sleepGranted) return;

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const sleepStart = new Date(dayStart);
    sleepStart.setDate(sleepStart.getDate() - 1);
    sleepStart.setHours(20, 0, 0, 0);
    const sleepEnd = new Date(dayStart);
    sleepEnd.setHours(11, 0, 0, 0);

    const stepsStart = new Date(dayStart);
    stepsStart.setDate(stepsStart.getDate() - 1);
    const stepsEnd = new Date();

    const [sleepRes, stepsRes, activeRes, bedtimeRes] = await Promise.all([
      readSleep(sleepStart.toISOString(), sleepEnd.toISOString()),
      readSteps(stepsStart.toISOString(), stepsEnd.toISOString()),
      readActiveMinutes(stepsStart.toISOString(), stepsEnd.toISOString()),
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
    if (!result.hasData) return;

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
          source,
        },
        { onConflict: "user_id,date" }
      );

    if (error) {
      console.error("[usePhoneHealth] upsert error:", error);
      return;
    }

    console.log("[usePhoneHealth] ✅ snapshot stored", {
      phi: result.phi,
      targetRec: result.targetRec,
    });

    queryClient.invalidateQueries({ queryKey: ["phone-health-snapshot", userId] });
    queryClient.invalidateQueries({ queryKey: ["recovery-v2-state", userId] });
  } catch (err) {
    console.error("[usePhoneHealth] sync error:", err);
  }
}
