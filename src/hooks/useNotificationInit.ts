import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  initializeDailyReminder, 
  getNotificationState,
  checkMissedReminder 
} from "@/lib/notifications";

/**
 * Hook to initialize daily reminder notifications on app load.
 * Re-schedules reminders when user logs in if they have reminders enabled.
 */
export function useNotificationInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const initReminders = async () => {
      // Check if notifications are supported and granted
      const { permission, isSupported } = getNotificationState();
      if (!isSupported || permission !== "granted") {
        return;
      }

      // Fetch user's reminder settings from profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time, daily_time_commitment")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching reminder settings:", error);
        return;
      }

      if (profile?.reminder_enabled && profile?.reminder_time) {
        console.log("[NotificationInit] Re-scheduling daily reminder for", profile.reminder_time);
        initializeDailyReminder(
          true,
          profile.reminder_time,
          profile.daily_time_commitment || "7min"
        );

        // Check if user missed their reminder (app was closed at scheduled time)
        checkMissedReminder(profile.reminder_time, profile.daily_time_commitment || "7min");
      }
    };

    initReminders();
  }, [user?.id]);
}
