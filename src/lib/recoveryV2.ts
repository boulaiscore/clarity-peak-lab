/**
 * ============================================
 * NEUROLOOP PRO – RECOVERY v2.0 ENGINE
 * ============================================
 * 
 * Continuous exponential decay model for Recovery (REC).
 * 
 * KEY FORMULAS:
 * - Decay: REC = REC × 2^(-Δt_hours / 72)
 * - Gain:  REC = min(100, REC + 0.12 × (detox_min + 0.5 × walk_min))
 * 
 * STATE:
 * - rec_value: Current REC (0-100)
 * - rec_last_ts: Timestamp of last update
 * - has_recovery_baseline: Whether RRI has been applied (one-time init)
 */

import {
  REC_HALF_LIFE_HOURS,
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
// NIGHT HOURS HELPER
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
// DECAY FUNCTION
// ============================================

/**
 * Apply exponential decay to recovery value.
 * Uses effective hours that account for reduced decay during night (23:00-07:00).
 * Formula: REC = REC × 2^(-effectiveHours / 72)
 * 
 * @param currentRec Current recovery value (0-100)
 * @param lastTs ISO timestamp of last update
 * @param nowTs ISO timestamp of current time (default: now)
 * @returns Decayed recovery value
 */
export function applyRecoveryDecay(
  currentRec: number,
  lastTs: string,
  nowTs: string = new Date().toISOString()
): number {
  if (currentRec <= 0) return 0;
  
  const effectiveHours = calculateEffectiveDecayHours(lastTs, nowTs);
  
  if (effectiveHours <= 0) return currentRec;
  
  const decayedRec = currentRec * Math.pow(2, -effectiveHours / REC_HALF_LIFE_HOURS);
  return Math.max(0, Math.round(decayedRec * 10) / 10);
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
  walkMinutes: number
): RecoveryActionResult {
  const nowTs = new Date().toISOString();
  
  // Step 1: Apply decay first
  const decayedRec = applyRecoveryDecay(currentRec, lastTs, nowTs);
  
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
export function getCurrentRecovery(state: RecoveryState): number | null {
  // No baseline yet
  if (!state.hasRecoveryBaseline) return null;
  
  // Value not set
  if (state.recValue === null || state.recLastTs === null) return null;
  
  // Apply decay to get current value
  return applyRecoveryDecay(state.recValue, state.recLastTs);
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
