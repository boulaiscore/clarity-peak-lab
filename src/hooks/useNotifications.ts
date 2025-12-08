import { useState, useEffect } from "react";
import {
  getNotificationState,
  requestNotificationPermission,
  setupLocalReminders,
  registerPeriodicSync,
  NotificationPermissionState,
} from "@/lib/notifications";

export function useNotifications() {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: "default",
    isSupported: false,
    isPushSupported: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setState(getNotificationState());
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setState((prev) => ({ ...prev, permission }));
      
      if (permission === "granted") {
        // Try to register periodic sync
        const syncRegistered = await registerPeriodicSync();
        
        if (!syncRegistered) {
          // Fallback to local reminders
          setupLocalReminders();
        }
      }
      
      return permission;
    } finally {
      setIsLoading(false);
    }
  };

  const checkReminders = () => {
    if (state.permission === "granted") {
      setupLocalReminders();
    }
  };

  return {
    ...state,
    isLoading,
    requestPermission,
    checkReminders,
  };
}
