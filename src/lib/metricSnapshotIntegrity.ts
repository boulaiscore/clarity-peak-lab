export interface CurrentMetricSnapshotValues {
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  rq: number | null;
  s1: number | null;
  s2: number | null;
  ae: number | null;
  ra: number | null;
  ct: number | null;
  inScore: number | null;
}

export interface PersistedMetricSnapshotValues {
  readiness: number | null;
  sharpness: number | null;
  recovery: number | null;
  reasoning_quality: number | null;
  s1: number | null;
  s2: number | null;
  ae: number | null;
  ra: number | null;
  ct: number | null;
  in_score: number | null;
}

const VALUE_CHANGE_THRESHOLD = 0.5;

function changed(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return a !== b;
  return Math.abs(Number(a) - Number(b)) > VALUE_CHANGE_THRESHOLD;
}

/**
 * Ensures an existing summary-only row is upgraded with canonical S1/S2 and
 * component values even when the four headline metrics have not changed.
 */
export function metricSnapshotNeedsSave(
  current: CurrentMetricSnapshotValues,
  saved: PersistedMetricSnapshotValues | null,
): boolean {
  if (!saved) return true;

  return (
    changed(current.readiness, saved.readiness) ||
    changed(current.sharpness, saved.sharpness) ||
    changed(current.recovery, saved.recovery) ||
    changed(current.rq, saved.reasoning_quality) ||
    changed(current.s1, saved.s1) ||
    changed(current.s2, saved.s2) ||
    changed(current.ae, saved.ae) ||
    changed(current.ra, saved.ra) ||
    changed(current.ct, saved.ct) ||
    changed(current.inScore, saved.in_score)
  );
}
