export interface DualProcessSnapshot {
  s1?: number | string | null;
  s2?: number | string | null;
  ae?: number | string | null;
  ra?: number | string | null;
  ct?: number | string | null;
  in_score?: number | string | null;
}

export interface DatedDualProcessSnapshot extends DualProcessSnapshot {
  snapshot_date: string;
}

export interface DualProcessSeriesPoint {
  date: string;
  s1: number | null;
  s2: number | null;
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

/**
 * Builds a continuous daily series without inventing values before the first
 * valid observation. A snapshot before the visible window can seed the first
 * displayed day, and later snapshots update S1/S2 independently.
 */
export function buildDualProcessSeries(
  snapshots: DatedDualProcessSnapshot[],
  dates: string[],
  livePoint?: DatedDualProcessSnapshot,
): DualProcessSeriesPoint[] {
  const orderedSnapshots = [...snapshots, ...(livePoint ? [livePoint] : [])]
    .filter((snapshot) => Boolean(snapshot.snapshot_date))
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

  let snapshotIndex = 0;
  let lastS1: number | null = null;
  let lastS2: number | null = null;

  return dates.map((date) => {
    while (
      snapshotIndex < orderedSnapshots.length &&
      orderedSnapshots[snapshotIndex].snapshot_date <= date
    ) {
      const resolved = resolveHistoricalSystemScores(orderedSnapshots[snapshotIndex]);
      if (resolved.s1 != null) lastS1 = resolved.s1;
      if (resolved.s2 != null) lastS2 = resolved.s2;
      snapshotIndex += 1;
    }

    return { date, s1: lastS1, s2: lastS2 };
  });
}
