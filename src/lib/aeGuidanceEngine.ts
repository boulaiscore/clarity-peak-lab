/**
 * ============================================
 * NEUROLOOP PRO – AE GUIDANCE ENGINE v1.4
 * ============================================
 * 
 * Implements deterministic, interpretable algorithm for:
 * 1) Suggesting which S1-AE game to play:
 *    - Orbit Lock (Stability)
 *    - Triage Sprint (Precision)
 *    - Focus Switch (Flexibility)
 * 2) Forcing difficulty level based on Plan, TC, Recovery, and Performance
 * 
 * CRITICAL RULES:
 * - Per-session performance is ONLY for guidance/gating/safety
 * - NEVER affects Sharpness, Readiness, SCI, or Cognitive Age directly
 * - Difficulty is NOT user-selectable (forced by this engine)
 */

import { TrainingPlanId } from "@/lib/trainingPlans";

// =============================================================================
// TYPES
// =============================================================================

export type AEGameName = "orbit_lock" | "triage_sprint" | "focus_switch";
export type Difficulty = "easy" | "medium" | "hard";
export type SuggestionReason = "Stability" | "Precision" | "Flexibility";
export type DifficultyReason = "Plan" | "Capacity" | "Recovery" | "Performance";

export interface AEGuidanceResult {
  suggestedGame: AEGameName;
  suggestedReason: SuggestionReason;
  forcedDifficulty: Difficulty;
  difficultyReasons: DifficultyReason[];
  computedDate: string; // YYYY-MM-DD
  // Debug info (not for UI)
  _debug?: {
    pdi: number;
    sdi: number;
    fdi: number;
    tcLoadRatio: number;
    tcTarget: Difficulty;
    sessionsInWindow: number;
    canUpgrade: boolean;
  };
}

export interface SessionAggregates {
  // Triage Sprint metrics
  falseAlarmRateAvg: number | null;
  hitRateAvg: number | null;
  rtVariabilityAvgNorm: number | null;
  // Orbit Lock metrics
  timeInBandPctAvg: number | null;
  // Focus Switch metrics
  switchLatencyAvgNorm: number | null;
  perseverationRateAvg: number | null;
  // Shared metrics
  degradationSlopeAvgNorm: number | null;
  // Session counts
  sessionCount: number;
  lastGamePlayed: AEGameName | null;
  sessionsAtCurrentDifficulty: number;
  lastUpgradeDate: string | null;
}

export interface GuidanceInput {
  aggregates: SessionAggregates;
  trainingPlan: TrainingPlanId;
  trainingCapacity: number;
  recovery: number;
  currentDate: string; // YYYY-MM-DD
}

// =============================================================================
// CONSTANTS
// =============================================================================

const EPSILON = 0.05; // Buffer to avoid frequent game switching

const PLAN_ALLOWED_DIFFICULTIES: Record<TrainingPlanId, Difficulty[]> = {
  light: ["easy", "medium"],
  expert: ["medium"],
  superhuman: ["medium", "hard"],
};

const PLAN_TC_CAPS: Record<TrainingPlanId, number> = {
  light: 120,
  expert: 200,
  superhuman: 300,
};

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];

// Normalization ranges for metrics
const RT_VARIABILITY_MAX = 500; // ms, for normalization
const DEGRADATION_MAX = 1.0; // slope range
const SWITCH_LATENCY_MAX = 2000; // ms, for normalization

// =============================================================================
// DEFICIT INDEX CALCULATIONS
// =============================================================================

/**
 * Precision Deficit Index (PDI)
 * Higher = more precision training needed → suggests Triage Sprint
 */
export function calculatePDI(aggregates: SessionAggregates): number {
  const falseAlarm = aggregates.falseAlarmRateAvg ?? 0.5;
  const hitRate = aggregates.hitRateAvg ?? 0.5;
  
  return 0.6 * falseAlarm + 0.4 * (1 - hitRate);
}

/**
 * Stability Deficit Index (SDI)
 * Higher = more stability training needed → suggests Orbit Lock
 */
export function calculateSDI(aggregates: SessionAggregates): number {
  const degradation = aggregates.degradationSlopeAvgNorm ?? 0.5;
  const rtVar = aggregates.rtVariabilityAvgNorm ?? 0.5;
  const timeInBand = aggregates.timeInBandPctAvg;
  
  if (timeInBand !== null) {
    // Have Orbit Lock data
    return (
      0.4 * degradation +
      0.3 * rtVar +
      0.3 * (1 - timeInBand)
    );
  } else {
    // No Orbit Lock data
    return (
      0.6 * degradation +
      0.4 * rtVar
    );
  }
}

/**
 * Flexibility Deficit Index (FDI)
 * Higher = more flexibility training needed → suggests Focus Switch
 */
export function calculateFDI(aggregates: SessionAggregates): number {
  const switchLatency = aggregates.switchLatencyAvgNorm ?? 0.5;
  const perseveration = aggregates.perseverationRateAvg ?? 0.5;
  
  return 0.5 * switchLatency + 0.5 * perseveration;
}

// =============================================================================
// GAME SUGGESTION
// =============================================================================

function suggestGame(
  aggregates: SessionAggregates
): { game: AEGameName; reason: SuggestionReason } {
  // If fewer than 3 sessions, use simple rotation
  if (aggregates.sessionCount < 3) {
    if (aggregates.lastGamePlayed === "orbit_lock") {
      return { game: "triage_sprint", reason: "Precision" };
    }
    if (aggregates.lastGamePlayed === "triage_sprint") {
      return { game: "focus_switch", reason: "Flexibility" };
    }
    if (aggregates.lastGamePlayed === "focus_switch") {
      return { game: "orbit_lock", reason: "Stability" };
    }
    // No games played → default to Orbit Lock
    return { game: "orbit_lock", reason: "Stability" };
  }
  
  // Calculate all three deficit indices
  const pdi = calculatePDI(aggregates);
  const sdi = calculateSDI(aggregates);
  const fdi = calculateFDI(aggregates);
  
  // Find the highest deficit with epsilon buffer
  // FDI > max(PDI, SDI) + epsilon → Focus Switch
  if (fdi > Math.max(pdi, sdi) + EPSILON) {
    return { game: "focus_switch", reason: "Flexibility" };
  }
  
  // SDI > PDI + epsilon → Orbit Lock
  if (sdi > pdi + EPSILON) {
    return { game: "orbit_lock", reason: "Stability" };
  }
  
  // Default → Triage Sprint
  return { game: "triage_sprint", reason: "Precision" };
}

// =============================================================================
// DIFFICULTY FORCING
// =============================================================================

function getDifficultyIndex(d: Difficulty): number {
  return DIFFICULTY_ORDER.indexOf(d);
}

function clampDifficulty(d: Difficulty, allowed: Difficulty[]): Difficulty {
  if (allowed.includes(d)) return d;
  
  const idx = getDifficultyIndex(d);
  // Find closest allowed
  for (let delta = 1; delta <= 2; delta++) {
    if (idx - delta >= 0) {
      const lower = DIFFICULTY_ORDER[idx - delta];
      if (allowed.includes(lower)) return lower;
    }
    if (idx + delta < DIFFICULTY_ORDER.length) {
      const higher = DIFFICULTY_ORDER[idx + delta];
      if (allowed.includes(higher)) return higher;
    }
  }
  
  return allowed[0];
}

function downgrade(d: Difficulty): Difficulty {
  const idx = getDifficultyIndex(d);
  if (idx > 0) return DIFFICULTY_ORDER[idx - 1];
  return d;
}

function upgrade(d: Difficulty): Difficulty {
  const idx = getDifficultyIndex(d);
  if (idx < DIFFICULTY_ORDER.length - 1) return DIFFICULTY_ORDER[idx + 1];
  return d;
}

function forceDifficulty(input: GuidanceInput): {
  difficulty: Difficulty;
  reasons: DifficultyReason[];
  tcTarget: Difficulty;
  canUpgrade: boolean;
} {
  const { aggregates, trainingPlan, trainingCapacity, recovery } = input;
  const allowed = PLAN_ALLOWED_DIFFICULTIES[trainingPlan];
  const planCap = PLAN_TC_CAPS[trainingPlan];
  const reasons: DifficultyReason[] = [];
  
  // B1: Plan-based forced difficulty
  if (trainingPlan === "expert") {
    return { difficulty: "medium", reasons: ["Plan"], tcTarget: "medium", canUpgrade: false };
  }
  
  // B2: TC-based target difficulty
  const loadRatio = trainingCapacity / planCap;
  let tcTarget: Difficulty;
  if (loadRatio < 0.55) {
    tcTarget = "easy";
  } else if (loadRatio <= 0.80) {
    tcTarget = "medium";
  } else {
    tcTarget = "hard";
  }
  
  // Clamp to allowed
  tcTarget = clampDifficulty(tcTarget, allowed);
  reasons.push("Capacity");
  
  let difficulty = tcTarget;
  
  // B3: Recovery safety downgrade
  if (recovery < 45 && difficulty === "hard") {
    difficulty = "medium";
    if (!reasons.includes("Recovery")) reasons.push("Recovery");
  }
  
  // B4: Performance safety downgrade (7-day window)
  const needsPerformanceDowngrade = 
    (aggregates.falseAlarmRateAvg !== null && aggregates.falseAlarmRateAvg > 0.35) ||
    (aggregates.degradationSlopeAvgNorm !== null && aggregates.degradationSlopeAvgNorm > 0.70);
  
  if (needsPerformanceDowngrade) {
    difficulty = downgrade(difficulty);
    difficulty = clampDifficulty(difficulty, allowed);
    if (!reasons.includes("Performance")) reasons.push("Performance");
  }
  
  // B5: Upgrade rule (anti-oscillation)
  let canUpgrade = false;
  const hasEnoughSessions = aggregates.sessionsAtCurrentDifficulty >= 5;
  const performanceGood = 
    (aggregates.falseAlarmRateAvg === null || aggregates.falseAlarmRateAvg < 0.20) &&
    (aggregates.degradationSlopeAvgNorm === null || aggregates.degradationSlopeAvgNorm <= 0.30);
  
  // Check if upgrade happened in last 7 days
  let noRecentUpgrade = true;
  if (aggregates.lastUpgradeDate) {
    const lastUpgrade = new Date(aggregates.lastUpgradeDate);
    const now = new Date(input.currentDate);
    const daysSinceUpgrade = Math.floor((now.getTime() - lastUpgrade.getTime()) / (1000 * 60 * 60 * 24));
    noRecentUpgrade = daysSinceUpgrade >= 7;
  }
  
  if (hasEnoughSessions && performanceGood && noRecentUpgrade) {
    const upgraded = upgrade(difficulty);
    if (allowed.includes(upgraded) && upgraded !== difficulty) {
      canUpgrade = true;
      // Note: We don't actually apply the upgrade here - it's just a signal
      // The upgrade should be applied at the end of a successful session
    }
  }
  
  // Ensure final difficulty is in allowed set
  difficulty = clampDifficulty(difficulty, allowed);
  
  return { difficulty, reasons, tcTarget, canUpgrade };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export function computeAEGuidance(input: GuidanceInput): AEGuidanceResult {
  const { game, reason } = suggestGame(input.aggregates);
  const { difficulty, reasons, tcTarget, canUpgrade } = forceDifficulty(input);
  
  // Calculate debug info
  const pdi = calculatePDI(input.aggregates);
  const sdi = calculateSDI(input.aggregates);
  const fdi = calculateFDI(input.aggregates);
  const planCap = PLAN_TC_CAPS[input.trainingPlan];
  
  return {
    suggestedGame: game,
    suggestedReason: reason,
    forcedDifficulty: difficulty,
    difficultyReasons: reasons,
    computedDate: input.currentDate,
    _debug: {
      pdi,
      sdi,
      fdi,
      tcLoadRatio: input.trainingCapacity / planCap,
      tcTarget,
      sessionsInWindow: input.aggregates.sessionCount,
      canUpgrade,
    },
  };
}

// =============================================================================
// AGGREGATE HELPERS
// =============================================================================

/**
 * Normalize RT variability to 0-1 range
 * Lower is better (more consistent)
 */
export function normalizeRTVariability(rtVariability: number): number {
  return Math.min(1, Math.max(0, rtVariability / RT_VARIABILITY_MAX));
}

/**
 * Normalize degradation slope to 0-1 range
 * 0 = stable performance, 1 = strong degradation
 * Original slope is typically -1 to 0 (negative = degradation)
 */
export function normalizeDegradationSlope(slope: number): number {
  // slope is typically negative for degradation
  // Convert to 0-1 where 1 = worst degradation
  const absSlope = Math.abs(Math.min(0, slope));
  return Math.min(1, absSlope / DEGRADATION_MAX);
}

/**
 * Convert time_in_band_pct (0-100) to 0-1 range
 */
export function normalizeTimeInBand(pct: number): number {
  return Math.min(1, Math.max(0, pct / 100));
}

/**
 * Normalize switch latency to 0-1 range
 * Higher = slower (worse)
 */
export function normalizeSwitchLatency(latencyMs: number): number {
  return Math.min(1, Math.max(0, latencyMs / SWITCH_LATENCY_MAX));
}
