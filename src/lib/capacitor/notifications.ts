import { LocalNotifications, LocalNotificationSchema, ScheduleOptions } from '@capacitor/local-notifications';
import { isNative, isIOS } from '@/lib/platformUtils';

export interface NotificationOptions {
  title: string;
  body: string;
  id?: number;
  scheduleAt?: Date;
  data?: Record<string, unknown>;
}

/**
 * Check if notifications are supported on the current platform
 */
export function areNotificationsSupported(): boolean {
  if (isNative()) {
    return true; // Capacitor Local Notifications always available on native
  }
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (isNative()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      if (result.display === 'granted') return 'granted';
      if (result.display === 'denied') return 'denied';
      return 'default';
    } catch (error) {
      console.error('[notifications] Error checking permissions:', error);
      return 'default';
    }
  }
  
  if ('Notification' in window) {
    return Notification.permission;
  }
  
  return 'denied';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (isNative()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      if (result.display === 'granted') return 'granted';
      if (result.display === 'denied') return 'denied';
      return 'default';
    } catch (error) {
      console.error('[notifications] Error requesting permissions:', error);
      return 'denied';
    }
  }
  
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return 'denied';
}

/**
 * Show an immediate notification
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  const { title, body, id = Date.now(), data } = options;
  
  if (isNative()) {
    try {
      const notification: LocalNotificationSchema = {
        id,
        title,
        body,
        extra: data,
        sound: isIOS() ? 'default' : undefined,
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#6366f1',
      };
      
      await LocalNotifications.schedule({
        notifications: [notification],
      });
      console.log('[notifications] Native notification scheduled:', title);
    } catch (error) {
      console.error('[notifications] Error showing native notification:', error);
    }
    return;
  }
  
  // Web fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      // Try service worker first for better background support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: { title, body, data },
        });
      } else {
        new Notification(title, { body, data: data as Record<string, string> });
      }
      console.log('[notifications] Web notification shown:', title);
    } catch (error) {
      console.error('[notifications] Error showing web notification:', error);
    }
  }
}

/**
 * Schedule a notification for a future time
 */
export async function scheduleNotification(options: NotificationOptions): Promise<number> {
  const { title, body, scheduleAt, id = Date.now(), data } = options;
  
  if (!scheduleAt) {
    await showNotification(options);
    return id;
  }
  
  if (isNative()) {
    try {
      const notification: LocalNotificationSchema = {
        id,
        title,
        body,
        schedule: { at: scheduleAt },
        extra: data,
        sound: isIOS() ? 'default' : undefined,
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#6366f1',
      };
      
      await LocalNotifications.schedule({
        notifications: [notification],
      });
      console.log('[notifications] Native notification scheduled for:', scheduleAt);
      return id;
    } catch (error) {
      console.error('[notifications] Error scheduling native notification:', error);
      return id;
    }
  }
  
  // Web fallback - use setTimeout
  const delay = scheduleAt.getTime() - Date.now();
  if (delay > 0) {
    setTimeout(() => {
      showNotification({ title, body, id, data });
    }, delay);
    console.log('[notifications] Web notification scheduled for:', scheduleAt);
  }
  
  return id;
}

/**
 * Cancel a scheduled notification by ID
 */
export async function cancelNotification(id: number): Promise<void> {
  if (isNative()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log('[notifications] Notification cancelled:', id);
    } catch (error) {
      console.error('[notifications] Error cancelling notification:', error);
    }
    return;
  }
  
  // Web doesn't have a reliable way to cancel scheduled notifications
  console.log('[notifications] Web notification cancellation not supported');
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (isNative()) {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        console.log('[notifications] All notifications cancelled');
      }
    } catch (error) {
      console.error('[notifications] Error cancelling all notifications:', error);
    }
    return;
  }
  
  console.log('[notifications] Web notification cancellation not supported');
}

/**
 * Get all pending scheduled notifications
 */
export async function getPendingNotifications(): Promise<{ id: number; title?: string }[]> {
  if (isNative()) {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications.map(n => ({ id: n.id, title: n.title }));
    } catch (error) {
      console.error('[notifications] Error getting pending notifications:', error);
      return [];
    }
  }
  
  return [];
}

/**
 * Add listener for notification actions
 */
export async function addNotificationListener(
  callback: (notification: { id: number; data?: Record<string, unknown> }) => void
): Promise<void> {
  if (isNative()) {
    try {
      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        callback({
          id: action.notification.id,
          data: action.notification.extra as Record<string, unknown>,
        });
      });
      console.log('[notifications] Notification listener added');
    } catch (error) {
      console.error('[notifications] Error adding notification listener:', error);
    }
  }
}
