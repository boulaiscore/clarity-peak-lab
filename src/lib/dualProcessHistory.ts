export interface DualProcessSnapshot {
  s1?: number | string | null;
  s2?: number | string | null;
  ae?: number | string | null;
  ra?: number | string | null;
  ct?: number | string | null;
  in_score?: number | string | null;
}

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Historical snapshots already persist canonical S1/S2 values. Prefer those
 * exact values; derive them from all four component states only for legacy
 * rows where the aggregate was not stored.
 */
export function resolveHistoricalSystemScores(snapshot: DualProcessSnapshot): {
  s1: number | null;
  s2: number | null;
} {
  const persistedS1 = toFiniteNumber(snapshot.s1);
  const persistedS2 = toFiniteNumber(snapshot.s2);
  const ae = toFiniteNumber(snapshot.ae);
  const ra = toFiniteNumber(snapshot.ra);
  const ct = toFiniteNumber(snapshot.ct);
  const insight = toFiniteNumber(snapshot.in_score);

  return {
    s1: persistedS1 ?? (ae != null && ra != null ? (ae + ra) / 2 : null),
    s2: persistedS2 ?? (ct != null && insight != null ? (ct + insight) / 2 : null),
  };
}
