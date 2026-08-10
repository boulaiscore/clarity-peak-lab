import { clamp } from "@/lib/cognitiveEngine";

export const FOCUS_INTEGRITY_MODEL_VERSION = "focus-integrity-shadow-v1";
export const FOCUS_INTEGRITY_MIN_BASELINE_DAYS = 5;
export const FOCUS_INTEGRITY_VALIDATION_DAYS = 21;

export interface FocusSessionSignal {
  durationSeconds: number;
  backgroundInterrupts: number;
  isValid: boolean;
}

export interface FocusIntegrityComponents {
  attentionStability: number | null;
  sessionContinuity: number | null;
  sessionCompletion: number | null;
}

export interface FocusIntegrityObservation {
  score: number | null;
  coverage: number;
  confidence: number;
  isEvaluable: boolean;
  components: FocusIntegrityComponents;
  evidence: {
    attentionBaselineDays: number;
    attentionLoadRatio: number | null;
    focusMinutes: number;
    interruptions: number;
    completedSessions: number;
    observedSessions: number;
  };
}

export interface FocusIntegrityObservationPoint {
  date: string;
  score: number;
}

export interface FocusIntegrityForecastInput {
  sharpness: number;
  readiness: number;
  recovery: number;
  healthScore: number | null;
  attentionLoadRatio: number | null;
  passiveCoverage: number;
  history: FocusIntegrityObservationPoint[];
}

export interface FocusIntegrityForecast {
  baselineScore: number;
  predictedScore: number;
  predictedDelta: number;
  confidence: number;
  isEvaluable: boolean;
  features: {
    historyDays: number;
    trendPerDay: number;
    stateIndex: number;
    healthScore: number | null;
    attentionLoadRatio: number | null;
    passiveCoverage: number;
  };
  reasons: Array<{
    code: "state" | "health" | "attention" | "trend" | "baseline";
    label: string;
    direction: "up" | "down" | "neutral";
    contribution: number;
  }>;
}

export interface FocusIntegrityValidationRecord {
  predictedDelta: number;
  observedDelta: number;
}

export interface FocusIntegrityValidation {
  sampleSize: number;
  directionalAccuracy: number | null;
  maeLift: number | null;
  status: "collecting" | "ready_for_review" | "needs_revision";
  gates: {
    minimumSample: boolean;
    directionalAccuracy: boolean;
    beatsNoChange: boolean;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function direction(value: number): -1 | 0 | 1 {
  if (value > 0.5) return 1;
  if (value < -0.5) return -1;
  return 0;
}

function trendPerDay(history: FocusIntegrityObservationPoint[]): number {
  const points = history.flatMap((point) => {
    const timestamp = new Date(point.date).getTime();
    return Number.isFinite(timestamp) && Number.isFinite(point.score)
      ? [{ x: timestamp / DAY_MS, y: clamp(point.score, 0, 100) }]
      : [];
  });
  if (points.length < 2) return 0;

  const meanX = mean(points.map((point) => point.x));
  const meanY = mean(points.map((point) => point.y));
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (denominator === 0) return 0;
  return round(
    points.reduce(
      (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
      0,
    ) / denominator,
    3,
  );
}

/**
 * Builds a privacy-safe, within-person proxy for sustained attention. It does
 * not rate intelligence, productivity or the quality of someone's work.
 * Missing components are omitted and the remaining weights are normalized.
 */
export function buildFocusIntegrityObservation(input: {
  attentionLoadRatio: number | null;
  attentionBaselineDays: number;
  attentionConfidence: number | null;
  sessions: FocusSessionSignal[];
}): FocusIntegrityObservation {
  const validDurations = input.sessions.filter((session) =>
    Number.isFinite(session.durationSeconds) && session.durationSeconds > 0,
  );
  const focusMinutes = validDurations.reduce(
    (sum, session) => sum + session.durationSeconds,
    0,
  ) / 60;
  const interruptions = validDurations.reduce(
    (sum, session) => sum + Math.max(0, session.backgroundInterrupts),
    0,
  );
  const completedSessions = validDurations.filter((session) => session.isValid).length;

  const attentionStability = input.attentionLoadRatio === null || input.attentionBaselineDays < 3
    ? null
    : clamp(50 + 35 * (1 - input.attentionLoadRatio), 0, 100);
  const sessionContinuity = focusMinutes < 10
    ? null
    : clamp(100 - (interruptions / Math.max(focusMinutes / 30, 0.5)) * 22, 0, 100);
  const sessionCompletion = validDurations.length === 0
    ? null
    : (completedSessions / validDurations.length) * 100;

  const weighted = [
    {
      value: attentionStability,
      weight: 0.6,
      reliability: Math.min(1, input.attentionBaselineDays / 5) *
        clamp(input.attentionConfidence ?? 0.7, 0, 1),
    },
    {
      value: sessionContinuity,
      weight: 0.25,
      reliability: Math.min(1, focusMinutes / 45),
    },
    {
      value: sessionCompletion,
      weight: 0.15,
      reliability: Math.min(1, validDurations.length / 2),
    },
  ].filter((component) => component.value !== null);

  const coverage = weighted.reduce((sum, component) => sum + component.weight, 0);
  const score = coverage === 0
    ? null
    : weighted.reduce(
        (sum, component) => sum + (component.value as number) * component.weight,
        0,
      ) / coverage;
  const confidence = coverage === 0
    ? 0
    : weighted.reduce(
        (sum, component) => sum + component.reliability * component.weight,
        0,
      ) / coverage;

  return {
    score: score === null ? null : round(score, 1),
    coverage: round(coverage, 3),
    confidence: round(confidence, 3),
    isEvaluable: score !== null && coverage >= 0.55 && confidence >= 0.45,
    components: {
      attentionStability: attentionStability === null ? null : round(attentionStability, 1),
      sessionContinuity: sessionContinuity === null ? null : round(sessionContinuity, 1),
      sessionCompletion: sessionCompletion === null ? null : round(sessionCompletion, 1),
    },
    evidence: {
      attentionBaselineDays: input.attentionBaselineDays,
      attentionLoadRatio: input.attentionLoadRatio,
      focusMinutes: round(focusMinutes, 1),
      interruptions,
      completedSessions,
      observedSessions: validDurations.length,
    },
  };
}

/** Forecasts tomorrow's passive Focus Integrity score in shadow mode. */
export function generateFocusIntegrityForecast(
  input: FocusIntegrityForecastInput,
): FocusIntegrityForecast {
  const history = [...input.history]
    .filter((point) => Number.isFinite(point.score))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
  const scores = history.map((point) => clamp(point.score, 0, 100));
  const baselineScore = scores.length > 0 ? mean(scores.slice(-7)) : 50;
  const trend = trendPerDay(history);
  const stateIndex = clamp(
    0.36 * input.sharpness + 0.34 * input.readiness + 0.3 * input.recovery,
    0,
    100,
  );

  const stateContribution = (stateIndex - 50) * 0.07;
  const healthContribution = input.healthScore === null
    ? 0
    : (input.healthScore - 50) * 0.035;
  const attentionContribution = input.attentionLoadRatio === null
    ? 0
    : clamp((1 - input.attentionLoadRatio) * 3.5, -5, 3.5);
  const trendContribution = clamp(trend * 0.35, -4, 4);
  const regressionContribution = (50 - baselineScore) * 0.04;
  const predictedDelta = clamp(
    stateContribution +
      healthContribution +
      attentionContribution +
      trendContribution +
      regressionContribution,
    -15,
    15,
  );
  const predictedScore = clamp(baselineScore + predictedDelta, 0, 100);
  const confidence = clamp(
    (0.18 + Math.min(history.length, 8) * 0.075) *
      (0.75 + 0.25 * input.passiveCoverage),
    0.12,
    0.85,
  );

  const reasonCandidates = [
    { code: "state" as const, label: "Cognitive state", contribution: stateContribution },
    { code: "health" as const, label: "Recovery context", contribution: healthContribution },
    { code: "attention" as const, label: "Attention load", contribution: attentionContribution },
    { code: "trend" as const, label: "Personal trend", contribution: trendContribution },
    { code: "baseline" as const, label: "Personal baseline", contribution: regressionContribution },
  ];

  return {
    baselineScore: round(baselineScore, 1),
    predictedScore: round(predictedScore, 1),
    predictedDelta: round(predictedScore - baselineScore, 1),
    confidence: round(confidence, 4),
    isEvaluable: history.length >= FOCUS_INTEGRITY_MIN_BASELINE_DAYS,
    features: {
      historyDays: history.length,
      trendPerDay: trend,
      stateIndex: round(stateIndex, 1),
      healthScore: input.healthScore,
      attentionLoadRatio: input.attentionLoadRatio,
      passiveCoverage: round(input.passiveCoverage, 3),
    },
    reasons: reasonCandidates
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 3)
      .map((reason) => ({
        ...reason,
        contribution: round(reason.contribution, 1),
        direction: Math.abs(reason.contribution) < 0.3
          ? "neutral"
          : reason.contribution > 0 ? "up" : "down",
      })),
  };
}

export function evaluateFocusIntegrityValidation(
  records: FocusIntegrityValidationRecord[],
): FocusIntegrityValidation {
  const valid = records.filter((record) =>
    Number.isFinite(record.predictedDelta) && Number.isFinite(record.observedDelta),
  );
  if (valid.length === 0) {
    return {
      sampleSize: 0,
      directionalAccuracy: null,
      maeLift: null,
      status: "collecting",
      gates: {
        minimumSample: false,
        directionalAccuracy: false,
        beatsNoChange: false,
      },
    };
  }

  const modelMae = mean(
    valid.map((record) => Math.abs(record.observedDelta - record.predictedDelta)),
  );
  const noChangeMae = mean(valid.map((record) => Math.abs(record.observedDelta)));
  const maeLift = noChangeMae > 0 ? (noChangeMae - modelMae) / noChangeMae : 0;
  const directionalAccuracy = mean(
    valid.map((record) => direction(record.predictedDelta) === direction(record.observedDelta) ? 1 : 0),
  );
  const gates = {
    minimumSample: valid.length >= FOCUS_INTEGRITY_VALIDATION_DAYS,
    directionalAccuracy: directionalAccuracy >= 0.6,
    beatsNoChange: maeLift >= 0.1,
  };

  return {
    sampleSize: valid.length,
    directionalAccuracy: round(directionalAccuracy, 4),
    maeLift: round(maeLift, 4),
    status: !gates.minimumSample
      ? "collecting"
      : gates.directionalAccuracy && gates.beatsNoChange
        ? "ready_for_review"
        : "needs_revision",
    gates,
  };
}
