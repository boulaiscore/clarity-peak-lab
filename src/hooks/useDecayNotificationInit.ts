/**
 * ============================================
 * NEUROLOOP PRO – DECAY NOTIFICATION INIT
 * ============================================
 * 
 * Hook to check and trigger decay notifications on app load.
 * Integrates with the main notification system.
 */

import { useEffect, useRef } from "react";
import { useDecayNotifications } from "@/hooks/useDecayNotifications";
import { getNotificationState } from "@/lib/notifications";

/**
 * Hook to initialize decay notifications on app load.
 * Checks recovery status and triggers appropriate notifications.
 * 
 * Should be called once at app startup (e.g., in AppShell or Home).
 */
export function useDecayNotificationInit() {
  const {
    isLoading,
    shouldShowRecoveryWarning,
    shouldShowRecoveryCritical,
    shouldShowInactivitySoft,
    shouldShowInactivityCritical,
    shouldShowWeeklyProgress,
    checkAndTriggerNotifications,
  } = useDecayNotifications();
  
  // Use ref to track if we've already triggered notifications this session
  const hasTriggeredRef = useRef(false);
  
  useEffect(() => {
    // Don't trigger if still loading or already triggered
    if (isLoading || hasTriggeredRef.current) return;
    
    // Check if notifications are supported and granted
    const { permission, isSupported } = getNotificationState();
    if (!isSupported || permission !== "granted") {
      return;
    }
    
    // Check if there's anything to notify about
    const hasNotifications = 
      shouldShowRecoveryWarning ||
      shouldShowRecoveryCritical ||
      shouldShowInactivitySoft ||
      shouldShowInactivityCritical ||
      shouldShowWeeklyProgress;
    
    if (hasNotifications) {
      console.log("[DecayNotificationInit] Triggering decay notifications", {
        shouldShowRecoveryWarning,
        shouldShowRecoveryCritical,
        shouldShowInactivitySoft,
        shouldShowInactivityCritical,
        shouldShowWeeklyProgress,
      });
      
      // Small delay to allow app to fully render
      const timeoutId = setTimeout(() => {
        checkAndTriggerNotifications();
        hasTriggeredRef.current = true;
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    isLoading,
    shouldShowRecoveryWarning,
    shouldShowRecoveryCritical,
    shouldShowInactivitySoft,
    shouldShowInactivityCritical,
    shouldShowWeeklyProgress,
    checkAndTriggerNotifications,
  ]);
  
  return {
    isLoading,
    hasNotifications: 
      shouldShowRecoveryWarning ||
      shouldShowRecoveryCritical ||
      shouldShowInactivitySoft ||
      shouldShowInactivityCritical ||
      shouldShowWeeklyProgress,
  };
}
