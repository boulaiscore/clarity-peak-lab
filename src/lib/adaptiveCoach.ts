import { clamp, type CognitiveStates } from "@/lib/cognitiveEngine";

export const ADAPTIVE_COACH_MODEL_VERSION = "interpretable-shadow-v3-state-aware";
export const ADAPTIVE_COACH_OUTCOME_WINDOW_DAYS = 7;
export const ADAPTIVE_COACH_MIN_BASELINE_SESSIONS = 3;

export type CoachSkill = keyof CognitiveStates;
export type CoachActionKey = "train_ae" | "train_ra" | "train_ct" | "train_in";
export type CoachTrainingState = "available" | "defer";

export interface CoachGameObservation {
  skill: CoachSkill;
  score: number;
  completedAt: Date;
}

export interface CoachCalibrationOutcome {
  actionKey: CoachActionKey;
  predictedDelta: number;
  observedDelta: number;
}

export interface CoachReason {
  code: "skill_gap" | "time_since_training" | "state_fit" | "limited_history" | "recent_decline" | "passive_context" | "personal_calibration";
  label: string;
  evidence: string;
  strength: number;
}

export interface CoachCandidateFeatures {
  skillValue: number;
  skillGap: number;
  baselineScore: number;
  recentTrendPerSession: number;
  recentSessionCount: number;
  daysSinceTraining: number;
  stateFit: number;
  uncertainty: number;
  trainingState: CoachTrainingState;
  personalCalibrationSamples: number;
  personalCalibrationAdjustment: number;
  metricTrendPerDay: number;
  healthScore: number | null;
  attentionLoadRatio: number | null;
  digitalFragmentationRatio: number | null;
  scheduleLoadRatio: number | null;
  activeDays7d: number;
  passiveDataCoverage: number;
  passiveContextAdjustment: number;
}

export interface CoachShadowPrediction {
  actionKey: CoachActionKey;
  targetSkill: CoachSkill;
  rank: number;
  isTopCandidate: boolean;
  isEvaluable: boolean;
  baselineScore: number;
  predictedScore: number;
  predictedDelta: number;
  priorityScore: number;
  confidence: number;
  features: CoachCandidateFeatures;
  reasons: CoachReason[];
}

export interface CoachContext {
  states: CognitiveStates;
  sharpness: number;
  readiness: number;
  recovery: number;
  recoveryInitialized: boolean;
  passive?: {
    metricTrendPerDay: number;
    skillTrendPerDay: Partial<Record<CoachSkill, number>>;
    healthScore: number | null;
    attentionLoadRatio: number | null;
    digitalFragmentationRatio: number | null;
    scheduleLoadRatio: number | null;
    activeDays7d: number;
    dataCoverage: number;
  };
  now?: Date;
}

export interface CoachValidationRecord {
  actionKey: CoachActionKey;
  predictedDelta: number;
  observedDelta: number;
}

export interface CoachValidationSummary {
  sampleSize: number;
  modelMae: number | null;
  noChangeMae: number | null;
  maeLift: number | null;
  directionalAccuracy: number | null;
  coveredSkills: number;
  samplesByAction: Record<CoachActionKey, number>;
  status: "collecting" | "ready_for_review" | "needs_revision";
  gates: {
    minimumSample: boolean;
    directionalAccuracy: boolean;
    beatsNoChange: boolean;
    actionCoverage: boolean;
  };
}

const SKILLS: CoachSkill[] = ["AE", "RA", "CT", "IN"];
const ACTION_BY_SKILL: Record<CoachSkill, CoachActionKey> = {
  AE: "train_ae",
  RA: "train_ra",
  CT: "train_ct",
  IN: "train_in",
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function daysBetween(earlier: Date, later: Date): number {
  const diff = later.getTime() - earlier.getTime();
  return Math.max(0, diff / (24 * 60 * 60 * 1000));
}

function getRecentSkillHistory(
  observations: CoachGameObservation[],
  skill: CoachSkill,
): CoachGameObservation[] {
  return observations
    .filter((observation) => observation.skill === skill && Number.isFinite(observation.score))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
    .slice(-5);
}

function calculateStateFit(skill: CoachSkill, context: CoachContext): number {
  if (skill === "AE" || skill === "RA") {
    return clamp(0.55 * context.sharpness + 0.45 * context.recovery, 0, 100);
  }
  return clamp(0.65 * context.readiness + 0.35 * context.recovery, 0, 100);
}

function calculatePersonalCalibration(
  actionKey: CoachActionKey,
  outcomes: CoachCalibrationOutcome[],
): { samples: number; adjustment: number } {
  const matching = outcomes.filter(
    (outcome) =>
      outcome.actionKey === actionKey &&
      Number.isFinite(outcome.predictedDelta) &&
      Number.isFinite(outcome.observedDelta),
  );
  if (matching.length === 0) return { samples: 0, adjustment: 0 };

  const residual = mean(
    matching.map((outcome) => outcome.observedDelta - outcome.predictedDelta),
  );
  // Empirical-Bayes shrinkage prevents one noisy session from dominating the
  // next forecast. The adjustment approaches the personal residual only as
  // repeated outcomes accumulate, and is capped for safety.
  const shrinkage = matching.length / (matching.length + 8);
  return {
    samples: matching.length,
    adjustment: clamp(residual * shrinkage, -4, 4),
  };
}

function calculatePassiveContextAdjustment(
  skill: CoachSkill,
  context: CoachContext,
): number {
  if (!context.passive) return 0;
  const skillTrend = context.passive.skillTrendPerDay[skill] ?? 0;
  // Current Health, attention and schedule already enter Sharpness/Readiness,
  // which are part of stateFit. Adding them again here double-counted the same
  // evidence. Passive context contributes only longitudinal residual trends.
  const trendAdjustment = clamp(skillTrend * 0.35, -1.2, 1.2);
  const metricTrendAdjustment = clamp(context.passive.metricTrendPerDay * 0.12, -0.4, 0.4);
  return clamp(
    trendAdjustment + metricTrendAdjustment,
    -1.5,
    1.5,
  );
}

function selectReasons(features: CoachCandidateFeatures): CoachReason[] {
  const reasons: CoachReason[] = [
    {
      code: "skill_gap",
      label: "Development gap",
      evidence: `${Math.round(features.skillGap)} points of headroom in the current skill state.`,
      strength: features.skillGap,
    },
    {
      code: "time_since_training",
      label: "Training recency",
      evidence: features.daysSinceTraining >= 14
        ? "No matching session is available in the recent history."
        : `${Math.round(features.daysSinceTraining)} day(s) since the latest matching session.`,
      strength: clamp((features.daysSinceTraining / 14) * 100, 0, 100),
    },
    {
      code: "state_fit",
      label: "Current state fit",
      evidence: `${Math.round(features.stateFit)}/100 fit from today's Recovery and ${features.trainingState === "defer" ? "cognitive state; training should be deferred" : "cognitive state"}.`,
      strength: features.stateFit,
    },
  ];

  if (features.recentSessionCount < ADAPTIVE_COACH_MIN_BASELINE_SESSIONS) {
    reasons.push({
      code: "limited_history",
      label: "Limited personal history",
      evidence: `${features.recentSessionCount}/${ADAPTIVE_COACH_MIN_BASELINE_SESSIONS} matching sessions available for an evaluable baseline.`,
      strength: features.uncertainty,
    });
  }

  if (features.recentTrendPerSession < -0.5) {
    reasons.push({
      code: "recent_decline",
      label: "Recent performance trend",
      evidence: `${round(features.recentTrendPerSession, 1)} score points per recent session.`,
      strength: clamp(Math.abs(features.recentTrendPerSession) * 12, 0, 100),
    });
  }

  if (features.passiveDataCoverage >= 0.35) {
    reasons.push({
      code: "passive_context",
      label: "Personal context",
      evidence: `Forecast context includes the user's metric trend, health, aggregate attention and schedule load (${Math.round(features.passiveDataCoverage * 100)}% coverage).`,
      strength: features.passiveDataCoverage * 70,
    });
  }

  if (features.personalCalibrationSamples > 0) {
    reasons.push({
      code: "personal_calibration",
      label: "Personal forecast calibration",
      evidence: `${features.personalCalibrationSamples} prior outcome(s) shift this forecast by ${features.personalCalibrationAdjustment >= 0 ? "+" : ""}${round(features.personalCalibrationAdjustment, 1)} points.`,
      strength: clamp(features.personalCalibrationSamples * 10, 0, 100),
    });
  }

  return reasons.sort((a, b) => b.strength - a.strength).slice(0, 3);
}

/**
 * Produces a daily, explainable ranking without changing active training.
 *
 * Forecast target: score delta on the next completed game routed to the same
 * skill within seven days, relative to the pre-prediction rolling mean.
 */
export function generateCoachShadowPredictions(
  context: CoachContext,
  observations: CoachGameObservation[],
  calibrationOutcomes: CoachCalibrationOutcome[] = [],
): CoachShadowPrediction[] {
  const now = context.now ?? new Date();

  const candidates = SKILLS.map((skill) => {
    const actionKey = ACTION_BY_SKILL[skill];
    const history = getRecentSkillHistory(observations, skill);
    const scores = history.map((observation) => clamp(observation.score, 0, 100));
    const baselineScore = scores.length > 0 ? mean(scores) : 50;
    const recentTrendPerSession = scores.length >= 2
      ? (scores[scores.length - 1] - scores[0]) / (scores.length - 1)
      : 0;
    const daysSinceTraining = history.length > 0
      ? Math.min(14, daysBetween(history[history.length - 1].completedAt, now))
      : 14;
    const stateFit = calculateStateFit(skill, context);
    const skillValue = clamp(context.states[skill], 0, 100);
    const skillGap = 100 - skillValue;
    const uncertainty = 100 - Math.min(100, history.length * 20);
    const trainingState: CoachTrainingState = context.recovery < 35 ? "defer" : "available";
    const personalCalibration = calculatePersonalCalibration(actionKey, calibrationOutcomes);
    const passiveContextAdjustment = calculatePassiveContextAdjustment(skill, context);
    const passiveSkillTrend = context.passive?.skillTrendPerDay[skill] ?? 0;

    const features: CoachCandidateFeatures = {
      skillValue: round(skillValue),
      skillGap: round(skillGap),
      baselineScore: round(baselineScore),
      recentTrendPerSession: round(recentTrendPerSession),
      recentSessionCount: history.length,
      daysSinceTraining: round(daysSinceTraining, 1),
      stateFit: round(stateFit),
      uncertainty: round(uncertainty),
      trainingState,
      personalCalibrationSamples: personalCalibration.samples,
      personalCalibrationAdjustment: round(personalCalibration.adjustment),
      metricTrendPerDay: round(passiveSkillTrend, 3),
      healthScore: context.passive?.healthScore ?? null,
      attentionLoadRatio: context.passive?.attentionLoadRatio ?? null,
      digitalFragmentationRatio: context.passive?.digitalFragmentationRatio ?? null,
      scheduleLoadRatio: context.passive?.scheduleLoadRatio ?? null,
      activeDays7d: context.passive?.activeDays7d ?? 0,
      passiveDataCoverage: context.passive?.dataCoverage ?? 0,
      passiveContextAdjustment: round(passiveContextAdjustment),
    };

    const recencyScore = clamp((daysSinceTraining / 14) * 100, 0, 100);
    const declineNeed = clamp(-recentTrendPerSession * 12, 0, 100);
    const priorityScore = clamp(
      0.35 * skillGap +
        0.20 * recencyScore +
        0.18 * stateFit +
        0.12 * uncertainty +
        0.08 * declineNeed +
        0.07 * clamp(-passiveSkillTrend * 20, 0, 100),
      0,
      100,
    );

    const trendAdjustment = recentTrendPerSession * Math.min(1, history.length / 5);
    const stateAdjustment = (stateFit - 50) * 0.06;
    const regressionAdjustment = (50 - baselineScore) * 0.03;
    const predictedDelta = clamp(
      trendAdjustment +
        stateAdjustment +
        regressionAdjustment +
        passiveContextAdjustment +
        personalCalibration.adjustment,
      -12,
      12,
    );
    const predictedScore = clamp(baselineScore + predictedDelta, 0, 100);
    const confidenceBase = clamp(0.15 + history.length * 0.12, 0.15, 0.8);
    const passiveCoverageFactor = context.passive
      ? 0.85 + 0.15 * context.passive.dataCoverage
      : 1;
    const confidence = confidenceBase *
      (context.recoveryInitialized ? 1 : 0.8) *
      passiveCoverageFactor;

    return {
      actionKey,
      targetSkill: skill,
      rank: 0,
      isTopCandidate: false,
      isEvaluable: history.length >= ADAPTIVE_COACH_MIN_BASELINE_SESSIONS,
      baselineScore: round(baselineScore),
      predictedScore: round(predictedScore),
      predictedDelta: round(predictedScore - baselineScore),
      priorityScore: round(priorityScore),
      confidence: round(confidence, 4),
      features,
      reasons: selectReasons(features),
    } satisfies CoachShadowPrediction;
  });

  return candidates
    .sort((a, b) => b.priorityScore - a.priorityScore || a.actionKey.localeCompare(b.actionKey))
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      isTopCandidate: index === 0,
    }));
}

function direction(value: number): -1 | 0 | 1 {
  if (value > 0.5) return 1;
  if (value < -0.5) return -1;
  return 0;
}

/**
 * Validation gate for considering a future active-personalization experiment.
 * Passing it only enables manual review; it never changes shadow mode.
 */
export function evaluateCoachValidation(
  records: CoachValidationRecord[],
): CoachValidationSummary {
  const valid = records.filter(
    (record) => Number.isFinite(record.predictedDelta) && Number.isFinite(record.observedDelta),
  );
  const samplesByAction: Record<CoachActionKey, number> = {
    train_ae: 0,
    train_ra: 0,
    train_ct: 0,
    train_in: 0,
  };

  valid.forEach((record) => {
    samplesByAction[record.actionKey] += 1;
  });

  const modelMae = valid.length > 0
    ? mean(valid.map((record) => Math.abs(record.observedDelta - record.predictedDelta)))
    : null;
  const noChangeMae = valid.length > 0
    ? mean(valid.map((record) => Math.abs(record.observedDelta)))
    : null;
  const directionalAccuracy = valid.length > 0
    ? valid.filter((record) => direction(record.predictedDelta) === direction(record.observedDelta)).length / valid.length
    : null;
  const maeLift = modelMae !== null && noChangeMae !== null && noChangeMae > 0
    ? (noChangeMae - modelMae) / noChangeMae
    : null;
  const coveredSkills = Object.values(samplesByAction).filter((count) => count >= 5).length;

  const gates = {
    minimumSample: valid.length >= 30,
    directionalAccuracy: directionalAccuracy !== null && directionalAccuracy >= 0.6,
    beatsNoChange: maeLift !== null && maeLift >= 0.1,
    actionCoverage: coveredSkills >= 3,
  };
  const allGatesPass = Object.values(gates).every(Boolean);

  return {
    sampleSize: valid.length,
    modelMae: modelMae === null ? null : round(modelMae),
    noChangeMae: noChangeMae === null ? null : round(noChangeMae),
    maeLift: maeLift === null ? null : round(maeLift, 4),
    directionalAccuracy: directionalAccuracy === null ? null : round(directionalAccuracy, 4),
    coveredSkills,
    samplesByAction,
    status: valid.length < 30 ? "collecting" : allGatesPass ? "ready_for_review" : "needs_revision",
    gates,
  };
}

export function getCoachActionLabel(actionKey: CoachActionKey): string {
  const labels: Record<CoachActionKey, string> = {
    train_ae: "Attentional Efficiency",
    train_ra: "Rapid Association",
    train_ct: "Critical Thinking",
    train_in: "Insight",
  };
  return labels[actionKey];
}
