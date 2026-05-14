/**
 * ============================================
 * LOOMA – PHONE HEALTH INDEX (PHI)
 * ============================================
 *
 * Computes a 0–100 daily index from base phone health signals
 * (HealthKit / Health Connect) with NO wearable required.
 *
 * Inputs: Sleep, sleep consistency, steps, active minutes, phone pickups.
 * Output: PHI (0–100) and a target REC value used by the morning Recovery
 * snapshot to mean-revert toward, instead of the fixed baseline 50.
 *
 * v2 — PARTIAL DEGRADATION + CONFIDENCE
 * --------------------------------------
 * Instead of requiring all sources, PHI is computed on whatever is
 * available with weights renormalized over the present sources.
 * A `confidence` score (0..1) reflects the share of total weight that
 * was available. The final `targetRec` blends the personalized target
 * with the neutral baseline (50) proportionally to confidence:
 *
 *     target_final = 50 * (1 - confidence) + targetPHI * confidence
 *
 * Result: more data → more personalization. Zero data → baseline 50.
 * Smooth, never breaks, transparent to the user.
 */

export interface PhoneHealthInputs {
  sleepMin: number | null;
  bedtimeDevMin: number | null; // |bedtime - 7day median|, minutes
  steps: number | null;
  activeMin: number | null;
  pickups: number | null; // optional, iOS only
}

export interface PhoneHealthSubScores {
  sleep: number;
  consistency: number;
  steps: number;
  active: number;
  pickupPenalty: number; // 0..100, subtracted (penalty source)
}

export type PhoneHealthSource =
  | "sleep"
  | "consistency"
  | "steps"
  | "active"
  | "pickups";

export interface PhoneHealthResult {
  phi: number; // 0..100
  targetRec: number; // confidence-blended, range ~35..65
  targetRecRaw: number; // unblended PHI-only target
  sub: PhoneHealthSubScores;
  hasData: boolean;
  /** 0..1 — share of total weight covered by available sources */
  confidence: number;
  /** Sources that contributed to PHI today */
  availableSources: PhoneHealthSource[];
}

/** Positive contributors. Weights sum to 1.0. */
const WEIGHTS: Record<Exclude<PhoneHealthSource, "pickups">, number> = {
  sleep: 0.5,
  consistency: 0.15,
  steps: 0.2,
  active: 0.15,
};

/** Pickups is a penalty source (max −10 PHI), not part of the confidence pool. */
const PICKUP_PENALTY_WEIGHT = 0.1;

const PHI_BASELINE_TARGET = 50;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function computeSubScores(inputs: PhoneHealthInputs): PhoneHealthSubScores {
  const sleep =
    inputs.sleepMin == null ? 0 : clamp01((inputs.sleepMin - 300) / 180) * 100;

  const consistency =
    inputs.bedtimeDevMin == null
      ? 0
      : clamp01(1 - inputs.bedtimeDevMin / 90) * 100;

  const steps =
    inputs.steps == null ? 0 : clamp01((inputs.steps - 2000) / 6000) * 100;

  const active =
    inputs.activeMin == null ? 0 : clamp01(inputs.activeMin / 30) * 100;

  const pickupPenalty =
    inputs.pickups == null ? 0 : clamp01((inputs.pickups - 80) / 120) * 100;

  return { sleep, consistency, steps, active, pickupPenalty };
}

export function getAvailableSources(
  inputs: PhoneHealthInputs
): PhoneHealthSource[] {
  const out: PhoneHealthSource[] = [];
  if (inputs.sleepMin != null) out.push("sleep");
  if (inputs.bedtimeDevMin != null) out.push("consistency");
  if (inputs.steps != null) out.push("steps");
  if (inputs.activeMin != null) out.push("active");
  if (inputs.pickups != null) out.push("pickups");
  return out;
}

/** Returns whether at least one positive contributor is present. */
export function hasUsableData(inputs: PhoneHealthInputs): boolean {
  return (
    inputs.sleepMin != null ||
    inputs.bedtimeDevMin != null ||
    inputs.steps != null ||
    inputs.activeMin != null
  );
}

export function computePHI(inputs: PhoneHealthInputs): PhoneHealthResult {
  const sub = computeSubScores(inputs);
  const available = getAvailableSources(inputs);
  const hasData = hasUsableData(inputs);

  // Confidence = share of positive weights actually available.
  const totalWeight =
    WEIGHTS.sleep + WEIGHTS.consistency + WEIGHTS.steps + WEIGHTS.active;
  const availableWeight =
    (inputs.sleepMin != null ? WEIGHTS.sleep : 0) +
    (inputs.bedtimeDevMin != null ? WEIGHTS.consistency : 0) +
    (inputs.steps != null ? WEIGHTS.steps : 0) +
    (inputs.activeMin != null ? WEIGHTS.active : 0);

  const confidence = totalWeight > 0 ? availableWeight / totalWeight : 0;

  // Renormalized PHI on present sources (so PHI scales 0..100 even with partial data).
  const weightedSum =
    (inputs.sleepMin != null ? WEIGHTS.sleep * sub.sleep : 0) +
    (inputs.bedtimeDevMin != null ? WEIGHTS.consistency * sub.consistency : 0) +
    (inputs.steps != null ? WEIGHTS.steps * sub.steps : 0) +
    (inputs.activeMin != null ? WEIGHTS.active * sub.active : 0);

  const phiPositive = availableWeight > 0 ? weightedSum / availableWeight : 0;
  const phiRaw =
    phiPositive -
    (inputs.pickups != null ? PICKUP_PENALTY_WEIGHT * sub.pickupPenalty : 0);

  const phi = Math.max(0, Math.min(100, Math.round(phiRaw * 10) / 10));

  // PHI-only target (no blending)
  const targetRecRaw = hasData
    ? Math.round((35 + (phi / 100) * 30) * 10) / 10
    : PHI_BASELINE_TARGET;

  // Confidence-blended target → smooth degradation toward baseline.
  const blended =
    PHI_BASELINE_TARGET * (1 - confidence) + targetRecRaw * confidence;
  const targetRec = hasData
    ? Math.round(blended * 10) / 10
    : PHI_BASELINE_TARGET;

  return {
    phi,
    targetRec,
    targetRecRaw,
    sub,
    hasData,
    confidence: Math.round(confidence * 100) / 100,
    availableSources: available,
  };
}

/**
 * Convenience labels for the Recovery Breakdown UI.
 */
export function describeContribution(weightPct: number, score: number): number {
  return Math.round(weightPct * score * 10) / 1000;
}
