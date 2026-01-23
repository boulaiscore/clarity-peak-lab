/**
 * ============================================
 * NLOOP TEMPORAL WINDOWS — ROLLING ONLY
 * ============================================
 * 
 * OFFICIAL RULES:
 * NLOOP NON usa settimane di calendario.
 * Usa SOLO rolling windows.
 * 
 * PERIODS:
 * - SHORT (1-3 days): State metrics (Sharpness, Readiness, Recovery, Gating)
 * - MEDIUM (7 days): Load & Plan (TC, SCI, S2_Consistency, Task_Priming)
 * - LONG (14-30 days): Growth & Decay (Skill decay, RQ decay, Cognitive Age)
 * 
 * NO calendar weeks, NO arbitrary resets.
 */

import { subDays, startOfDay, format } from "date-fns";

// ============================================
// SHORT PERIOD (1-3 days) — STATE
// ============================================

/**
 * Get the start of the short period (3 days ago).
 * Used for: Sharpness, Readiness, Recovery (REC_raw), Gating games
 * 
 * Activity from 4+ days ago does NOT count for state metrics.
 */
export function getShortPeriodStart(now = new Date()): Date {
  return startOfDay(subDays(now, 3));
}

/**
 * Get today's start (midnight).
 * Used for: Daily caps, today's metrics
 */
export function getTodayStart(now = new Date()): Date {
  return startOfDay(now);
}

/**
 * Get yesterday's start.
 * Used for: "Today + Yesterday" calculations
 */
export function getYesterdayStart(now = new Date()): Date {
  return startOfDay(subDays(now, 1));
}

// ============================================
// MEDIUM PERIOD (7 days) — LOAD & PLAN
// ============================================

/**
 * Get the start of the medium period (7 days ago).
 * Used for: Training Capacity, SCI, RQ priming, Weekly XP, Adherence
 * 
 * Key rule: ANY activity within 7 days counts.
 * - Game done 6 days ago → counts
 * - Game done 8 days ago → does NOT count
 */
export function getMediumPeriodStart(now = new Date()): Date {
  return subDays(now, 7);
}

/**
 * Get the formatted ISO string for medium period start.
 * Useful for Supabase queries.
 */
export function getMediumPeriodStartISO(now = new Date()): string {
  return getMediumPeriodStart(now).toISOString();
}

/**
 * Get the formatted date string for medium period start.
 * Format: "yyyy-MM-dd"
 */
export function getMediumPeriodStartDate(now = new Date()): string {
  return format(getMediumPeriodStart(now), "yyyy-MM-dd");
}

// ============================================
// LONG PERIOD (14-30 days) — GROWTH & DECAY
// ============================================

/**
 * Get the start of a long period (14 or 30 days ago).
 * Used for: Skill decay, RQ decay, SCI decay, Cognitive Age regression
 * 
 * Single events don't matter here — patterns of prolonged absence do.
 */
export function getLongPeriodStart(days: 14 | 21 | 30, now = new Date()): Date {
  return subDays(now, days);
}

/**
 * Get the formatted ISO string for long period start.
 */
export function getLongPeriodStartISO(days: 14 | 21 | 30, now = new Date()): string {
  return getLongPeriodStart(days, now).toISOString();
}

// ============================================
// GAME WINDOW RULES
// ============================================

/**
 * Games influence different metrics based on age:
 * - 1 day ago → counts for EVERYTHING (state, load, decay prevention)
 * - 6 days ago → counts for TC / SCI / RQ (load, plan)
 * - 10 days ago → counts ONLY for decay prevention
 * - 30+ days ago → counts for NOTHING
 */
export const GAME_WINDOWS = {
  /** Counts for state metrics (gating, sharpness, readiness) */
  STATE: 3,
  /** Counts for load/capacity metrics (TC, SCI, RQ) */
  LOAD: 7,
  /** Counts for decay prevention only */
  DECAY_PREVENTION: 30,
} as const;

/**
 * Check if a game at given age (in days) counts for a specific window.
 */
export function gameCountsForWindow(
  daysAgo: number, 
  window: keyof typeof GAME_WINDOWS
): boolean {
  return daysAgo <= GAME_WINDOWS[window];
}

// ============================================
// TASK WINDOW RULES
// ============================================

/**
 * Tasks have different rules than games.
 * They ONLY influence Reasoning Quality (RQ) via Task_Priming.
 * 
 * Task_Priming window: 7 days rolling
 * Weight decays over time: today > 3 days ago > 7 days ago
 * Beyond 7 days → weight = 0
 */
export const TASK_WINDOWS = {
  /** RQ priming window */
  PRIMING: 7,
} as const;

/**
 * Calculate task priming weight based on age.
 * Returns 0-1 weight for RQ calculation.
 */
export function getTaskPrimingWeight(daysAgo: number): number {
  if (daysAgo <= 0) return 1.0;    // Today
  if (daysAgo <= 1) return 0.9;    // Yesterday
  if (daysAgo <= 3) return 0.7;    // 2-3 days ago
  if (daysAgo <= 5) return 0.4;    // 4-5 days ago
  if (daysAgo <= 7) return 0.2;    // 6-7 days ago
  return 0;                         // >7 days = no effect
}

// ============================================
// DECAY WINDOWS
// ============================================

/**
 * Decay windows for different metrics.
 * Decay only triggers after sustained inactivity.
 */
export const DECAY_WINDOWS = {
  /** Skill decay (AE, RA, CT, IN) */
  SKILL: 30,
  /** Reasoning Quality decay */
  RQ: 14,
  /** SCI decay */
  SCI: 7,
  /** Cognitive Age regression */
  COGNITIVE_AGE: 21,
} as const;

// ============================================
// HELPER: Query Builders
// ============================================

/**
 * Get Supabase query range for medium period (7 days).
 * Returns { from: ISO string, to: ISO string }
 */
export function getMediumPeriodRange(now = new Date()): { from: string; to: string } {
  return {
    from: getMediumPeriodStart(now).toISOString(),
    to: now.toISOString(),
  };
}

/**
 * Get Supabase query range for short period (3 days).
 */
export function getShortPeriodRange(now = new Date()): { from: string; to: string } {
  return {
    from: getShortPeriodStart(now).toISOString(),
    to: now.toISOString(),
  };
}

/**
 * Get today's date range for queries.
 */
export function getTodayRange(now = new Date()): { from: string; to: string } {
  const todayStart = getTodayStart(now);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    from: todayStart.toISOString(),
    to: tomorrow.toISOString(),
  };
}
