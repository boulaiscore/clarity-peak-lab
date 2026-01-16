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
 * - PerformanceAvg = (AE + RA + CT + IN + S2) / 5
 * - BE = min(100, (weekly_games_xp / xp_target_week) × 100)
 * - REC = Recovery from detox + walking
 * 
 * NOTE: Tasks do NOT contribute to XP or BE in v1.3
 */

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
  weeklyDetoxMinutes: number;
  detoxTarget: number;
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
 * CP = PerformanceAvg = (AE + RA + CT + IN + S2) / 5
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
  
  const performanceAvg = (AE + RA + CT + IN + S2) / 5;
  const score = Math.max(0, Math.min(100, performanceAvg));

  return {
    score: Math.round(score),
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
    score: Math.round(gamesProgress),
    components: { gamesProgress: Math.round(gamesProgress) },
  };
}

/**
 * Calculate Recovery Factor (20% of SCI)
 */
function calculateRecoveryFactor(input: RecoveryInput): number {
  const detoxProgress = input.detoxTarget > 0
    ? Math.min(100, (input.weeklyDetoxMinutes / input.detoxTarget) * 100)
    : 0;
  return Math.round(detoxProgress);
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

  const cpWeighted = WEIGHTS.cognitivePerformance * cpResult.score;
  const beWeighted = WEIGHTS.behavioralEngagement * beResult.score;
  const rfWeighted = WEIGHTS.recoveryFactor * rfScore;

  const total = Math.round(cpWeighted + beWeighted + rfWeighted);

  return {
    total: Math.min(100, Math.max(0, total)),
    cognitivePerformance: {
      score: cpResult.score,
      weighted: Math.round(cpWeighted),
      components: cpResult.components,
    },
    behavioralEngagement: {
      score: beResult.score,
      weighted: Math.round(beWeighted),
      components: beResult.components,
    },
    recoveryFactor: {
      score: rfScore,
      weighted: Math.round(rfWeighted),
    },
  };
}

/**
 * Get status text based on SCI score
 */
export function getSCIStatusText(score: number): string {
  if (score >= 80) return "Elite cognitive integration";
  if (score >= 65) return "High strategic clarity";
  if (score >= 50) return "Developing strategic capacity";
  if (score >= 35) return "Building cognitive foundation";
  return "Early activation phase";
}

/**
 * Get level classification
 */
export function getSCILevel(score: number): "elite" | "high" | "moderate" | "developing" | "early" {
  if (score >= 80) return "elite";
  if (score >= 65) return "high";
  if (score >= 50) return "moderate";
  if (score >= 35) return "developing";
  return "early";
}

/**
 * Default targets based on training plans v1.3
 * - Only games XP target (tasks removed)
 * - Detox minutes for recovery
 */
export const DEFAULT_TARGETS = {
  light: {
    xpTargetWeek: 120,
    detoxMinutes: 480, // 8 hours
  },
  expert: {
    xpTargetWeek: 200,
    detoxMinutes: 840, // 14 hours
  },
  superhuman: {
    xpTargetWeek: 300,
    detoxMinutes: 1680, // 28 hours
  },
};

export type TrainingPlanType = keyof typeof DEFAULT_TARGETS;

export function getTargetsForPlan(plan: string): typeof DEFAULT_TARGETS.expert {
  if (plan === "light") return DEFAULT_TARGETS.light;
  if (plan === "superhuman") return DEFAULT_TARGETS.superhuman;
  return DEFAULT_TARGETS.expert;
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
      actionDescription: "Complete games in NeuroLab to improve your cognitive scores"
    },
    {
      variable: "training" as const,
      currentScore: breakdown.behavioralEngagement.score,
      weight: WEIGHTS.behavioralEngagement,
      potentialGain: Math.round((100 - breakdown.behavioralEngagement.score) * WEIGHTS.behavioralEngagement),
      actionLabel: "Earn XP",
      actionDescription: "Play more games this week to hit your XP target"
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
