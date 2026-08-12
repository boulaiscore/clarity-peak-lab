/**
 * useWearableSync - Orchestrates wearable data synchronization
 * 
 * MVP Strategy:
 * - On-App-Open: Reads last 2 days of data when app opens
 * - Throttled: Syncs max once every 6 hours
 * - Aggregates daily data and sends to backend
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
  isNativePlatform,
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
  isCheckingAvailability: boolean;
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

function hasAnyHealthPermission(permissions: HealthPermissionStatus): boolean {
  return (
    permissions.sleep === "granted" ||
    permissions.hrv === "granted" ||
    permissions.restingHr === "granted" ||
    permissions.steps === "granted" ||
    permissions.activeMinutes === "granted"
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWearableSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const syncInProgress = useRef(false);
  const permissionGrantedRef = useRef(false);

  const [state, setState] = useState<WearableSyncState>({
    isAvailable: false,
    isCheckingAvailability: true,
    isConnected: false,
    permissions: null,
    lastSyncAt: null,
    isSyncing: false,
    error: null,
  });

  const applyPermissionState = useCallback(
    (permissions: HealthPermissionStatus): boolean => {
      const isConnected = hasAnyHealthPermission(permissions);
      permissionGrantedRef.current = isConnected;

      setState((prev) => ({
        ...prev,
        isAvailable: true,
        isCheckingAvailability: false,
        isConnected,
        permissions,
        error: null,
      }));

      return isConnected;
    },
    []
  );

  const refreshConnection = useCallback(async (): Promise<boolean> => {
    const available = await isHealthAvailable();

    if (!available) {
      permissionGrantedRef.current = false;
      setState((prev) => ({
        ...prev,
        isAvailable: false,
        isCheckingAvailability: false,
        isConnected: false,
        permissions: null,
      }));
      return false;
    }

    const permissionResult = await checkPermissions();
    if (permissionResult.success && permissionResult.data?.[0]) {
      return applyPermissionState(permissionResult.data[0]);
    }

    permissionGrantedRef.current = false;
    setState((prev) => ({
      ...prev,
      isAvailable: true,
      isCheckingAvailability: false,
      isConnected: false,
      error: permissionResult.errorMessage || null,
    }));
    return false;
  }, [applyPermissionState]);

  // -------------------------------------------------------------------------
  // Keep availability and permissions aligned with the native lifecycle.
  // Android may finish the Health Connect permission activity after React has
  // already rendered, so refresh whenever the app becomes active again.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let disposed = false;
    let appStateListener: { remove: () => Promise<void> } | undefined;

    const refresh = async () => {
      if (!disposed) await refreshConnection();
    };

    void refresh();

    if (isNativePlatform()) {
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void refresh();
      }).then((listener) => {
        if (disposed) void listener.remove();
        else appStateListener = listener;
      });
    }

    window.addEventListener("looma:health-permissions-changed", refresh);

    return () => {
      disposed = true;
      window.removeEventListener("looma:health-permissions-changed", refresh);
      if (appStateListener) void appStateListener.remove();
    };
  }, [refreshConnection]);

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

    const permissions = result.data?.[0];
    if (permissions) {
      const isConnected = applyPermissionState(permissions);

      if (isConnected) {
        window.dispatchEvent(new Event("looma:health-permissions-changed"));
      }

      return isConnected;
    }

    // Defensive fallback for older native bundles that do not yet return the
    // permission payload. A lifecycle refresh will also run on app resume.
    return refreshConnection();
  }, [state.isAvailable, applyPermissionState, refreshConnection]);

  // -------------------------------------------------------------------------
  // Sync data from wearable
  // -------------------------------------------------------------------------
  const sync = useCallback(async (force = false): Promise<boolean> => {
    if (!user?.id) {
      console.log("[WearableSync] No user, skipping sync");
      return false;
    }

    if (!state.isConnected && !permissionGrantedRef.current) {
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
    refreshConnection,
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
    const dateStr = format(date, "yyyy-MM-dd");
    
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
    const dateStr = format(new Date(record.endDate), "yyyy-MM-dd");
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
    const dateStr = format(new Date(record.timestamp), "yyyy-MM-dd");
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
    const dateStr = format(new Date(record.timestamp), "yyyy-MM-dd");
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
        onConflict: "user_id,date,source",
      }
    );

  if (error) {
    console.error("[WearableSync] Error upserting snapshot:", error);
    throw error;
  }
}
