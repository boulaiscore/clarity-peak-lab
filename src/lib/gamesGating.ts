/**
 * ============================================
 * NEUROLOOP PRO – GAMES GATING SYSTEM v1.3
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
 * DAILY/WEEKLY CAPS:
 * - S1 total: ≤3/day
 * - S2 total: ≤1/day
 * - Insight (S2-IN): ≤3/week
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

// Default thresholds from Technical Manual v1.3 Section 10
const DEFAULT_THRESHOLDS = {
  "S1-AE": {
    // enabled IF (REC >= 45) AND (Sharpness <= 75)
    // Note: Sharpness <= 75 means "not already sharp enough" to trigger S1 use
    minREC: 45,
    maxSharpness: 75, // S1-AE is for when you need to BUILD sharpness
  },
  "S1-RA": {
    // enabled IF (REC >= 50) AND (Readiness >= 45)
    minREC: 50,
    minReadiness: 45,
  },
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
    case "S1-AE": {
      const config = DEFAULT_THRESHOLDS["S1-AE"];
      
      // Check REC >= 45
      if (recovery < config.minREC) {
        enabled = false;
        thresholds.push({ metric: "Recovery", current: recovery, required: config.minREC });
        unlockActions.push("Complete a detox session", "Take a walk");
      }
      
      // Check Sharpness <= 75 (S1-AE is for building sharpness, not when already sharp)
      if (sharpness > config.maxSharpness) {
        enabled = false;
        thresholds.push({ metric: "Sharpness", current: sharpness, required: config.maxSharpness });
        withheldReason = "Sharpness already high — S1-AE not needed";
      }
      
      // Check daily cap
      if (caps.s1DailyUsed >= caps.s1DailyMax) {
        enabled = false;
        withheldReason = `S1 daily limit reached (${caps.s1DailyUsed}/${caps.s1DailyMax})`;
      }
      break;
    }

    case "S1-RA": {
      const config = DEFAULT_THRESHOLDS["S1-RA"];
      
      // Check REC >= 50
      if (recovery < config.minREC) {
        enabled = false;
        thresholds.push({ metric: "Recovery", current: recovery, required: config.minREC });
        unlockActions.push("Complete a detox session", "Take a walk");
      }
      
      // Check Readiness >= 45
      if (readiness < config.minReadiness) {
        enabled = false;
        thresholds.push({ metric: "Readiness", current: readiness, required: config.minReadiness });
        unlockActions.push("Delay by 2-4 hours", "Short rest");
      }
      
      // Check daily cap
      if (caps.s1DailyUsed >= caps.s1DailyMax) {
        enabled = false;
        withheldReason = `S1 daily limit reached (${caps.s1DailyUsed}/${caps.s1DailyMax})`;
      }
      break;
    }

    case "S2-CT": {
      const config = DEFAULT_THRESHOLDS["S2-CT"];
      const minSharpness = config.minSharpness + s2Modifier;
      const minReadiness = config.minReadiness + s2Modifier;
      const minREC = Math.max(config.minREC, requireRecForS2);
      
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
      const config = DEFAULT_THRESHOLDS["S2-IN"];
      const insightMax = planModifiers?.insightMaxPerWeek ?? DEFAULT_CAPS.insightWeeklyMax;
      const minSharpness = config.minSharpness + s2Modifier;
      const minREC = Math.max(config.minREC, requireRecForS2);
      
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
    const missing = thresholds.map(t => `${t.metric}: ${t.current} < ${t.required}`).join(", ");
    withheldReason = `Insufficient metrics: ${missing}`;
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
 * Get all game availabilities at once
 */
export function getAllGamesAvailability(
  sharpness: number,
  readiness: number,
  recovery: number,
  caps: GamesCaps,
  planModifiers?: TrainingPlanModifiers
): Record<GameType, GameAvailability> {
  return {
    "S1-AE": checkGameAvailability("S1-AE", sharpness, readiness, recovery, caps, planModifiers),
    "S1-RA": checkGameAvailability("S1-RA", sharpness, readiness, recovery, caps, planModifiers),
    "S2-CT": checkGameAvailability("S2-CT", sharpness, readiness, recovery, caps, planModifiers),
    "S2-IN": checkGameAvailability("S2-IN", sharpness, readiness, recovery, caps, planModifiers),
  };
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
