/**
 * ============================================
 * NLOOP PRO – COGNITIVE ENGINE v1.3
 * ============================================
 * 
 * Technical Manual v1.3 Aligned
 * 
 * ⚠️ CRITICAL METRIC INTEGRITY RULES ⚠️
 * 
 * 1. BASELINE DRILLS:
 *    - Used ONLY to initialize skill values (AE0, RA0, CT0, IN0)
 *    - MUST NOT affect daily metrics (Sharpness, Readiness, Recovery)
 *    - Do NOT award XP
 * 
 * 2. GAMES (TRAINING):
 *    - Award XP according to difficulty
 *    - Route XP to ONE skill only: Δskill = XP × 0.5
 *    - Raw performance (accuracy, reaction time) is for feedback ONLY
 *    - Performance MUST NOT directly affect Sharpness/Readiness/SCI/CognitiveAge
 * 
 * 3. METRICS (SINGLE SOURCE OF TRUTH):
 *    - Capacity metrics use persistent skill values: AE, RA, CT, IN
 *    - Derived aggregates: S1, S2
 *    - Daily state may modulate Sharpness/Readiness by measured coverage
 *    - Recovery comes from Recovery v2 and passive Health/wearable targets
 *    - NEVER read from per-session data (game scores, baseline sessions)
 * 
 * 4. DAILY COMPUTATION ORDER (MANDATORY):
 *    1. Load persistent skills: AE, RA, CT, IN
 *    2. Compute aggregates: S1 = (AE+RA)/2, S2 = (CT+IN)/2
 *    3. Compute Recovery and passive Daily State
 *    4. Compute states: Sharpness, Readiness
 *    5. Compute dashboard metrics: Cognitive Age, SCI, Dual-Process
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
 * - PerformanceAvg = (AE + RA + CT + IN) / 4
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

export interface ReadinessPhysioData {
  hrvMs: number | null;
  restingHr: number | null;
  sleepDurationMin: number | null;
  sleepEfficiency: number | null;
}

export interface PhysioEstimate {
  /** Renormalized score across the wearable signals available today. */
  rawScore: number;
  /** Score conservatively blended toward 50 according to confidence. */
  score: number;
  /** Share of the canonical wearable signal weights available (0-1). */
  confidence: number;
}

export interface DailyStateMetricContext {
  score: number;
  coverage: number;
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
// SHARPNESS (PRIMARY TODAY METRIC)
// Formula:
//   S1 = (AE + RA) / 2
//   S2 = (CT + IN) / 2
//   Capacity = 0.6 × S1 + 0.4 × S2
//   AppSharpness = Capacity × (0.75 + 0.25 × REC / 100)
//   ContextSharpness = Capacity × (0.70 + 0.30 × DailyState / 100)
//   Sharpness = (1 − coverage) × AppSharpness + coverage × ContextSharpness
// ============================================

export function calculateSharpness(
  states: CognitiveStates,
  recovery: number,
  dailyState?: DailyStateMetricContext | null,
): number {
  const { S1, S2 } = calculateSystemScores(states);
  const base = 0.6 * S1 + 0.4 * S2;
  const recoveryModifier = calculateSharpnessRecoveryModifier(recovery);
  const coverage = clamp(dailyState?.coverage ?? 0, 0, 1);
  const dailyModifier = dailyState
    ? calculateSharpnessDailyModifier(dailyState.score)
    : recoveryModifier;
  const blendedModifier = (1 - coverage) * recoveryModifier + coverage * dailyModifier;
  const modulated = base * blendedModifier;
  
  return clamp(Math.round(modulated * 10) / 10, 0, 100);
}

/** Canonical Recovery multiplier used by Sharpness and its UI explanations. */
export function calculateSharpnessRecoveryModifier(recovery: number): number {
  const normalizedRecovery = clamp(recovery, 0, 100) / 100;
  return 0.75 + 0.25 * normalizedRecovery;
}

/** Daily passive-state multiplier used as signal coverage grows. */
export function calculateSharpnessDailyModifier(dailyState: number): number {
  return 0.70 + 0.30 * (clamp(dailyState, 0, 100) / 100);
}

// ============================================
// READINESS (SUPPORT TODAY METRIC)
// Without passive context:
//   Readiness = 0.35 × REC + 0.35 × S2 + 0.30 × AE
// With passive context:
//   CognitiveComponent = 0.30 × CT + 0.25 × AE + 0.20 × IN + 0.15 × S2 + 0.10 × S1
//   ContextTarget = 0.60 × DailyState + 0.40 × CognitiveComponent
//   Readiness = (1 − coverage) × AppReadiness + coverage × ContextTarget
// ============================================

export function calculateReadiness(
  states: CognitiveStates,
  recovery: number,
  dailyState?: DailyStateMetricContext | null,
): number {
  const { S2 } = calculateSystemScores(states);
  const appReadiness = 0.35 * recovery + 0.35 * S2 + 0.30 * states.AE;
  const coverage = clamp(dailyState?.coverage ?? 0, 0, 1);
  if (!dailyState || coverage === 0) {
    return clamp(Math.round(appReadiness * 10) / 10, 0, 100);
  }

  const cognitiveComponent = calculateReadinessCognitiveComponent(states);
  const contextTarget =
    0.60 * clamp(dailyState.score, 0, 100) + 0.40 * cognitiveComponent;
  const readiness = (1 - coverage) * appReadiness + coverage * contextTarget;
  return clamp(Math.round(readiness * 10) / 10, 0, 100);
}

/** Canonical cognitive component of context-aware Readiness. */
export function calculateReadinessCognitiveComponent(states: CognitiveStates): number {
  const { S1, S2 } = calculateSystemScores(states);
  return clamp(
    0.30 * states.CT +
      0.25 * states.AE +
      0.20 * states.IN +
      0.15 * S2 +
      0.10 * S1,
    0,
    100,
  );
}

// ============================================
// PHYSIO COMPONENT (from wearables)
// HRV 40%, resting HR 20%, sleep duration 24%, sleep efficiency 16%
// ============================================

export function calculatePhysioComponent(data: ReadinessPhysioData | null): number | null {
  return calculatePhysioEstimate(data)?.score ?? null;
}

/**
 * Partial wearable estimator. Available signals are renormalized, while the
 * public score is shrunk toward 50 in proportion to missing-signal weight.
 */
export function calculatePhysioEstimate(
  data: ReadinessPhysioData | null,
  options: { includeSleepDuration?: boolean } = {},
): PhysioEstimate | null {
  if (!data) return null;
  const { hrvMs, restingHr, sleepDurationMin, sleepEfficiency } = data;
  const includeSleepDuration = options.includeSleepDuration ?? true;

  const signals: Array<{ value: number | null; weight: number }> = [
    {
      value: hrvMs == null
        ? null
        : ((clamp(hrvMs, 20, 120) - 20) / 100) * 100,
      weight: 0.40,
    },
    {
      value: restingHr == null
        ? null
        : (1 - (clamp(restingHr, 45, 90) - 45) / 45) * 100,
      weight: 0.20,
    },
    {
      value: !includeSleepDuration || sleepDurationMin == null
        ? null
        : ((clamp(sleepDurationMin, 300, 540) - 300) / 240) * 100,
      weight: 0.24,
    },
    {
      value: sleepEfficiency == null
        ? null
        : ((clamp(sleepEfficiency > 1 ? sleepEfficiency / 100 : sleepEfficiency, 0.70, 0.98) - 0.70) / 0.28) * 100,
      weight: 0.16,
    },
  ];
  const available = signals.filter(
    (signal): signal is { value: number; weight: number } => signal.value !== null,
  );
  const confidence = available.reduce((sum, signal) => sum + signal.weight, 0);
  if (confidence <= 0) return null;

  const rawScore = available.reduce(
    (sum, signal) => sum + signal.value * signal.weight,
    0,
  ) / confidence;
  const score = 50 * (1 - confidence) + rawScore * confidence;

  return {
    rawScore: Math.round(clamp(rawScore, 0, 100) * 10) / 10,
    score: Math.round(clamp(score, 0, 100) * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
  };
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
// PerformanceAvg = (AE + RA + CT + IN) / 4
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
  
  // Cognitive Performance uses each canonical skill exactly once. S2 remains
  // a presentation aggregate and must not double-weight CT and IN.
  const performanceAvg = (states.AE + states.RA + states.CT + states.IN) / 4;
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
// Formula (v2 with RQ modulation):
//   PerformanceAvg = (AE + RA + CT + IN) / 4
//   Improvement = PerformanceAvg − BaselinePerformanceAvg
//   RQ_Multiplier = 0.85 + 0.15 × (RQ / 100)  // Range: [0.85, 1.00]
//   CognitiveAge = BaselineCognitiveAge − (Improvement / 10) × RQ_Multiplier
// Cap: ±15 years from baseline
//
// RQ (Reasoning Quality) modulates the effectiveness of improvement:
// - Higher RQ = up to 15% more effective improvement
// - If RQ unavailable, use conservative multiplier (0.85)
// ============================================

export interface CognitiveAgeBaseline {
  baselineCognitiveAge: number;
  baselineAE: number;
  baselineRA: number;
  baselineCT: number;
  baselineIN: number;
}

export interface CognitiveAgeInput {
  states: CognitiveStates;
  baseline: CognitiveAgeBaseline;
  rq?: number | null; // Reasoning Quality (0-100), optional
}

/**
 * Calculate the RQ multiplier for Cognitive Age improvement.
 * Multiplier = 0.85 + 0.15 × (RQ / 100)
 * Range: [0.85, 1.00]
 * If RQ unavailable: 0.85 (conservative)
 */
export function calculateRQMultiplier(rq: number | null | undefined): number {
  if (rq === null || rq === undefined) {
    return 0.85;
  }
  
  const multiplier = 0.85 + 0.15 * (rq / 100);
  return clamp(multiplier, 0.85, 1.0);
}

export function calculateCognitiveAge(
  states: CognitiveStates,
  baseline: CognitiveAgeBaseline,
  rq?: number | null
): CognitiveAgeResult {
  // Current and baseline performance use the four canonical skills once each.
  const performanceAvg = (states.AE + states.RA + states.CT + states.IN) / 4;
  const baselinePerformanceAvg = (
    baseline.baselineAE + 
    baseline.baselineRA + 
    baseline.baselineCT + 
    baseline.baselineIN
  ) / 4;
  
  // Improvement
  const improvement = performanceAvg - baselinePerformanceAvg;
  
  // RQ Multiplier for improvement effectiveness
  const rqMultiplier = calculateRQMultiplier(rq);
  
  // Cognitive Age with RQ modulation and cap
  const rawCognitiveAge = baseline.baselineCognitiveAge - (improvement / 10) * rqMultiplier;
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
  // Effective baselines and inactivity timestamps
  baseline_eff_focus?: number | null;
  baseline_eff_fast_thinking?: number | null;
  baseline_eff_reasoning?: number | null;
  baseline_eff_slow_thinking?: number | null;
  last_ae_xp_at?: string | null;
  last_ra_xp_at?: string | null;
  last_ct_xp_at?: string | null;
  last_in_xp_at?: string | null;
}

export interface EffectiveCognitiveStatesResult {
  states: CognitiveStates;
  rawStates: CognitiveStates;
  baseline: CognitiveAgeBaseline;
  skillDecay: {
    aeDecay: number;
    raDecay: number;
    ctDecay: number;
    inDecay: number;
  };
  S1: number;
  S2: number;
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

// ============================================
// DECAY CALCULATION FUNCTIONS
// ============================================

import {
  SKILL_DECAY_THRESHOLD_DAYS,
  SKILL_DECAY_INTERVAL_DAYS,
  SKILL_DECAY_BASE_POINTS,
  SKILL_DECAY_INTERVAL_POINTS,
  SKILL_DECAY_MAX_POINTS,
  LOW_RECOVERY_THRESHOLD,
  READINESS_DECAY_TRIGGER_DAYS,
  READINESS_DECAY_INITIAL_POINTS,
  READINESS_DECAY_PER_DAY_POINTS,
  READINESS_DECAY_MAX_WEEKLY,
  SCI_LOW_RECOVERY_DECAY,
  SCI_NO_TRAINING_THRESHOLD_DAYS,
  SCI_NO_TRAINING_DECAY,
  SCI_DECAY_MAX_WEEKLY,
  DUAL_PROCESS_IMBALANCE_RATIO,
  DUAL_PROCESS_IMBALANCE_DECAY,
  DUAL_PROCESS_DECAY_MAX_WEEKLY,
  COGNITIVE_AGE_PERFORMANCE_DROP_THRESHOLD,
  COGNITIVE_AGE_DROP_DAYS_THRESHOLD,
  COGNITIVE_AGE_MAX_INCREASE_PER_MONTH,
} from "@/lib/decayConstants";

// ============================================
// TYPES FOR DECAY CALCULATIONS
// ============================================

export interface SkillDecayInput {
  lastXpDate: Date | null;
  currentValue: number;
  baselineValue: number;
  today: Date;
}

export interface ReadinessDecayInput {
  consecutiveLowRecDays: number;
  currentDecayApplied: number;
}

export interface SCIDecayInput {
  recovery: number;
  daysSinceLastTraining: number;
  currentDecayApplied: number;
}

export interface DualProcessDecayInput {
  weeklyS1XP: number;
  weeklyS2XP: number;
  currentDecayApplied: number;
}

export interface CognitiveAgeRegressionInput {
  currentPerformanceAvg: number;
  windowStartPerformanceAvg: number | null;
  consecutiveDropDays: number;
}

// ============================================
// SKILL INACTIVITY DECAY
// Decay if no XP for 30+ consecutive days
// -1 pt initially, then -1 pt per 15 additional days
// Max -3 pts per 90 days. Never decay below baseline.
// ============================================

export function calculateSkillDecay(input: SkillDecayInput): number {
  const { lastXpDate, currentValue, baselineValue, today } = input;
  
  // No decay if no XP ever received (new user)
  if (!lastXpDate) return 0;
  
  const diffMs = today.getTime() - lastXpDate.getTime();
  const daysSinceXP = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // No decay under threshold days
  if (daysSinceXP < SKILL_DECAY_THRESHOLD_DAYS) return 0;
  
  // Base decay at threshold
  let decay = SKILL_DECAY_BASE_POINTS;
  
  // Additional decay per interval after threshold
  const additionalDays = daysSinceXP - SKILL_DECAY_THRESHOLD_DAYS;
  decay += Math.floor(additionalDays / SKILL_DECAY_INTERVAL_DAYS) * SKILL_DECAY_INTERVAL_POINTS;
  
  // Cap at max
  decay = Math.min(decay, SKILL_DECAY_MAX_POINTS);
  
  // Never decay below baseline
  const maxDecay = Math.max(0, currentValue - baselineValue);
  
  return Math.min(decay, maxDecay);
}

/**
 * Canonical derivation from the database row to the effective states used by
 * Today, Monitor, SCI, daily snapshots, and intraday snapshots.
 */
export function deriveEffectiveCognitiveStates(
  metrics: DatabaseMetrics | null,
  chronologicalAge = 35,
  today = new Date(),
): EffectiveCognitiveStatesResult {
  const rawStates = mapDatabaseToCognitiveStates(metrics);
  const baseline = mapDatabaseToBaseline(metrics ? {
    ...metrics,
    baseline_focus: metrics.baseline_eff_focus ?? metrics.baseline_focus,
    baseline_fast_thinking: metrics.baseline_eff_fast_thinking ?? metrics.baseline_fast_thinking,
    baseline_reasoning: metrics.baseline_eff_reasoning ?? metrics.baseline_reasoning,
    baseline_slow_thinking: metrics.baseline_eff_slow_thinking ?? metrics.baseline_slow_thinking,
  } : null, chronologicalAge);

  const parseXpDate = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const aeDecay = calculateSkillDecay({
    lastXpDate: parseXpDate(metrics?.last_ae_xp_at),
    currentValue: rawStates.AE,
    baselineValue: baseline.baselineAE,
    today,
  });
  const raDecay = calculateSkillDecay({
    lastXpDate: parseXpDate(metrics?.last_ra_xp_at),
    currentValue: rawStates.RA,
    baselineValue: baseline.baselineRA,
    today,
  });
  const ctDecay = calculateSkillDecay({
    lastXpDate: parseXpDate(metrics?.last_ct_xp_at),
    currentValue: rawStates.CT,
    baselineValue: baseline.baselineCT,
    today,
  });
  const inDecay = calculateSkillDecay({
    lastXpDate: parseXpDate(metrics?.last_in_xp_at),
    currentValue: rawStates.IN,
    baselineValue: baseline.baselineIN,
    today,
  });

  const states: CognitiveStates = {
    AE: clamp(rawStates.AE - aeDecay, baseline.baselineAE, 100),
    RA: clamp(rawStates.RA - raDecay, baseline.baselineRA, 100),
    CT: clamp(rawStates.CT - ctDecay, baseline.baselineCT, 100),
    IN: clamp(rawStates.IN - inDecay, baseline.baselineIN, 100),
  };
  const { S1, S2 } = calculateSystemScores(states);

  return {
    states,
    rawStates,
    baseline,
    skillDecay: { aeDecay, raDecay, ctDecay, inDecay },
    S1,
    S2,
  };
}

// ============================================
// READINESS DECAY
// Decays if REC < 40 for 3+ consecutive days
// -5 pts initially, then -2 pts/day
// Max -15 pts/week
// ============================================

export function calculateReadinessDecay(input: ReadinessDecayInput): number {
  const { consecutiveLowRecDays, currentDecayApplied } = input;
  
  const remainingDecay = READINESS_DECAY_MAX_WEEKLY - currentDecayApplied;
  
  if (remainingDecay <= 0) return 0;
  if (consecutiveLowRecDays < READINESS_DECAY_TRIGGER_DAYS) return 0;
  
  let totalDecay = 0;
  
  if (consecutiveLowRecDays >= READINESS_DECAY_TRIGGER_DAYS) {
    // Initial decay on trigger day
    totalDecay = READINESS_DECAY_INITIAL_POINTS;
    
    // Additional decay for days beyond trigger
    const additionalDays = consecutiveLowRecDays - READINESS_DECAY_TRIGGER_DAYS;
    totalDecay += additionalDays * READINESS_DECAY_PER_DAY_POINTS;
  }
  
  // Cap at weekly max minus already applied
  return Math.min(totalDecay, remainingDecay);
}

// ============================================
// SCI (COGNITIVE NETWORK) DECAY
// -5 pts/week if REC < 40
// -5 pts/week if no training for 7 days
// Decays stack, max -10 pts/week
// ============================================

export function calculateSCIDecay(input: SCIDecayInput): number {
  const { recovery, daysSinceLastTraining, currentDecayApplied } = input;
  
  const remainingDecay = SCI_DECAY_MAX_WEEKLY - currentDecayApplied;
  if (remainingDecay <= 0) return 0;
  
  let decay = 0;
  
  // Low recovery penalty
  if (recovery < LOW_RECOVERY_THRESHOLD) {
    decay += SCI_LOW_RECOVERY_DECAY;
  }
  
  // No training penalty
  if (daysSinceLastTraining >= SCI_NO_TRAINING_THRESHOLD_DAYS) {
    decay += SCI_NO_TRAINING_DECAY;
  }
  
  return Math.min(decay, remainingDecay);
}

// ============================================
// DUAL-PROCESS BALANCE DECAY
// -5 pts if S1 XP ≥ 2x S2 XP (or vice versa) over 7 days
// Max -10 pts/week
// ============================================

export function calculateDualProcessDecay(input: DualProcessDecayInput): number {
  const { weeklyS1XP, weeklyS2XP, currentDecayApplied } = input;
  
  const remainingDecay = DUAL_PROCESS_DECAY_MAX_WEEKLY - currentDecayApplied;
  if (remainingDecay <= 0) return 0;
  
  // Handle zero cases
  if (weeklyS1XP === 0 && weeklyS2XP === 0) return 0;
  
  // If one is zero and other is not, that's an imbalance
  if (weeklyS1XP === 0 && weeklyS2XP > 0) {
    return Math.min(DUAL_PROCESS_IMBALANCE_DECAY, remainingDecay);
  }
  if (weeklyS2XP === 0 && weeklyS1XP > 0) {
    return Math.min(DUAL_PROCESS_IMBALANCE_DECAY, remainingDecay);
  }
  
  const ratio = weeklyS1XP / weeklyS2XP;
  
  // S1 dominates (≥2x S2)
  if (ratio >= DUAL_PROCESS_IMBALANCE_RATIO) {
    return Math.min(DUAL_PROCESS_IMBALANCE_DECAY, remainingDecay);
  }
  
  // S2 dominates (S1 ≤ 0.5x S2)
  if (ratio <= 1 / DUAL_PROCESS_IMBALANCE_RATIO) {
    return Math.min(DUAL_PROCESS_IMBALANCE_DECAY, remainingDecay);
  }
  
  return 0; // Balanced
}

// ============================================
// COGNITIVE AGE REGRESSION
// +1 year if PerformanceAvg decreases by ≥10 pts for ≥21 consecutive days
// Max +1 year per 30 days
// ============================================

export function calculateCognitiveAgeRegression(input: CognitiveAgeRegressionInput): number {
  const { currentPerformanceAvg, windowStartPerformanceAvg, consecutiveDropDays } = input;
  
  // If no baseline window established, no regression
  if (windowStartPerformanceAvg === null) return 0;
  
  const performanceDrop = windowStartPerformanceAvg - currentPerformanceAvg;
  
  // Check if drop exceeds threshold
  if (performanceDrop < COGNITIVE_AGE_PERFORMANCE_DROP_THRESHOLD) return 0;
  
  // Check if sustained long enough
  if (consecutiveDropDays < COGNITIVE_AGE_DROP_DAYS_THRESHOLD) return 0;
  
  // Apply age increase (capped at max per month)
  return COGNITIVE_AGE_MAX_INCREASE_PER_MONTH;
}

// ============================================
// HELPER: Check if recovery is low
// ============================================

export function isRecoveryLow(recovery: number): boolean {
  return recovery < LOW_RECOVERY_THRESHOLD;
}

// ============================================
// TRAINING CAPACITY (TC) FUNCTIONS
// ============================================

import {
  TC_FLOOR,
  TC_GROWTH_ALPHA,
  TC_DECAY_PER_WEEK,
  TC_INACTIVITY_THRESHOLD_DAYS,
  TC_OPTIMAL_MIN_PERCENT,
  TC_OPTIMAL_MAX_PERCENT,
} from "@/lib/decayConstants";

/**
 * Initialize Training Capacity for a new user based on cognitive states.
 * TC0 = clamp(round((S1+S2)/2), 30, planCap*0.6)
 */
export function initializeTrainingCapacity(
  states: CognitiveStates,
  planCap: number
): number {
  const S1 = (states.AE + states.RA) / 2;
  const S2 = (states.CT + states.IN) / 2;
  const base = (S1 + S2) / 2;
  return clamp(Math.round(base), TC_FLOOR, Math.round(planCap * 0.6));
}

/**
 * Calculate recovery multiplier for TC growth.
 * recMult = clamp(0.6 + 0.006 * avgREC, 0.6, 1.2)
 */
export function calculateRecoveryMultiplier(avgREC: number): number {
  return clamp(0.6 + 0.006 * avgREC, 0.6, 1.2);
}

export interface TrainingCapacityUpdateInput {
  currentTC: number;
  weeklyXP: number;
  avgREC: number;
  daysSinceLastXP: number;
  planCap: number;
}

/**
 * Update Training Capacity based on weekly XP and recovery.
 * TC_new = clamp(TC + growth - decay, TC_FLOOR, planCap)
 * growth = alpha * min(weeklyXP, planCap) * recMult
 * decay = 3 if daysSinceLastXP >= 7, else 0
 */
export function updateTrainingCapacity(input: TrainingCapacityUpdateInput): number {
  const { currentTC, weeklyXP, avgREC, daysSinceLastXP, planCap } = input;
  
  const recMult = calculateRecoveryMultiplier(avgREC);
  const xpEff = Math.min(weeklyXP, planCap);
  const growth = TC_GROWTH_ALPHA * xpEff * recMult;
  const decay = daysSinceLastXP >= TC_INACTIVITY_THRESHOLD_DAYS ? TC_DECAY_PER_WEEK : 0;
  
  const newTC = currentTC + growth - decay;
  return clamp(Math.round(newTC * 10) / 10, TC_FLOOR, planCap);
}

export interface DynamicOptimalRange {
  min: number;
  max: number;
  cap: number;
}

/**
 * Get dynamic optimal range based on Training Capacity.
 * optMin = round(0.60 * TC)
 * optMax = min(round(0.85 * TC), weeklyXPTarget) – if target provided
 * 
 * v1.5: Ensures optMax doesn't exceed the plan's XP target
 */
export function getDynamicOptimalRange(
  tc: number, 
  planCap: number, 
  weeklyXPTarget?: number
): DynamicOptimalRange {
  const rawMin = Math.round(tc * TC_OPTIMAL_MIN_PERCENT);
  const rawMax = Math.round(tc * TC_OPTIMAL_MAX_PERCENT);
  
  // If weeklyXPTarget provided, cap optMax at the target
  const max = weeklyXPTarget ? Math.min(rawMax, weeklyXPTarget) : rawMax;
  // Ensure optMin doesn't exceed 70% of the capped optMax
  const min = Math.min(rawMin, Math.round(max * 0.7));
  
  return { min, max, cap: planCap };
}
