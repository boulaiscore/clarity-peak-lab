/**
 * ============================================
 * NLOOP PRO – DECAY CONSTANTS
 * ============================================
 * 
 * Quantitative decay rules from NLOOP Decay & Dynamics Manual.
 * All thresholds and rates are centralized here for maintainability.
 */

// ============================================
// SKILL INACTIVITY DECAY (AE, RA, CT, IN)
// ============================================

/** Days of no XP before decay begins */
export const SKILL_DECAY_THRESHOLD_DAYS = 30;

/** Additional decay applied every N days after threshold */
export const SKILL_DECAY_INTERVAL_DAYS = 15;

/** Base decay points at threshold */
export const SKILL_DECAY_BASE_POINTS = 1;

/** Additional decay points per interval */
export const SKILL_DECAY_INTERVAL_POINTS = 1;

/** Maximum decay points per 90-day window */
export const SKILL_DECAY_MAX_POINTS = 3;

// ============================================
// READINESS DECAY
// ============================================

/** Recovery threshold below which low-REC tracking begins */
export const LOW_RECOVERY_THRESHOLD = 40;

/** Consecutive low-REC days before decay triggers */
export const READINESS_DECAY_TRIGGER_DAYS = 3;

/** Initial decay on day 3 of low REC */
export const READINESS_DECAY_INITIAL_POINTS = 5;

/** Additional decay per day after trigger */
export const READINESS_DECAY_PER_DAY_POINTS = 2;

/** Maximum readiness decay per week */
export const READINESS_DECAY_MAX_WEEKLY = 15;

// ============================================
// SCI (COGNITIVE NETWORK) DECAY
// ============================================

/** Decay if recovery is below threshold */
export const SCI_LOW_RECOVERY_DECAY = 5;

/** Days without training before SCI decay triggers */
export const SCI_NO_TRAINING_THRESHOLD_DAYS = 7;

/** Decay per week for no training */
export const SCI_NO_TRAINING_DECAY = 5;

/** Maximum SCI decay per week (stacking both conditions) */
export const SCI_DECAY_MAX_WEEKLY = 10;

// ============================================
// DUAL-PROCESS BALANCE DECAY
// ============================================

/** Imbalance ratio threshold (2x means S1/S2 >= 2 or <= 0.5) */
export const DUAL_PROCESS_IMBALANCE_RATIO = 2;

/** Decay per week when imbalanced */
export const DUAL_PROCESS_IMBALANCE_DECAY = 5;

/** Maximum dual-process decay per week */
export const DUAL_PROCESS_DECAY_MAX_WEEKLY = 10;

// ============================================
// COGNITIVE AGE REGRESSION
// ============================================

/** Performance drop threshold (points) to trigger age regression */
export const COGNITIVE_AGE_PERFORMANCE_DROP_THRESHOLD = 10;

/** Consecutive days of performance drop before age increases */
export const COGNITIVE_AGE_DROP_DAYS_THRESHOLD = 21;

/** Maximum cognitive age increase per 30-day period */
export const COGNITIVE_AGE_MAX_INCREASE_PER_MONTH = 1;

/** Days in age regression tracking period */
export const COGNITIVE_AGE_TRACKING_PERIOD_DAYS = 30;

// ============================================
// RECOVERY TARGET
// ============================================

/**
 * Canonical weekly recovery target in minutes (rolling 7-day window).
 * Used for calculating Recovery% = (detox + 0.5×walk) / REC_TARGET × 100
 * 840 min = 14 hours/week = 2 hours/day average
 */
export const REC_TARGET = 840;

// ============================================
// TRAINING CAPACITY (TC) CONSTANTS
// ============================================

/** Minimum TC value (floor) */
export const TC_FLOOR = 30;

/** Growth rate alpha for TC update formula */
export const TC_GROWTH_ALPHA = 0.06;

/** Decay per week when inactive for 7+ days */
export const TC_DECAY_PER_WEEK = 3;

/** Days without XP before TC decay kicks in */
export const TC_INACTIVITY_THRESHOLD_DAYS = 7;

/** Minimum percentage of TC for optimal range */
export const TC_OPTIMAL_MIN_PERCENT = 0.60;

/** Maximum percentage of TC for optimal range */
export const TC_OPTIMAL_MAX_PERCENT = 0.85;

/** Threshold for showing upgrade hint (optMax >= 90% of planCap) */
export const TC_UPGRADE_HINT_THRESHOLD = 0.90;

/** Plan capacity caps - v1.5: Aligned with XP targets */
export const TC_PLAN_CAPS: Record<string, number> = {
  light: 100,      // Target: 80 XP (80% of cap)
  expert: 160,     // Target: 140 XP (87.5% of cap)
  superhuman: 220, // Target: 200 XP (91% of cap)
};
