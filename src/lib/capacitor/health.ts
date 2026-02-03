/**
 * NeuroLoop Pro - Health Data Bridge API
 * 
 * Unified interface for reading health data from:
 * - iOS: HealthKit (SDNN for HRV)
 * - Android: Health Connect (RMSSD for HRV)
 * 
 * This module abstracts platform differences and provides a consistent API
 * for the React frontend to consume health data.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SleepRecord {
  startDate: string;      // ISO timestamp
  endDate: string;        // ISO timestamp
  durationMin: number;    // Total sleep duration in minutes
  efficiency?: number;    // 0-1 (if available)
  stages?: {
    rem: number;          // Minutes in REM
    deep: number;         // Minutes in deep sleep
    core: number;         // Minutes in light/core sleep
    awake: number;        // Minutes awake during sleep session
  };
}

export interface HRVRecord {
  timestamp: string;      // ISO timestamp
  value: number;          // Value in milliseconds
  metric: "sdnn" | "rmssd"; // Type of HRV metric (iOS=sdnn, Android=rmssd)
}

export interface RHRRecord {
  timestamp: string;      // ISO timestamp
  bpm: number;            // Beats per minute
}

export type HealthError =
  | "permission_denied"
  | "not_available"
  | "no_data"
  | "health_connect_not_installed"
  | "unknown";

export interface HealthResult<T> {
  success: boolean;
  data?: T[];
  error?: HealthError;
  errorMessage?: string;
}

export interface HealthPermissionStatus {
  sleep: "granted" | "denied" | "not_determined";
  hrv: "granted" | "denied" | "not_determined";
  restingHr: "granted" | "denied" | "not_determined";
}

export interface HealthPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  checkPermissions(): Promise<{ permissions: HealthPermissionStatus }>;
  requestPermissions(): Promise<{ granted: boolean; permissions: HealthPermissionStatus }>;
  readSleep(options: { startDate: string; endDate: string }): Promise<{ records: SleepRecord[] }>;
  readHRV(options: { startDate: string; endDate: string }): Promise<{ records: HRVRecord[] }>;
  readRestingHR(options: { startDate: string; endDate: string }): Promise<{ records: RHRRecord[] }>;
  openHealthConnectSettings?(): Promise<void>; // Android only
}

// ============================================================================
// Plugin Registration
// ============================================================================

const HealthPlugin = registerPlugin<HealthPluginInterface>("HealthPlugin", {
  web: () => import("./health-web").then((m) => new m.HealthPluginWeb()),
});

// ============================================================================
// Platform Detection
// ============================================================================

export function getPlatform(): "ios" | "android" | "web" {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return "web";
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns the HRV metric type based on platform
 * iOS uses SDNN, Android uses RMSSD
 */
export function getPlatformHRVMetric(): "sdnn" | "rmssd" {
  return getPlatform() === "ios" ? "sdnn" : "rmssd";
}

// ============================================================================
// Health API Functions
// ============================================================================

/**
 * Check if health data is available on this device
 */
export async function isHealthAvailable(): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log("[Health] Not on native platform, health not available");
    return false;
  }

  try {
    const result = await HealthPlugin.isAvailable();
    return result.available;
  } catch (error) {
    console.error("[Health] Error checking availability:", error);
    return false;
  }
}

/**
 * Check current permission status for health data types
 */
export async function checkPermissions(): Promise<HealthResult<HealthPermissionStatus>> {
  if (!isNativePlatform()) {
    return {
      success: false,
      error: "not_available",
      errorMessage: "Health data is only available on native platforms",
    };
  }

  try {
    const result = await HealthPlugin.checkPermissions();
    return {
      success: true,
      data: [result.permissions],
    };
  } catch (error) {
    console.error("[Health] Error checking permissions:", error);
    return {
      success: false,
      error: "unknown",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Request permissions to read health data
 */
export async function requestPermissions(): Promise<HealthResult<boolean>> {
  if (!isNativePlatform()) {
    return {
      success: false,
      error: "not_available",
      errorMessage: "Health data is only available on native platforms",
    };
  }

  try {
    const result = await HealthPlugin.requestPermissions();
    return {
      success: true,
      data: [result.granted],
    };
  } catch (error) {
    console.error("[Health] Error requesting permissions:", error);
    
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("denied")) {
      return {
        success: false,
        error: "permission_denied",
        errorMessage: "User denied health data permissions",
      };
    }
    
    if (errorMessage.includes("not installed") || errorMessage.includes("Health Connect")) {
      return {
        success: false,
        error: "health_connect_not_installed",
        errorMessage: "Health Connect app is not installed",
      };
    }
    
    return {
      success: false,
      error: "unknown",
      errorMessage,
    };
  }
}

/**
 * Read sleep data within a date range
 */
export async function readSleep(
  startISO: string,
  endISO: string
): Promise<HealthResult<SleepRecord>> {
  if (!isNativePlatform()) {
    return {
      success: false,
      error: "not_available",
      errorMessage: "Health data is only available on native platforms",
    };
  }

  try {
    const result = await HealthPlugin.readSleep({
      startDate: startISO,
      endDate: endISO,
    });

    if (!result.records || result.records.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    return {
      success: true,
      data: result.records,
    };
  } catch (error) {
    console.error("[Health] Error reading sleep data:", error);
    return handleReadError(error);
  }
}

/**
 * Read HRV data within a date range
 * Returns SDNN on iOS, RMSSD on Android
 */
export async function readHRV(
  startISO: string,
  endISO: string
): Promise<HealthResult<HRVRecord>> {
  if (!isNativePlatform()) {
    return {
      success: false,
      error: "not_available",
      errorMessage: "Health data is only available on native platforms",
    };
  }

  try {
    const result = await HealthPlugin.readHRV({
      startDate: startISO,
      endDate: endISO,
    });

    if (!result.records || result.records.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Ensure metric field is set correctly based on platform
    const metric = getPlatformHRVMetric();
    const records = result.records.map((record) => ({
      ...record,
      metric,
    }));

    return {
      success: true,
      data: records,
    };
  } catch (error) {
    console.error("[Health] Error reading HRV data:", error);
    return handleReadError(error);
  }
}

/**
 * Read resting heart rate data within a date range
 */
export async function readRestingHR(
  startISO: string,
  endISO: string
): Promise<HealthResult<RHRRecord>> {
  if (!isNativePlatform()) {
    return {
      success: false,
      error: "not_available",
      errorMessage: "Health data is only available on native platforms",
    };
  }

  try {
    const result = await HealthPlugin.readRestingHR({
      startDate: startISO,
      endDate: endISO,
    });

    if (!result.records || result.records.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    return {
      success: true,
      data: result.records,
    };
  } catch (error) {
    console.error("[Health] Error reading resting HR data:", error);
    return handleReadError(error);
  }
}

/**
 * Open Health Connect settings (Android only)
 */
export async function openHealthSettings(): Promise<void> {
  if (getPlatform() !== "android") {
    console.log("[Health] openHealthSettings is only available on Android");
    return;
  }

  try {
    await HealthPlugin.openHealthConnectSettings?.();
  } catch (error) {
    console.error("[Health] Error opening Health Connect settings:", error);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function handleReadError<T>(error: unknown): HealthResult<T> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes("denied") || errorMessage.includes("permission")) {
    return {
      success: false,
      error: "permission_denied",
      errorMessage: "Permission denied to read health data",
    };
  }

  if (errorMessage.includes("not installed") || errorMessage.includes("Health Connect")) {
    return {
      success: false,
      error: "health_connect_not_installed",
      errorMessage: "Health Connect app is not installed",
    };
  }

  return {
    success: false,
    error: "unknown",
    errorMessage,
  };
}

// ============================================================================
// Aggregation Helpers
// ============================================================================

/**
 * Aggregate sleep records for a single night (returns the longest session)
 */
export function aggregateSleepForDate(records: SleepRecord[]): SleepRecord | null {
  if (!records || records.length === 0) return null;

  // Find the longest sleep session
  return records.reduce((longest, current) =>
    current.durationMin > longest.durationMin ? current : longest
  );
}

/**
 * Get average HRV value from records
 */
export function averageHRV(records: HRVRecord[]): { value: number; metric: "sdnn" | "rmssd" } | null {
  if (!records || records.length === 0) return null;

  const sum = records.reduce((acc, r) => acc + r.value, 0);
  return {
    value: Math.round(sum / records.length),
    metric: records[0].metric,
  };
}

/**
 * Get average resting HR from records
 */
export function averageRestingHR(records: RHRRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const sum = records.reduce((acc, r) => acc + r.bpm, 0);
  return Math.round(sum / records.length);
}

/**
 * Calculate sleep efficiency from duration and stages
 */
export function calculateSleepEfficiency(record: SleepRecord): number {
  if (record.efficiency !== undefined) return record.efficiency;
  
  if (record.stages) {
    const totalSleepMin = record.stages.rem + record.stages.deep + record.stages.core;
    const totalTimeMin = totalSleepMin + record.stages.awake;
    return totalTimeMin > 0 ? totalSleepMin / totalTimeMin : 0;
  }
  
  // Default to 85% if no stages available
  return 0.85;
}
