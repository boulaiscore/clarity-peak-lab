/**
 * ============================================
 * NEUROLOOP PRO – S1 DIFFICULTY ENGINE v1.0
 * ============================================
 * 
 * Unified difficulty suggestion and forcing rules for ALL System 1 games (AE and RA).
 * 
 * INPUTS:
 * - REC (Recovery): 0-100
 * - Sharpness: 0-100
 * - Readiness: 0-100
 * - weeklyXP: current load (XP earned this week)
 * - TC (Training Capacity): user's cognitive limit
 * 
 * OUTPUTS:
 * - recommended: soft suggestion (Easy/Medium/Hard)
 * - locked: hard blocks with reasons
 * - safetyModeActive: if all but Easy are locked
 * 
 * CRITICAL RULES:
 * - User may always CHOOSE the game, but difficulty is constrained
 * - Difficulty can be overridden if not locked (tracked as difficulty_override)
 * - This replaces the "forced-only" approach for user-facing selection
 */

// =============================================================================
// TYPES
// =============================================================================

export type Difficulty = "easy" | "medium" | "hard";
export type DifficultyStatus = "enabled" | "recommended" | "locked";

export interface DifficultyLockReason {
  code: string;
  message: string;
}

export interface DifficultyOption {
  difficulty: Difficulty;
  status: DifficultyStatus;
  lockReason?: DifficultyLockReason;
}

export interface S1DifficultyResult {
  /** The recommended difficulty (soft suggestion) */
  recommended: Difficulty;
  /** All three difficulty options with their status */
  options: DifficultyOption[];
  /** True if all difficulties except Easy are locked */
  safetyModeActive: boolean;
  /** Safety mode label (shown when safetyModeActive) */
  safetyLabel?: string;
  /** Debug info */
  _debug?: {
    optMin: number;
    optMax: number;
    recovery: number;
    sharpness: number;
    readiness: number;
    weeklyXP: number;
    tc: number;
  };
}

export interface S1DifficultyInput {
  recovery: number;         // REC 0-100
  sharpness: number;        // 0-100
  readiness: number;        // 0-100
  weeklyXP: number;         // current load (XP earned this week)
  trainingCapacity: number; // TC
  trainingPlan?: "light" | "expert" | "superhuman"; // v1.5: Training plan affects suggestion
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Optimal range is 60-85% of TC
const OPT_MIN_RATIO = 0.60;
const OPT_MAX_RATIO = 0.85;

// =============================================================================
// BLOCKING RULES (HARD LOCKS)
// =============================================================================

/**
 * Check if HARD difficulty should be blocked
 */
function shouldBlockHard(input: S1DifficultyInput, optMax: number): DifficultyLockReason | null {
  // Block HARD if REC < 55
  if (input.recovery < 55) {
    return { code: "REC_TOO_LOW", message: "Recovery below 55%" };
  }
  
  // Block HARD if weeklyXP > optMax
  if (input.weeklyXP > optMax) {
    return { code: "LOAD_TOO_HIGH", message: "Weekly load exceeds optimal range" };
  }
  
  // Block HARD if Readiness < 45
  if (input.readiness < 45) {
    return { code: "READINESS_TOO_LOW", message: "Readiness below 45%" };
  }
  
  return null;
}

/**
 * Check if MEDIUM difficulty should be blocked
 * Note: If MEDIUM is blocked, HARD is also blocked
 */
function shouldBlockMedium(input: S1DifficultyInput, tc: number): DifficultyLockReason | null {
  // Block MEDIUM if REC < 40
  if (input.recovery < 40) {
    return { code: "REC_VERY_LOW", message: "Recovery below 40%" };
  }
  
  // Block MEDIUM if weeklyXP > TC
  if (input.weeklyXP > tc) {
    return { code: "LOAD_EXCEEDS_TC", message: "Weekly load exceeds capacity" };
  }
  
  return null;
}

// =============================================================================
// SUGGESTION RULES (SOFT RECOMMENDATIONS)
// =============================================================================

/**
 * Determine the suggested difficulty based on metrics AND training plan
 * 
 * v1.5 UPDATE: Training plan influences the default suggestion:
 * - Light: Prefers Easy/Medium (only Medium if REC > 60)
 * - Expert: Standard balanced logic
 * - Superhuman: Prefers Medium/Hard (Easy only if REC < 40)
 */
function suggestDifficulty(input: S1DifficultyInput, optMin: number, optMax: number): Difficulty {
  const { recovery, sharpness, readiness, weeklyXP, trainingPlan } = input;
  
  // ===== LIGHT PLAN: Conservative approach =====
  if (trainingPlan === "light") {
    // Only suggest Medium if recovery is strong
    if (recovery >= 60 && sharpness >= 60 && weeklyXP <= optMax) {
      return "medium";
    }
    // Default to Easy for Light plan
    return "easy";
  }
  
  // ===== SUPERHUMAN PLAN: Aggressive approach =====
  if (trainingPlan === "superhuman") {
    // Suggest Hard if conditions are good
    if (recovery >= 65 && weeklyXP <= optMax && sharpness >= 65 && readiness >= 55) {
      return "hard";
    }
    // Only fall to Easy if recovery is very low
    if (recovery < 40) {
      return "easy";
    }
    // Default to Medium for Superhuman
    return "medium";
  }
  
  // ===== EXPERT PLAN (default): Balanced approach =====
  
  // Suggest EASY if ANY is true:
  // - REC < 45
  // - weeklyXP < optMin
  // - Sharpness < 55
  if (recovery < 45 || weeklyXP < optMin || sharpness < 55) {
    return "easy";
  }
  
  // Suggest HARD if ALL are true:
  // - REC >= 70
  // - weeklyXP <= optMax
  // - Sharpness >= 70
  // - Readiness >= 60
  if (recovery >= 70 && weeklyXP <= optMax && sharpness >= 70 && readiness >= 60) {
    return "hard";
  }
  
  // Otherwise suggest MEDIUM if ALL are true:
  // - REC >= 45 AND REC < 70
  // - weeklyXP >= optMin AND weeklyXP <= optMax
  // - Sharpness >= 55 AND Sharpness < 70
  if (
    recovery >= 45 && recovery < 70 &&
    weeklyXP >= optMin && weeklyXP <= optMax &&
    sharpness >= 55 && sharpness < 70
  ) {
    return "medium";
  }
  
  // Default to EASY for safety if conditions aren't clearly met
  // This handles edge cases where metrics are in ambiguous ranges
  return "easy";
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Compute S1 difficulty options with suggestion and locks
 */
export function computeS1Difficulty(input: S1DifficultyInput): S1DifficultyResult {
  const { trainingCapacity: tc } = input;
  
  // Calculate optimal range
  const optMin = tc * OPT_MIN_RATIO;
  const optMax = tc * OPT_MAX_RATIO;
  
  // Check blocking rules
  const mediumBlockReason = shouldBlockMedium(input, tc);
  const hardBlockReason = shouldBlockHard(input, optMax);
  
  // If MEDIUM is blocked, HARD is also blocked (use medium reason for hard)
  const finalHardBlockReason = mediumBlockReason || hardBlockReason;
  
  // Determine suggested difficulty
  let recommended = suggestDifficulty(input, optMin, optMax);
  
  // If the recommended difficulty is locked, downgrade
  if (recommended === "hard" && finalHardBlockReason) {
    recommended = "medium";
  }
  if (recommended === "medium" && mediumBlockReason) {
    recommended = "easy";
  }
  
  // Build options array
  const options: DifficultyOption[] = [
    {
      difficulty: "easy",
      status: recommended === "easy" ? "recommended" : "enabled",
    },
    {
      difficulty: "medium",
      status: mediumBlockReason 
        ? "locked" 
        : recommended === "medium" 
          ? "recommended" 
          : "enabled",
      lockReason: mediumBlockReason ?? undefined,
    },
    {
      difficulty: "hard",
      status: finalHardBlockReason 
        ? "locked" 
        : recommended === "hard" 
          ? "recommended" 
          : "enabled",
      lockReason: finalHardBlockReason ?? undefined,
    },
  ];
  
  // Check if safety mode is active (all but Easy locked)
  const safetyModeActive = !!mediumBlockReason;
  
  return {
    recommended,
    options,
    safetyModeActive,
    safetyLabel: safetyModeActive ? "Light mode enabled for safety" : undefined,
    _debug: {
      optMin: Math.round(optMin),
      optMax: Math.round(optMax),
      recovery: input.recovery,
      sharpness: input.sharpness,
      readiness: input.readiness,
      weeklyXP: input.weeklyXP,
      tc,
    },
  };
}

/**
 * Check if a specific difficulty is available (not locked)
 */
export function isDifficultyAvailable(
  difficulty: Difficulty,
  result: S1DifficultyResult
): boolean {
  const option = result.options.find(o => o.difficulty === difficulty);
  return option?.status !== "locked";
}

/**
 * Get the first available difficulty (for fallback scenarios)
 */
export function getFirstAvailableDifficulty(result: S1DifficultyResult): Difficulty {
  // Always return at least Easy
  for (const option of result.options) {
    if (option.status !== "locked") {
      return option.difficulty;
    }
  }
  return "easy";
}
