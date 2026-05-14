/**
 * ============================================
 * LOOMA – PHONE HEALTH INDEX (PHI)
 * ============================================
 *
 * Computes a 0–100 daily index from base phone health signals
 * (HealthKit / Health Connect) with NO wearable required.
 *
 * Inputs: Sleep, sleep consistency, steps, active minutes, phone pickups.
 * Output: PHI (0–100) and a target REC value (35–65) used by the
 * morning Recovery snapshot to mean-revert toward, instead of the
 * fixed baseline 50.
 *
 * If PHI is unavailable (no permissions / no data) → target = 50,
 * preserving the legacy snapshot behavior with zero regression.
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
  pickupPenalty: number; // 0..100, subtracted with weight 0.10
}

export interface PhoneHealthResult {
  phi: number; // 0..100
  targetRec: number; // 35..65
  sub: PhoneHealthSubScores;
  hasData: boolean;
}

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

/**
 * Returns whether at least one meaningful input is present.
 * Sleep alone is enough to produce a meaningful PHI.
 */
export function hasUsableData(inputs: PhoneHealthInputs): boolean {
  return inputs.sleepMin != null || inputs.steps != null || inputs.activeMin != null;
}

export function computePHI(inputs: PhoneHealthInputs): PhoneHealthResult {
  const sub = computeSubScores(inputs);
  const hasData = hasUsableData(inputs);

  // Weighted mix; pickup is subtracted (max −10).
  const phiRaw =
    0.5 * sub.sleep +
    0.15 * sub.consistency +
    0.2 * sub.steps +
    0.15 * sub.active -
    0.1 * sub.pickupPenalty;

  const phi = Math.max(0, Math.min(100, Math.round(phiRaw * 10) / 10));

  const targetRec = hasData
    ? Math.round((35 + (phi / 100) * 30) * 10) / 10
    : 50;

  return { phi, targetRec, sub, hasData };
}

/**
 * Convenience labels for the Recovery Breakdown UI.
 */
export function describeContribution(weightPct: number, score: number): number {
  // contribution = weight × score, in PHI points (0..100)
  return Math.round(weightPct * score * 10) / 1000;
}
