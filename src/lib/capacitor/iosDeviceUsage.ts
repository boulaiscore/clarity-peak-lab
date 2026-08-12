import { Capacitor, registerPlugin } from "@capacitor/core";

export type IosDeviceUsagePermission =
  | "granted"
  | "denied"
  | "not_determined"
  | "unavailable";

interface IosDeviceUsagePlugin {
  isAvailable(): Promise<{ available: boolean }>;
  getPermissionStatus(): Promise<{ state: IosDeviceUsagePermission; selectionReady: boolean }>;
  requestPermission(): Promise<{ state: IosDeviceUsagePermission }>;
  selectAttentionApps(): Promise<{ selectedCount: number }>;
  getUsageAggregate(): Promise<{
    attentionUsageMin: number;
    activeAppCount: number;
    lastAttentionUseAt: number | null;
    confidence: number;
    attentionSessionCount: number | null;
    attentionSwitchCount: number | null;
    briefSessionCount: number | null;
  }>;
}

const IosDeviceUsage = registerPlugin<IosDeviceUsagePlugin>("DeviceUsage", {
  web: {
    async isAvailable() {
      return { available: false };
    },
    async getPermissionStatus() {
      return { state: "unavailable" as const, selectionReady: false };
    },
    async requestPermission() {
      return { state: "unavailable" as const };
    },
    async selectAttentionApps() {
      return { selectedCount: 0 };
    },
    async getUsageAggregate() {
      return {
        attentionUsageMin: 0,
        activeAppCount: 0,
        lastAttentionUseAt: null,
        confidence: 0,
        attentionSessionCount: null,
        attentionSwitchCount: null,
        briefSessionCount: null,
      };
    },
  },
});

export function isNativeIos(): boolean {
  return Capacitor.getPlatform() === "ios";
}

export default IosDeviceUsage;
