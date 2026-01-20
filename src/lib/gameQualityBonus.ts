/**
 * ============================================
 * GAME QUALITY BONUS SYSTEM
 * ============================================
 * 
 * Category-specific quality calculations and XP bonuses.
 * Base XP values remain unchanged; bonuses reward quality execution.
 */

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

export interface S1AEMetrics {
  hitRate: number;              // 0-1
  falseAlarmRate: number;       // 0-1
  rtVariability: number;        // ms, lower is better
  degradationSlope: number;     // negative = degradation
}

export interface S1RAMetrics {
  hitRate: number;              // 0-1
  medianReactionTime: number;   // ms
  remoteAssociationRate?: number; // 0-1, for remote/far-link accuracy
  rtStdDev: number;             // ms, lower is more consistent
}

export interface S2INMetrics {
  counterexampleEfficiency?: number;  // 0-100
  ruleBreakLatency?: number;          // ms, lower is faster
  stressTestQuality?: number;         // 0-100
}

export interface QualityBonusResult {
  baseXP: number;
  bonus: number;
  totalXP: number;
  qualityScore: number;
  qualityLine?: string;  // Neutral line for end screen
}

export type GameCategory = "S1-AE" | "S1-RA" | "S2-CT" | "S2-IN";

// ────────────────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────────────────

const XP_CAPS = {
  "S1-AE": 1.4,   // Hard cap: baseXP × 1.4
  "S1-RA": 1.25,  // Hard cap: baseXP × 1.25
  "S2-CT": 1.0,   // No bonus
  "S2-IN": 1.15,  // Hard cap: baseXP × 1.15
};

// Reference reaction time for S1-RA (per difficulty)
const RT_REFERENCE = {
  easy: 2500,
  medium: 2000,
  hard: 1500,
};

// ────────────────────────────────────────────────────────────
// S1-AE: ATTENTIONAL EFFICIENCY
// ────────────────────────────────────────────────────────────

/**
 * Calculate S1-AE quality score (0-100).
 * 
 * Formula:
 * aeQualityScore = 
 *   0.35 × hitRate × 100 +
 *   0.25 × (1 - falseAlarmRate) × 100 +
 *   0.20 × clamp((RT_ref - rtVariability) / RT_ref, 0, 1) × 100 +
 *   0.20 × clamp(-degradationSlope × 10, 0, 1) × 100
 */
export function calculateS1AEQualityScore(metrics: S1AEMetrics): number {
  const RT_REF = 150; // Reference RT variability (ms)
  
  const hitComponent = metrics.hitRate * 100;
  const faComponent = (1 - metrics.falseAlarmRate) * 100;
  
  const rtComponent = Math.max(0, Math.min(1, (RT_REF - metrics.rtVariability) / RT_REF)) * 100;
  
  // Degradation slope: negative means degradation, positive means improvement
  // We reward stability (slope near 0) or improvement (positive slope)
  const degradationComponent = Math.max(0, Math.min(1, 1 + metrics.degradationSlope * 10)) * 100;

  const score = (
    0.35 * hitComponent +
    0.25 * faComponent +
    0.20 * rtComponent +
    0.20 * degradationComponent
  );

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Get S1-AE quality bonus.
 * - aeQualityScore ≥ 70 → +3 XP
 * - aeQualityScore ≥ 80 → +5 XP
 * - aeQualityScore ≥ 90 → +7 XP
 */
export function getS1AEQualityBonus(score: number, baseXP: number): QualityBonusResult {
  let bonus = 0;
  let qualityLine: string | undefined;

  if (score >= 90) {
    bonus = 7;
    qualityLine = "High attentional stability detected.";
  } else if (score >= 80) {
    bonus = 5;
    qualityLine = "High attentional stability detected.";
  } else if (score >= 70) {
    bonus = 3;
  }

  // Apply hard cap
  const maxXP = Math.floor(baseXP * XP_CAPS["S1-AE"]);
  const totalXP = Math.min(baseXP + bonus, maxXP);
  const actualBonus = totalXP - baseXP;

  return {
    baseXP,
    bonus: actualBonus,
    totalXP,
    qualityScore: score,
    qualityLine: actualBonus > 0 ? qualityLine : undefined,
  };
}

// ────────────────────────────────────────────────────────────
// S1-RA: RAPID ASSOCIATION
// ────────────────────────────────────────────────────────────

/**
 * Calculate S1-RA quality score (0-100).
 * 
 * Formula:
 * raQualityScore =
 *   0.40 × hitRate × 100 +
 *   0.25 × clamp((RT_ref − medianRT) / RT_ref, 0, 1) × 100 +
 *   0.20 × remoteAssociationRate × 100 +
 *   0.15 × consistencyScore
 */
export function calculateS1RAQualityScore(
  metrics: S1RAMetrics,
  difficulty: "easy" | "medium" | "hard" = "medium"
): number {
  const rtRef = RT_REFERENCE[difficulty];
  
  const hitComponent = metrics.hitRate * 100;
  
  const speedComponent = Math.max(0, Math.min(1, (rtRef - metrics.medianReactionTime) / rtRef)) * 100;
  
  const remoteComponent = (metrics.remoteAssociationRate ?? 0) * 100;
  
  // Consistency: lower RT std dev is better. Reference: 500ms std dev = 0% consistency
  const consistencyScore = Math.max(0, Math.min(1, 1 - (metrics.rtStdDev / 500))) * 100;

  const score = (
    0.40 * hitComponent +
    0.25 * speedComponent +
    0.20 * remoteComponent +
    0.15 * consistencyScore
  );

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Get S1-RA quality bonus.
 * - raQualityScore ≥ 80 → +3 XP
 * - raQualityScore ≥ 90 → +5 XP
 */
export function getS1RAQualityBonus(score: number, baseXP: number): QualityBonusResult {
  let bonus = 0;
  let qualityLine: string | undefined;

  if (score >= 90) {
    bonus = 5;
    qualityLine = "Fast and accurate associations.";
  } else if (score >= 80) {
    bonus = 3;
    qualityLine = "Fast and accurate associations.";
  }

  // Apply hard cap
  const maxXP = Math.floor(baseXP * XP_CAPS["S1-RA"]);
  const totalXP = Math.min(baseXP + bonus, maxXP);
  const actualBonus = totalXP - baseXP;

  return {
    baseXP,
    bonus: actualBonus,
    totalXP,
    qualityScore: score,
    qualityLine: actualBonus > 0 ? qualityLine : undefined,
  };
}

// ────────────────────────────────────────────────────────────
// S2-CT: CRITICAL THINKING (NO BONUS)
// ────────────────────────────────────────────────────────────

/**
 * S2-CT has NO XP bonus.
 * Quality is already slow, effortful, and capped by time.
 * XP inflation here would bias plan optimization.
 */
export function getS2CTQualityBonus(baseXP: number): QualityBonusResult {
  return {
    baseXP,
    bonus: 0,
    totalXP: baseXP,
    qualityScore: 0,
    qualityLine: undefined,
  };
}

// ────────────────────────────────────────────────────────────
// S2-IN: INSIGHT (MICRO-BONUS, RARE)
// ────────────────────────────────────────────────────────────

/**
 * Calculate S2-IN quality score (0-100).
 * Based on counterexample efficiency, rule-break latency, stress-test quality.
 */
export function calculateS2INQualityScore(metrics: S2INMetrics): number {
  const parts: number[] = [];
  const weights: number[] = [];

  if (metrics.counterexampleEfficiency !== undefined) {
    parts.push(metrics.counterexampleEfficiency);
    weights.push(0.4);
  }

  if (metrics.stressTestQuality !== undefined) {
    parts.push(metrics.stressTestQuality);
    weights.push(0.35);
  }

  if (metrics.ruleBreakLatency !== undefined) {
    // Lower latency is better. Reference: 30000ms = 0%, 5000ms = 100%
    const latencyScore = Math.max(0, Math.min(1, (30000 - metrics.ruleBreakLatency) / 25000)) * 100;
    parts.push(latencyScore);
    weights.push(0.25);
  }

  if (parts.length === 0) return 0;

  // Normalize weights
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let score = 0;
  for (let i = 0; i < parts.length; i++) {
    score += parts[i] * (weights[i] / totalWeight);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Get S2-IN quality bonus (rare).
 * - insightQualityScore ≥ 90 → +3 XP
 * Otherwise → no bonus
 */
export function getS2INQualityBonus(score: number, baseXP: number): QualityBonusResult {
  let bonus = 0;
  let qualityLine: string | undefined;

  if (score >= 90) {
    bonus = 3;
    qualityLine = "High-quality insight detected.";
  }

  // Apply hard cap
  const maxXP = Math.floor(baseXP * XP_CAPS["S2-IN"]);
  const totalXP = Math.min(baseXP + bonus, maxXP);
  const actualBonus = totalXP - baseXP;

  return {
    baseXP,
    bonus: actualBonus,
    totalXP,
    qualityScore: score,
    qualityLine: actualBonus > 0 ? qualityLine : undefined,
  };
}

// ────────────────────────────────────────────────────────────
// UNIFIED INTERFACE
// ────────────────────────────────────────────────────────────

/**
 * Calculate quality bonus for any game category.
 */
export function calculateQualityBonus(
  category: GameCategory,
  baseXP: number,
  metrics: S1AEMetrics | S1RAMetrics | S2INMetrics | null,
  difficulty: "easy" | "medium" | "hard" = "medium"
): QualityBonusResult {
  if (!metrics) {
    return {
      baseXP,
      bonus: 0,
      totalXP: baseXP,
      qualityScore: 0,
      qualityLine: undefined,
    };
  }

  switch (category) {
    case "S1-AE": {
      const score = calculateS1AEQualityScore(metrics as S1AEMetrics);
      return getS1AEQualityBonus(score, baseXP);
    }
    case "S1-RA": {
      const score = calculateS1RAQualityScore(metrics as S1RAMetrics, difficulty);
      return getS1RAQualityBonus(score, baseXP);
    }
    case "S2-CT": {
      return getS2CTQualityBonus(baseXP);
    }
    case "S2-IN": {
      const score = calculateS2INQualityScore(metrics as S2INMetrics);
      return getS2INQualityBonus(score, baseXP);
    }
    default:
      return {
        baseXP,
        bonus: 0,
        totalXP: baseXP,
        qualityScore: 0,
        qualityLine: undefined,
      };
  }
}

/**
 * Determine game category from game type string.
 */
export function getGameCategory(gameType: string): GameCategory | null {
  if (gameType === "S1-AE") return "S1-AE";
  if (gameType === "S1-RA") return "S1-RA";
  if (gameType === "S2-CT") return "S2-CT";
  if (gameType === "S2-IN") return "S2-IN";
  return null;
}
