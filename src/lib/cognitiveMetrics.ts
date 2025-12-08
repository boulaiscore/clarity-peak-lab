// ============= Cognitive Metrics Data Models & Formulas =============

export interface CognitiveMetricsSnapshot {
  id: string;
  userId: string;
  date: string;
  reactionTimeAvgMs: number;
  reasoningAccuracy: number; // 0–1
  clarityScoreRaw: number; // 0–100
  decisionQualityRaw: number; // 0–100
  creativityRaw: number; // 0–100
  focusStabilityRaw: number; // 0–100
  philosophicalDepthRaw: number; // 0–100
  fastThinkingScoreRaw: number; // 0–100
  slowThinkingScoreRaw: number; // 0–100
  sessionsCompleted: number;
  hrvScore?: number; // 0–100, optional from wearable
  sleepQualityScore?: number; // 0–100, optional
}

export interface CognitiveBaseline {
  userId: string;
  reactionTimeBaselineMs: number;
  reasoningAccuracyBaseline: number;
  clarityBaseline: number;
  decisionQualityBaseline: number;
  creativityBaseline: number;
  focusStabilityBaseline: number;
  fastThinkingBaseline: number;
  slowThinkingBaseline: number;
  brainAgeBaseline?: number;
}

export interface BrainFunctionScore {
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  status: "excellent" | "good" | "moderate" | "low";
}

export interface CognitiveInsight {
  id: string;
  text: string;
  type: "positive" | "neutral" | "suggestion";
}

// ============= Utility Functions =============

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(raw: number, baseline: number): number {
  if (baseline === 0) return 0.5;
  const norm = (raw - baseline) / baseline;
  return clamp(norm + 0.5, 0, 1); // Center at 0.5
}

function normalizeScore(raw: number): number {
  return clamp(raw / 100, 0, 1);
}

// ============= Metric Calculations =============

export function calculateCognitivePerformanceScore(
  snapshot: CognitiveMetricsSnapshot,
  baseline: CognitiveBaseline
): number {
  const reasoningNorm = normalize(snapshot.reasoningAccuracy, baseline.reasoningAccuracyBaseline);
  const clarityNorm = normalizeScore(snapshot.clarityScoreRaw);
  const decisionNorm = normalizeScore(snapshot.decisionQualityRaw);
  const focusNorm = normalizeScore(snapshot.focusStabilityRaw);
  
  // Lower reaction time is better, so invert
  const reactionNorm = 1 - normalize(snapshot.reactionTimeAvgMs, baseline.reactionTimeBaselineMs);

  const cps =
    0.25 * reasoningNorm +
    0.20 * clarityNorm +
    0.20 * decisionNorm +
    0.20 * focusNorm +
    0.15 * reactionNorm;

  return clamp(cps, 0, 1);
}

export function calculateBrainAgeIndex(
  chronologicalAge: number,
  cps: number,
  k: number = 0.4
): { brainAge: number; delta: number } {
  // CPS centered around 0.5, k scales the effect
  const brainAge = chronologicalAge * (1 - (cps - 0.5) * k);
  const clampedBrainAge = clamp(brainAge, chronologicalAge - 15, chronologicalAge + 15);
  const delta = clampedBrainAge - chronologicalAge;

  return {
    brainAge: Math.round(clampedBrainAge * 10) / 10,
    delta: Math.round(delta * 10) / 10,
  };
}

export function calculateCriticalThinkingScore(snapshot: CognitiveMetricsSnapshot): number {
  const reasoningNorm = snapshot.reasoningAccuracy;
  const clarityNorm = normalizeScore(snapshot.clarityScoreRaw);
  return Math.round(100 * (0.6 * reasoningNorm + 0.4 * clarityNorm));
}

export function calculateCreativeScore(snapshot: CognitiveMetricsSnapshot): number {
  return Math.round(snapshot.creativityRaw);
}

export function calculateFocusIndex(snapshot: CognitiveMetricsSnapshot): number {
  const focusNorm = normalizeScore(snapshot.focusStabilityRaw);
  const clarityNorm = normalizeScore(snapshot.clarityScoreRaw);
  const decisionNorm = normalizeScore(snapshot.decisionQualityRaw);
  return Math.round(100 * (0.5 * focusNorm + 0.3 * clarityNorm + 0.2 * decisionNorm));
}

export function calculateDecisionQualityScore(snapshot: CognitiveMetricsSnapshot): number {
  return Math.round(snapshot.decisionQualityRaw);
}

export function calculatePhilosophicalIndex(snapshot: CognitiveMetricsSnapshot): number {
  return Math.round(snapshot.philosophicalDepthRaw);
}

export function calculateFastThinkingScore(
  snapshot: CognitiveMetricsSnapshot,
  baseline: CognitiveBaseline
): number {
  const accuracyNorm = normalizeScore(snapshot.fastThinkingScoreRaw);
  const reactionNorm = 1 - normalize(snapshot.reactionTimeAvgMs, baseline.reactionTimeBaselineMs);
  return Math.round(100 * (0.6 * accuracyNorm + 0.4 * reactionNorm));
}

export function calculateSlowThinkingScore(snapshot: CognitiveMetricsSnapshot): number {
  return Math.round(snapshot.slowThinkingScoreRaw);
}

export function calculateCognitiveReadiness(
  snapshot: CognitiveMetricsSnapshot,
  baseline: CognitiveBaseline
): { score: number; level: "LOW" | "MODERATE" | "HIGH" } {
  const reasoningNorm = normalize(snapshot.reasoningAccuracy, baseline.reasoningAccuracyBaseline);
  const clarityNorm = normalizeScore(snapshot.clarityScoreRaw);
  const decisionNorm = normalizeScore(snapshot.decisionQualityRaw);
  const focusNorm = normalizeScore(snapshot.focusStabilityRaw);

  // Physiological component
  let physioComponent = 0.5; // Neutral fallback
  if (snapshot.hrvScore !== undefined || snapshot.sleepQualityScore !== undefined) {
    const hrv = snapshot.hrvScore !== undefined ? normalizeScore(snapshot.hrvScore) : 0.5;
    const sleep = snapshot.sleepQualityScore !== undefined ? normalizeScore(snapshot.sleepQualityScore) : 0.5;
    physioComponent = (hrv + sleep) / 2;
  }

  const score = Math.round(
    100 * (
      0.3 * reasoningNorm +
      0.2 * clarityNorm +
      0.2 * decisionNorm +
      0.15 * focusNorm +
      0.15 * physioComponent
    )
  );

  let level: "LOW" | "MODERATE" | "HIGH";
  if (score < 40) level = "LOW";
  else if (score < 70) level = "MODERATE";
  else level = "HIGH";

  return { score: clamp(score, 0, 100), level };
}

export function getBrainFunctionScores(
  snapshot: CognitiveMetricsSnapshot,
  previousSnapshot?: CognitiveMetricsSnapshot
): BrainFunctionScore[] {
  const functions = [
    { name: "Reasoning", current: snapshot.reasoningAccuracy * 100 },
    { name: "Clarity", current: snapshot.clarityScoreRaw },
    { name: "Focus", current: snapshot.focusStabilityRaw },
    { name: "Creativity", current: snapshot.creativityRaw },
    { name: "Decision Quality", current: snapshot.decisionQualityRaw },
    { name: "Memory", current: Math.round((snapshot.reasoningAccuracy * 100 + snapshot.clarityScoreRaw) / 2) },
  ];

  return functions.map((f) => {
    let trend: "up" | "down" | "stable" = "stable";
    let trendPercent = 0;

    if (previousSnapshot) {
      const prevValue = getPreviousValue(f.name, previousSnapshot);
      const diff = f.current - prevValue;
      trendPercent = prevValue > 0 ? Math.round((diff / prevValue) * 100) : 0;
      if (trendPercent > 2) trend = "up";
      else if (trendPercent < -2) trend = "down";
    }

    let status: "excellent" | "good" | "moderate" | "low";
    if (f.current >= 80) status = "excellent";
    else if (f.current >= 60) status = "good";
    else if (f.current >= 40) status = "moderate";
    else status = "low";

    return {
      name: f.name,
      score: Math.round(f.current),
      trend,
      trendPercent: Math.abs(trendPercent),
      status,
    };
  });
}

function getPreviousValue(name: string, snapshot: CognitiveMetricsSnapshot): number {
  switch (name) {
    case "Reasoning": return snapshot.reasoningAccuracy * 100;
    case "Clarity": return snapshot.clarityScoreRaw;
    case "Focus": return snapshot.focusStabilityRaw;
    case "Creativity": return snapshot.creativityRaw;
    case "Decision Quality": return snapshot.decisionQualityRaw;
    case "Memory": return (snapshot.reasoningAccuracy * 100 + snapshot.clarityScoreRaw) / 2;
    default: return 0;
  }
}

export function generateCognitiveInsights(
  snapshot: CognitiveMetricsSnapshot,
  baseline: CognitiveBaseline,
  brainAgeDelta: number
): CognitiveInsight[] {
  const insights: CognitiveInsight[] = [];

  // Brain age insight
  if (brainAgeDelta < -1) {
    insights.push({
      id: "brain-age-young",
      text: `Your Cognitive Age is ${Math.abs(brainAgeDelta).toFixed(1)} years younger than your chronological age. Keep training Reasoning Workout 3–4 times per week.`,
      type: "positive",
    });
  } else if (brainAgeDelta > 1) {
    insights.push({
      id: "brain-age-old",
      text: `Your Cognitive Age is ${brainAgeDelta.toFixed(1)} years above baseline. Increase session frequency for improvement.`,
      type: "suggestion",
    });
  }

  // Fast vs Slow thinking insight
  const fastScore = calculateFastThinkingScore(snapshot, baseline);
  const slowScore = calculateSlowThinkingScore(snapshot);
  if (slowScore > fastScore + 10) {
    insights.push({
      id: "slow-dominant",
      text: "Your Slow Thinking outperforms Fast Thinking. Consider more intuition drills in Fast mode.",
      type: "neutral",
    });
  } else if (fastScore > slowScore + 10) {
    insights.push({
      id: "fast-dominant",
      text: "Your Fast Thinking is your strongest asset. Balance with more structured reasoning exercises.",
      type: "neutral",
    });
  }

  // Focus insight
  if (snapshot.focusStabilityRaw >= 80) {
    insights.push({
      id: "focus-high",
      text: "Focus Index is exceptional. Your concentration is in the top tier.",
      type: "positive",
    });
  } else if (snapshot.focusStabilityRaw < 50) {
    insights.push({
      id: "focus-low",
      text: "Focus Index could improve. Try morning sessions when cognitive resources are fresh.",
      type: "suggestion",
    });
  }

  // Sessions insight
  if (snapshot.sessionsCompleted >= 5) {
    insights.push({
      id: "sessions-consistent",
      text: `${snapshot.sessionsCompleted} sessions this week. Consistency is building your cognitive edge.`,
      type: "positive",
    });
  }

  // Clarity insight
  if (snapshot.clarityScoreRaw >= 75) {
    insights.push({
      id: "clarity-high",
      text: "Clarity Lab training is paying off. Your conceptual precision is strong.",
      type: "positive",
    });
  }

  return insights.slice(0, 5);
}

// ============= Mock Data Generator =============

export function generateMockSnapshot(userId: string): CognitiveMetricsSnapshot {
  return {
    id: crypto.randomUUID(),
    userId,
    date: new Date().toISOString(),
    reactionTimeAvgMs: 280 + Math.random() * 80,
    reasoningAccuracy: 0.65 + Math.random() * 0.25,
    clarityScoreRaw: 60 + Math.random() * 30,
    decisionQualityRaw: 55 + Math.random() * 35,
    creativityRaw: 50 + Math.random() * 40,
    focusStabilityRaw: 60 + Math.random() * 30,
    philosophicalDepthRaw: 45 + Math.random() * 40,
    fastThinkingScoreRaw: 55 + Math.random() * 35,
    slowThinkingScoreRaw: 60 + Math.random() * 30,
    sessionsCompleted: Math.floor(3 + Math.random() * 7),
    hrvScore: 50 + Math.random() * 40,
    sleepQualityScore: 55 + Math.random() * 35,
  };
}

export function generateMockBaseline(userId: string): CognitiveBaseline {
  return {
    userId,
    reactionTimeBaselineMs: 320,
    reasoningAccuracyBaseline: 0.7,
    clarityBaseline: 65,
    decisionQualityBaseline: 60,
    creativityBaseline: 55,
    focusStabilityBaseline: 65,
    fastThinkingBaseline: 60,
    slowThinkingBaseline: 65,
    brainAgeBaseline: 35,
  };
}
