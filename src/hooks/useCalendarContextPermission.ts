import { useCallback, useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import CalendarContext, {
  isNativeMobile,
  type CalendarPermissionState,
} from "@/lib/capacitor/calendarContext";

export function useCalendarContextPermission() {
  const platformSupported = isNativeMobile();
  const [state, setState] = useState<CalendarPermissionState>(
    platformSupported ? "not_determined" : "unavailable",
  );
  const [isLoading, setIsLoading] = useState(platformSupported);

  const refresh = useCallback(async () => {
    if (!platformSupported) {
      setState("unavailable");
      setIsLoading(false);
      return;
    }
    try {
      const result = await CalendarContext.getPermissionStatus();
      setState(result.state);
    } catch (error) {
      console.warn("[CalendarContext] Permission check unavailable:", error);
      setState("unavailable");
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
    if (!platformSupported || state === "unavailable") return;
    try {
      const result = await CalendarContext.requestPermission();
      setState(result.state);
    } catch (error) {
      console.warn("[CalendarContext] Permission setup unavailable:", error);
      setState("unavailable");
    } finally {
      setIsLoading(false);
    }
  }, [platformSupported, state]);

  return {
    supported: platformSupported && state !== "unavailable",
    state,
    granted: state === "granted",
    isLoading,
    request,
    refresh,
  };
}
