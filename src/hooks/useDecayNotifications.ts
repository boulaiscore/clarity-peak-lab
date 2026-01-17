/**
 * ============================================
 * NEUROLOOP PRO – DECAY NOTIFICATIONS HOOK
 * ============================================
 * 
 * Manages intelligent notifications based on:
 * 1. Recovery decay status (low REC streak)
 * 2. Training inactivity (days without XP)
 * 3. Weekly progress checks
 * 
 * Respects plan-specific thresholds and cooldowns.
 */

import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyRecoverySnapshot } from "@/hooks/useDailyRecoverySnapshot";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useStableCognitiveLoad } from "@/hooks/useStableCognitiveLoad";
import {
  getNotificationThresholds,
  canSendNotification,
  isTodayWeeklyCheckDay,
  getPlanDisplayName,
  NOTIFICATION_PREF_KEYS,
  type PlanNotificationThresholds,
} from "@/lib/notificationConfigs";
import {
  showRecoveryWarningNotification,
  showRecoveryCriticalNotification,
  showInactivitySoftNotification,
  showInactivityCriticalNotification,
  showWeeklyProgressNotification,
} from "@/lib/notifications";
import type { TrainingPlanId } from "@/lib/trainingPlans";

// ============================================
// TYPES
// ============================================

export interface DecayNotificationState {
  /** Whether recovery warning should be shown */
  shouldShowRecoveryWarning: boolean;
  
  /** Whether recovery is critical (decay active) */
  shouldShowRecoveryCritical: boolean;
  
  /** Whether soft inactivity nudge should be shown */
  shouldShowInactivitySoft: boolean;
  
  /** Whether critical inactivity warning should be shown */
  shouldShowInactivityCritical: boolean;
  
  /** Whether weekly progress notification should be shown */
  shouldShowWeeklyProgress: boolean;
  
  /** Current low REC streak days */
  lowRecStreakDays: number;
  
  /** Days since last XP earned */
  daysSinceLastXP: number;
  
  /** Current recovery percentage */
  currentRecovery: number;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getLastNotificationTime(key: string): Date | null {
  const stored = localStorage.getItem(key);
  return stored ? new Date(stored) : null;
}

function setLastNotificationTime(key: string): void {
  localStorage.setItem(key, new Date().toISOString());
}

function isNotificationEnabled(key: string): boolean {
  const stored = localStorage.getItem(key);
  // Default to enabled if not set
  return stored !== "false";
}

// ============================================
// MAIN HOOK
// ============================================

export function useDecayNotifications() {
  const { user } = useAuth();
  const planId = (user?.trainingPlan as TrainingPlanId) ?? "expert";
  
  const { lowRecStreakDays, isLoading: isLoadingSnapshot } = useDailyRecoverySnapshot();
  const { weeklyXPEarned, weeklyXPTarget, isLoading: isLoadingProgress } = useWeeklyProgress();
  const { recoveryProgress, isLoading: isLoadingLoad } = useStableCognitiveLoad();
  
  const isLoading = isLoadingSnapshot || isLoadingProgress || isLoadingLoad;
  
  // For now, we don't have a direct "days since last XP" tracker
  // This would need a separate query to exercise_completions with max(created_at)
  // For MVP, we'll focus on recovery streak which is already tracked
  const daysSinceLastXP = 0; // TODO: Add proper tracking in future iteration
  
  // Get plan-specific thresholds
  const thresholds = useMemo<PlanNotificationThresholds>(
    () => getNotificationThresholds(planId),
    [planId]
  );
  
  // Calculate notification state
  const notificationState = useMemo<DecayNotificationState>(() => {
    const decayEnabled = isNotificationEnabled(NOTIFICATION_PREF_KEYS.decayNotificationsEnabled);
    const recoveryEnabled = decayEnabled && isNotificationEnabled(NOTIFICATION_PREF_KEYS.recoveryWarningsEnabled);
    const inactivityEnabled = decayEnabled && isNotificationEnabled(NOTIFICATION_PREF_KEYS.inactivityWarningsEnabled);
    const weeklyEnabled = isNotificationEnabled(NOTIFICATION_PREF_KEYS.weeklyProgressEnabled);
    
    // Check cooldowns
    const lastRecovery = getLastNotificationTime(NOTIFICATION_PREF_KEYS.lastRecoveryWarning);
    const lastInactivity = getLastNotificationTime(NOTIFICATION_PREF_KEYS.lastInactivityWarning);
    const lastWeekly = getLastNotificationTime(NOTIFICATION_PREF_KEYS.lastWeeklyProgress);
    
    const canSendRecovery = canSendNotification(lastRecovery, thresholds.cooldownHours);
    const canSendInactivity = canSendNotification(lastInactivity, thresholds.cooldownHours);
    const canSendWeekly = canSendNotification(lastWeekly, 24); // Weekly has 24h cooldown
    
    // Determine what to show
    const shouldShowRecoveryWarning = 
      recoveryEnabled &&
      canSendRecovery &&
      lowRecStreakDays >= thresholds.recoveryWarningAfterDays &&
      lowRecStreakDays < thresholds.recoveryCriticalAfterDays;
    
    const shouldShowRecoveryCritical =
      recoveryEnabled &&
      canSendRecovery &&
      lowRecStreakDays >= thresholds.recoveryCriticalAfterDays;
    
    const shouldShowInactivitySoft =
      inactivityEnabled &&
      canSendInactivity &&
      daysSinceLastXP >= thresholds.inactivitySoftAfterDays &&
      daysSinceLastXP < thresholds.inactivityCriticalAfterDays;
    
    const shouldShowInactivityCritical =
      inactivityEnabled &&
      canSendInactivity &&
      daysSinceLastXP >= thresholds.inactivityCriticalAfterDays;
    
    const shouldShowWeeklyProgress =
      weeklyEnabled &&
      canSendWeekly &&
      isTodayWeeklyCheckDay(planId);
    
    return {
      shouldShowRecoveryWarning,
      shouldShowRecoveryCritical,
      shouldShowInactivitySoft,
      shouldShowInactivityCritical,
      shouldShowWeeklyProgress,
      lowRecStreakDays,
      daysSinceLastXP,
      currentRecovery: recoveryProgress ?? 0,
    };
  }, [
    lowRecStreakDays,
    daysSinceLastXP,
    recoveryProgress,
    thresholds,
    planId,
  ]);
  
  // Function to trigger recovery warning
  const triggerRecoveryWarning = useCallback(() => {
    if (notificationState.shouldShowRecoveryWarning) {
      showRecoveryWarningNotification(
        notificationState.lowRecStreakDays,
        Math.round(notificationState.currentRecovery)
      );
      setLastNotificationTime(NOTIFICATION_PREF_KEYS.lastRecoveryWarning);
    }
  }, [notificationState]);
  
  // Function to trigger recovery critical
  const triggerRecoveryCritical = useCallback(() => {
    if (notificationState.shouldShowRecoveryCritical) {
      showRecoveryCriticalNotification(
        notificationState.lowRecStreakDays,
        5 // Decay points (initial)
      );
      setLastNotificationTime(NOTIFICATION_PREF_KEYS.lastRecoveryWarning);
    }
  }, [notificationState]);
  
  // Function to trigger inactivity soft
  const triggerInactivitySoft = useCallback(() => {
    if (notificationState.shouldShowInactivitySoft) {
      showInactivitySoftNotification(notificationState.daysSinceLastXP);
      setLastNotificationTime(NOTIFICATION_PREF_KEYS.lastInactivityWarning);
    }
  }, [notificationState]);
  
  // Function to trigger inactivity critical
  const triggerInactivityCritical = useCallback(() => {
    if (notificationState.shouldShowInactivityCritical) {
      showInactivityCriticalNotification(notificationState.daysSinceLastXP);
      setLastNotificationTime(NOTIFICATION_PREF_KEYS.lastInactivityWarning);
    }
  }, [notificationState]);
  
  // Function to trigger weekly progress
  const triggerWeeklyProgress = useCallback(() => {
    if (notificationState.shouldShowWeeklyProgress) {
      const percent = weeklyXPTarget > 0 ? Math.round((weeklyXPEarned / weeklyXPTarget) * 100) : 0;
      showWeeklyProgressNotification(
        getPlanDisplayName(planId),
        weeklyXPEarned,
        weeklyXPTarget,
        percent,
        Math.round(notificationState.currentRecovery)
      );
      setLastNotificationTime(NOTIFICATION_PREF_KEYS.lastWeeklyProgress);
    }
  }, [notificationState, planId, weeklyXPEarned, weeklyXPTarget]);
  
  // Check and trigger all applicable notifications
  const checkAndTriggerNotifications = useCallback(() => {
    if (Notification.permission !== "granted") return;
    
    // Priority: Critical > Warning > Info
    if (notificationState.shouldShowRecoveryCritical) {
      triggerRecoveryCritical();
    } else if (notificationState.shouldShowRecoveryWarning) {
      triggerRecoveryWarning();
    }
    
    if (notificationState.shouldShowInactivityCritical) {
      triggerInactivityCritical();
    } else if (notificationState.shouldShowInactivitySoft) {
      triggerInactivitySoft();
    }
    
    if (notificationState.shouldShowWeeklyProgress) {
      triggerWeeklyProgress();
    }
  }, [
    notificationState,
    triggerRecoveryCritical,
    triggerRecoveryWarning,
    triggerInactivityCritical,
    triggerInactivitySoft,
    triggerWeeklyProgress,
  ]);
  
  return {
    ...notificationState,
    isLoading,
    thresholds,
    planId,
    weeklyXPEarned,
    weeklyXPTarget,
    
    // Manual triggers
    triggerRecoveryWarning,
    triggerRecoveryCritical,
    triggerInactivitySoft,
    triggerInactivityCritical,
    triggerWeeklyProgress,
    checkAndTriggerNotifications,
  };
}

// ============================================
// NOTIFICATION PREFERENCES HOOK
// ============================================

export function useDecayNotificationPreferences() {
  const getPreference = useCallback((key: keyof typeof NOTIFICATION_PREF_KEYS): boolean => {
    const stored = localStorage.getItem(NOTIFICATION_PREF_KEYS[key]);
    return stored !== "false";
  }, []);
  
  const setPreference = useCallback((key: keyof typeof NOTIFICATION_PREF_KEYS, enabled: boolean): void => {
    localStorage.setItem(NOTIFICATION_PREF_KEYS[key], String(enabled));
  }, []);
  
  return {
    decayNotificationsEnabled: getPreference("decayNotificationsEnabled"),
    recoveryWarningsEnabled: getPreference("recoveryWarningsEnabled"),
    inactivityWarningsEnabled: getPreference("inactivityWarningsEnabled"),
    weeklyProgressEnabled: getPreference("weeklyProgressEnabled"),
    
    setDecayNotificationsEnabled: (enabled: boolean) => setPreference("decayNotificationsEnabled", enabled),
    setRecoveryWarningsEnabled: (enabled: boolean) => setPreference("recoveryWarningsEnabled", enabled),
    setInactivityWarningsEnabled: (enabled: boolean) => setPreference("inactivityWarningsEnabled", enabled),
    setWeeklyProgressEnabled: (enabled: boolean) => setPreference("weeklyProgressEnabled", enabled),
  };
}
