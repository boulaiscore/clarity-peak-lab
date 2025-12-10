// ============= Fast/Slow Thinking Systems (Kahneman Dual-Process Model) =============

import { CognitiveMetricsSnapshot } from "./cognitiveMetrics";

export interface ThinkingSystemScore {
  score: number; // 0-100
  delta: number; // change from previous
  metricsUsed: string[];
  level: "low" | "moderate" | "high" | "elite";
}

export interface ThinkingSystemsResult {
  fast: ThinkingSystemScore;
  slow: ThinkingSystemScore;
}

/**
 * Fast Thinking System (System 1)
 * - Intuitive, rapid, pattern-based, perceptual
 * - Trained by: Focus Arena fast drills, Creativity Hub fast-divergent drills
 */
function computeFastSystemScore(snapshot: CognitiveMetricsSnapshot): { score: number; metricsUsed: string[] } {
  const metrics: { value: number; name: string }[] = [];
  
  // Fast thinking direct score
  if (snapshot.fastThinkingScoreRaw !== undefined) {
    metrics.push({ value: snapshot.fastThinkingScoreRaw, name: "fastThinkingScore" });
  }
  
  // Reaction time (inverse - lower is better, normalized to 0-100)
  if (snapshot.reactionTimeAvgMs !== undefined) {
    // Normalize: 200ms = 100, 500ms = 0
    const reactionScore = Math.max(0, Math.min(100, 100 - ((snapshot.reactionTimeAvgMs - 200) / 3)));
    metrics.push({ value: reactionScore, name: "reactionSpeed" });
  }
  
  // Focus stability contributes to fast pattern recognition
  if (snapshot.focusStabilityRaw !== undefined) {
    metrics.push({ value: snapshot.focusStabilityRaw * 0.7, name: "visualProcessingSpeed" });
  }
  
  // Creativity contributes to fast intuitive leaps
  if (snapshot.creativityRaw !== undefined) {
    metrics.push({ value: snapshot.creativityRaw * 0.5, name: "creativeFluencyFast" });
  }

  if (metrics.length === 0) {
    return { score: 50, metricsUsed: [] };
  }

  const totalWeight = metrics.length;
  const score = metrics.reduce((sum, m) => sum + m.value, 0) / totalWeight;
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    metricsUsed: metrics.map(m => m.name)
  };
}

/**
 * Slow Thinking System (System 2)
 * - Deliberate, rule-based, analytic, effortful
 * - Trained by: Focus Arena slow drills, Critical Reasoning, Creativity slow drills
 */
function computeSlowSystemScore(snapshot: CognitiveMetricsSnapshot): { score: number; metricsUsed: string[] } {
  const metrics: { value: number; name: string }[] = [];
  
  // Slow thinking direct score
  if (snapshot.slowThinkingScoreRaw !== undefined) {
    metrics.push({ value: snapshot.slowThinkingScoreRaw, name: "slowThinkingScore" });
  }
  
  // Reasoning accuracy - core System 2 metric
  if (snapshot.reasoningAccuracy !== undefined) {
    metrics.push({ value: snapshot.reasoningAccuracy * 100, name: "reasoningStrength" });
  }
  
  // Clarity - conceptual precision
  if (snapshot.clarityScoreRaw !== undefined) {
    metrics.push({ value: snapshot.clarityScoreRaw, name: "clarityScore" });
  }
  
  // Decision quality - structured decision-making
  if (snapshot.decisionQualityRaw !== undefined) {
    metrics.push({ value: snapshot.decisionQualityRaw, name: "executiveControl" });
  }
  
  // Philosophical depth - deep reasoning
  if (snapshot.philosophicalDepthRaw !== undefined) {
    metrics.push({ value: snapshot.philosophicalDepthRaw * 0.8, name: "cognitiveFlexibility" });
  }
  
  // Focus stability - sustained attention for deliberate thinking
  if (snapshot.focusStabilityRaw !== undefined) {
    metrics.push({ value: snapshot.focusStabilityRaw * 0.6, name: "attentionStability" });
  }

  if (metrics.length === 0) {
    return { score: 50, metricsUsed: [] };
  }

  const totalWeight = metrics.length;
  const score = metrics.reduce((sum, m) => sum + m.value, 0) / totalWeight;
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    metricsUsed: metrics.map(m => m.name)
  };
}

function getLevel(score: number): "low" | "moderate" | "high" | "elite" {
  if (score >= 85) return "elite";
  if (score >= 70) return "high";
  if (score >= 50) return "moderate";
  return "low";
}

/**
 * Compute Fast/Slow Thinking Systems scores
 * Returns scores for both systems based on mapped metrics
 */
export function computeFastSlowSystems(
  snapshot: CognitiveMetricsSnapshot,
  previousSnapshot?: CognitiveMetricsSnapshot
): ThinkingSystemsResult {
  const fastResult = computeFastSystemScore(snapshot);
  const slowResult = computeSlowSystemScore(snapshot);
  
  // Calculate deltas if previous snapshot available
  let fastDelta = 0;
  let slowDelta = 0;
  
  if (previousSnapshot) {
    const prevFast = computeFastSystemScore(previousSnapshot);
    const prevSlow = computeSlowSystemScore(previousSnapshot);
    fastDelta = fastResult.score - prevFast.score;
    slowDelta = slowResult.score - prevSlow.score;
  }

  return {
    fast: {
      score: fastResult.score,
      delta: Math.round(fastDelta * 10) / 10,
      metricsUsed: fastResult.metricsUsed,
      level: getLevel(fastResult.score)
    },
    slow: {
      score: slowResult.score,
      delta: Math.round(slowDelta * 10) / 10,
      metricsUsed: slowResult.metricsUsed,
      level: getLevel(slowResult.score)
    }
  };
}

// ============= Neuro Lab Area Contributions =============

export interface AreaContribution {
  area: string;
  icon: string;
  fastContribution: number; // 0-100%
  slowContribution: number; // 0-100%
  description: string;
  fastExamples: string[];
  slowExamples: string[];
}

export const NEURO_LAB_AREA_CONTRIBUTIONS: AreaContribution[] = [
  {
    area: "Focus Arena",
    icon: "🎯",
    fastContribution: 70,
    slowContribution: 30,
    description: "Improves selective attention speed and controlled sustained focus.",
    fastExamples: ["Dot Target", "Go/No-Go", "Visual Search"],
    slowExamples: ["Rule Switch", "Category Switch", "Stroop"]
  },
  {
    area: "Critical Reasoning",
    icon: "🧠",
    fastContribution: 20,
    slowContribution: 80,
    description: "Deep System-2 development: logic, argument clarity, bias resistance.",
    fastExamples: ["Quick Pattern Recognition", "Sequence Flash"],
    slowExamples: ["Logic Puzzles", "Analogy Match", "Sequence Logic"]
  },
  {
    area: "Creativity Hub",
    icon: "✨",
    fastContribution: 50,
    slowContribution: 50,
    description: "Combines divergent insight (fast) with reframing and analogical reasoning (slow).",
    fastExamples: ["Visual Vibe", "Rapid Association", "Gestalt Completion"],
    slowExamples: ["Deep Analogies", "Structured Reframing", "Pattern Analysis"]
  }
];
