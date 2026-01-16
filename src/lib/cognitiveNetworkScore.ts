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

// Component weights
const WEIGHTS = {
  COGNITIVE_PERFORMANCE: 0.50,
  BEHAVIORAL_ENGAGEMENT: 0.30,
  RECOVERY_FACTOR: 0.20,
};

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

  const cpWeighted = WEIGHTS.COGNITIVE_PERFORMANCE * cpResult.score;
  const beWeighted = WEIGHTS.BEHAVIORAL_ENGAGEMENT * beResult.score;
  const rfWeighted = WEIGHTS.RECOVERY_FACTOR * rfScore;

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
