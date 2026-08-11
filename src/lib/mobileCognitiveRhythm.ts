import { clamp } from "@/lib/cognitiveEngine";

export const MOBILE_RHYTHM_EMERGING_DAYS = 7;
export const MOBILE_RHYTHM_RELIABLE_DAYS = 21;

export interface MobileRhythmDay {
  date: string;
  sharpness: number | null;
  readiness: number | null;
  recovery: number | null;
  healthScore: number | null;
  attentionUsageMinutes: number | null;
  busyMinutes: number | null;
  meetingCount: number | null;
  longestOpenStartMinute: number | null;
  longestOpenMinutes: number | null;
}

export interface MobileCognitiveRhythm {
  status: "learning" | "emerging" | "reliable";
  observedDays: number;
  progress: number;
  openWindow: string | null;
  attentionLoad: "Low" | "Usual" | "High" | null;
  scheduleLoad: "Light" | "Moderate" | "Packed" | null;
  topDriver: {
    label: "Recovery" | "Health" | "Attention" | "Schedule";
    direction: "supports" | "limits";
    strength: number;
  } | null;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
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

function formatMinute(minute: number): string {
  const safe = Math.round(clamp(minute, 0, 1440));
  const hour = Math.floor(safe / 60) % 24;
  const minutes = safe % 60;
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function cognitiveState(day: MobileRhythmDay): number | null {
  const values = [day.sharpness, day.readiness].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  );
  return values.length > 0 ? mean(values) : null;
}

export function deriveMobileCognitiveRhythm(
  inputDays: MobileRhythmDay[],
): MobileCognitiveRhythm {
  const days = [...inputDays]
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const observedDays = days.filter((day) =>
    day.healthScore !== null ||
    day.attentionUsageMinutes !== null ||
    day.busyMinutes !== null,
  ).length;
  const status = observedDays >= MOBILE_RHYTHM_RELIABLE_DAYS
    ? "reliable"
    : observedDays >= MOBILE_RHYTHM_EMERGING_DAYS ? "emerging" : "learning";
  const latest = days[days.length - 1];

  const openWindow = latest?.longestOpenStartMinute !== null &&
    latest?.longestOpenStartMinute !== undefined &&
    latest.longestOpenMinutes !== null &&
    latest.longestOpenMinutes >= 45
    ? `${formatMinute(latest.longestOpenStartMinute)}–${formatMinute(
        latest.longestOpenStartMinute + Math.min(120, latest.longestOpenMinutes),
      )}`
    : null;

  const attentionHistory = days.slice(0, -1).flatMap((day) =>
    day.attentionUsageMinutes === null ? [] : [day.attentionUsageMinutes],
  );
  const attentionBaseline = median(attentionHistory.slice(-14));
  const attentionRatio = latest?.attentionUsageMinutes !== null &&
    latest?.attentionUsageMinutes !== undefined &&
    attentionBaseline !== null && attentionBaseline > 0
    ? latest.attentionUsageMinutes / attentionBaseline
    : null;
  const attentionLoad = attentionRatio === null
    ? null
    : attentionRatio < 0.8 ? "Low" : attentionRatio > 1.2 ? "High" : "Usual";

  const scheduleLoad = latest?.busyMinutes === null || latest?.busyMinutes === undefined
    ? null
    : latest.busyMinutes >= 300 || (latest.meetingCount ?? 0) >= 7
      ? "Packed"
      : latest.busyMinutes <= 120 && (latest.meetingCount ?? 0) <= 3
        ? "Light"
        : "Moderate";

  const candidates = [
    { key: "recovery" as const, label: "Recovery" as const },
    { key: "healthScore" as const, label: "Health" as const },
    { key: "attentionUsageMinutes" as const, label: "Attention" as const },
    { key: "busyMinutes" as const, label: "Schedule" as const },
  ].flatMap((candidate) => {
    // Use a one-day lag: same-day Sharpness/Readiness already include passive
    // context, so correlating a source with that same score is mechanically
    // circular. Yesterday's context versus today's state is still associative,
    // but is a materially cleaner signal for a future predictive model.
    const pairs = days.slice(0, -1).flatMap((day, index) => {
      const x = day[candidate.key];
      const y = cognitiveState(days[index + 1]);
      return x === null || y === null ? [] : [{ x, y }];
    });
    const correlation = pearson(pairs);
    return correlation === null ? [] : [{ ...candidate, correlation }];
  }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  const strongest = candidates[0];
  const topDriver = strongest && Math.abs(strongest.correlation) >= 0.25
    ? {
        label: strongest.label,
        direction: strongest.correlation > 0 ? "supports" as const : "limits" as const,
        strength: Math.round(Math.abs(strongest.correlation) * 100) / 100,
      }
    : null;

  return {
    status,
    observedDays,
    progress: Math.round(clamp(observedDays / MOBILE_RHYTHM_RELIABLE_DAYS, 0, 1) * 1000) / 1000,
    openWindow,
    attentionLoad,
    scheduleLoad,
    topDriver,
  };
}
