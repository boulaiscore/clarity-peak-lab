import {
  calculateRelativeLoadEstimate,
  type RelativeLoadEstimate,
} from "@/lib/dailyPassiveState";

export interface DigitalUsagePoint {
  attentionUsageMin: number | null | undefined;
  activeAppCount: number | null | undefined;
  attentionSessionCount: number | null | undefined;
  attentionSwitchCount: number | null | undefined;
  briefSessionCount: number | null | undefined;
}

export interface DigitalAttentionEstimate {
  /** Favourably oriented 0-100 state used by Daily State. */
  score: number | null;
  confidence: number;
  /** Duration-only state, relative to the user's prior days. */
  usageScore: number | null;
  usageRatio: number | null;
  /** Favourably oriented fragmentation state. Lower means more fragmented. */
  fragmentationScore: number | null;
  fragmentationRatio: number | null;
  baselineDays: number;
  attentionUsageMin: number | null;
  activeAppCount: number | null;
  attentionSessionCount: number | null;
  attentionSwitchCount: number | null;
  briefSessionCount: number | null;
  mode: "fragmentation" | "legacy_usage" | "unavailable";
}

function finite(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function weightedMean(
  values: Array<{ value: number | null; weight: number }>,
): number | null {
  const observed = values.filter(
    (item): item is { value: number; weight: number } => item.value !== null,
  );
  const weight = observed.reduce((sum, item) => sum + item.weight, 0);
  if (weight <= 0) return null;
  return observed.reduce((sum, item) => sum + item.value * item.weight, 0) / weight;
}

function relative(
  current: number | null | undefined,
  history: Array<number | null | undefined>,
  confidence: number,
  minimumBaseline: number,
): RelativeLoadEstimate {
  return calculateRelativeLoadEstimate({
    current,
    history,
    sourceConfidence: confidence,
    minimumBaseline,
  });
}

/**
 * Canonical privacy-safe digital context.
 *
 * New native snapshots use equal parts duration load and fragmentation. The
 * latter is the equal-weight mean of attention-session frequency, returns from
 * another app, and brief sessions. Every component is compared only with the
 * person's preceding days; lower partial-day use never creates a reward.
 *
 * Older snapshots fall back to the previous duration/app-diversity formula so
 * an app update cannot create a discontinuity while the new baseline matures.
 */
export function calculateDigitalAttentionEstimate(args: {
  current: DigitalUsagePoint | null | undefined;
  history: DigitalUsagePoint[];
  sourceConfidence: number;
}): DigitalAttentionEstimate {
  const current = args.current;
  if (!current) {
    return {
      score: null,
      confidence: 0,
      usageScore: null,
      usageRatio: null,
      fragmentationScore: null,
      fragmentationRatio: null,
      baselineDays: 0,
      attentionUsageMin: null,
      activeAppCount: null,
      attentionSessionCount: null,
      attentionSwitchCount: null,
      briefSessionCount: null,
      mode: "unavailable",
    };
  }

  const usage = relative(
    current.attentionUsageMin,
    args.history.map((point) => point.attentionUsageMin),
    args.sourceConfidence,
    30,
  );
  const activeApps = relative(
    current.activeAppCount,
    args.history.map((point) => point.activeAppCount),
    args.sourceConfidence,
    2,
  );
  const sessions = relative(
    current.attentionSessionCount,
    args.history.map((point) => point.attentionSessionCount),
    args.sourceConfidence,
    1,
  );
  const switches = relative(
    current.attentionSwitchCount,
    args.history.map((point) => point.attentionSwitchCount),
    args.sourceConfidence,
    1,
  );
  const briefSessions = relative(
    current.briefSessionCount,
    args.history.map((point) => point.briefSessionCount),
    args.sourceConfidence,
    1,
  );

  const hasFragmentation = [
    current.attentionSessionCount,
    current.attentionSwitchCount,
    current.briefSessionCount,
  ].some((value) => finite(value) !== null);
  const fragmentationScore = hasFragmentation
    ? weightedMean([
        { value: sessions.score, weight: 1 },
        { value: switches.score, weight: 1 },
        { value: briefSessions.score, weight: 1 },
      ])
    : null;
  const fragmentationRatio = hasFragmentation
    ? weightedMean([
        { value: sessions.ratio, weight: 1 },
        { value: switches.ratio, weight: 1 },
        { value: briefSessions.ratio, weight: 1 },
      ])
    : null;
  const fragmentationConfidence = hasFragmentation
    ? weightedMean([
        { value: sessions.confidence, weight: 1 },
        { value: switches.confidence, weight: 1 },
        { value: briefSessions.confidence, weight: 1 },
      ]) ?? 0
    : 0;

  const score = hasFragmentation
    ? weightedMean([
        { value: usage.score, weight: 0.5 },
        { value: fragmentationScore, weight: 0.5 },
      ])
    : weightedMean([
        { value: usage.score, weight: 0.75 },
        { value: activeApps.score, weight: 0.25 },
      ]);
  const confidence = hasFragmentation
    ? weightedMean([
        { value: usage.score === null ? null : usage.confidence, weight: 0.5 },
        { value: fragmentationScore === null ? null : fragmentationConfidence, weight: 0.5 },
      ]) ?? 0
    : weightedMean([
        { value: usage.score === null ? null : usage.confidence, weight: 0.75 },
        { value: activeApps.score === null ? null : activeApps.confidence, weight: 0.25 },
      ]) ?? 0;

  return {
    score: score === null ? null : Math.round(score * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    usageScore: usage.score,
    usageRatio: usage.ratio,
    fragmentationScore: fragmentationScore === null
      ? null
      : Math.round(fragmentationScore * 10) / 10,
    fragmentationRatio: fragmentationRatio === null
      ? null
      : Math.round(fragmentationRatio * 100) / 100,
    baselineDays: Math.max(
      usage.baselineDays,
      sessions.baselineDays,
      switches.baselineDays,
      briefSessions.baselineDays,
    ),
    attentionUsageMin: finite(current.attentionUsageMin),
    activeAppCount: finite(current.activeAppCount),
    attentionSessionCount: finite(current.attentionSessionCount),
    attentionSwitchCount: finite(current.attentionSwitchCount),
    briefSessionCount: finite(current.briefSessionCount),
    mode: hasFragmentation ? "fragmentation" : "legacy_usage",
  };
}
