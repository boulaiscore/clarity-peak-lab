import { useState, useEffect } from "react";
import {
  getNotificationState,
  requestNotificationPermission,
  setupLocalReminders,
  registerPeriodicSync,
  scheduleDailyReminder,
  cancelDailyReminder,
  initializeDailyReminder,
  getScheduledReminderInfo,
  checkMissedReminder,
  NotificationPermissionState,
} from "@/lib/notifications";

export function useNotifications() {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: "default",
    isSupported: false,
    isPushSupported: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  useEffect(() => {
    setState(getNotificationState());
    const { scheduledAt } = getScheduledReminderInfo();
    setScheduledAt(scheduledAt);
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

  const setDailyReminder = (
    enabled: boolean,
    time: string | null,
    dailyCommitment: string
  ) => {
    if (enabled && time && state.permission === "granted") {
      scheduleDailyReminder(time, dailyCommitment);
      const { scheduledAt } = getScheduledReminderInfo();
      setScheduledAt(scheduledAt);
    } else {
      cancelDailyReminder();
      setScheduledAt(null);
    }
  };

  const initializeReminder = (
    enabled: boolean,
    time: string | null,
    dailyCommitment: string
  ) => {
    initializeDailyReminder(enabled, time, dailyCommitment);
    const { scheduledAt } = getScheduledReminderInfo();
    setScheduledAt(scheduledAt);
  };

  return {
    ...state,
    isLoading,
    scheduledAt,
    requestPermission,
    checkReminders,
    setDailyReminder,
    initializeReminder,
  };
}
