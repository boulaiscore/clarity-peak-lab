// Push notification utilities for NeuroLoop Pro

const VAPID_PUBLIC_KEY = ""; // Will be set when push notifications are configured

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isPushSupported: boolean;
}

// Check if notifications are supported
export function getNotificationState(): NotificationPermissionState {
  const isSupported = "Notification" in window;
  const isPushSupported = "PushManager" in window;
  
  return {
    permission: isSupported ? Notification.permission : "denied",
    isSupported,
    isPushSupported,
  };
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return "denied";
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Show a local notification (for testing and immediate notifications)
export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }
  
  // Use service worker to show notification if available
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "neuroloop-training",
        ...options,
      } as NotificationOptions);
    });
  } else {
    // Fallback to regular notification
    new Notification(title, {
      icon: "/icon-192.png",
      ...options,
    });
  }
}

// Schedule a training reminder notification
export function scheduleTrainingReminder(): void {
  const messages = [
    { title: "Time for cognitive training", body: "5 minutes to sharpen your thinking." },
    { title: "Train your mind", body: "A quick reasoning exercise awaits." },
    { title: "Cognitive check-in", body: "Keep your mental edge sharp." },
    { title: "Ready for a challenge?", body: "Your brain is trainable. Let's exercise it." },
    { title: "Decision quality check", body: "Practice structured thinking today." },
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  showLocalNotification(randomMessage.title, {
    body: randomMessage.body,
    data: { url: "/app/categories" },
  });
}

// Register for periodic background sync (if supported)
export async function registerPeriodicSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if periodicSync is supported
    if ("periodicSync" in registration) {
      const status = await navigator.permissions.query({
        name: "periodic-background-sync" as PermissionName,
      });
      
      if (status.state === "granted") {
        await (registration as any).periodicSync.register("training-reminder", {
          minInterval: 4 * 60 * 60 * 1000, // Every 4 hours
        });
        console.log("Periodic sync registered");
        return true;
      }
    }
  } catch (error) {
    console.warn("Periodic sync not available:", error);
  }
  
  return false;
}

// Fallback: Set up in-app reminder scheduling using localStorage
export function setupLocalReminders(): void {
  const REMINDER_KEY = "neuroloop_last_reminder";
  const REMINDER_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in ms
  
  const lastReminder = localStorage.getItem(REMINDER_KEY);
  const now = Date.now();
  
  if (!lastReminder || now - parseInt(lastReminder) > REMINDER_INTERVAL) {
    // Check if user has done a session today
    const lastSession = localStorage.getItem("neuroloop_last_session");
    
    if (!lastSession || now - parseInt(lastSession) > REMINDER_INTERVAL) {
      // Show reminder
      if (Notification.permission === "granted") {
        scheduleTrainingReminder();
      }
    }
    
    localStorage.setItem(REMINDER_KEY, now.toString());
  }
}

// Mark that user completed a session
export function markSessionCompleted(): void {
  localStorage.setItem("neuroloop_last_session", Date.now().toString());
}

// ============================================
// Daily Training Reminder System
// ============================================

const REMINDER_TIMEOUT_KEY = "neuroloop_reminder_timeout_id";
const REMINDER_SCHEDULED_KEY = "neuroloop_reminder_scheduled_at";

// Get exercise count based on daily commitment
function getExerciseCountForCommitment(dailyCommitment: string): number {
  switch (dailyCommitment) {
    case "3min": return 6;
    case "7min": return 14;
    case "10min": return 20;
    default: return 14;
  }
}

// Show personalized daily training notification
export function showDailyTrainingNotification(dailyCommitment: string): void {
  const exerciseCount = getExerciseCountForCommitment(dailyCommitment);
  
  showLocalNotification("🧠 Your daily cognitive training is ready", {
    body: `${dailyCommitment} session • ${exerciseCount} exercises across Focus, Reasoning, Creativity`,
    data: { url: "/app/daily-session" },
    requireInteraction: true,
  });
}

// Schedule daily reminder at specific time
export function scheduleDailyReminder(reminderTime: string, dailyCommitment: string): void {
  // Cancel any existing reminder first
  cancelDailyReminder();
  
  // Parse time (HH:mm format)
  const [hours, minutes] = reminderTime.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.warn("Invalid reminder time format:", reminderTime);
    return;
  }
  
  // Calculate milliseconds until next reminder
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  
  // If time already passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  const msUntilReminder = next.getTime() - now.getTime();
  
  console.log(`Scheduling daily reminder for ${next.toLocaleString()} (in ${Math.round(msUntilReminder / 1000 / 60)} minutes)`);
  
  // Store timeout ID for cancellation
  const timeoutId = window.setTimeout(() => {
    showDailyTrainingNotification(dailyCommitment);
    // Re-schedule for next day
    scheduleDailyReminder(reminderTime, dailyCommitment);
  }, msUntilReminder);
  
  localStorage.setItem(REMINDER_TIMEOUT_KEY, String(timeoutId));
  localStorage.setItem(REMINDER_SCHEDULED_KEY, next.toISOString());
}

// Cancel existing daily reminder
export function cancelDailyReminder(): void {
  const timeoutId = localStorage.getItem(REMINDER_TIMEOUT_KEY);
  if (timeoutId) {
    window.clearTimeout(Number(timeoutId));
    localStorage.removeItem(REMINDER_TIMEOUT_KEY);
    localStorage.removeItem(REMINDER_SCHEDULED_KEY);
    console.log("Daily reminder cancelled");
  }
}

// Get scheduled reminder info
export function getScheduledReminderInfo(): { scheduledAt: Date | null } {
  const scheduledAt = localStorage.getItem(REMINDER_SCHEDULED_KEY);
  return {
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  };
}

// Initialize reminder on app load (if enabled)
export function initializeDailyReminder(
  reminderEnabled: boolean,
  reminderTime: string | null,
  dailyCommitment: string
): void {
  if (reminderEnabled && reminderTime && Notification.permission === "granted") {
    scheduleDailyReminder(reminderTime, dailyCommitment);
  } else {
    cancelDailyReminder();
  }
}
