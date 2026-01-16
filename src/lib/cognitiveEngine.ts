/**
 * ============================================
 * NEUROLOOP PRO – COGNITIVE ENGINE v1.3
 * ============================================
 * 
 * Technical Manual v1.3 Aligned
 * 
 * COGNITIVE STATES (BASE VARIABLES):
 * - AE = Attentional Efficiency (0-100) – mapped from focus_stability
 * - RA = Rapid Association (0-100) – mapped from fast_thinking
 * - CT = Critical Thinking (0-100) – mapped from reasoning_accuracy
 * - IN = Insight (0-100) – mapped from slow_thinking
 * 
 * DERIVED SYSTEM SCORES:
 * - S1 = (AE + RA) / 2  (Intuition/Fast)
 * - S2 = (CT + IN) / 2  (Reasoning/Slow)
 * 
 * SCI FORMULA (v1.3):
 * - CP = clamp(0, 100, PerformanceAvg)
 * - PerformanceAvg = (AE + RA + CT + IN + S2) / 5
 * - BE = min(100, (weekly_games_xp / xp_target_week) × 100)
 * - SCI = 0.50×CP + 0.30×BE + 0.20×REC
 * 
 * NOTE: Tasks do NOT give XP. They are cognitive inputs, not training rewards.
 */

// ============================================
// TYPES
// ============================================

export interface CognitiveStates {
  AE: number; // Attentional Efficiency (0-100)
  RA: number; // Rapid Association (0-100)
  CT: number; // Critical Thinking (0-100)
  IN: number; // Insight (0-100)
}

export interface DerivedSystemScores {
  S1: number; // (AE + RA) / 2
  S2: number; // (CT + IN) / 2
}

export interface RecoveryInput {
  weeklyDetoxMinutes: number;
  weeklyWalkMinutes: number;
  detoxTarget?: number; // Default: 60
}

export interface ReadinessPhysioData {
  hrvMs: number | null;
  restingHr: number | null;
  sleepDurationMin: number | null;
  sleepEfficiency: number | null;
}

export interface TodayMetrics {
  sharpness: number;
  readiness: number;
  recovery: number;
}

/**
 * BehavioralEngagement v1.3
 * - Tasks removed (they don't contribute to XP)
 * - Only games XP matters for behavioral engagement
 */
export interface BehavioralEngagement {
  weeklyGamesXP: number;
  xpTargetWeek: number; // From training plan
}

export interface SCIResult {
  total: number;
  cognitivePerformance: number;
  behavioralEngagement: number;
  recoveryFactor: number;
  dualProcessBalance: number;
}

export interface CognitiveAgeResult {
  cognitiveAge: number;
  delta: number; // Difference from baseline
  performanceAvg: number;
  baselinePerformanceAvg: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================
// SYSTEM SCORES
// ============================================

export function calculateSystemScores(states: CognitiveStates): DerivedSystemScores {
  return {
    S1: (states.AE + states.RA) / 2,
    S2: (states.CT + states.IN) / 2,
  };
}

// ============================================
// RECOVERY (REC)
// Formula: min(100, (weekly_detox_minutes + 0.5 × weekly_walk_minutes) / detox_target × 100)
// ============================================

export function calculateRecovery(input: RecoveryInput): number {
  const { weeklyDetoxMinutes, weeklyWalkMinutes, detoxTarget = 60 } = input;
  
  if (detoxTarget <= 0) return 0;
  
  const recInput = weeklyDetoxMinutes + 0.5 * weeklyWalkMinutes;
  const rec = Math.min(100, (recInput / detoxTarget) * 100);
  
  return Math.round(rec * 10) / 10; // 1 decimal precision
}

// ============================================
// SHARPNESS (PRIMARY TODAY METRIC)
// Formula:
//   Sharpness_base = 0.50 × S1 + 0.30 × AE + 0.20 × S2
//   Sharpness = Sharpness_base × (0.75 + 0.25 × REC / 100)
// ============================================

export function calculateSharpness(states: CognitiveStates, recovery: number): number {
  const { S1, S2 } = calculateSystemScores(states);
  
  const base = 0.50 * S1 + 0.30 * states.AE + 0.20 * S2;
  const modulated = base * (0.75 + 0.25 * recovery / 100);
  
  return clamp(Math.round(modulated * 10) / 10, 0, 100);
}

// ============================================
// READINESS (SUPPORT TODAY METRIC)
// Without wearable:
//   Readiness = 0.35 × REC + 0.35 × S2 + 0.30 × AE
// With wearable:
//   CognitiveComponent = 0.30 × CT + 0.25 × AE + 0.20 × IN + 0.15 × S2 + 0.10 × S1
//   Readiness = 0.5 × PhysioComponent + 0.5 × CognitiveComponent
// ============================================

export function calculateReadiness(
  states: CognitiveStates,
  recovery: number,
  physioComponent: number | null
): number {
  const { S1, S2 } = calculateSystemScores(states);
  
  if (physioComponent === null) {
    // Without wearable
    const readiness = 0.35 * recovery + 0.35 * S2 + 0.30 * states.AE;
    return clamp(Math.round(readiness * 10) / 10, 0, 100);
  }
  
  // With wearable
  const cognitiveComponent = 
    0.30 * states.CT +
    0.25 * states.AE +
    0.20 * states.IN +
    0.15 * S2 +
    0.10 * S1;
  
  const readiness = 0.5 * physioComponent + 0.5 * cognitiveComponent;
  return clamp(Math.round(readiness * 10) / 10, 0, 100);
}

// ============================================
// PHYSIO COMPONENT (from wearables)
// HRV 40%, resting HR 20%, sleep 40%
// ============================================

export function calculatePhysioComponent(data: ReadinessPhysioData | null): number | null {
  if (!data) return null;
  
  const { hrvMs, restingHr, sleepDurationMin, sleepEfficiency } = data;
  
  if (hrvMs == null || restingHr == null || sleepDurationMin == null || sleepEfficiency == null) {
    return null;
  }
  
  // Normalize HRV (20-120 ms → 0-100)
  const hrvMin = 20, hrvMax = 120;
  const hrvClipped = Math.max(hrvMin, Math.min(hrvMax, hrvMs));
  const hrvScore = ((hrvClipped - hrvMin) / (hrvMax - hrvMin)) * 100;
  
  // Normalize resting HR (45-90 bpm → lower is better)
  const rhrMin = 45, rhrMax = 90;
  const rhrClipped = Math.max(rhrMin, Math.min(rhrMax, restingHr));
  const rhrScore = (1 - (rhrClipped - rhrMin) / (rhrMax - rhrMin)) * 100;
  
  // Sleep score (duration + efficiency)
  const durMin = 300, durMax = 540; // 5h-9h
  const durClipped = Math.max(durMin, Math.min(durMax, sleepDurationMin));
  const durScore = ((durClipped - durMin) / (durMax - durMin)) * 100;
  
  const eff = sleepEfficiency > 1 ? sleepEfficiency / 100 : sleepEfficiency;
  const effClipped = Math.max(0.7, Math.min(0.98, eff));
  const effScore = ((effClipped - 0.7) / 0.28) * 100;
  
  const sleepScore = 0.6 * durScore + 0.4 * effScore;
  
  // Final: HRV 40%, resting HR 20%, sleep 40%
  return 0.4 * hrvScore + 0.2 * rhrScore + 0.4 * sleepScore;
}

// ============================================
// DUAL-PROCESS INTEGRATION
// Formula: DualProcess = 100 − |S1 − S2|
// ============================================

export function calculateDualProcessBalance(S1: number, S2: number): number {
  return 100 - Math.abs(S1 - S2);
}

export function getDualProcessLevel(score: number): "elite" | "good" | "unbalanced" {
  if (score >= 85) return "elite";
  if (score >= 70) return "good";
  return "unbalanced";
}

// ============================================
// COGNITIVE NETWORK (SCI) - v1.3 Formula
// 
// CP = clamp(0, 100, PerformanceAvg)
// PerformanceAvg = (AE + RA + CT + IN + S2) / 5
// BE = min(100, (weekly_games_xp / xp_target_week) × 100)
// SCI = 0.50×CP + 0.30×BE + 0.20×REC
// 
// NOTE: Tasks removed from BE calculation
// ============================================

export function calculateSCI(
  states: CognitiveStates,
  behavioral: BehavioralEngagement,
  recovery: number
): SCIResult {
  const { S1, S2 } = calculateSystemScores(states);
  
  // Dual Process Balance
  const dualProcessBalance = calculateDualProcessBalance(S1, S2);
  
  // Cognitive Performance (CP) = PerformanceAvg
  // PerformanceAvg = (AE + RA + CT + IN + S2) / 5
  const performanceAvg = (states.AE + states.RA + states.CT + states.IN + S2) / 5;
  const CP = clamp(performanceAvg, 0, 100);
  
  // Behavioral Engagement (BE) = based on games XP only
  // BE = min(100, (weekly_games_xp / xp_target_week) × 100)
  const BE = behavioral.xpTargetWeek > 0 
    ? Math.min(100, (behavioral.weeklyGamesXP / behavioral.xpTargetWeek) * 100)
    : 0;
  
  // SCI = 0.50×CP + 0.30×BE + 0.20×REC
  const total = 0.50 * CP + 0.30 * BE + 0.20 * recovery;
  
  return {
    total: clamp(Math.round(total * 10) / 10, 0, 100),
    cognitivePerformance: clamp(Math.round(CP * 10) / 10, 0, 100),
    behavioralEngagement: clamp(Math.round(BE * 10) / 10, 0, 100),
    recoveryFactor: clamp(Math.round(recovery * 10) / 10, 0, 100),
    dualProcessBalance: clamp(Math.round(dualProcessBalance * 10) / 10, 0, 100),
  };
}

export function getSCILevel(score: number): "elite" | "high" | "moderate" | "developing" | "early" {
  if (score >= 85) return "elite";
  if (score >= 70) return "high";
  if (score >= 55) return "moderate";
  if (score >= 40) return "developing";
  return "early";
}

export function getSCIStatusText(score: number): string {
  const level = getSCILevel(score);
  switch (level) {
    case "elite": return "Elite cognitive integration";
    case "high": return "High cognitive performance";
    case "moderate": return "Moderate cognitive development";
    case "developing": return "Developing cognitive foundation";
    case "early": return "Early cognitive baseline";
  }
}

// ============================================
// COGNITIVE AGE
// Formula:
//   PerformanceAvg = (AE + RA + CT + IN + S2) / 5
//   Improvement = PerformanceAvg − BaselinePerformanceAvg
//   CognitiveAge = BaselineCognitiveAge − (Improvement / 10)
// Cap: ±15 years from baseline
// ============================================

export interface CognitiveAgeBaseline {
  baselineCognitiveAge: number;
  baselineAE: number;
  baselineRA: number;
  baselineCT: number;
  baselineIN: number;
}

export function calculateCognitiveAge(
  states: CognitiveStates,
  baseline: CognitiveAgeBaseline
): CognitiveAgeResult {
  const { S2 } = calculateSystemScores(states);
  
  // Current performance average
  const performanceAvg = (states.AE + states.RA + states.CT + states.IN + S2) / 5;
  
  // Baseline performance average
  const baselineS2 = (baseline.baselineCT + baseline.baselineIN) / 2;
  const baselinePerformanceAvg = (
    baseline.baselineAE + 
    baseline.baselineRA + 
    baseline.baselineCT + 
    baseline.baselineIN + 
    baselineS2
  ) / 5;
  
  // Improvement
  const improvement = performanceAvg - baselinePerformanceAvg;
  
  // Cognitive Age with cap
  const rawCognitiveAge = baseline.baselineCognitiveAge - (improvement / 10);
  const cognitiveAge = clamp(
    rawCognitiveAge,
    baseline.baselineCognitiveAge - 15,
    baseline.baselineCognitiveAge + 15
  );
  
  return {
    cognitiveAge: Math.round(cognitiveAge * 10) / 10,
    delta: Math.round((baseline.baselineCognitiveAge - cognitiveAge) * 10) / 10,
    performanceAvg: Math.round(performanceAvg * 10) / 10,
    baselinePerformanceAvg: Math.round(baselinePerformanceAvg * 10) / 10,
  };
}

// ============================================
// DATABASE COLUMN MAPPING
// ============================================

export interface DatabaseMetrics {
  focus_stability?: number | null;
  fast_thinking?: number | null;
  reasoning_accuracy?: number | null;
  slow_thinking?: number | null;
  // Baseline values
  baseline_focus?: number | null;
  baseline_fast_thinking?: number | null;
  baseline_reasoning?: number | null;
  baseline_slow_thinking?: number | null;
  baseline_cognitive_age?: number | null;
}

export function mapDatabaseToCognitiveStates(metrics: DatabaseMetrics | null): CognitiveStates {
  if (!metrics) {
    return { AE: 50, RA: 50, CT: 50, IN: 50 };
  }
  
  return {
    AE: metrics.focus_stability ?? 50,    // Attentional Efficiency
    RA: metrics.fast_thinking ?? 50,      // Rapid Association
    CT: metrics.reasoning_accuracy ?? 50, // Critical Thinking
    IN: metrics.slow_thinking ?? 50,      // Insight
  };
}

export function mapDatabaseToBaseline(metrics: DatabaseMetrics | null, chronologicalAge: number = 35): CognitiveAgeBaseline {
  if (!metrics) {
    return {
      baselineCognitiveAge: chronologicalAge,
      baselineAE: 50,
      baselineRA: 50,
      baselineCT: 50,
      baselineIN: 50,
    };
  }
  
  return {
    baselineCognitiveAge: metrics.baseline_cognitive_age ?? chronologicalAge,
    baselineAE: metrics.baseline_focus ?? 50,
    baselineRA: metrics.baseline_fast_thinking ?? 50,
    baselineCT: metrics.baseline_reasoning ?? 50,
    baselineIN: metrics.baseline_slow_thinking ?? 50,
  };
}

// ============================================
// XP ROUTING HELPERS
// Each exercise routes XP to ONE AND ONLY ONE skill
// ============================================

export type SkillTarget = "AE" | "RA" | "CT" | "IN";
export type ThinkingSystem = "S1" | "S2";

export interface XPRouting {
  system: ThinkingSystem;
  skill: SkillTarget;
}

export function getXPRouting(gymArea: string, thinkingMode: string): XPRouting {
  // Default to S2/CT if unknown
  const mode = thinkingMode?.toLowerCase() || "slow";
  const area = gymArea?.toLowerCase() || "reasoning";
  
  if (mode === "fast") {
    // System 1
    if (area === "focus") {
      return { system: "S1", skill: "AE" };
    }
    if (area === "creativity") {
      return { system: "S1", skill: "RA" };
    }
    // Default fast to AE
    return { system: "S1", skill: "AE" };
  }
  
  // System 2 (slow)
  if (area === "reasoning") {
    return { system: "S2", skill: "CT" };
  }
  if (area === "creativity" || area === "insight") {
    return { system: "S2", skill: "IN" };
  }
  // Default slow to CT
  return { system: "S2", skill: "CT" };
}

// XP → State update formula: Δstate = XP × 0.5
export function calculateStateUpdate(currentValue: number, earnedXP: number): number {
  const delta = earnedXP * 0.5;
  return clamp(currentValue + delta, 0, 100);
}
