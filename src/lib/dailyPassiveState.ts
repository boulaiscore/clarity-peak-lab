import { clamp } from "@/lib/cognitiveEngine";

export type PassiveSignalId = "health" | "wearable" | "attention" | "schedule";
export type PassiveSignalStatus = "active" | "learning" | "off";
export type SignalCoverageLevel = "Basic" | "Enhanced" | "High";

export interface PassiveSignalInput {
  id: PassiveSignalId;
  label: string;
  score: number | null;
  confidence: number;
  updatedAt: string | null;
}
export interface PassiveSignalSource extends PassiveSignalInput {
  weight: number;
  status: PassiveSignalStatus;
  /** Observed share of the final Daily State after confidence renormalization. */
  effectiveWeight: number;
  /** Exact additive point contribution to Daily State. */
  scoreContribution: number;
}

export interface DailyPassiveState {
  /** State estimate on the shared 0-100 scale. */
  score: number;
  /** Share of the canonical passive input set currently covered (0-1). */
  coverage: number;
  level: SignalCoverageLevel;
  updatedAt: string | null;
  sources: PassiveSignalSource[];
}

export interface RelativeLoadEstimate {
  score: number | null;
  confidence: number;
  ratio: number | null;
  baselineDays: number;
}

export const PASSIVE_SIGNAL_WEIGHTS: Record<PassiveSignalId, number> = {
  health: 0.30,
  wearable: 0.35,
  attention: 0.20,
  schedule: 0.15,
};

function finite(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function sourceStatus(confidence: number): PassiveSignalStatus {
  if (confidence <= 0) return "off";
  return confidence >= 0.65 ? "active" : "learning";
}

function coverageLevel(coverage: number): SignalCoverageLevel {
  if (coverage >= 0.75) return "High";
  if (coverage >= 0.35) return "Enhanced";
  return "Basic";
}

/**
 * Builds the canonical daily-state estimate. Only observed sources enter the
 * score. Coverage controls how strongly that estimate may affect a metric, so
 * missing data reduces personalization without becoming a zero or a penalty.
 */
export function buildDailyPassiveState(inputs: PassiveSignalInput[]): DailyPassiveState {
  const byId = new Map(inputs.map((input) => [input.id, input]));
  const rawSources = (Object.keys(PASSIVE_SIGNAL_WEIGHTS) as PassiveSignalId[]).map((id) => {
    const input = byId.get(id);
    const score = finite(input?.score);
    const confidence = score === null ? 0 : clamp(input?.confidence ?? 0, 0, 1);
    return {
      id,
      label: input?.label ?? id,
      score,
      confidence,
      updatedAt: input?.updatedAt ?? null,
      weight: PASSIVE_SIGNAL_WEIGHTS[id],
      status: sourceStatus(confidence),
    };
  });

  const coverage = rawSources.reduce(
    (sum, source) => sum + source.weight * source.confidence,
    0,
  );
  const weightedScore = rawSources.reduce(
    (sum, source) => sum + source.weight * source.confidence * (source.score ?? 50),
    0,
  );
  const score = coverage > 0 ? weightedScore / coverage : 50;
  const sources: PassiveSignalSource[] = rawSources.map((source) => {
    const effectiveWeight = coverage > 0
      ? source.weight * source.confidence / coverage
      : 0;
    return {
      ...source,
      effectiveWeight: Math.round(effectiveWeight * 10_000) / 10_000,
      scoreContribution: Math.round(effectiveWeight * (source.score ?? 50) * 10) / 10,
    };
  });
  const timestamps = sources
    .map((source) => source.updatedAt)
    .filter((value): value is string => value !== null)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  return {
    score: Math.round(clamp(score, 0, 100) * 10) / 10,
    coverage: Math.round(clamp(coverage, 0, 1) * 100) / 100,
    level: coverageLevel(coverage),
    updatedAt: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null,
    sources,
  };
}

/**
 * Estimates load relative to the user's own previous days. A lighter partial
 * day never creates an artificial benefit; only load above the personal
 * baseline lowers the neutral score of 50.
 */
export function calculateRelativeLoadEstimate(args: {
  current: number | null | undefined;
  history: Array<number | null | undefined>;
  sourceConfidence: number;
  minimumBaseline?: number;
}): RelativeLoadEstimate {
  const current = finite(args.current);
  if (current === null) {
    return { score: null, confidence: 0, ratio: null, baselineDays: 0 };
  }

  const history = args.history
    .map(finite)
    .filter((value): value is number => value !== null && value >= 0);
  const baseline = median(history);
  const maturity = clamp(history.length / 7, 0, 1);
  const confidence = clamp(args.sourceConfidence, 0, 1) * (0.25 + 0.75 * maturity);

  if (baseline === null) {
    return {
      score: 50,
      confidence: Math.round(confidence * 100) / 100,
      ratio: null,
      baselineDays: 0,
    };
  }

  const denominator = Math.max(baseline, args.minimumBaseline ?? 15);
  const ratio = current / denominator;
  const overload = Math.max(0, ratio - 1);
  const score = 50 - Math.min(30, overload * 24);

  return {
    score: Math.round(score * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    ratio: Math.round(ratio * 100) / 100,
    baselineDays: history.length,
  };
}
