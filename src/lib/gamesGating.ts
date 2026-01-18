/**
 * ============================================
 * NEUROLOOP PRO – GAMES GATING SYSTEM v1.4
 * ============================================
 * 
 * Games are gated by cognitive metrics. NO override allowed for games.
 * 
 * GAME TYPES:
 * - S1-AE: System 1 Attentional Efficiency (Focus Fast)
 * - S1-RA: System 1 Rapid Association (Creativity Fast)
 * - S2-CT: System 2 Critical Thinking (Reasoning Slow)
 * - S2-IN: System 2 Insight (Creativity Slow)
 * 
 * CRITICAL v1.4 FIXES:
 * - S1 games do NOT depend on Recovery
 * - Post-baseline safety rule: at least one S1 game always enabled
 * - S2 hard block when Recovery < 45
 * 
 * DAILY/WEEKLY CAPS:
 * - S1 total: ≤3/day
 * - S2 total: ≤1/day
 * - Insight (S2-IN): ≤3/week (plan-dependent)
 */

import type { CognitiveStates } from "./cognitiveEngine";

export type GameType = "S1-AE" | "S1-RA" | "S2-CT" | "S2-IN";

export interface GameThreshold {
  metric: string;
  current: number;
  required: number;
}

export interface GameAvailability {
  type: GameType;
  enabled: boolean;
  withheldReason: string | null;
  thresholds: GameThreshold[];
  unlockActions: string[];
}

export interface GamesCaps {
  s1DailyUsed: number;
  s1DailyMax: number;
  s2DailyUsed: number;
  s2DailyMax: number;
  insightWeeklyUsed: number;
  insightWeeklyMax: number;
  // Weekly S2 total cap (optional, computed from insightWeeklyMax + CT cap)
  s2WeeklyUsed?: number;
  s2WeeklyMax?: number;
}

export interface TrainingPlanModifiers {
  s2ThresholdModifier: number; // e.g., +3 for Light, 0 for Expert
  requireRecForS2: number; // e.g., 55 for Superhuman
  insightMaxPerWeek: number; // 2 for Light, 3 for Expert, 4 for Superhuman
}

// ============================================
// THRESHOLDS v1.4 - CORRECTED
// ============================================
// S1 games: NO Recovery dependency
// S2 games: Hard block when Recovery < 45

const S1_THRESHOLDS = {
  "S1-AE": {
    // S1-AE enabled if: Sharpness >= 40
    minSharpness: 40,
  },
  "S1-RA": {
    // S1-RA enabled if: Sharpness >= 45 AND Readiness >= 35
    minSharpness: 45,
    minReadiness: 35,
  },
};

const S2_THRESHOLDS = {
  "S2-CT": {
    // enabled IF (Sharpness >= 65) AND (Readiness >= 60) AND (REC >= 50)
    minSharpness: 65,
    minReadiness: 60,
    minREC: 50,
  },
  "S2-IN": {
    // enabled IF (Sharpness >= 60) AND (REC >= 55) AND (50 <= Readiness <= 70)
    minSharpness: 60,
    minREC: 55,
    minReadiness: 50,
    maxReadiness: 70,
  },
};

// S2 hard block threshold
const S2_HARD_BLOCK_RECOVERY = 45;

// Caps from Technical Manual v1.3
const DEFAULT_CAPS = {
  s1DailyMax: 3,
  s2DailyMax: 1,
  insightWeeklyMax: 3, // Default, can be overridden by plan
};

/**
 * Check if a specific game type is available based on cognitive metrics
 */
export function checkGameAvailability(
  gameType: GameType,
  sharpness: number,
  readiness: number,
  recovery: number,
  caps: GamesCaps,
  planModifiers?: TrainingPlanModifiers
): GameAvailability {
  const thresholds: GameThreshold[] = [];
  const unlockActions: string[] = [];
  let enabled = true;
  let withheldReason: string | null = null;

  const s2Modifier = planModifiers?.s2ThresholdModifier ?? 0;
  const requireRecForS2 = planModifiers?.requireRecForS2 ?? 50;

  switch (gameType) {
    // ============================================
    // S1 GAMES - NO RECOVERY DEPENDENCY
    // ============================================
    case "S1-AE": {
      const config = S1_THRESHOLDS["S1-AE"];
      
      // Check Sharpness >= 40
      if (sharpness < config.minSharpness) {
        enabled = false;
        thresholds.push({ metric: "Sharpness", current: sharpness, required: config.minSharpness });
        unlockActions.push("Light warm-up activity", "Brief rest");
      }
      
      // Check daily cap
      if (caps.s1DailyUsed >= caps.s1DailyMax) {
        enabled = false;
        withheldReason = `S1 daily limit reached (${caps.s1DailyUsed}/${caps.s1DailyMax})`;
      }
      break;
    }

    case "S1-RA": {
      const config = S1_THRESHOLDS["S1-RA"];
      
      // Check Sharpness >= 45
      if (sharpness < config.minSharpness) {
        enabled = false;
        thresholds.push({ metric: "Sharpness", current: sharpness, required: config.minSharpness });
        unlockActions.push("Light focus activity", "S1-AE session first");
      }
      
      // Check Readiness >= 35
      if (readiness < config.minReadiness) {
        enabled = false;
        thresholds.push({ metric: "Readiness", current: readiness, required: config.minReadiness });
        unlockActions.push("Short rest", "Delay by 1-2 hours");
      }
      
      // Check daily cap
      if (caps.s1DailyUsed >= caps.s1DailyMax) {
        enabled = false;
        withheldReason = `S1 daily limit reached (${caps.s1DailyUsed}/${caps.s1DailyMax})`;
      }
      break;
    }

    // ============================================
    // S2 GAMES - RECOVERY HARD BLOCK AT 45
    // ============================================
    case "S2-CT": {
      const config = S2_THRESHOLDS["S2-CT"];
      const minSharpness = config.minSharpness + s2Modifier;
      const minReadiness = config.minReadiness + s2Modifier;
      const minREC = Math.max(config.minREC, requireRecForS2);
      
      // S2 HARD BLOCK: Recovery < 45
      if (recovery < S2_HARD_BLOCK_RECOVERY) {
        enabled = false;
        thresholds.push({ metric: "Recovery", current: recovery, required: S2_HARD_BLOCK_RECOVERY });
        unlockActions.push("Complete a Detox session", "Take a Walk", "Rest without screens");
        withheldReason = "Recovery is low";
        break; // Skip other checks
      }
      
      // Check Sharpness >= 65 (+modifier)
      if (sharpness < minSharpness) {
        enabled = false;
        thresholds.push({ metric: "Sharpness", current: sharpness, required: minSharpness });
        unlockActions.push("S1-AE session first", "Focus block");
      }
      
      // Check Readiness >= 60 (+modifier)
      if (readiness < minReadiness) {
        enabled = false;
        thresholds.push({ metric: "Readiness", current: readiness, required: minReadiness });
        unlockActions.push("Delay by 2-4 hours", "Short rest");
      }
      
      // Check REC >= 50 (or plan-specific)
      if (recovery < minREC) {
        enabled = false;
        thresholds.push({ metric: "Recovery", current: recovery, required: minREC });
        unlockActions.push("Detox session", "No-screens break");
      }
      
      // Check daily cap
      if (caps.s2DailyUsed >= caps.s2DailyMax) {
        enabled = false;
        withheldReason = `S2 daily limit reached (${caps.s2DailyUsed}/${caps.s2DailyMax})`;
      }
      
      // Check weekly S2 cap
      if (caps.s2WeeklyUsed !== undefined && caps.s2WeeklyMax !== undefined) {
        if (caps.s2WeeklyUsed >= caps.s2WeeklyMax) {
          enabled = false;
          withheldReason = `S2 weekly limit reached (${caps.s2WeeklyUsed}/${caps.s2WeeklyMax})`;
        }
      }
      break;
    }

    case "S2-IN": {
      const config = S2_THRESHOLDS["S2-IN"];
      const insightMax = planModifiers?.insightMaxPerWeek ?? DEFAULT_CAPS.insightWeeklyMax;
      const minSharpness = config.minSharpness + s2Modifier;
      const minREC = Math.max(config.minREC, requireRecForS2);
      
      // S2 HARD BLOCK: Recovery < 45
      if (recovery < S2_HARD_BLOCK_RECOVERY) {
        enabled = false;
        thresholds.push({ metric: "Recovery", current: recovery, required: S2_HARD_BLOCK_RECOVERY });
        unlockActions.push("Complete a detox session", "Take a walk", "Rest without screens");
        withheldReason = "Recovery too low";
        break; // Skip other checks
      }
      
      // Check Sharpness >= 60 (+modifier)
      if (sharpness < minSharpness) {
        enabled = false;
        thresholds.push({ metric: "Sharpness", current: sharpness, required: minSharpness });
        unlockActions.push("S1-AE session first", "Focus block");
      }
      
      // Check REC >= 55 (or plan-specific)
      if (recovery < minREC) {
        enabled = false;
        thresholds.push({ metric: "Recovery", current: recovery, required: minREC });
        unlockActions.push("Detox session", "No-screens break");
      }
      
      // Check 50 <= Readiness <= 70
      if (readiness < config.minReadiness) {
        enabled = false;
        thresholds.push({ metric: "Readiness", current: readiness, required: config.minReadiness });
        unlockActions.push("Short rest", "Low-demand activity first");
      }
      if (readiness > config.maxReadiness) {
        enabled = false;
        thresholds.push({ metric: "Readiness", current: readiness, required: config.maxReadiness });
        withheldReason = "Readiness too high for Insight — use S2-CT instead";
      }
      
      // Check daily S2 cap
      if (caps.s2DailyUsed >= caps.s2DailyMax) {
        enabled = false;
        withheldReason = `S2 daily limit reached (${caps.s2DailyUsed}/${caps.s2DailyMax})`;
      }
      
      // Check weekly Insight cap
      if (caps.insightWeeklyUsed >= insightMax) {
        enabled = false;
        withheldReason = `Insight weekly limit reached (${caps.insightWeeklyUsed}/${insightMax})`;
      }
      break;
    }
  }

  // Build withheld reason from thresholds if not already set
  if (!enabled && !withheldReason && thresholds.length > 0) {
    const t = thresholds[0];
    withheldReason = `${t.metric} below threshold`;
  }

  return {
    type: gameType,
    enabled,
    withheldReason,
    thresholds,
    unlockActions: enabled ? [] : unlockActions,
  };
}

/**
 * Get all game availabilities with NO-DEADLOCK SAFETY RULE
 * 
 * SAFETY RULE (v1.5):
 * IF availableGames.length == 0:
 *   Force-enable S1-AE as safe mode option (unless daily cap reached)
 * 
 * This prevents users from being completely locked out of training
 * due to low metrics (e.g., Sharpness = 39.8 from REC_raw = 0).
 */
export function getAllGamesAvailability(
  sharpness: number,
  readiness: number,
  recovery: number,
  caps: GamesCaps,
  planModifiers?: TrainingPlanModifiers,
  isCalibrated?: boolean
): Record<GameType, GameAvailability> {
  // First compute standard availability
  const result: Record<GameType, GameAvailability> = {
    "S1-AE": checkGameAvailability("S1-AE", sharpness, readiness, recovery, caps, planModifiers),
    "S1-RA": checkGameAvailability("S1-RA", sharpness, readiness, recovery, caps, planModifiers),
    "S2-CT": checkGameAvailability("S2-CT", sharpness, readiness, recovery, caps, planModifiers),
    "S2-IN": checkGameAvailability("S2-IN", sharpness, readiness, recovery, caps, planModifiers),
  };

  // ============================================
  // NO-DEADLOCK SAFETY RULE (v1.5)
  // ============================================
  // Check if ANY game is available
  const availableGames = Object.values(result).filter(g => g.enabled);
  
  if (availableGames.length === 0) {
    // Check if S1-AE is capped - cannot override cap
    const s1AECapped = caps.s1DailyUsed >= caps.s1DailyMax;
    
    if (!s1AECapped) {
      // Force-enable S1-AE as safe mode training
      result["S1-AE"] = {
        type: "S1-AE",
        enabled: true,
        withheldReason: null,
        thresholds: [],
        unlockActions: [],
        // Mark as safe mode (will be checked by isSafetyRuleActive)
      };
    }
    // If S1-AE capped, all games remain blocked - user must wait until next day
  }

  return result;
}

/**
 * Check if no-deadlock safety rule is currently active
 * Returns true when S1-AE was force-enabled due to all games being blocked
 */
export function isSafetyRuleActive(
  recovery: number,
  isCalibrated: boolean,
  gamesAvailability: Record<GameType, GameAvailability>,
  sharpness?: number
): boolean {
  // Safety rule active if:
  // - S1-AE is enabled BUT
  // - S1-AE would normally be blocked (sharpness < 40)
  // - OR all other games are blocked
  
  const s1AE = gamesAvailability["S1-AE"];
  const s1RA = gamesAvailability["S1-RA"];
  const s2CT = gamesAvailability["S2-CT"];
  const s2IN = gamesAvailability["S2-IN"];
  
  // Count enabled games excluding S1-AE
  const otherGamesEnabled = [s1RA, s2CT, s2IN].filter(g => g.enabled).length;
  
  // Safety rule is active if S1-AE is the only enabled game
  // and it would normally have been blocked (sharpness check failed)
  if (s1AE.enabled && otherGamesEnabled === 0 && sharpness !== undefined && sharpness < 40) {
    return true;
  }
  
  return false;
}

/**
 * Map gym area + thinking mode to GameType
 */
export function getGameTypeFromArea(gymArea: string, thinkingMode: string): GameType {
  const mode = thinkingMode?.toLowerCase() || "slow";
  const area = gymArea?.toLowerCase() || "reasoning";
  
  if (mode === "fast") {
    if (area === "focus") return "S1-AE";
    if (area === "creativity") return "S1-RA";
    return "S1-AE"; // default fast
  }
  
  // Slow mode
  if (area === "reasoning") return "S2-CT";
  if (area === "creativity" || area === "insight") return "S2-IN";
  return "S2-CT"; // default slow
}

/**
 * Get display name for game type
 */
export function getGameTypeDisplayName(gameType: GameType): string {
  switch (gameType) {
    case "S1-AE": return "Focus (Fast)";
    case "S1-RA": return "Creativity (Fast)";
    case "S2-CT": return "Reasoning (Slow)";
    case "S2-IN": return "Insight (Slow)";
  }
}

/**
 * Get default caps, optionally modified by training plan
 */
export function getDefaultCaps(planModifiers?: TrainingPlanModifiers): Omit<GamesCaps, "s1DailyUsed" | "s2DailyUsed" | "insightWeeklyUsed"> {
  return {
    s1DailyMax: DEFAULT_CAPS.s1DailyMax,
    s2DailyMax: DEFAULT_CAPS.s2DailyMax,
    insightWeeklyMax: planModifiers?.insightMaxPerWeek ?? DEFAULT_CAPS.insightWeeklyMax,
  };
}
