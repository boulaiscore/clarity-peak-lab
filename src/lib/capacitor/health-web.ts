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
  StepsRecord,
  ActiveMinutesRecord,
  BedtimeDeviationRecord,
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
        steps: "not_determined",
        activeMinutes: "not_determined",
      },
    };
  }

  async requestPermissions(): Promise<{ granted: boolean; permissions: HealthPermissionStatus }> {
    return {
      granted: false,
      permissions: {
        sleep: "denied",
        hrv: "denied",
        restingHr: "denied",
        steps: "denied",
        activeMinutes: "denied",
      },
    };
  }

  async readSleep(_options: { startDate: string; endDate: string }): Promise<{ records: SleepRecord[] }> {
    return { records: [] };
  }

  async readHRV(_options: { startDate: string; endDate: string }): Promise<{ records: HRVRecord[] }> {
    return { records: [] };
  }

  async readRestingHR(_options: { startDate: string; endDate: string }): Promise<{ records: RHRRecord[] }> {
    return { records: [] };
  }

  async readSteps(_options: { startDate: string; endDate: string }): Promise<{ records: StepsRecord[] }> {
    return { records: [] };
  }

  async readActiveMinutes(_options: { startDate: string; endDate: string }): Promise<{ records: ActiveMinutesRecord[] }> {
    return { records: [] };
  }

  async readBedtimeHistory(_options: { days: number }): Promise<{ records: BedtimeDeviationRecord[] }> {
    return { records: [] };
  }

  async openHealthConnectSettings(): Promise<void> {
    console.log("[HealthPlugin Web] Cannot open Health Connect settings on web platform");
  }
}
