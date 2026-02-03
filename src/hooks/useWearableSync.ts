/**
 * useWearableSync - Orchestrates wearable data synchronization
 * 
 * MVP Strategy:
 * - On-App-Open: Reads last 2 days of data when app opens
 * - Throttled: Syncs max once every 6 hours
 * - Aggregates daily data and sends to backend
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  isHealthAvailable,
  checkPermissions,
  requestPermissions,
  readSleep,
  readHRV,
  readRestingHR,
  getPlatform,
  getPlatformHRVMetric,
  aggregateSleepForDate,
  averageHRV,
  averageRestingHR,
  calculateSleepEfficiency,
  type HealthPermissionStatus,
  type SleepRecord,
  type HRVRecord,
  type RHRRecord,
} from "@/lib/capacitor/health";

// ============================================================================
// Constants
// ============================================================================

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const SYNC_STORAGE_KEY = "neuroloop_last_wearable_sync";
const DAYS_TO_SYNC = 2;

// ============================================================================
// Types
// ============================================================================

export interface WearableSyncState {
  isAvailable: boolean;
  isConnected: boolean;
  permissions: HealthPermissionStatus | null;
  lastSyncAt: Date | null;
  isSyncing: boolean;
  error: string | null;
}

interface AggregatedDayData {
  date: string; // YYYY-MM-DD
  sleepDurationMin: number | null;
  sleepEfficiency: number | null;
  hrvMs: number | null;
  hrvMetric: "sdnn" | "rmssd";
  restingHr: number | null;
  source: "healthkit" | "health_connect";
}

// ============================================================================
// Hook
// ============================================================================

export function useWearableSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const syncInProgress = useRef(false);

  const [state, setState] = useState<WearableSyncState>({
    isAvailable: false,
    isConnected: false,
    permissions: null,
    lastSyncAt: null,
    isSyncing: false,
    error: null,
  });

  // -------------------------------------------------------------------------
  // Check availability on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await isHealthAvailable();
      setState((prev) => ({ ...prev, isAvailable: available }));

      if (available) {
        const permResult = await checkPermissions();
        if (permResult.success && permResult.data?.[0]) {
          const perms = permResult.data[0];
          const isConnected =
            perms.sleep === "granted" ||
            perms.hrv === "granted" ||
            perms.restingHr === "granted";

          setState((prev) => ({
            ...prev,
            permissions: perms,
            isConnected,
          }));
        }
      }
    };

    checkAvailability();
  }, []);

  // -------------------------------------------------------------------------
  // Load last sync time from localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem(SYNC_STORAGE_KEY);
    if (stored) {
      setState((prev) => ({ ...prev, lastSyncAt: new Date(stored) }));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Request permissions
  // -------------------------------------------------------------------------
  const connect = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable) {
      console.log("[WearableSync] Health not available on this device");
      return false;
    }

    setState((prev) => ({ ...prev, error: null }));

    const result = await requestPermissions();

    if (!result.success) {
      setState((prev) => ({
        ...prev,
        error: result.errorMessage || "Failed to request permissions",
      }));
      return false;
    }

    // Re-check permissions after request
    const permResult = await checkPermissions();
    if (permResult.success && permResult.data?.[0]) {
      const perms = permResult.data[0];
      const isConnected =
        perms.sleep === "granted" ||
        perms.hrv === "granted" ||
        perms.restingHr === "granted";

      setState((prev) => ({
        ...prev,
        permissions: perms,
        isConnected,
      }));

      return isConnected;
    }

    return false;
  }, [state.isAvailable]);

  // -------------------------------------------------------------------------
  // Sync data from wearable
  // -------------------------------------------------------------------------
  const sync = useCallback(async (force = false): Promise<boolean> => {
    if (!user?.id) {
      console.log("[WearableSync] No user, skipping sync");
      return false;
    }

    if (!state.isConnected) {
      console.log("[WearableSync] Not connected, skipping sync");
      return false;
    }

    if (syncInProgress.current) {
      console.log("[WearableSync] Sync already in progress");
      return false;
    }

    // Check if we should sync (throttle)
    if (!force && state.lastSyncAt) {
      const timeSinceLastSync = Date.now() - state.lastSyncAt.getTime();
      if (timeSinceLastSync < SYNC_INTERVAL_MS) {
        console.log("[WearableSync] Throttled, last sync was", Math.round(timeSinceLastSync / 60000), "minutes ago");
        return false;
      }
    }

    syncInProgress.current = true;
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const platform = getPlatform();
      const hrvMetric = getPlatformHRVMetric();
      const source = platform === "ios" ? "healthkit" : "health_connect";

      // Calculate date range (last N days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - DAYS_TO_SYNC);

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      console.log("[WearableSync] Reading data from", startISO, "to", endISO);

      // Read all data types in parallel
      const [sleepResult, hrvResult, rhrResult] = await Promise.all([
        readSleep(startISO, endISO),
        readHRV(startISO, endISO),
        readRestingHR(startISO, endISO),
      ]);

      // Aggregate by date
      const aggregatedData = aggregateByDate(
        sleepResult.success ? sleepResult.data || [] : [],
        hrvResult.success ? hrvResult.data || [] : [],
        rhrResult.success ? rhrResult.data || [] : [],
        hrvMetric,
        source
      );

      console.log("[WearableSync] Aggregated data:", aggregatedData);

      // Send to backend (upsert for each day)
      for (const dayData of aggregatedData) {
        await upsertWearableSnapshot(user.id, dayData);
      }

      // Update last sync time
      const now = new Date();
      localStorage.setItem(SYNC_STORAGE_KEY, now.toISOString());
      
      setState((prev) => ({
        ...prev,
        lastSyncAt: now,
        isSyncing: false,
      }));

      // Invalidate queries to refresh readiness
      queryClient.invalidateQueries({ queryKey: ["wearable-snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });

      console.log("[WearableSync] Sync complete");
      return true;
    } catch (error) {
      console.error("[WearableSync] Sync failed:", error);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }));
      return false;
    } finally {
      syncInProgress.current = false;
    }
  }, [user?.id, state.isConnected, state.lastSyncAt, queryClient]);

  // -------------------------------------------------------------------------
  // Auto-sync on app open (if connected and throttle allows)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (state.isConnected && user?.id) {
      // Small delay to let the app settle
      const timer = setTimeout(() => {
        sync(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.isConnected, user?.id, sync]);

  return {
    ...state,
    connect,
    sync,
    forceSync: () => sync(true),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function aggregateByDate(
  sleepRecords: SleepRecord[],
  hrvRecords: HRVRecord[],
  rhrRecords: RHRRecord[],
  hrvMetric: "sdnn" | "rmssd",
  source: "healthkit" | "health_connect"
): AggregatedDayData[] {
  const dateMap = new Map<string, AggregatedDayData>();

  // Get dates from last N days
  const today = new Date();
  for (let i = 0; i < DAYS_TO_SYNC; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    dateMap.set(dateStr, {
      date: dateStr,
      sleepDurationMin: null,
      sleepEfficiency: null,
      hrvMs: null,
      hrvMetric,
      restingHr: null,
      source,
    });
  }

  // Aggregate sleep (use end date as the sleep date)
  for (const record of sleepRecords) {
    const dateStr = record.endDate.split("T")[0];
    const existing = dateMap.get(dateStr);
    if (existing) {
      // Take the longest sleep session for the day
      if (!existing.sleepDurationMin || record.durationMin > existing.sleepDurationMin) {
        existing.sleepDurationMin = record.durationMin;
        existing.sleepEfficiency = calculateSleepEfficiency(record);
      }
    }
  }

  // Aggregate HRV (average for each day)
  const hrvByDate = new Map<string, HRVRecord[]>();
  for (const record of hrvRecords) {
    const dateStr = record.timestamp.split("T")[0];
    if (!hrvByDate.has(dateStr)) {
      hrvByDate.set(dateStr, []);
    }
    hrvByDate.get(dateStr)!.push(record);
  }
  
  for (const [dateStr, records] of hrvByDate) {
    const existing = dateMap.get(dateStr);
    if (existing) {
      const avg = averageHRV(records);
      if (avg) {
        existing.hrvMs = avg.value;
      }
    }
  }

  // Aggregate RHR (average for each day)
  const rhrByDate = new Map<string, RHRRecord[]>();
  for (const record of rhrRecords) {
    const dateStr = record.timestamp.split("T")[0];
    if (!rhrByDate.has(dateStr)) {
      rhrByDate.set(dateStr, []);
    }
    rhrByDate.get(dateStr)!.push(record);
  }
  
  for (const [dateStr, records] of rhrByDate) {
    const existing = dateMap.get(dateStr);
    if (existing) {
      existing.restingHr = averageRestingHR(records);
    }
  }

  // Filter out days with no data
  return Array.from(dateMap.values()).filter(
    (day) =>
      day.sleepDurationMin !== null ||
      day.hrvMs !== null ||
      day.restingHr !== null
  );
}

async function upsertWearableSnapshot(
  userId: string,
  data: AggregatedDayData
): Promise<void> {
  const { error } = await supabase
    .from("wearable_snapshots")
    .upsert(
      {
        user_id: userId,
        date: data.date,
        sleep_duration_min: data.sleepDurationMin,
        sleep_efficiency: data.sleepEfficiency,
        hrv_ms: data.hrvMs,
        resting_hr: data.restingHr,
        source: data.source,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,date",
      }
    );

  if (error) {
    console.error("[WearableSync] Error upserting snapshot:", error);
    throw error;
  }
}
