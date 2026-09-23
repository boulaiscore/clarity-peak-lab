/**
 * ============================================
 * LOOMA – ADAPTIVE (PERSONAL) DRILL THRESHOLDS
 * ============================================
 *
 * Canonical gating thresholds (see gamesGating.ts) describe LOOMA's "Ready"
 * zone for a generic profile. For a user whose own range sits lower, a fixed
 * cutoff is effectively unreachable: the drill stays locked forever and the
 * product feels like a judgement instead of a plan.
 *
 * Rule: thresholds are personalised around the user's own typical state and
 * can only ever RELAX, never become stricter than the canonical value.
 *
 *   effective = clamp(typical + reach, canonical - maxRelief, canonical)
 *
 * - `reach` keeps the threshold slightly above the user's typical day, so the
 *   drill still signals "a good day for this", not "any day".
 * - `maxRelief` bounds how far the standard can move, so results stay
 *   comparable across users and over time.
 * - Personalisation only activates with enough history; before that the
 *   canonical value is used.
 *
 * Recovery thresholds are deliberately NOT personalised: they are a safety
 * floor, not a performance standard.
 */

export interface PersonalCalibration {
  /** Median Sharpness over the observed window, or null when unavailable. */
  typicalSharpness: number | null;
  /** Median Readiness over the observed window, or null when unavailable. */
  typicalReadiness: number | null;
  /** Number of days with usable data. */
  sampleDays: number;
  /** True when thresholds should be personalised. */
  isActive: boolean;
}

export const MIN_CALIBRATION_DAYS = 5;

/** How far above the user's typical state a drill threshold sits. */
const REACH = { S1: 2, S2: 4 } as const;

/** Maximum amount a canonical threshold can be relaxed. */
const MAX_RELIEF = { S1: 8, S2: 15 } as const;

export const EMPTY_CALIBRATION: PersonalCalibration = {
  typicalSharpness: null,
  typicalReadiness: null,
  sampleDays: 0,
  isActive: false,
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Build the personal calibration from recent daily snapshots.
 */
export function buildPersonalCalibration(
  points: Array<{ sharpness?: number | null; readiness?: number | null }>,
): PersonalCalibration {
  const sharpnessValues = points
    .map((p) => p.sharpness)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const readinessValues = points
    .map((p) => p.readiness)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const sampleDays = Math.max(sharpnessValues.length, readinessValues.length);

  return {
    typicalSharpness: median(sharpnessValues),
    typicalReadiness: median(readinessValues),
    sampleDays,
    isActive: sampleDays >= MIN_CALIBRATION_DAYS,
  };
}

/**
 * Personalise a single minimum threshold. Returns the canonical value when
 * calibration is unavailable, and never returns a stricter value.
 */
export function personalizeMinThreshold(
  canonical: number,
  typical: number | null | undefined,
  system: "S1" | "S2",
  calibrationActive: boolean,
): number {
  if (!calibrationActive || typeof typical !== "number" || !Number.isFinite(typical)) {
    return canonical;
  }
  const floor = canonical - MAX_RELIEF[system];
  const target = Math.round(typical + REACH[system]);
  return Math.max(floor, Math.min(canonical, target));
}
