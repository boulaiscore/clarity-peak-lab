// Cognitive Readiness Calculation Utilities

export interface WearableSnapshot {
  hrvMs: number | null;
  restingHr: number | null;
  sleepDurationMin: number | null;
  sleepEfficiency: number | null;
}

export interface CognitiveInput {
  reasoningAccuracy: number;
  focusIndex: number;
  workingMemoryScore: number;
  fastThinkingScore: number;
  slowThinkingScore: number;
}

export type ReadinessClassification = "LOW" | "MEDIUM" | "HIGH";

// Normalize HRV (20–120 ms → 0–100)
export function normalizeHrv(hrvMs: number): number {
  const min = 20;
  const max = 120;
  const clipped = Math.max(min, Math.min(max, hrvMs));
  return ((clipped - min) / (max - min)) * 100;
}

// Normalize resting HR (45–90 bpm → lower is better)
export function normalizeRestingHr(restingHr: number): number {
  const min = 45;
  const max = 90;
  const clipped = Math.max(min, Math.min(max, restingHr));
  const x = (clipped - min) / (max - min);
  return (1 - x) * 100;
}

// Sleep score (duration + efficiency)
export function computeSleepScore(sleepDurationMin: number, sleepEfficiency: number): number {
  const durMin = 300; // 5h
  const durMax = 540; // 9h
  const durClipped = Math.max(durMin, Math.min(durMax, sleepDurationMin));
  const durScore = ((durClipped - durMin) / (durMax - durMin)) * 100;

  // Efficiency should be 0-1
  const eff = sleepEfficiency > 1 ? sleepEfficiency / 100 : sleepEfficiency;
  const effClipped = Math.max(0.7, Math.min(0.98, eff));
  const effScore = ((effClipped - 0.7) / 0.28) * 100;

  return 0.6 * durScore + 0.4 * effScore;
}

export function computePhysioComponent(snapshot: WearableSnapshot | null): number | null {
  if (!snapshot) return null;
  const { hrvMs, restingHr, sleepDurationMin, sleepEfficiency } = snapshot;
  if (
    hrvMs == null ||
    restingHr == null ||
    sleepDurationMin == null ||
    sleepEfficiency == null
  ) {
    return null;
  }
  const hrvScore = normalizeHrv(hrvMs);
  const rhrScore = normalizeRestingHr(restingHr);
  const sleepScore = computeSleepScore(sleepDurationMin, sleepEfficiency);

  // HRV 40%, resting HR 20%, sleep 40%
  return 0.4 * hrvScore + 0.2 * rhrScore + 0.4 * sleepScore;
}

// Cognitive component: assumes we have normalized 0–100 metrics
export function computeCognitiveComponent(input: CognitiveInput): number {
  const {
    reasoningAccuracy,
    focusIndex,
    workingMemoryScore,
    fastThinkingScore,
    slowThinkingScore,
  } = input;

  return (
    0.3 * reasoningAccuracy +
    0.25 * focusIndex +
    0.2 * workingMemoryScore +
    0.15 * slowThinkingScore +
    0.1 * fastThinkingScore
  );
}

export function computeCognitiveReadiness(
  physioComponent: number | null,
  cognitiveComponent: number
): number {
  if (physioComponent == null) {
    // fallback: no wearable → purely cognitive
    return cognitiveComponent;
  }
  return 0.5 * physioComponent + 0.5 * cognitiveComponent;
}

export function classifyReadiness(score: number): ReadinessClassification {
  if (score < 40) return "LOW";
  if (score < 70) return "MEDIUM";
  return "HIGH";
}

export function getReadinessHint(classification: ReadinessClassification): string {
  switch (classification) {
    case "HIGH":
      return "Great window for deep work and important decisions.";
    case "MEDIUM":
      return "You can perform well; consider pacing your high-load tasks.";
    case "LOW":
      return "Be careful with high-stakes decisions; prioritize clarity and recovery.";
  }
}

export function getReadinessColor(classification: ReadinessClassification): {
  bg: string;
  text: string;
  border: string;
} {
  switch (classification) {
    case "HIGH":
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40" };
    case "MEDIUM":
      return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/40" };
    case "LOW":
      return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" };
  }
}
