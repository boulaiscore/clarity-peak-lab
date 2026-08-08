/**
 * ============================================
 * NLOOP PRO – METRIC STATUS LABELS
 * ============================================
 * 
 * Provides consistent qualitative labels for all cognitive metrics.
 * Each metric has its own threshold logic based on its semantics.
 */

export type MetricLevel = "high" | "good" | "moderate" | "low" | "very_low";

export interface MetricStatus {
  level: MetricLevel;
  label: string;
}

/**
 * One qualitative scale for every 0–100 metric. The metric name and
 * explanatory sentence provide semantics; the level label never changes its
 * meaning between screens.
 */
export function getStandardMetricStatus(value: number): MetricStatus {
  if (value >= 80) return { level: "high", label: "Optimal" };
  if (value >= 65) return { level: "good", label: "Strong" };
  if (value >= 50) return { level: "moderate", label: "Moderate" };
  if (value >= 35) return { level: "low", label: "Low" };
  return { level: "very_low", label: "Very low" };
}

/**
 * Sharpness (0-100)
 * Reflects current cognitive clarity and intuitive processing capacity.
 * Higher = sharper, more ready for demanding tasks.
 */
export function getSharpnessStatus(value: number): MetricStatus {
  return getStandardMetricStatus(value);
}

/**
 * Readiness (0-100)
 * Reflects capacity for sustained deliberate cognitive work.
 * Combines recovery, reasoning capacity, and focus stability.
 */
export function getReadinessStatus(value: number): MetricStatus {
  return getStandardMetricStatus(value);
}

/**
 * Recovery (0-100)
 * Reflects attentional restoration and cognitive reserve.
 * Built through detox and walking activities.
 */
export function getRecoveryStatus(value: number): MetricStatus {
  return getStandardMetricStatus(value);
}

/**
 * Reasoning Quality (0-100)
 * Reflects depth and quality of thought elaboration.
 * Built through S2 training, consistency, and task engagement.
 */
export function getReasoningQualityStatus(value: number): MetricStatus {
  return getStandardMetricStatus(value);
}
