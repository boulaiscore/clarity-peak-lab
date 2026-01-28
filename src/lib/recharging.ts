// Recharging Feature Configuration
// A session-based cognitive reset to restore reasoning clarity after cognitive overload.
// This is NOT physiological recovery - it's a short-term cognitive boost.
// Does NOT affect long-term baseline metrics, only temporarily modulates Sharpness.

export const RECHARGING_CONFIG = {
  duration: {
    min: 600, // 10 min in seconds
    max: 900, // 15 min in seconds
    default: 720, // 12 min in seconds
  },
  // Temporary boost to Sharpness (not persisted, session only)
  sharpnessBoostMax: 8, // Up to +8% temporary boost based on score
};

export type RechargingMode = 
  | "overloaded" 
  | "ruminating" 
  | "pre-decision" 
  | "end-of-day";

export const RECHARGING_MODES: Record<RechargingMode, {
  id: RechargingMode;
  label: string;
  description: string;
}> = {
  overloaded: {
    id: "overloaded",
    label: "Overloaded",
    description: "Too much input, difficulty focusing",
  },
  ruminating: {
    id: "ruminating",
    label: "Ruminating",
    description: "Stuck in repetitive thought loops",
  },
  "pre-decision": {
    id: "pre-decision",
    label: "Pre-decision",
    description: "Need clarity before an important choice",
  },
  "end-of-day": {
    id: "end-of-day",
    label: "End of day",
    description: "Processing the day's cognitive load",
  },
};

export interface RechargingCheckValues {
  mentalNoise: number; // 0-100
  cognitiveFatigue: number; // 0-100
  readinessToClear: number; // 0-100
}

export type RechargingScoreLevel = "low" | "moderate" | "strong";

export interface RechargingResult {
  preCheck: RechargingCheckValues;
  postCheck: RechargingCheckValues;
  mode: RechargingMode;
  durationSeconds: number;
  score: number; // 0-100
  level: RechargingScoreLevel;
  deltas: {
    mentalNoise: number;
    cognitiveFatigue: number;
    readinessToClear: number;
  };
}

/**
 * Calculate Recharging Score based on pre/post check values
 * Higher score = better recovery of reasoning clarity
 */
export function calculateRechargingScore(
  preCheck: RechargingCheckValues,
  postCheck: RechargingCheckValues
): { score: number; level: RechargingScoreLevel; deltas: RechargingResult["deltas"] } {
  // Calculate deltas (positive = improvement)
  const mentalNoiseDelta = preCheck.mentalNoise - postCheck.mentalNoise;
  const cognitiveFatigueDelta = preCheck.cognitiveFatigue - postCheck.cognitiveFatigue;
  const readinessToClearDelta = postCheck.readinessToClear - preCheck.readinessToClear;
  
  // Weighted score calculation
  // Mental noise reduction: 35%
  // Cognitive fatigue reduction: 35%
  // Readiness improvement: 30%
  const normalizedNoiseReduction = Math.max(0, mentalNoiseDelta) / 100;
  const normalizedFatigueReduction = Math.max(0, cognitiveFatigueDelta) / 100;
  const normalizedReadinessGain = Math.max(0, readinessToClearDelta) / 100;
  
  const rawScore = (
    normalizedNoiseReduction * 0.35 +
    normalizedFatigueReduction * 0.35 +
    normalizedReadinessGain * 0.30
  ) * 100;
  
  // Also factor in absolute post-session readiness (bonus for ending in a good state)
  const readinessBonus = (postCheck.readinessToClear / 100) * 15;
  
  const finalScore = Math.min(100, Math.round(rawScore + readinessBonus));
  
  // Determine level
  let level: RechargingScoreLevel;
  if (finalScore >= 60) {
    level = "strong";
  } else if (finalScore >= 35) {
    level = "moderate";
  } else {
    level = "low";
  }
  
  return {
    score: finalScore,
    level,
    deltas: {
      mentalNoise: mentalNoiseDelta,
      cognitiveFatigue: cognitiveFatigueDelta,
      readinessToClear: readinessToClearDelta,
    },
  };
}

/**
 * Suggest a recharging mode based on pre-check values
 */
export function suggestRechargingMode(preCheck: RechargingCheckValues): RechargingMode {
  const { mentalNoise, cognitiveFatigue, readinessToClear } = preCheck;
  
  // High mental noise + low readiness = overloaded
  if (mentalNoise >= 70 && readinessToClear <= 40) {
    return "overloaded";
  }
  
  // High fatigue + moderate noise = end of day
  if (cognitiveFatigue >= 65 && mentalNoise >= 50) {
    return "end-of-day";
  }
  
  // Moderate levels with high readiness desire = pre-decision
  if (readinessToClear <= 50 && mentalNoise >= 40 && mentalNoise <= 70) {
    return "pre-decision";
  }
  
  // Default to ruminating for other patterns
  return "ruminating";
}

/**
 * Get the score level label for display
 */
export function getRechargingLevelLabel(level: RechargingScoreLevel): string {
  switch (level) {
    case "strong":
      return "Strong Recharging";
    case "moderate":
      return "Moderate Recharging";
    case "low":
      return "Low Recharging";
  }
}

/**
 * Get color class for score level
 */
export function getRechargingLevelColor(level: RechargingScoreLevel): string {
  switch (level) {
    case "strong":
      return "text-emerald-400";
    case "moderate":
      return "text-amber-400";
    case "low":
      return "text-muted-foreground";
  }
}
