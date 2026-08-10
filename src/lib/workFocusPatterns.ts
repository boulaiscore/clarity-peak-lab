import { clamp } from "@/lib/cognitiveEngine";
import type { DesktopSensorBlockAggregate } from "@/lib/desktopSensorBridge";

export const DESKTOP_PATTERN_MIN_BLOCKS = 7;
export const DESKTOP_PATTERN_RELIABLE_BLOCKS = 30;

export interface DesktopBlockIntegrity {
  score: number;
  confidence: number;
  components: {
    continuity: number;
    switching: number;
    interruptions: number;
    attentionControl: number;
  };
}

export interface FocusPatternBlock {
  localDate: string;
  localStartHour: number;
  focusedMinutes: number;
  attentionMinutes: number;
  interruptionCount: number;
  contextSwitchCount: number;
  endedAbruptly: boolean;
  integrityScore: number;
  confidence: number;
}

export interface FocusPatternDailyContext {
  date: string;
  sharpness: number | null;
  readiness: number | null;
  recovery: number | null;
  healthScore: number | null;
}

export interface FocusPatterns {
  status: "learning" | "emerging" | "reliable";
  observedBlocks: number;
  observedDays: number;
  progress: number;
  bestWindow: string | null;
  sustainableDuration: string | null;
  interruptionRisk: "Low" | "Moderate" | "High" | null;
  topDriver: {
    label: string;
    direction: "supports" | "limits";
    strength: number;
  } | null;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function pearson(pairs: Array<{ x: number; y: number }>): number | null {
  if (pairs.length < 6) return null;
  const meanX = mean(pairs.map((pair) => pair.x));
  const meanY = mean(pairs.map((pair) => pair.y));
  const numerator = pairs.reduce(
    (sum, pair) => sum + (pair.x - meanX) * (pair.y - meanY),
    0,
  );
  const xVariance = pairs.reduce((sum, pair) => sum + (pair.x - meanX) ** 2, 0);
  const yVariance = pairs.reduce((sum, pair) => sum + (pair.y - meanY) ** 2, 0);
  const denominator = Math.sqrt(xVariance * yVariance);
  return denominator > 0 ? numerator / denominator : null;
}

export function calculateDesktopBlockIntegrity(
  block: DesktopSensorBlockAggregate,
): DesktopBlockIntegrity {
  const focusedMinutes = Math.max(0.1, block.focusedMinutes);
  const activeMinutes = Math.max(0.1, block.activeMinutes);
  const continuity = clamp(
    (block.longestContinuousMinutes / Math.min(45, focusedMinutes)) * 100,
    0,
    100,
  );
  const switchesPer30 = (Math.max(0, block.contextSwitchCount) / focusedMinutes) * 30;
  const interruptionsPer30 = (Math.max(0, block.interruptionCount) / focusedMinutes) * 30;
  const switching = clamp(100 - switchesPer30 * 12, 0, 100);
  const interruptions = clamp(100 - interruptionsPer30 * 20, 0, 100);
  const attentionControl = clamp(
    100 - (Math.max(0, block.attentionMinutes) / activeMinutes) * 160,
    0,
    100,
  );
  const earlyExitPenalty = block.endedAbruptly ? 8 : 0;
  const score = clamp(
    0.35 * continuity +
      0.25 * switching +
      0.25 * interruptions +
      0.15 * attentionControl -
      earlyExitPenalty,
    0,
    100,
  );

  return {
    score: round(score),
    confidence: round(
      clamp(block.confidence, 0, 1) * clamp(focusedMinutes / 20, 0.5, 1),
      3,
    ),
    components: {
      continuity: round(continuity),
      switching: round(switching),
      interruptions: round(interruptions),
      attentionControl: round(attentionControl),
    },
  };
}

function formatWindow(bucket: number): string {
  const end = (bucket + 2) % 24;
  return `${String(bucket).padStart(2, "0")}:00–${String(end).padStart(2, "0")}:00`;
}

export function deriveFocusPatterns(
  inputBlocks: FocusPatternBlock[],
  contexts: FocusPatternDailyContext[] = [],
): FocusPatterns {
  const blocks = inputBlocks.filter((block) =>
    Number.isFinite(block.integrityScore) &&
    block.focusedMinutes >= 10 &&
    block.confidence >= 0.35,
  );
  const observedDays = new Set(blocks.map((block) => block.localDate)).size;
  const status = blocks.length >= DESKTOP_PATTERN_RELIABLE_BLOCKS && observedDays >= 7
    ? "reliable"
    : blocks.length >= DESKTOP_PATTERN_MIN_BLOCKS
      ? "emerging"
      : "learning";

  if (blocks.length === 0) {
    return {
      status,
      observedBlocks: 0,
      observedDays: 0,
      progress: 0,
      bestWindow: null,
      sustainableDuration: null,
      interruptionRisk: null,
      topDriver: null,
    };
  }

  const globalMean = mean(blocks.map((block) => block.integrityScore));
  const buckets = new Map<number, FocusPatternBlock[]>();
  for (const block of blocks) {
    const bucket = Math.floor(clamp(block.localStartHour, 0, 23) / 2) * 2;
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), block]);
  }
  const rankedBuckets = [...buckets.entries()]
    .filter(([, values]) => values.length >= 2)
    .map(([bucket, values]) => ({
      bucket,
      score: (values.reduce((sum, value) => sum + value.integrityScore, 0) + globalMean * 3) /
        (values.length + 3),
    }))
    .sort((a, b) => b.score - a.score);
  const bestWindow = blocks.length >= 5 && rankedBuckets.length > 0
    ? formatWindow(rankedBuckets[0].bucket)
    : null;

  const scoreMedian = median(blocks.map((block) => block.integrityScore));
  const strongDurations = blocks
    .filter((block) => block.integrityScore >= scoreMedian && !block.endedAbruptly)
    .map((block) => block.focusedMinutes);
  const sustainableCenter = strongDurations.length >= 3
    ? Math.round(median(strongDurations) / 5) * 5
    : null;
  const sustainableDuration = sustainableCenter === null
    ? null
    : `${Math.max(10, sustainableCenter - 10)}–${Math.min(150, sustainableCenter + 10)} min`;

  const focusHours = blocks.reduce((sum, block) => sum + block.focusedMinutes, 0) / 60;
  const interruptionRate = focusHours > 0
    ? blocks.reduce((sum, block) => sum + block.interruptionCount, 0) / focusHours
    : 0;
  const interruptionRisk = blocks.length < 3
    ? null
    : interruptionRate < 1 ? "Low" : interruptionRate < 2.5 ? "Moderate" : "High";

  const contextByDate = new Map(contexts.map((context) => [context.date, context]));
  const candidates = [
    { key: "recovery" as const, label: "Recovery" },
    { key: "sharpness" as const, label: "Sharpness" },
    { key: "readiness" as const, label: "Readiness" },
    { key: "healthScore" as const, label: "Health" },
  ].flatMap((candidate) => {
    const pairs = blocks.flatMap((block) => {
      const value = contextByDate.get(block.localDate)?.[candidate.key];
      return value === null || value === undefined || !Number.isFinite(value)
        ? []
        : [{ x: value, y: block.integrityScore }];
    });
    const correlation = pearson(pairs);
    return correlation === null ? [] : [{ ...candidate, correlation }];
  }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  const strongest = candidates[0];
  const topDriver = strongest && Math.abs(strongest.correlation) >= 0.2
    ? {
        label: strongest.label,
        direction: strongest.correlation > 0 ? "supports" as const : "limits" as const,
        strength: round(Math.abs(strongest.correlation), 2),
      }
    : null;

  return {
    status,
    observedBlocks: blocks.length,
    observedDays,
    progress: round(clamp(blocks.length / DESKTOP_PATTERN_RELIABLE_BLOCKS, 0, 1), 3),
    bestWindow,
    sustainableDuration,
    interruptionRisk,
    topDriver,
  };
}
