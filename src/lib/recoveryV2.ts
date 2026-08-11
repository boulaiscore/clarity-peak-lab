/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY v2.0 ENGINE
 * ============================================
 * 
 * Daily snapshot recalibration model for Recovery (REC).
 * 
 * KEY FORMULAS:
 * - New day: REC = target + (REC - target) × 0.35
 * - Gain:  REC = min(100, REC + 0.12 × (detox_min + 0.5 × walk_min))
 * 
 * STATE:
 * - rec_value: Current REC (0-100)
 * - rec_last_ts: Timestamp of last update
 * - has_recovery_baseline: Whether RRI has been applied (one-time init)
 */

import {
  REC_GAIN_COEFFICIENT,
  REC_DEFAULT_RRI,
  REC_RRI_MIN,
  REC_RRI_MAX,
  NIGHT_START_HOUR,
  NIGHT_END_HOUR,
  NIGHT_DECAY_MULTIPLIER,
} from "@/lib/decayConstants";

// ============================================
// TYPES
// ============================================

export interface RecoveryState {
  recValue: number | null;
  recLastTs: string | null;
  hasRecoveryBaseline: boolean;
}

export interface RecoveryActionResult {
  newRecValue: number;
  newRecLastTs: string;
}

export interface RecoveryWearableEstimate {
  rawScore: number;
  confidence: number;
}

export interface DailyRecoveryTargetBreakdown {
  /** Confidence-blended target produced by Phone Health, when available. */
  phoneHealthTarget: number | null;
  /** Raw 0-100 physiological estimate before it is mapped to REC's 35-65 range. */
  wearableRawScore: number | null;
  /** Wearable estimate mapped to REC's deliberately bounded 35-65 target range. */
  wearableTarget: number | null;
  /** Fraction of the available wearable signal set observed today. */
  wearableConfidence: number;
  /** Effective weight of wearable physiology in today's combined target. */
  wearableWeight: number;
  /** Signed change produced by wearable physiology versus the available base target. */
  wearableContribution: number;
  /** Final target consumed by Home, Monitor, gating, actions and history. */
  combinedTarget: number;
}

const roundRecovery = (value: number): number =>
  Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
const roundSigned = (value: number): number => Math.round(value * 10) / 10;

/**
 * Canonical, explainable breakdown for today's passive Recovery target.
 * UI surfaces consume this result instead of recreating coefficients.
 */
export function calculateDailyRecoveryTargetBreakdown(
  phoneHealthTarget: number | null | undefined,
  wearable: RecoveryWearableEstimate | null | undefined,
): DailyRecoveryTargetBreakdown {
  const phoneTarget = phoneHealthTarget != null && Number.isFinite(phoneHealthTarget)
    ? Math.max(0, Math.min(100, phoneHealthTarget))
    : null;
  const wearableConfidence = wearable
    ? Math.max(0, Math.min(1, wearable.confidence))
    : 0;
  const wearableRawScore = wearable
    ? Math.max(0, Math.min(100, wearable.rawScore))
    : null;
  const wearableTarget = wearableRawScore == null
    ? null
    : 35 + 0.30 * wearableRawScore;

  if (phoneTarget === null) {
    const baseTarget = 50;
    const wearableWeight = wearableTarget == null ? 0 : wearableConfidence;
    const wearableContribution = wearableTarget == null
      ? 0
      : wearableWeight * (wearableTarget - baseTarget);
    return {
      phoneHealthTarget: null,
      wearableRawScore,
      wearableTarget: wearableTarget == null ? null : roundRecovery(wearableTarget),
      wearableConfidence,
      wearableWeight,
      wearableContribution: roundSigned(wearableContribution),
      combinedTarget: roundRecovery(baseTarget + wearableContribution),
    };
  }

  const wearableWeight = wearableTarget == null ? 0 : 0.50 * wearableConfidence;
  const wearableContribution = wearableTarget == null
    ? 0
    : wearableWeight * (wearableTarget - phoneTarget);
  return {
    phoneHealthTarget: roundRecovery(phoneTarget),
    wearableRawScore,
    wearableTarget: wearableTarget == null ? null : roundRecovery(wearableTarget),
    wearableConfidence,
    wearableWeight,
    wearableContribution: roundSigned(wearableContribution),
    combinedTarget: roundRecovery(phoneTarget + wearableContribution),
  };
}

/**
 * Combines the confidence-blended Phone Health target with today's wearable
 * physiology. Wearable confidence controls its influence, so a partial record
 * improves the estimate without replacing a complete Health target.
 */
export function calculateDailyRecoveryTarget(
  phoneHealthTarget: number | null | undefined,
  wearable: RecoveryWearableEstimate | null | undefined,
): number {
  return calculateDailyRecoveryTargetBreakdown(phoneHealthTarget, wearable).combinedTarget;
}

// ============================================
// RRI CALCULATION
// ============================================

/**
 * Calculate Recovery Readiness Init (RRI) from onboarding data.
 * Formula: clamp(35, 55, 45 + sleepBonus + detoxBonus + mentalStateBonus)
 */
export function calculateRRI(
  sleepHours: string | null,
  detoxHours: string | null,
  mentalState: string | null
): number {
  let base = 45;
  
  // Sleep bonus: +5 for 7-8h, +3 for 6-7h, 0 for <6h or >8h
  if (sleepHours === "7-8") base += 5;
  else if (sleepHours === "6-7") base += 3;
  else if (sleepHours === "8+") base += 2;
  
  // Detox bonus: +5 for 2+h, +3 for 1-2h, 0 for <1h
  if (detoxHours === "2+") base += 5;
  else if (detoxHours === "1-2") base += 3;
  
  // Mental state bonus: +5 for good, +2 for okay, -2 for stressed
  if (mentalState === "good") base += 5;
  else if (mentalState === "okay") base += 2;
  else if (mentalState === "stressed") base -= 2;
  
  return Math.max(REC_RRI_MIN, Math.min(REC_RRI_MAX, base));
}

// ============================================
// LEGACY NIGHT HOURS HELPER
// ============================================

/**
 * Check if a given hour (0-23) falls within the night period.
 * Night is defined as NIGHT_START_HOUR (23) to NIGHT_END_HOUR (7).
 */
function isNightHour(hour: number): boolean {
  // Night spans midnight: 23, 0, 1, 2, 3, 4, 5, 6
  if (NIGHT_START_HOUR > NIGHT_END_HOUR) {
    return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
  }
  return hour >= NIGHT_START_HOUR && hour < NIGHT_END_HOUR;
}

/**
 * Calculate effective decay hours between two timestamps.
 * Retained for historical reports; Recovery v2 daily recalibration does not
 * consume this helper.
 * Night hours (23:00-07:00) are weighted by NIGHT_DECAY_MULTIPLIER (0.2).
 * Day hours are weighted at 1.0.
 * 
 * @param startTs ISO timestamp of start
 * @param endTs ISO timestamp of end
 * @returns Effective decay hours (reduced for night periods)
 */
export function calculateEffectiveDecayHours(
  startTs: string,
  endTs: string
): number {
  const startDate = new Date(startTs);
  const endDate = new Date(endTs);
  
  const totalMs = endDate.getTime() - startDate.getTime();
  if (totalMs <= 0) return 0;
  
  // For very short periods (< 1 hour), use simple calculation
  const totalHours = totalMs / (1000 * 60 * 60);
  if (totalHours < 1) {
    const midpointHour = startDate.getHours();
    const multiplier = isNightHour(midpointHour) ? NIGHT_DECAY_MULTIPLIER : 1;
    return totalHours * multiplier;
  }
  
  // Iterate hour by hour for accurate calculation
  let effectiveHours = 0;
  let currentTime = new Date(startDate);
  
  while (currentTime < endDate) {
    const currentHour = currentTime.getHours();
    const multiplier = isNightHour(currentHour) ? NIGHT_DECAY_MULTIPLIER : 1;
    
    // Calculate time remaining in this hour
    const nextHour = new Date(currentTime);
    nextHour.setHours(currentHour + 1, 0, 0, 0);
    
    // Don't go past endDate
    const hourEnd = nextHour > endDate ? endDate : nextHour;
    const hourFraction = (hourEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    
    effectiveHours += hourFraction * multiplier;
    currentTime = nextHour;
  }
  
  return effectiveHours;
}

// ============================================
// DAILY SNAPSHOT MODEL (WHOOP-style)
// ============================================

/**
 * Baseline value REC mean-reverts toward when no actions are taken.
 * Represents the "neutral" cognitive reserve a healthy adult has by default.
 */
const REC_DAILY_BASELINE = 50;

/**
 * How much of the gap toward baseline is closed each missed day.
 * 0.65 = 65% recalibration toward today's passive Health target.
 * Examples (starting from 80, baseline 50):
 *   Day 1: 80 → 60.5
 *   Day 3: ~51.3
 *   Day 7: ~50
 * Never collapses to 0.
 */
const REC_DAILY_MEAN_REVERSION = 0.65;

/**
 * Recalibrate one daily Recovery step toward the best target available for
 * that day. This is shared by the live engine and historical projections so
 * Monitor cannot apply a different decay model from Home.
 */
export function recalibrateRecoveryForNewDay(
  currentRec: number,
  targetOverride: number = REC_DAILY_BASELINE,
): number {
  const current = Math.max(0, Math.min(100, currentRec));
  const target = Math.max(0, Math.min(100, targetOverride));
  const retainedShare = 1 - REC_DAILY_MEAN_REVERSION;
  return Math.round((target + (current - target) * retainedShare) * 10) / 10;
}

/**
 * A missing Recovery baseline is uncertainty, not depletion. Until a real
 * REC value exists, headline metrics use the confidence-aware daily target
 * (which itself falls back to the neutral value of 50).
 */
export function resolveRecoveryForMetrics(
  recoveryValue: number | null | undefined,
  dailyTarget: number | null | undefined,
): number {
  if (recoveryValue != null && Number.isFinite(recoveryValue)) {
    return Math.max(0, Math.min(100, recoveryValue));
  }
  if (dailyTarget != null && Number.isFinite(dailyTarget)) {
    return Math.max(0, Math.min(100, dailyTarget));
  }
  return REC_DAILY_BASELINE;
}

/**
 * Number of full calendar days between two ISO timestamps (local time).
 * Same day = 0; next calendar day = 1; etc.
 */
function calendarDaysBetween(lastTs: string, nowTs: string): number {
  const last = new Date(lastTs);
  const now = new Date(nowTs);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffMs = nowDay - lastDay;
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Apply daily snapshot recalibration.
 * - Within the same calendar day: REC is FROZEN (no change). WHOOP-style fixed score.
 * - Each new day: REC mean-reverts toward `targetOverride` (or REC_DAILY_BASELINE 50
 *   if not provided) by REC_DAILY_MEAN_REVERSION.
 *
 * Active gains via applyRecoveryAction continue to bump REC immediately within the day.
 *
 * @param currentRec Current recovery value (0-100)
 * @param lastTs ISO timestamp of last update
 * @param nowTs ISO timestamp of current time (default: now)
 * @param targetOverride Optional dynamic target (e.g. from Phone Health Index, range ~35..65).
 *                      When omitted falls back to REC_DAILY_BASELINE (50) → unchanged behavior.
 * @returns Recalibrated recovery value
 */
export function applyRecoveryDecay(
  currentRec: number,
  lastTs: string,
  nowTs: string = new Date().toISOString(),
  targetOverride?: number | null
): number {
  const days = calendarDaysBetween(lastTs, nowTs);

  // Same calendar day → frozen snapshot
  if (days <= 0) return currentRec;

  const target =
    targetOverride != null && Number.isFinite(targetOverride)
      ? Math.max(0, Math.min(100, targetOverride))
      : REC_DAILY_BASELINE;

  // Apply the canonical daily recalibration once per missed calendar day.
  let rec = currentRec;
  for (let i = 0; i < days; i++) {
    rec = recalibrateRecoveryForNewDay(rec, target);
  }

  return Math.max(0, Math.min(100, Math.round(rec * 10) / 10));
}

// ============================================
// GAIN FUNCTION
// ============================================

/**
 * Apply recovery gain from Detox/Walking actions.
 * Formula: REC = min(100, decayed_REC + 0.12 × (detox_min + 0.5 × walk_min))
 * 
 * @param currentRec Current recovery value (0-100)
 * @param lastTs ISO timestamp of last update
 * @param detoxMinutes Minutes of digital detox completed
 * @param walkMinutes Minutes of walking completed
 * @returns New recovery state
 */
export function applyRecoveryAction(
  currentRec: number,
  lastTs: string,
  detoxMinutes: number,
  walkMinutes: number,
  targetOverride?: number | null,
): RecoveryActionResult {
  const nowTs = new Date().toISOString();
  
  // Step 1: Apply decay first
  const decayedRec = applyRecoveryDecay(currentRec, lastTs, nowTs, targetOverride);
  
  // Step 2: Apply gain
  const x = detoxMinutes + 0.5 * walkMinutes;
  const gainedRec = decayedRec + REC_GAIN_COEFFICIENT * x;
  const newRecValue = Math.min(100, Math.round(gainedRec * 10) / 10);
  
  return {
    newRecValue,
    newRecLastTs: nowTs,
  };
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize recovery baseline for a new user.
 * Uses RRI from onboarding or default value.
 * 
 * @param rriValue Optional RRI from onboarding
 * @returns Initial recovery state
 */
export function initializeRecoveryBaseline(
  rriValue: number | null
): RecoveryActionResult {
  const initialRec = rriValue ?? REC_DEFAULT_RRI;
  const nowTs = new Date().toISOString();
  
  return {
    newRecValue: Math.max(REC_RRI_MIN, Math.min(REC_RRI_MAX, initialRec)),
    newRecLastTs: nowTs,
  };
}

// ============================================
// CURRENT VALUE COMPUTATION
// ============================================

/**
 * Get the current (decayed) recovery value.
 * This applies decay from last timestamp to now WITHOUT persisting.
 * 
 * @param state Current recovery state from DB
 * @returns Current effective recovery value (0-100)
 */
export function getCurrentRecovery(
  state: RecoveryState,
  targetOverride?: number | null,
): number | null {
  // No baseline yet
  if (!state.hasRecoveryBaseline) return null;
  
  // Value not set
  if (state.recValue === null || state.recLastTs === null) return null;
  
  // Apply decay to get current value
  return applyRecoveryDecay(state.recValue, state.recLastTs, new Date().toISOString(), targetOverride);
}

/**
 * Check if recovery data is valid and initialized.
 */
export function hasValidRecoveryData(state: RecoveryState): boolean {
  return (
    state.hasRecoveryBaseline &&
    state.recValue !== null &&
    state.recLastTs !== null
  );
}
