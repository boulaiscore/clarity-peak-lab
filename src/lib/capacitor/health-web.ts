/**
 * Web implementation of HealthPlugin
 * Returns mock/unavailable responses for web platform
 */

import type {
  HealthPluginInterface,
  HealthPermissionStatus,
  SleepRecord,
  HRVRecord,
  RHRRecord,
} from "./health";

export class HealthPluginWeb implements HealthPluginInterface {
  async isAvailable(): Promise<{ available: boolean }> {
    console.log("[HealthPlugin Web] Health data not available on web platform");
    return { available: false };
  }

  async checkPermissions(): Promise<{ permissions: HealthPermissionStatus }> {
    return {
      permissions: {
        sleep: "not_determined",
        hrv: "not_determined",
        restingHr: "not_determined",
      },
    };
  }

  async requestPermissions(): Promise<{ granted: boolean; permissions: HealthPermissionStatus }> {
    console.log("[HealthPlugin Web] Cannot request permissions on web platform");
    return {
      granted: false,
      permissions: {
        sleep: "denied",
        hrv: "denied",
        restingHr: "denied",
      },
    };
  }

  async readSleep(_options: { startDate: string; endDate: string }): Promise<{ records: SleepRecord[] }> {
    console.log("[HealthPlugin Web] Cannot read sleep data on web platform");
    return { records: [] };
  }

  async readHRV(_options: { startDate: string; endDate: string }): Promise<{ records: HRVRecord[] }> {
    console.log("[HealthPlugin Web] Cannot read HRV data on web platform");
    return { records: [] };
  }

  async readRestingHR(_options: { startDate: string; endDate: string }): Promise<{ records: RHRRecord[] }> {
    console.log("[HealthPlugin Web] Cannot read resting HR data on web platform");
    return { records: [] };
  }

  async openHealthConnectSettings(): Promise<void> {
    console.log("[HealthPlugin Web] Cannot open Health Connect settings on web platform");
  }
}
