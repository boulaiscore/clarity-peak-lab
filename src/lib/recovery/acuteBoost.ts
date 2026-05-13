/**
 * ============================================
 * ACUTE RECOVERY BOOST
 * ============================================
 *
 * Fast Recover acts as an "emergency button" producing a transient boost
 * to the displayed Recovery, modeling slow-breathing / vagal tone shifts.
 *
 * NEUROSCIENCE:
 * - 30-min half-life mirrors observed parasympathetic recovery decay
 *   (Zaccaro 2018; Brown & Gerbarg, slow breathing protocols).
 * - Magnitude is small (+3..+8) — state change, not trait change.
 * - Hard cap at REC_effective ≤ 85, so it never simulates structural recovery.
 *
 * INTEGRITY:
 * - Boost is applied ONLY at the visualization layer.
 * - REC_raw, recovery_snapshots, daily_metric_snapshots, Sharpness,
 *   Readiness, Cognitive Age — all UNCHANGED.
 * - Stored as `intraday_metric_events.event_type = 'acute_recovery_boost'`
 *   with metadata; never feeds historical trends.
 */

export const ACUTE_BOOST = {
  EVENT_TYPE: "acute_recovery_boost" as const,
  HALF_LIFE_MIN: 30,
  TOTAL_DURATION_MIN: 90, // boost ≈ 0 after 3 half-lives
  MIN_BOOST: 3,
  MAX_BOOST: 8,
  REC_EFFECTIVE_CAP: 85,
  COOLDOWN_HOURS: 3,
  DAILY_LIMIT: 3,
  // Threshold below which we treat the boost as fully decayed (UI clean-up)
  EXPIRED_THRESHOLD: 0.5,
};

export interface AcuteBoostEvent {
  /** ISO timestamp when the boost was applied */
  appliedAt: string;
  /** Initial magnitude in REC points (3..8) */
  initialBoost: number;
}

/**
 * Compute remaining boost magnitude at "now" given an event.
 * Pure function. Returns 0 when event has fully decayed.
 */
export function getResidualBoost(event: AcuteBoostEvent, now: Date = new Date()): number {
  const appliedMs = new Date(event.appliedAt).getTime();
  const elapsedMin = (now.getTime() - appliedMs) / 60_000;
  if (elapsedMin < 0) return 0;
  if (elapsedMin >= ACUTE_BOOST.TOTAL_DURATION_MIN) return 0;
  const decay = Math.pow(0.5, elapsedMin / ACUTE_BOOST.HALF_LIFE_MIN);
  const value = event.initialBoost * decay;
  return value < ACUTE_BOOST.EXPIRED_THRESHOLD ? 0 : value;
}

/**
 * Among all recent boost events, return the maximum residual boost.
 * Boosts do NOT stack (state-level intervention, not additive).
 */
export function getActiveResidualBoost(
  events: AcuteBoostEvent[],
  now: Date = new Date(),
): { boost: number; sourceEvent: AcuteBoostEvent | null } {
  let best = 0;
  let source: AcuteBoostEvent | null = null;
  for (const e of events) {
    const r = getResidualBoost(e, now);
    if (r > best) {
      best = r;
      source = e;
    }
  }
  return { boost: best, sourceEvent: source };
}

/**
 * Apply the acute boost to a raw REC value, capped.
 * REC_displayed = min(CAP, REC_raw + boost).
 */
export function applyBoostToRec(recRaw: number, boost: number): number {
  if (boost <= 0) return recRaw;
  return Math.min(ACUTE_BOOST.REC_EFFECTIVE_CAP, recRaw + boost);
}

/**
 * Compute initial boost magnitude from session inputs.
 *
 * Inputs:
 *   durationMinutes — actual session length (clamped to 3..15)
 *   perceivedDelta01 — normalized 0..1 improvement (avg of pre/post improvements)
 *
 * Magnitude:
 *   raw = durationMinutes * 0.8 * perceivedDelta01
 *   then clamped to [MIN_BOOST, MAX_BOOST]
 *
 * If perceivedDelta01 ≤ 0 (no perceived improvement), we still grant MIN_BOOST
 * because the parasympathetic shift exists even when self-report doesn't track it.
 */
export function computeInitialBoost(
  durationMinutes: number,
  perceivedDelta01: number,
): number {
  const dur = Math.max(3, Math.min(15, durationMinutes));
  const delta = Math.max(0, Math.min(1, perceivedDelta01));
  const raw = dur * 0.8 * Math.max(0.4, delta); // floor on perceived contribution
  return Math.round(
    Math.max(ACUTE_BOOST.MIN_BOOST, Math.min(ACUTE_BOOST.MAX_BOOST, raw))
  );
}

/**
 * Translate Recharging pre/post checks into a normalized 0..1 perceived delta.
 * Uses the same three axes as the result screen.
 */
export function perceivedDeltaFromChecks(args: {
  preMentalNoise: number;
  postMentalNoise: number;
  preCognitiveFatigue: number;
  postCognitiveFatigue: number;
  preReadinessToClear: number;
  postReadinessToClear: number;
}): number {
  const noiseDrop = (args.preMentalNoise - args.postMentalNoise) / 100;
  const fatigueDrop = (args.preCognitiveFatigue - args.postCognitiveFatigue) / 100;
  const readinessGain = (args.postReadinessToClear - args.preReadinessToClear) / 100;
  const avg = (Math.max(0, noiseDrop) + Math.max(0, fatigueDrop) + Math.max(0, readinessGain)) / 3;
  return Math.max(0, Math.min(1, avg));
}

/**
 * Cooldown / daily-limit evaluation against today's events.
 */
export function evaluateAvailability(
  todaysEvents: AcuteBoostEvent[],
  now: Date = new Date(),
): {
  usedToday: number;
  canApply: boolean;
  /** ISO timestamp when next boost can be applied; null if available now */
  nextAvailableAt: string | null;
  reason: "available" | "cooldown" | "daily_limit";
} {
  const used = todaysEvents.length;

  // Daily cap
  if (used >= ACUTE_BOOST.DAILY_LIMIT) {
    // Available again at next local midnight
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    return {
      usedToday: used,
      canApply: false,
      nextAvailableAt: tomorrow.toISOString(),
      reason: "daily_limit",
    };
  }

  // Cooldown vs most recent
  if (todaysEvents.length > 0) {
    const latest = todaysEvents.reduce((acc, e) =>
      new Date(e.appliedAt).getTime() > new Date(acc.appliedAt).getTime() ? e : acc
    );
    const earliest = new Date(latest.appliedAt).getTime() + ACUTE_BOOST.COOLDOWN_HOURS * 3600_000;
    if (earliest > now.getTime()) {
      return {
        usedToday: used,
        canApply: false,
        nextAvailableAt: new Date(earliest).toISOString(),
        reason: "cooldown",
      };
    }
  }

  return {
    usedToday: used,
    canApply: true,
    nextAvailableAt: null,
    reason: "available",
  };
}

/**
 * Format remaining time as compact "47m" / "1h 12m".
 */
export function formatRemainingMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}
