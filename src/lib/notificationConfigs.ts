/**
 * ============================================
 * NEUROLOOP PRO – NOTIFICATION CONFIGURATIONS
 * ============================================
 * 
 * Plan-specific notification thresholds and settings.
 * Controls when decay warnings and progress reminders are triggered.
 */

import type { TrainingPlanId } from "@/lib/trainingPlans";

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | "recovery_warning"
  | "recovery_critical"
  | "inactivity_soft"
  | "inactivity_critical"
  | "weekly_progress"
  | "weekend_summary";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface NotificationConfig {
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  tag: string;
  url: string;
}

// ============================================
// PLAN-SPECIFIC THRESHOLDS
// ============================================

export interface PlanNotificationThresholds {
  /** Days of low REC before showing warning (pre-decay) */
  recoveryWarningAfterDays: number;
  
  /** Days of low REC before showing critical (decay active) */
  recoveryCriticalAfterDays: number;
  
  /** Days without XP before soft nudge */
  inactivitySoftAfterDays: number;
  
  /** Days without XP before critical warning (SCI decay imminent) */
  inactivityCriticalAfterDays: number;
  
  /** Days of week for progress check notifications */
  weeklyCheckDays: ("monday" | "wednesday" | "friday" | "sunday")[];
  
  /** Minimum hours between same notification type */
  cooldownHours: number;
}

/**
 * Thresholds vary by plan intensity.
 * - Light: More relaxed, warnings come later
 * - Expert: Balanced approach
 * - Superhuman: Aggressive, early warnings
 */
export const PLAN_NOTIFICATION_THRESHOLDS: Record<TrainingPlanId, PlanNotificationThresholds> = {
  light: {
    recoveryWarningAfterDays: 2,
    recoveryCriticalAfterDays: 3,
    inactivitySoftAfterDays: 5,
    inactivityCriticalAfterDays: 7,
    weeklyCheckDays: ["sunday"],
    cooldownHours: 24,
  },
  expert: {
    recoveryWarningAfterDays: 2,
    recoveryCriticalAfterDays: 3,
    inactivitySoftAfterDays: 4,
    inactivityCriticalAfterDays: 6,
    weeklyCheckDays: ["wednesday", "sunday"],
    cooldownHours: 20,
  },
  superhuman: {
    recoveryWarningAfterDays: 1,
    recoveryCriticalAfterDays: 2,
    inactivitySoftAfterDays: 3,
    inactivityCriticalAfterDays: 5,
    weeklyCheckDays: ["monday", "wednesday", "sunday"],
    cooldownHours: 16,
  },
};

// ============================================
// NOTIFICATION MESSAGES (Italian)
// ============================================

export interface NotificationMessage {
  title: string;
  bodyTemplate: string;
}

export const NOTIFICATION_MESSAGES: Record<NotificationType, NotificationMessage> = {
  recovery_warning: {
    title: "⚠️ Recovery in calo",
    bodyTemplate: "REC al {rec}% da {days} giorni. Previeni il decay con 30 min di detox.",
  },
  recovery_critical: {
    title: "🚨 Readiness Decay Attivo",
    bodyTemplate: "{days} giorni con REC < 40%. La tua Readiness sta calando. Completa 45 min di recovery.",
  },
  inactivity_soft: {
    title: "💡 Cognitivamente idle",
    bodyTemplate: "{days} giorni senza training. Una sessione di 10 min mantiene il tuo SCI stabile.",
  },
  inactivity_critical: {
    title: "📉 SCI Decay Imminente",
    bodyTemplate: "{days} giorni senza XP. Il tuo Neural Strength inizierà a calare. Sessione rapida disponibile.",
  },
  weekly_progress: {
    title: "📊 Check Settimanale",
    bodyTemplate: "{plan}: {xp}/{target} XP ({percent}%) | REC: {rec}%",
  },
  weekend_summary: {
    title: "📈 Riepilogo Settimanale",
    bodyTemplate: "Settimana completata: {xp} XP | {sessions} sessioni | REC media: {avgRec}%",
  },
};

// ============================================
// NOTIFICATION PREFERENCE KEYS
// ============================================

export const NOTIFICATION_PREF_KEYS = {
  /** Master toggle for decay notifications */
  decayNotificationsEnabled: "neuroloop_decay_notifications_enabled",
  
  /** Individual toggles */
  recoveryWarningsEnabled: "neuroloop_recovery_warnings_enabled",
  inactivityWarningsEnabled: "neuroloop_inactivity_warnings_enabled",
  weeklyProgressEnabled: "neuroloop_weekly_progress_enabled",
  
  /** Last notification timestamps */
  lastRecoveryWarning: "neuroloop_last_recovery_warning",
  lastInactivityWarning: "neuroloop_last_inactivity_warning",
  lastWeeklyProgress: "neuroloop_last_weekly_progress",
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get thresholds for a specific plan.
 */
export function getNotificationThresholds(planId: TrainingPlanId): PlanNotificationThresholds {
  return PLAN_NOTIFICATION_THRESHOLDS[planId] ?? PLAN_NOTIFICATION_THRESHOLDS.expert;
}

/**
 * Format a notification message by replacing placeholders.
 */
export function formatNotificationMessage(
  type: NotificationType,
  values: Record<string, string | number>
): { title: string; body: string } {
  const message = NOTIFICATION_MESSAGES[type];
  
  let body = message.bodyTemplate;
  for (const [key, value] of Object.entries(values)) {
    body = body.replace(`{${key}}`, String(value));
  }
  
  return {
    title: message.title,
    body,
  };
}

/**
 * Check if enough time has passed since last notification of this type.
 */
export function canSendNotification(
  lastSentAt: Date | null,
  cooldownHours: number
): boolean {
  if (!lastSentAt) return true;
  
  const hoursSince = (Date.now() - lastSentAt.getTime()) / (1000 * 60 * 60);
  return hoursSince >= cooldownHours;
}

/**
 * Check if today is a weekly check day for the given plan.
 */
export function isTodayWeeklyCheckDay(planId: TrainingPlanId): boolean {
  const thresholds = getNotificationThresholds(planId);
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    wednesday: 3,
    friday: 5,
  };
  
  return thresholds.weeklyCheckDays.some(day => dayMap[day] === dayOfWeek);
}

/**
 * Get plan display name for notifications.
 */
export function getPlanDisplayName(planId: TrainingPlanId): string {
  const names: Record<TrainingPlanId, string> = {
    light: "Light",
    expert: "Expert",
    superhuman: "Superhuman",
  };
  return names[planId] ?? "Expert";
}
