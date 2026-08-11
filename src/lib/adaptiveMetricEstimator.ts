/**
 * Explainable, domain-specific adaptive cognitive-state estimator.
 *
 * The model fits attention and executive outcomes separately around versioned
 * literature-informed priors. Features must be standardized, favourably
 * oriented and constructed only from information available before an outcome.
 * It remains shadow-only: canonical Home metrics are not mutated here.
 */

import {
  ADAPTIVE_FEATURE_IDS,
  SCIENTIFIC_DOMAIN_PRIORS,
  SCIENTIFIC_PRIOR_VERSION,
  type AdaptiveDomain,
  type AdaptiveFeatureId,
} from "@/lib/scientificCognitivePriors";

export const ADAPTIVE_METRIC_MODEL_VERSION = "adaptive-domain-ridge-v2-shadow";
export type AdaptiveEstimateStatus = "learning" | "emerging" | "personalized";

type NullableFeatureMap = Partial<Record<AdaptiveFeatureId, number | null>>;
type FeatureReliabilityMap = Partial<Record<AdaptiveFeatureId, number>>;
type NullableOutcomeMap = Partial<Record<AdaptiveDomain, number | null>>;

export interface AdaptiveContextPoint {
  date: string;
  /** Approximately z-scaled to [-2, 2], with higher always favourable. */
  features: NullableFeatureMap;
  /** Measurement confidence for each observed feature, from 0 to 1. */
  reliability?: FeatureReliabilityMap;
  /** Objective outcomes, separated by cognitive domain. */
  outcomes: NullableOutcomeMap;
}

export interface AdaptiveDomainEstimate {
  predictedScore: number;
  observedOutcome: number | null;
  outcomeSampleCount: number;
  featureCoverage: number;
  confidence: number;
  uncertainty: number;
  rmse: number | null;
  status: AdaptiveEstimateStatus;
  coefficients: Record<"intercept" | "persistence" | AdaptiveFeatureId, number>;
}

export interface AdaptiveMetricEstimate {
  modelVersion: typeof ADAPTIVE_METRIC_MODEL_VERSION;
  evidenceVersion: typeof SCIENTIFIC_PRIOR_VERSION;
  mode: "shadow";
  predictedDailyState: number;
  fixedDailyState: number;
  signalCoverage: number;
  confidence: number;
  uncertainty: number;
  outcomeSampleCount: number;
  observedOutcome: number | null;
  status: AdaptiveEstimateStatus;
  domains: Record<AdaptiveDomain, AdaptiveDomainEstimate>;
  coefficients: Record<"intercept" | "persistence" | AdaptiveFeatureId, number>;
  features: NullableFeatureMap;
  featureReliability: FeatureReliabilityMap;
}

const DOMAIN_BLEND: Record<AdaptiveDomain, number> = {
  attention: 0.55,
  executive: 0.45,
};
const PERSONALIZED_OUTCOMES = 45;
const EMERGING_OUTCOMES = 14;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function finite(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
}

function statusFor(sampleCount: number): AdaptiveEstimateStatus {
  if (sampleCount >= PERSONALIZED_OUTCOMES) return "personalized";
  if (sampleCount >= EMERGING_OUTCOMES) return "emerging";
  return "learning";
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] | null {
  const n = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < n; column++) {
    let pivot = column;
    for (let row = column + 1; row < n; row++) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) {
        pivot = row;
      }
    }
    if (Math.abs(augmented[pivot][column]) < 1e-9) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];

    const divisor = augmented[column][column];
    for (let j = column; j <= n; j++) augmented[column][j] /= divisor;

    for (let row = 0; row < n; row++) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let j = column; j <= n; j++) {
        augmented[row][j] -= factor * augmented[column][j];
      }
    }
  }

  return augmented.map((row) => row[n]);
}

function previousObservedOutcome(
  sorted: AdaptiveContextPoint[],
  beforeIndex: number,
  domain: AdaptiveDomain,
): number | null {
  for (let index = beforeIndex - 1; index >= 0; index--) {
    const outcome = finite(sorted[index].outcomes[domain]);
    if (outcome !== null) return clamp(outcome);
  }
  return null;
}

function featureVector(
  point: AdaptiveContextPoint,
  previousOutcome: number | null,
): number[] {
  return [
    1,
    ...ADAPTIVE_FEATURE_IDS.map((id) => {
      const value = finite(point.features[id]);
      const reliability = value === null ? 0 : clamp(point.reliability?.[id] ?? 1, 0, 1);
      return value === null ? 0 : clamp(value, -2, 2) * reliability;
    }),
    previousOutcome === null ? 0 : clamp((previousOutcome - 50) / 15, -2, 2),
  ];
}

function priorVector(domain: AdaptiveDomain): number[] {
  const domainPrior = SCIENTIFIC_DOMAIN_PRIORS[domain];
  return [
    domainPrior.intercept,
    ...ADAPTIVE_FEATURE_IDS.map((id) => domainPrior.features[id].coefficient),
    domainPrior.persistence.coefficient,
  ];
}

function regularizationVector(domain: AdaptiveDomain): number[] {
  const domainPrior = SCIENTIFIC_DOMAIN_PRIORS[domain];
  return [
    5,
    ...ADAPTIVE_FEATURE_IDS.map((id) => domainPrior.features[id].regularization),
    domainPrior.persistence.regularization,
  ];
}

function fitWithPrior(
  domain: AdaptiveDomain,
  rows: Array<{ x: number[]; y: number }>,
): number[] {
  const prior = priorVector(domain);
  const penalties = regularizationVector(domain);
  const size = prior.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  const vector = Array(size).fill(0);

  for (const row of rows) {
    for (let i = 0; i < size; i++) {
      vector[i] += row.x[i] * row.y;
      for (let j = 0; j < size; j++) matrix[i][j] += row.x[i] * row.x[j];
    }
  }

  for (let i = 0; i < size; i++) {
    matrix[i][i] += penalties[i];
    vector[i] += penalties[i] * prior[i];
  }

  return solveLinearSystem(matrix, vector) ?? prior;
}

function dot(coefficients: number[], features: number[]): number {
  return coefficients.reduce((sum, coefficient, index) => sum + coefficient * features[index], 0);
}

function featureCoverage(point: AdaptiveContextPoint, domain: AdaptiveDomain): number {
  const domainPrior = SCIENTIFIC_DOMAIN_PRIORS[domain];
  const weights = ADAPTIVE_FEATURE_IDS.map((id) =>
    Math.max(0.15, Math.abs(domainPrior.features[id].coefficient)),
  );
  const total = weights.reduce((sum, value) => sum + value, 0);
  const observed = ADAPTIVE_FEATURE_IDS.reduce((sum, id, index) => {
    if (finite(point.features[id]) === null) return sum;
    return sum + weights[index] * clamp(point.reliability?.[id] ?? 1, 0, 1);
  }, 0);
  return total > 0 ? clamp(observed / total, 0, 1) : 0;
}

function coefficientsRecord(
  coefficients: number[],
): Record<"intercept" | "persistence" | AdaptiveFeatureId, number> {
  const entries: Array<[string, number]> = [
    ["intercept", round(coefficients[0], 3)],
    ...ADAPTIVE_FEATURE_IDS.map((id, index) => [id, round(coefficients[index + 1], 3)] as [string, number]),
    ["persistence", round(coefficients[coefficients.length - 1], 3)],
  ];
  return Object.fromEntries(entries) as Record<"intercept" | "persistence" | AdaptiveFeatureId, number>;
}

function estimateDomain(
  sorted: AdaptiveContextPoint[],
  current: AdaptiveContextPoint,
  currentIndex: number,
  currentDate: string,
  domain: AdaptiveDomain,
): AdaptiveDomainEstimate {
  const trainingRows: Array<{ x: number[]; y: number }> = [];
  sorted.forEach((point, index) => {
    const outcome = finite(point.outcomes[domain]);
    if (point.date >= currentDate || outcome === null) return;
    trainingRows.push({
      x: featureVector(point, previousObservedOutcome(sorted, index, domain)),
      y: clamp(outcome),
    });
  });

  const coefficients = fitWithPrior(domain, trainingRows);
  const previousOutcome = previousObservedOutcome(sorted, currentIndex, domain);
  const prediction = clamp(dot(coefficients, featureVector(current, previousOutcome)));
  const coverage = featureCoverage(current, domain);
  const maturity = clamp(trainingRows.length / PERSONALIZED_OUTCOMES, 0, 1);
  const residuals = trainingRows.map((row) => row.y - dot(coefficients, row.x));
  const rmse = residuals.length > 0
    ? Math.sqrt(residuals.reduce((sum, residual) => sum + residual ** 2, 0) / residuals.length)
    : null;
  const residualFactor = rmse === null ? 0.55 : clamp(1 - rmse / 45, 0.3, 1);
  const confidence = clamp(coverage * (0.15 + 0.85 * maturity) * residualFactor, 0, 1);
  const uncertainty = clamp(
    8 + (1 - coverage) * 14 + (1 - maturity) * 14 + Math.min(14, (rmse ?? 18) * 0.4),
    8,
    45,
  );

  return {
    predictedScore: round(prediction, 1),
    observedOutcome: finite(current.outcomes[domain]),
    outcomeSampleCount: trainingRows.length,
    featureCoverage: round(coverage, 4),
    confidence: round(confidence, 4),
    uncertainty: round(uncertainty, 1),
    rmse: rmse === null ? null : round(rmse, 2),
    status: statusFor(trainingRows.length),
    coefficients: coefficientsRecord(coefficients),
  };
}

function blendDomains(
  domains: Record<AdaptiveDomain, AdaptiveDomainEstimate>,
  key: "predictedScore" | "featureCoverage" | "confidence" | "uncertainty",
): number {
  return (Object.keys(DOMAIN_BLEND) as AdaptiveDomain[]).reduce(
    (sum, domain) => sum + DOMAIN_BLEND[domain] * domains[domain][key],
    0,
  );
}

/**
 * Fits exclusively on dates before `currentDate`. Current-day outcomes are
 * retained for later evaluation but can never enter the current prediction.
 */
export function estimateAdaptiveDailyState(args: {
  points: AdaptiveContextPoint[];
  currentDate: string;
  fixedDailyState: number;
}): AdaptiveMetricEstimate {
  const sorted = [...args.points]
    .filter((point) => /^\d{4}-\d{2}-\d{2}$/.test(point.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.find((point) => point.date === args.currentDate) ?? {
    date: args.currentDate,
    features: {},
    reliability: {},
    outcomes: {},
  };
  const foundIndex = sorted.findIndex((point) => point.date === args.currentDate);
  const currentIndex = foundIndex >= 0 ? foundIndex : sorted.length;
  const domains = {
    attention: estimateDomain(sorted, current, currentIndex, args.currentDate, "attention"),
    executive: estimateDomain(sorted, current, currentIndex, args.currentDate, "executive"),
  };
  const prediction = blendDomains(domains, "predictedScore");
  const observed = (Object.keys(DOMAIN_BLEND) as AdaptiveDomain[]).flatMap((domain) => {
    const value = domains[domain].observedOutcome;
    return value === null ? [] : [{ value, weight: DOMAIN_BLEND[domain] }];
  });
  const observedWeight = observed.reduce((sum, item) => sum + item.weight, 0);
  const observedOutcome = observedWeight > 0
    ? observed.reduce((sum, item) => sum + item.value * item.weight, 0) / observedWeight
    : null;
  const aggregateCoefficients = coefficientsRecord([
    DOMAIN_BLEND.attention * domains.attention.coefficients.intercept +
      DOMAIN_BLEND.executive * domains.executive.coefficients.intercept,
    ...ADAPTIVE_FEATURE_IDS.map((id) =>
      DOMAIN_BLEND.attention * domains.attention.coefficients[id] +
      DOMAIN_BLEND.executive * domains.executive.coefficients[id],
    ),
    DOMAIN_BLEND.attention * domains.attention.coefficients.persistence +
      DOMAIN_BLEND.executive * domains.executive.coefficients.persistence,
  ]);
  const status: AdaptiveEstimateStatus =
    domains.attention.status === "personalized" && domains.executive.status === "personalized"
      ? "personalized"
      : domains.attention.status !== "learning" || domains.executive.status !== "learning"
        ? "emerging"
        : "learning";

  return {
    modelVersion: ADAPTIVE_METRIC_MODEL_VERSION,
    evidenceVersion: SCIENTIFIC_PRIOR_VERSION,
    mode: "shadow",
    predictedDailyState: round(prediction, 1),
    fixedDailyState: round(clamp(args.fixedDailyState), 1),
    signalCoverage: round(blendDomains(domains, "featureCoverage"), 4),
    confidence: round(blendDomains(domains, "confidence"), 4),
    uncertainty: round(blendDomains(domains, "uncertainty"), 1),
    outcomeSampleCount: domains.attention.outcomeSampleCount + domains.executive.outcomeSampleCount,
    observedOutcome: observedOutcome === null ? null : round(observedOutcome, 1),
    status,
    domains,
    coefficients: aggregateCoefficients,
    features: current.features,
    featureReliability: current.reliability ?? {},
  };
}

