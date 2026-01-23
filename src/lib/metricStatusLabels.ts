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
 * Sharpness (0-100)
 * Reflects current cognitive clarity and intuitive processing capacity.
 * Higher = sharper, more ready for demanding tasks.
 */
export function getSharpnessStatus(value: number): MetricStatus {
  if (value >= 80) return { level: "high", label: "Peak" };
  if (value >= 65) return { level: "good", label: "Sharp" };
  if (value >= 50) return { level: "moderate", label: "Steady" };
  if (value >= 35) return { level: "low", label: "Foggy" };
  return { level: "very_low", label: "Drained" };
}

/**
 * Readiness (0-100)
 * Reflects capacity for sustained deliberate cognitive work.
 * Combines recovery, reasoning capacity, and focus stability.
 */
export function getReadinessStatus(value: number): MetricStatus {
  if (value >= 80) return { level: "high", label: "Optimal" };
  if (value >= 65) return { level: "good", label: "Ready" };
  if (value >= 50) return { level: "moderate", label: "Baseline" };
  if (value >= 35) return { level: "low", label: "Limited" };
  return { level: "very_low", label: "Depleted" };
}

/**
 * Recovery (0-100)
 * Reflects attentional restoration and cognitive reserve.
 * Built through detox and walking activities.
 */
export function getRecoveryStatus(value: number): MetricStatus {
  if (value >= 80) return { level: "high", label: "Restored" };
  if (value >= 65) return { level: "good", label: "Recovered" };
  if (value >= 50) return { level: "moderate", label: "Partial" };
  if (value >= 35) return { level: "low", label: "Fatigued" };
  return { level: "very_low", label: "Depleted" };
}

/**
 * Reasoning Quality (0-100)
 * Reflects depth and quality of thought elaboration.
 * Built through S2 training, consistency, and task engagement.
 */
export function getReasoningQualityStatus(value: number): MetricStatus {
  if (value >= 80) return { level: "high", label: "Elite" };
  if (value >= 60) return { level: "good", label: "High" };
  if (value >= 40) return { level: "moderate", label: "Developing" };
  if (value >= 25) return { level: "low", label: "Building" };
  return { level: "very_low", label: "Emerging" };
}
