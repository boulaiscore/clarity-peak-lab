/**
 * ============================================
 * COGNITIVE NETWORK SCORE (SCI) v1.3
 * ============================================
 * 
 * Technical Manual v1.3 Aligned
 * 
 * SCI = 0.50×CP + 0.30×BE + 0.20×REC
 * 
 * Where:
 * - CP = clamp(0, 100, PerformanceAvg)
 * - PerformanceAvg = (AE + RA + CT + IN) / 4
 * - BE = min(100, (weekly_games_xp / xp_target_week) × 100)
 * - REC = the same effective Recovery value shown in Today
 * 
 * NOTE: Tasks do NOT contribute to XP or BE in v1.3
 */

import {
  calculateSCI as calculateCanonicalSCI,
  getSCILevel as getCanonicalSCILevel,
  getSCIStatusText as getCanonicalSCIStatusText,
} from "@/lib/cognitiveEngine";
import { TRAINING_PLANS, type TrainingPlanId } from "@/lib/trainingPlans";

// Component weights (exported for bottleneck calculation)
export const WEIGHTS = {
  cognitivePerformance: 0.50,
  behavioralEngagement: 0.30,
  recoveryFactor: 0.20,
};

export type ImpactLevel = "low" | "moderate" | "high" | "critical";

export interface ImpactClassification {
  level: ImpactLevel;
  normalizedImpact: number; // 0-100 (percentage of max potential for this component)
  label: string;
  description: string;
}

export interface BottleneckResult {
  variable: "thinking" | "training" | "recovery";
  potentialGain: number;
  currentScore: number;
  weight: number;
  actionLabel: string;
  actionDescription: string;
  impact: ImpactClassification;
}

/**
 * Classify the impact level of a bottleneck based on normalized potential
 * 
 * Scientific basis: We normalize the potential gain against the maximum
 * theoretical gain for each component (weight × 100), creating comparable
 * thresholds across components with different weights.
 * 
 * Thresholds based on effect size conventions:
 * - Low (0-20%): Marginal effect, component near optimal
 * - Moderate (20-50%): Medium effect size, meaningful improvement possible
 * - High (50-80%): Large effect size, substantial leverage point
 * - Critical (80-100%): Dominant effect, primary constraint on system
 */
export function classifyBottleneckImpact(
  potentialGain: number,
  weight: number
): ImpactClassification {
  const maxPotential = weight * 100;
  const normalizedImpact = maxPotential > 0
    ? (potentialGain / maxPotential) * 100
    : 0;

  if (normalizedImpact >= 80) {
    return {
      level: "critical",
      normalizedImpact: Math.round(normalizedImpact),
      label: "Critical lever",
      description: "This component dominates your potential growth"
    };
  }
  if (normalizedImpact >= 50) {
    return {
      level: "high",
      normalizedImpact: Math.round(normalizedImpact),
      label: "High leverage",
      description: "Substantial room for improvement here"
    };
  }
  if (normalizedImpact >= 20) {
    return {
      level: "moderate",
      normalizedImpact: Math.round(normalizedImpact),
      label: "Moderate impact",
      description: "Meaningful gains available"
    };
  }
  return {
    level: "low",
    normalizedImpact: Math.round(normalizedImpact),
    label: "Low priority",
    description: "Already near optimal for this component"
  };
}

export interface CognitiveMetricsInput {
  // Raw cognitive states (AE, RA, CT, IN mapped from DB)
  focus_stability: number; // AE
  fast_thinking: number; // RA
  reasoning_accuracy: number; // CT
  slow_thinking: number; // IN
}

/**
 * BehavioralEngagementInput v1.3
 * Only games XP matters for behavioral engagement
 */
export interface BehavioralEngagementInput {
  weeklyGamesXP: number;
  xpTargetWeek: number; // From training plan
}

export interface RecoveryInput {
  recovery: number;
}

export interface SCIBreakdown {
  total: number;
  cognitivePerformance: {
    score: number;
    weighted: number;
    components: {
      AE: number;
      RA: number;
      CT: number;
      IN: number;
      S2: number;
      performanceAvg: number;
    };
  };
  behavioralEngagement: {
    score: number;
    weighted: number;
    components: {
      gamesProgress: number;
    };
  };
  recoveryFactor: {
    score: number;
    weighted: number;
  };
}

/**
 * Calculate Cognitive Performance (CP) v1.3
 * CP = PerformanceAvg = (AE + RA + CT + IN) / 4
 */
function calculateCognitivePerformance(metrics: CognitiveMetricsInput): {
  score: number;
  components: SCIBreakdown["cognitivePerformance"]["components"];
} {
  const AE = metrics.focus_stability;
  const RA = metrics.fast_thinking;
  const CT = metrics.reasoning_accuracy;
  const IN = metrics.slow_thinking;
  const S2 = (CT + IN) / 2;
  
  const performanceAvg = (AE + RA + CT + IN) / 4;
  const score = Math.max(0, Math.min(100, performanceAvg));

  return {
    score,
    components: { AE, RA, CT, IN, S2, performanceAvg },
  };
}

/**
 * Calculate Behavioral Engagement (BE) v1.3
 * BE = min(100, (weekly_games_xp / xp_target_week) × 100)
 * 
 * NOTE: Tasks removed from BE calculation
 */
function calculateBehavioralEngagement(input: BehavioralEngagementInput): {
  score: number;
  components: SCIBreakdown["behavioralEngagement"]["components"];
} {
  const gamesProgress = input.xpTargetWeek > 0
    ? Math.min(100, (input.weeklyGamesXP / input.xpTargetWeek) * 100)
    : 0;

  return {
    score: gamesProgress,
    components: { gamesProgress },
  };
}

/**
 * Calculate Recovery Factor (20% of SCI).
 * REC is canonical Recovery v2, not a second weekly approximation.
 */
function calculateRecoveryFactor(input: RecoveryInput): number {
  return Math.max(0, Math.min(100, input.recovery));
}

/**
 * Calculate the full Synthesized Cognitive Index with breakdown
 */
export function calculateSCI(
  metrics: CognitiveMetricsInput,
  behavioral: BehavioralEngagementInput,
  recovery: RecoveryInput
): SCIBreakdown {
  const cpResult = calculateCognitivePerformance(metrics);
  const beResult = calculateBehavioralEngagement(behavioral);
  const rfScore = calculateRecoveryFactor(recovery);
  const canonical = calculateCanonicalSCI(
    {
      AE: metrics.focus_stability,
      RA: metrics.fast_thinking,
      CT: metrics.reasoning_accuracy,
      IN: metrics.slow_thinking,
    },
    behavioral,
    rfScore,
  );

  const cpWeighted = WEIGHTS.cognitivePerformance * canonical.cognitivePerformance;
  const beWeighted = WEIGHTS.behavioralEngagement * canonical.behavioralEngagement;
  const rfWeighted = WEIGHTS.recoveryFactor * canonical.recoveryFactor;

  return {
    total: canonical.total,
    cognitivePerformance: {
      score: canonical.cognitivePerformance,
      weighted: Math.round(cpWeighted * 10) / 10,
      components: cpResult.components,
    },
    behavioralEngagement: {
      score: canonical.behavioralEngagement,
      weighted: Math.round(beWeighted * 10) / 10,
      components: beResult.components,
    },
    recoveryFactor: {
      score: canonical.recoveryFactor,
      weighted: Math.round(rfWeighted * 10) / 10,
    },
  };
}

/**
 * Get status text based on SCI score
 */
export function getSCIStatusText(score: number): string {
  return getCanonicalSCIStatusText(score);
}

/**
 * Get level classification
 */
export function getSCILevel(score: number): "elite" | "high" | "moderate" | "developing" | "early" {
  return getCanonicalSCILevel(score);
}

/**
 * Default targets based on training plans v1.3
 * - Only games XP target (tasks removed)
 * - Detox minutes for recovery
 */
export interface SCITargets {
  xpTargetWeek: number;
  detoxMinutes: number;
}

export const DEFAULT_TARGETS: Record<TrainingPlanId, SCITargets> = {
  light: {
    xpTargetWeek: TRAINING_PLANS.light.xpTargetWeek,
    detoxMinutes: TRAINING_PLANS.light.detox.weeklyMinutes,
  },
  expert: {
    xpTargetWeek: TRAINING_PLANS.expert.xpTargetWeek,
    detoxMinutes: TRAINING_PLANS.expert.detox.weeklyMinutes,
  },
  superhuman: {
    xpTargetWeek: TRAINING_PLANS.superhuman.xpTargetWeek,
    detoxMinutes: TRAINING_PLANS.superhuman.detox.weeklyMinutes,
  },
};

export type TrainingPlanType = keyof typeof DEFAULT_TARGETS;

export function getTargetsForPlan(plan: string): SCITargets {
  const planId: TrainingPlanId = plan === "expert" || plan === "superhuman" ? plan : "light";
  return DEFAULT_TARGETS[planId];
}

/**
 * Identify which variable has the biggest potential impact on Neural Strength
 * Calculates gap-to-100 weighted by component weight
 */
export function identifyBottleneck(breakdown: SCIBreakdown): BottleneckResult {
  const rawGaps = [
    {
      variable: "thinking" as const,
      currentScore: breakdown.cognitivePerformance.score,
      weight: WEIGHTS.cognitivePerformance,
      potentialGain: Math.round((100 - breakdown.cognitivePerformance.score) * WEIGHTS.cognitivePerformance),
      actionLabel: "Train Thinking",
      actionDescription: "Complete drills in NeuroLab to improve your cognitive scores"
    },
    {
      variable: "training" as const,
      currentScore: breakdown.behavioralEngagement.score,
      weight: WEIGHTS.behavioralEngagement,
      potentialGain: Math.round((100 - breakdown.behavioralEngagement.score) * WEIGHTS.behavioralEngagement),
      actionLabel: "Earn XP",
      actionDescription: "Run more drills this week to hit your XP target"
    },
    {
      variable: "recovery" as const,
      currentScore: breakdown.recoveryFactor.score,
      weight: WEIGHTS.recoveryFactor,
      potentialGain: Math.round((100 - breakdown.recoveryFactor.score) * WEIGHTS.recoveryFactor),
      actionLabel: "Add Recovery",
      actionDescription: "Complete Detox or Walking sessions"
    }
  ];

  // Add impact classification to each gap
  const gaps: BottleneckResult[] = rawGaps.map(gap => ({
    ...gap,
    impact: classifyBottleneckImpact(gap.potentialGain, gap.weight)
  }));
  
  // Sort by potential gain descending
  gaps.sort((a, b) => b.potentialGain - a.potentialGain);
  
  return gaps[0];
}
