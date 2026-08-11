import { useCallback, useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import AppBlocker, { isNativeAndroid } from "@/lib/capacitor/appBlocker";
import IosDeviceUsage, { isNativeIos } from "@/lib/capacitor/iosDeviceUsage";

export function useDeviceUsagePermission() {
  const platformSupported = isNativeAndroid() || isNativeIos();
  const [available, setAvailable] = useState(isNativeAndroid());
  const [granted, setGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(platformSupported);

  const refresh = useCallback(async () => {
    if (!platformSupported) {
      setAvailable(false);
      setGranted(false);
      setIsLoading(false);
      return;
    }
    try {
      if (isNativeAndroid()) {
        setAvailable(true);
        const result = await AppBlocker.hasUsageAccessPermission();
        setGranted(result.granted);
      } else {
        const availability = await IosDeviceUsage.isAvailable();
        setAvailable(availability.available);
        if (!availability.available) {
          setGranted(false);
          return;
        }
        const result = await IosDeviceUsage.getPermissionStatus();
        setGranted(result.state === "granted" && result.selectionReady);
      }
    } catch (error) {
      console.error("[DeviceUsage] Permission check failed:", error);
      setAvailable(false);
      setGranted(false);
    } finally {
      setIsLoading(false);
    }
  }, [platformSupported]);

  useEffect(() => {
    void refresh();
    if (!platformSupported) return;

    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive && !disposed) void refresh();
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [platformSupported, refresh]);

  const request = useCallback(async () => {
    if (!platformSupported || !available) return;
    try {
      if (isNativeAndroid()) {
        await AppBlocker.requestUsageAccessPermission();
        return;
      }
      const permission = await IosDeviceUsage.requestPermission();
      if (permission.state === "granted") {
        await IosDeviceUsage.selectAttentionApps();
        await refresh();
      }
    } catch (error) {
      console.warn("[DeviceUsage] Permission setup unavailable:", error);
    }
  }, [available, platformSupported, refresh]);

  return { supported: platformSupported && available, granted, isLoading, request, refresh };
}
