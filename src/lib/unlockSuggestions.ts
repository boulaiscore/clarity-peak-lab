/**
 * Unlock Suggestions Engine
 * 
 * Generates concrete, actionable suggestions to restore eligibility
 * for withheld tasks based on which metrics are below threshold.
 */

export type MetricType = "sharpness" | "readiness" | "recovery";

export interface UnlockSuggestion {
  id: string;
  action: string;
  estimatedTime: string;
  targetMetric: MetricType;
  estimatedGain: number;
  actionType?: "focus" | "detox" | "rest" | "delay";
}

export interface MetricGap {
  metric: MetricType;
  current: number;
  required: number;
  gap: number;
}

// Suggestion pools by metric type
const SHARPNESS_SUGGESTIONS: UnlockSuggestion[] = [
  {
    id: "focus-challenge",
    action: "Complete a 10-min Focus Challenge",
    estimatedTime: "10-15 min",
    targetMetric: "sharpness",
    estimatedGain: 8,
    actionType: "focus",
  },
  {
    id: "breathing-reset",
    action: "5-minute breathing reset",
    estimatedTime: "5 min",
    targetMetric: "sharpness",
    estimatedGain: 5,
    actionType: "rest",
  },
  {
    id: "low-distraction-walk",
    action: "20-30 min low-distraction walk",
    estimatedTime: "20-30 min",
    targetMetric: "sharpness",
    estimatedGain: 10,
    actionType: "detox",
  },
  {
    id: "no-context-switch",
    action: "90 min without context switching",
    estimatedTime: "90 min",
    targetMetric: "sharpness",
    estimatedGain: 12,
    actionType: "focus",
  },
];

const READINESS_SUGGESTIONS: UnlockSuggestion[] = [
  {
    id: "delay-task",
    action: "Delay task by 2-4 hours",
    estimatedTime: "2-4 hours",
    targetMetric: "readiness",
    estimatedGain: 8,
    actionType: "delay",
  },
  {
    id: "short-rest",
    action: "Short nap or eyes-closed rest",
    estimatedTime: "10-20 min",
    targetMetric: "readiness",
    estimatedGain: 10,
    actionType: "rest",
  },
  {
    id: "complete-low-demand",
    action: "Complete a LOW-demand task first",
    estimatedTime: "15-20 min",
    targetMetric: "readiness",
    estimatedGain: 6,
    actionType: "focus",
  },
  {
    id: "avoid-heavy-input",
    action: "Avoid heavy cognitive input for next block",
    estimatedTime: "60-90 min",
    targetMetric: "readiness",
    estimatedGain: 8,
    actionType: "rest",
  },
];

const RECOVERY_SUGGESTIONS: UnlockSuggestion[] = [
  {
    id: "detox-session",
    action: "30-60 min Detox (no input)",
    estimatedTime: "30-60 min",
    targetMetric: "recovery",
    estimatedGain: 12,
    actionType: "detox",
  },
  {
    id: "light-movement",
    action: "Light physical movement (walk, stretch)",
    estimatedTime: "15-20 min",
    targetMetric: "recovery",
    estimatedGain: 8,
    actionType: "detox",
  },
  {
    id: "no-screens",
    action: "No screens for 45 min",
    estimatedTime: "45 min",
    targetMetric: "recovery",
    estimatedGain: 10,
    actionType: "detox",
  },
  {
    id: "early-shutdown",
    action: "Early shutdown of tasks for the day",
    estimatedTime: "Rest of day",
    targetMetric: "recovery",
    estimatedGain: 15,
    actionType: "rest",
  },
];

/**
 * Calculate gaps between current and required metrics
 */
export function calculateMetricGaps(
  sharpness: number,
  readiness: number,
  recovery: number,
  requiredSharpness?: number,
  requiredReadiness?: number,
  requiredRecovery?: number,
  requiredS2Capacity?: number,
  requiredS1Buffer?: number
): MetricGap[] {
  const gaps: MetricGap[] = [];
  const s2Capacity = Math.round(0.6 * sharpness + 0.4 * readiness);
  const s1Buffer = recovery;
  
  // Check S1Buffer (Recovery) gap
  if (requiredS1Buffer !== undefined && s1Buffer < requiredS1Buffer) {
    gaps.push({
      metric: "recovery",
      current: s1Buffer,
      required: requiredS1Buffer,
      gap: requiredS1Buffer - s1Buffer,
    });
  }
  
  // Check direct Sharpness requirement
  if (requiredSharpness !== undefined && sharpness < requiredSharpness) {
    gaps.push({
      metric: "sharpness",
      current: sharpness,
      required: requiredSharpness,
      gap: requiredSharpness - sharpness,
    });
  }
  
  // Check direct Readiness requirement
  if (requiredReadiness !== undefined && readiness < requiredReadiness) {
    gaps.push({
      metric: "readiness",
      current: readiness,
      required: requiredReadiness,
      gap: requiredReadiness - readiness,
    });
  }
  
  // Check S2Capacity gap - need to improve sharpness and/or readiness
  if (requiredS2Capacity !== undefined && s2Capacity < requiredS2Capacity) {
    const s2Gap = requiredS2Capacity - s2Capacity;
    // Prioritize sharpness since it has 0.6 weight
    if (!gaps.some(g => g.metric === "sharpness")) {
      gaps.push({
        metric: "sharpness",
        current: sharpness,
        required: sharpness + Math.ceil(s2Gap / 0.6),
        gap: Math.ceil(s2Gap / 0.6),
      });
    }
    if (!gaps.some(g => g.metric === "readiness") && s2Gap > 10) {
      gaps.push({
        metric: "readiness",
        current: readiness,
        required: readiness + Math.ceil(s2Gap / 0.4),
        gap: Math.ceil(s2Gap / 0.4),
      });
    }
  }
  
  return gaps;
}

/**
 * Generate unlock suggestions based on metric gaps
 * Returns max 3 suggestions, prioritized by impact
 */
export function generateUnlockSuggestions(gaps: MetricGap[]): UnlockSuggestion[] {
  const suggestions: UnlockSuggestion[] = [];
  
  // Sort gaps by size (largest first)
  const sortedGaps = [...gaps].sort((a, b) => b.gap - a.gap);
  
  for (const gap of sortedGaps) {
    let pool: UnlockSuggestion[] = [];
    
    switch (gap.metric) {
      case "sharpness":
        pool = SHARPNESS_SUGGESTIONS;
        break;
      case "readiness":
        pool = READINESS_SUGGESTIONS;
        break;
      case "recovery":
        pool = RECOVERY_SUGGESTIONS;
        break;
    }
    
    // Find suggestions that could cover the gap
    const relevantSuggestions = pool
      .filter(s => !suggestions.some(existing => existing.id === s.id))
      .sort((a, b) => {
        // Prefer suggestions that can cover the gap with reasonable time
        const aCovers = a.estimatedGain >= gap.gap;
        const bCovers = b.estimatedGain >= gap.gap;
        if (aCovers && !bCovers) return -1;
        if (!aCovers && bCovers) return 1;
        return b.estimatedGain - a.estimatedGain;
      });
    
    if (relevantSuggestions.length > 0 && suggestions.length < 3) {
      suggestions.push(relevantSuggestions[0]);
    }
  }
  
  return suggestions.slice(0, 3);
}

/**
 * Generate estimated unlock window text
 */
export function getUnlockWindow(gaps: MetricGap[]): string {
  const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);
  
  if (totalGap <= 10) {
    return "Estimated unlock: within 1-2 hours";
  } else if (totalGap <= 20) {
    return "Estimated unlock: later today";
  } else if (totalGap <= 35) {
    return "Estimated unlock: tomorrow morning";
  } else {
    return "Estimated unlock: after sustained recovery";
  }
}

/**
 * Format metric name for display
 */
export function formatMetricName(metric: MetricType): string {
  switch (metric) {
    case "sharpness":
      return "Sharpness";
    case "readiness":
      return "Readiness";
    case "recovery":
      return "Recovery";
  }
}
