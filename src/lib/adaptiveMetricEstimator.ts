/**
 * Explainable adaptive daily-state estimator.
 *
 * This is deliberately a small, inspectable model rather than an opaque AI
 * score. It fits a ridge regression around conservative population priors and
 * gradually lets the user's own objective outcomes move the coefficients.
 * The result is shadow-only: canonical Home metrics remain the active values
 * until time-forward validation shows a real improvement.
 */

export const ADAPTIVE_METRIC_MODEL_VERSION = "adaptive-daily-state-ridge-v1-shadow";

export type AdaptiveEstimateStatus = "learning" | "emerging" | "personalized";

export interface AdaptiveContextPoint {
  date: string;
  health: number | null;
  wearable: number | null;
  attention: number | null;
  schedule: number | null;
  /** Objective, non-manual outcome such as drill score or focus integrity. */
  outcome: number | null;
}

export interface AdaptiveMetricEstimate {
  modelVersion: typeof ADAPTIVE_METRIC_MODEL_VERSION;
  mode: "shadow";
  predictedDailyState: number;
  fixedDailyState: number;
  signalCoverage: number;
  confidence: number;
  uncertainty: number;
  outcomeSampleCount: number;
  observedOutcome: number | null;
  status: AdaptiveEstimateStatus;
  coefficients: {
    intercept: number;
    health: number;
    wearable: number;
    attention: number;
    schedule: number;
    persistence: number;
  };
  features: {
    health: number | null;
    wearable: number | null;
    attention: number | null;
    schedule: number | null;
    previousOutcome: number | null;
  };
}

const PRIOR = [50, 12, 14, 8, 6, 10] as const;
const RIDGE_STRENGTH = 18;
const PERSONALIZED_OUTCOMES = 21;
const EMERGING_OUTCOMES = 7;

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

function centered(value: number | null): number {
  return value === null ? 0 : (clamp(value) - 50) / 50;
}

function featureVector(point: AdaptiveContextPoint, previousOutcome: number | null): number[] {
  return [
    1,
    centered(point.health),
    centered(point.wearable),
    centered(point.attention),
    centered(point.schedule),
    centered(previousOutcome),
  ];
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

function fitWithPrior(rows: Array<{ x: number[]; y: number }>): number[] {
  const size = PRIOR.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  const vector = Array(size).fill(0);

  for (const row of rows) {
    for (let i = 0; i < size; i++) {
      vector[i] += row.x[i] * row.y;
      for (let j = 0; j < size; j++) matrix[i][j] += row.x[i] * row.x[j];
    }
  }

  // Regularize toward an explainable population prior, not toward zero.
  for (let i = 0; i < size; i++) {
    const strength = i === 0 ? RIDGE_STRENGTH * 0.35 : RIDGE_STRENGTH;
    matrix[i][i] += strength;
    vector[i] += strength * PRIOR[i];
  }

  return solveLinearSystem(matrix, vector) ?? [...PRIOR];
}

function dot(coefficients: number[], features: number[]): number {
  return coefficients.reduce((sum, coefficient, index) => sum + coefficient * features[index], 0);
}

function signalCoverage(point: AdaptiveContextPoint): number {
  return round(
    (point.health === null ? 0 : 0.30) +
      (point.wearable === null ? 0 : 0.35) +
      (point.attention === null ? 0 : 0.20) +
      (point.schedule === null ? 0 : 0.15),
    4,
  );
}

function previousObservedOutcome(
  sorted: AdaptiveContextPoint[],
  beforeIndex: number,
): number | null {
  for (let index = beforeIndex - 1; index >= 0; index--) {
    const outcome = finite(sorted[index].outcome);
    if (outcome !== null) return clamp(outcome);
  }
  return null;
}

/**
 * Fits only on dates before `currentDate`; today's outcome is retained for
 * later evaluation and can never leak into today's prediction.
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
    health: null,
    wearable: null,
    attention: null,
    schedule: null,
    outcome: null,
  };

  const trainingRows: Array<{ x: number[]; y: number }> = [];
  sorted.forEach((point, index) => {
    const outcome = finite(point.outcome);
    if (point.date >= args.currentDate || outcome === null) return;
    trainingRows.push({
      x: featureVector(point, previousObservedOutcome(sorted, index)),
      y: clamp(outcome),
    });
  });

  const coefficients = fitWithPrior(trainingRows);
  const currentIndex = sorted.findIndex((point) => point.date === args.currentDate);
  const previousOutcome = previousObservedOutcome(
    sorted,
    currentIndex >= 0 ? currentIndex : sorted.length,
  );
  const prediction = clamp(dot(coefficients, featureVector(current, previousOutcome)));
  const coverage = signalCoverage(current);
  const maturity = clamp(trainingRows.length / PERSONALIZED_OUTCOMES, 0, 1);
  const residuals = trainingRows.map((row) => row.y - dot(coefficients, row.x));
  const rmse = residuals.length > 0
    ? Math.sqrt(residuals.reduce((sum, residual) => sum + residual ** 2, 0) / residuals.length)
    : 18;
  const confidence = clamp(
    coverage * (0.2 + 0.8 * maturity) * clamp(1 - rmse / 50, 0.35, 1),
    0,
    1,
  );
  const uncertainty = clamp(
    10 + (1 - coverage) * 18 + (1 - maturity) * 12 + Math.min(12, rmse * 0.35),
    8,
    45,
  );
  const status: AdaptiveEstimateStatus = trainingRows.length >= PERSONALIZED_OUTCOMES
    ? "personalized"
    : trainingRows.length >= EMERGING_OUTCOMES ? "emerging" : "learning";

  return {
    modelVersion: ADAPTIVE_METRIC_MODEL_VERSION,
    mode: "shadow",
    predictedDailyState: round(prediction, 1),
    fixedDailyState: round(clamp(args.fixedDailyState), 1),
    signalCoverage: coverage,
    confidence: round(confidence, 4),
    uncertainty: round(uncertainty, 1),
    outcomeSampleCount: trainingRows.length,
    observedOutcome: finite(current.outcome),
    status,
    coefficients: {
      intercept: round(coefficients[0], 3),
      health: round(coefficients[1], 3),
      wearable: round(coefficients[2], 3),
      attention: round(coefficients[3], 3),
      schedule: round(coefficients[4], 3),
      persistence: round(coefficients[5], 3),
    },
    features: {
      health: finite(current.health),
      wearable: finite(current.wearable),
      attention: finite(current.attention),
      schedule: finite(current.schedule),
      previousOutcome,
    },
  };
}

