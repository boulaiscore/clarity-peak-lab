import { useCallback, useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import AppBlocker, { isNativeAndroid } from "@/lib/capacitor/appBlocker";

export function useDeviceUsagePermission() {
  const supported = isNativeAndroid();
  const [granted, setGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(supported);

  const refresh = useCallback(async () => {
    if (!supported) {
      setGranted(false);
      setIsLoading(false);
      return;
    }
    try {
      const result = await AppBlocker.hasUsageAccessPermission();
      setGranted(result.granted);
    } catch (error) {
      console.error("[DeviceUsage] Permission check failed:", error);
      setGranted(false);
    } finally {
      setIsLoading(false);
    }
  }, [supported]);

  useEffect(() => {
    void refresh();
    if (!supported) return;

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
  }, [refresh, supported]);

  const request = useCallback(async () => {
    if (!supported) return;
    await AppBlocker.requestUsageAccessPermission();
  }, [supported]);

  return { supported, granted, isLoading, request, refresh };
}
