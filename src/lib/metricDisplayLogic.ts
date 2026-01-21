/**
 * ============================================
 * NEUROLOOP PRO – METRIC DISPLAY LOGIC
 * ============================================
 * 
 * Determines what to show inside metric rings:
 * - Status label (qualitative) when status changed or no delta data
 * - Delta percentage when status is stable but delta is significant
 */

import { MetricLevel } from "./metricStatusLabels";

export interface MetricDisplayInfo {
  text: string;
  type: "status" | "delta";
}

/**
 * Determines the most interesting display for a metric.
 * 
 * Logic:
 * 1. If no delta data available → show status label
 * 2. If status level changed from last week → show status label (interesting change)
 * 3. If delta is significant (>±5%) → show delta (shows progress)
 * 4. Otherwise → show status label (default)
 */
export function getMetricDisplayInfo(
  statusLabel: string,
  currentLevel: MetricLevel,
  previousLevel: MetricLevel | null,
  weeklyDelta: number | null
): MetricDisplayInfo {
  // No delta data → show status
  if (weeklyDelta === null) {
    return { text: statusLabel, type: "status" };
  }
  
  // Status level changed → show status (interesting qualitative change)
  if (previousLevel !== null && currentLevel !== previousLevel) {
    return { text: statusLabel, type: "status" };
  }
  
  // Delta is significant (>±5%) → show delta
  if (Math.abs(weeklyDelta) >= 5) {
    const sign = weeklyDelta > 0 ? "+" : "";
    return { text: `${sign}${Math.round(weeklyDelta)}%`, type: "delta" };
  }
  
  // Default → show status
  return { text: statusLabel, type: "status" };
}

/**
 * Metric definitions for display below metric names.
 * Keep these brief and action-oriented.
 */
export const METRIC_DEFINITIONS = {
  sharpness: "Fast thinking capacity",
  readiness: "Sustained focus potential",
  recovery: "Mental energy reserve",
  reasoningQuality: "Depth of thought",
} as const;
