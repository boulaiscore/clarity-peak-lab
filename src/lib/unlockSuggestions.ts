/**
 * ============================================
 * UNLOCK SUGGESTIONS ENGINE v1.3
 * ============================================
 * 
 * Technical Manual v1.3 Aligned (Section 9.2)
 * 
 * Generates concrete, actionable suggestions to restore eligibility
 * for withheld tasks/games based on which metrics are below threshold.
 * 
 * SUGGESTION CATEGORIES:
 * - Missing Sharpness: S1-AE session, focus block, breathing reset
 * - Missing Readiness: delay, rest, low-load block
 * - Missing Recovery: detox, walk, no-screens
 * - Missing S2Capacity: CT session (if games enabled), else rest
 */

export type MetricType = "sharpness" | "readiness" | "recovery" | "s2Capacity";

export interface UnlockSuggestion {
  id: string;
  action: string;
  estimatedTime: string;
  targetMetric: MetricType;
  estimatedGain: number;
  actionType: "focus" | "detox" | "rest" | "delay" | "game";
  priority: number; // 1 = highest
}

export interface MetricGap {
  metric: MetricType;
  current: number;
  required: number;
  gap: number;
}

// Suggestion pools by metric type (v1.3 aligned)
const SHARPNESS_SUGGESTIONS: UnlockSuggestion[] = [
  {
    id: "s1-ae-session",
    action: "Complete an S1-AE Focus session",
    estimatedTime: "10-15 min",
    targetMetric: "sharpness",
    estimatedGain: 12,
    actionType: "game",
    priority: 1,
  },
  {
    id: "focus-block",
    action: "90-minute focused work block (no context switching)",
    estimatedTime: "90 min",
    targetMetric: "sharpness",
    estimatedGain: 10,
    actionType: "focus",
    priority: 2,
  },
  {
    id: "breathing-reset",
    action: "5-minute breathing reset",
    estimatedTime: "5 min",
    targetMetric: "sharpness",
    estimatedGain: 5,
    actionType: "rest",
    priority: 3,
  },
];

const READINESS_SUGGESTIONS: UnlockSuggestion[] = [
  {
    id: "delay-task",
    action: "Delay by 2-4 hours",
    estimatedTime: "2-4 hours",
    targetMetric: "readiness",
    estimatedGain: 10,
    actionType: "delay",
    priority: 1,
  },
  {
    id: "short-rest",
    action: "Short nap or eyes-closed rest (10-20 min)",
    estimatedTime: "10-20 min",
    targetMetric: "readiness",
    estimatedGain: 8,
    actionType: "rest",
    priority: 2,
  },
  {
    id: "low-load-block",
    action: "Low-cognitive-load activity for 60 min",
    estimatedTime: "60 min",
    targetMetric: "readiness",
    estimatedGain: 6,
    actionType: "rest",
    priority: 3,
  },
];

const RECOVERY_SUGGESTIONS: UnlockSuggestion[] = [
  {
    id: "detox-session",
    action: "30-60 min Detox session (no input)",
    estimatedTime: "30-60 min",
    targetMetric: "recovery",
    estimatedGain: 15,
    actionType: "detox",
    priority: 1,
  },
  {
    id: "walk-session",
    action: "20-30 min walk (no screens)",
    estimatedTime: "20-30 min",
    targetMetric: "recovery",
    estimatedGain: 10,
    actionType: "detox",
    priority: 2,
  },
  {
    id: "no-screens",
    action: "No screens for 45 min",
    estimatedTime: "45 min",
    targetMetric: "recovery",
    estimatedGain: 8,
    actionType: "detox",
    priority: 3,
  },
];

const S2_CAPACITY_SUGGESTIONS: UnlockSuggestion[] = [
  {
    id: "s2-ct-session",
    action: "Complete an S2-CT Reasoning session (if available)",
    estimatedTime: "15-20 min",
    targetMetric: "s2Capacity",
    estimatedGain: 10,
    actionType: "game",
    priority: 1,
  },
  {
    id: "build-sharpness-first",
    action: "Build Sharpness with S1-AE session first",
    estimatedTime: "10-15 min",
    targetMetric: "s2Capacity",
    estimatedGain: 8,
    actionType: "game",
    priority: 2,
  },
  {
    id: "rest-for-s2",
    action: "Rest and try again later",
    estimatedTime: "1-2 hours",
    targetMetric: "s2Capacity",
    estimatedGain: 6,
    actionType: "rest",
    priority: 3,
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
  
  // S2Capacity = 0.6 × Sharpness + 0.4 × Readiness
  const s2Capacity = Math.round(0.6 * sharpness + 0.4 * readiness);
  
  // S1Buffer = Recovery (they're the same in v1.3)
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
  
  // Check direct Recovery requirement
  if (requiredRecovery !== undefined && recovery < requiredRecovery) {
    // Only add if not already covered by S1Buffer
    if (!gaps.some(g => g.metric === "recovery")) {
      gaps.push({
        metric: "recovery",
        current: recovery,
        required: requiredRecovery,
        gap: requiredRecovery - recovery,
      });
    }
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
  
  // Check S2Capacity gap
  if (requiredS2Capacity !== undefined && s2Capacity < requiredS2Capacity) {
    gaps.push({
      metric: "s2Capacity",
      current: s2Capacity,
      required: requiredS2Capacity,
      gap: requiredS2Capacity - s2Capacity,
    });
  }
  
  return gaps;
}

/**
 * Generate unlock suggestions based on metric gaps (v1.3 aligned)
 * Returns max 3 suggestions, prioritized by impact
 */
export function generateUnlockSuggestions(
  gaps: MetricGap[],
  gamesEnabled: boolean = true
): UnlockSuggestion[] {
  const suggestions: UnlockSuggestion[] = [];
  
  // Sort gaps by size (largest first)
  const sortedGaps = [...gaps].sort((a, b) => b.gap - a.gap);
  
  for (const gap of sortedGaps) {
    let pool: UnlockSuggestion[] = [];
    
    switch (gap.metric) {
      case "sharpness":
        pool = gamesEnabled 
          ? SHARPNESS_SUGGESTIONS 
          : SHARPNESS_SUGGESTIONS.filter(s => s.actionType !== "game");
        break;
      case "readiness":
        pool = READINESS_SUGGESTIONS;
        break;
      case "recovery":
        pool = RECOVERY_SUGGESTIONS;
        break;
      case "s2Capacity":
        pool = gamesEnabled
          ? S2_CAPACITY_SUGGESTIONS
          : S2_CAPACITY_SUGGESTIONS.filter(s => s.actionType !== "game");
        break;
    }
    
    // Find best suggestion that isn't already added
    const relevantSuggestions = pool
      .filter(s => !suggestions.some(existing => existing.id === s.id))
      .sort((a, b) => a.priority - b.priority);
    
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
    case "s2Capacity":
      return "S2 Capacity";
  }
}

/**
 * Get unlock actions for games (v1.3)
 * Different from task unlock actions
 */
export function getGameUnlockActions(
  missingMetrics: { metric: string; gap: number }[]
): string[] {
  const actions: string[] = [];
  
  for (const { metric, gap } of missingMetrics) {
    switch (metric.toLowerCase()) {
      case "sharpness":
        if (gap > 10) {
          actions.push("Complete an S1-AE session");
        }
        actions.push("90-min focus block");
        break;
      case "readiness":
        actions.push("Delay by 2-4 hours");
        actions.push("Short rest (10-20 min)");
        break;
      case "recovery":
        actions.push("30-min detox session");
        actions.push("20-min walk");
        break;
    }
  }
  
  return [...new Set(actions)].slice(0, 3);
}
