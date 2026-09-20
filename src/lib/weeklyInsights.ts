/**
 * Weekly personal insight engine — "We noticed…"
 *
 * Deterministic, client-side correlation engine over the user's own history.
 * No AI calls, no fabricated numbers: when evidence is thin we say so.
 */

export type InsightMetricKey = "sharpness" | "readiness" | "reasoningQuality" | "recovery";

export interface InsightDay {
  date: string; // yyyy-MM-dd
  sharpness: number | null;
  readiness: number | null;
  reasoningQuality: number | null;
  recovery: number | null;
  didTraining: boolean | null;
}

export interface InsightHealthDay {
  date: string; // yyyy-MM-dd
  sleepMin: number | null;
  steps: number | null;
  activeMin: number | null;
  bedtimeDevMin: number | null;
}

export interface WeeklyInsight {
  id: string;
  /** Short, scannable statement of the pattern. */
  headline: string;
  /** One sentence of evidence + what to do with it. */
  detail: string;
  metric: InsightMetricKey;
  /** Signed effect in metric points. */
  deltaPoints: number;
  sampleSize: number;
  confidence: "emerging" | "solid";
}

export type WeeklyInsightResult =
  | { status: "insufficient"; daysObserved: number; daysRequired: number }
  | { status: "no-signal"; daysObserved: number }
  | { status: "ready"; daysObserved: number; insight: WeeklyInsight; alternatives: WeeklyInsight[] };

export const MIN_DAYS_FOR_INSIGHTS = 21;
const MIN_GROUP_SIZE = 6;
const MIN_EFFECT_POINTS = 4;
const SOLID_EFFECT_POINTS = 6;
const SOLID_SAMPLE_SIZE = 24;

const METRIC_LABEL: Record<InsightMetricKey, string> = {
  sharpness: "Sharpness",
  readiness: "Readiness",
  reasoningQuality: "Decision quality",
  recovery: "Recovery",
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function previousDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function confidenceFor(delta: number, sampleSize: number): "emerging" | "solid" {
  return Math.abs(delta) >= SOLID_EFFECT_POINTS && sampleSize >= SOLID_SAMPLE_SIZE ? "solid" : "emerging";
}

interface SplitEffect {
  delta: number;
  sampleSize: number;
  lowCount: number;
  highCount: number;
}

function groupedDelta(
  pairs: Array<{ driverValue: number; metricValue: number }>,
  threshold: number,
  minimumPerGroup: number,
): number | null {
  const low = pairs.filter((pair) => pair.driverValue < threshold).map((pair) => pair.metricValue);
  const high = pairs.filter((pair) => pair.driverValue >= threshold).map((pair) => pair.metricValue);
  if (low.length < minimumPerGroup || high.length < minimumPerGroup) return null;
  return mean(high) - mean(low);
}

/**
 * Compares the metric on days that follow a "low" value of the driver vs a "high" one,
 * splitting on the user's own median. Returns null when either group is too small.
 */
function nextDayEffect(
  days: InsightDay[],
  health: InsightHealthDay[],
  driver: (day: InsightHealthDay) => number | null,
  metric: InsightMetricKey,
): SplitEffect | null {
  const healthByDate = new Map(health.map((entry) => [entry.date, entry]));
  const pairs: { driverValue: number; metricValue: number }[] = [];

  for (const day of days) {
    const metricValue = day[metric];
    if (metricValue === null || metricValue === undefined) continue;
    const previous = healthByDate.get(previousDate(day.date));
    if (!previous) continue;
    const driverValue = driver(previous);
    if (driverValue === null || driverValue === undefined) continue;
    const priorMetric = days.find((candidate) => candidate.date === previousDate(day.date))?.[metric];
    if (priorMetric === null || priorMetric === undefined) continue;
    // Compare next-day change, not the raw score. This removes much of the
    // metric's own day-to-day momentum before evaluating a passive driver.
    pairs.push({ driverValue, metricValue: metricValue - priorMetric });
  }

  if (pairs.length < MIN_GROUP_SIZE * 2) return null;

  const threshold = median(pairs.map((pair) => pair.driverValue));
  const low = pairs.filter((pair) => pair.driverValue < threshold).map((pair) => pair.metricValue);
  const high = pairs.filter((pair) => pair.driverValue >= threshold).map((pair) => pair.metricValue);
  if (low.length < MIN_GROUP_SIZE || high.length < MIN_GROUP_SIZE) return null;

  // A durable pattern must repeat across time, not be created by one unusual
  // cluster. Require the direction to agree in both chronological halves.
  const midpoint = Math.floor(pairs.length / 2);
  const earlyDelta = groupedDelta(pairs.slice(0, midpoint), threshold, 2);
  const recentDelta = groupedDelta(pairs.slice(midpoint), threshold, 2);
  if (
    earlyDelta === null ||
    recentDelta === null ||
    Math.sign(earlyDelta) !== Math.sign(recentDelta) ||
    Math.abs(earlyDelta) < MIN_EFFECT_POINTS / 2 ||
    Math.abs(recentDelta) < MIN_EFFECT_POINTS / 2
  ) return null;

  return {
    delta: round1(mean(high) - mean(low)),
    sampleSize: pairs.length,
    lowCount: low.length,
    highCount: high.length,
  };
}

function weekOverWeek(days: InsightDay[], metric: InsightMetricKey): SplitEffect | null {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7).map((day) => day[metric]).filter((v): v is number => v !== null);
  const prior = sorted.slice(-14, -7).map((day) => day[metric]).filter((v): v is number => v !== null);
  if (recent.length < MIN_GROUP_SIZE || prior.length < MIN_GROUP_SIZE) return null;
  return {
    delta: round1(mean(recent) - mean(prior)),
    sampleSize: recent.length + prior.length,
    lowCount: prior.length,
    highCount: recent.length,
  };
}

export function deriveWeeklyInsight(
  days: InsightDay[],
  health: InsightHealthDay[],
): WeeklyInsightResult {
  const uniqueDays = [...new Map(days.map((day) => [day.date, day])).values()]
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const observed = uniqueDays.filter(
    (day) =>
      day.sharpness !== null ||
      day.readiness !== null ||
      day.reasoningQuality !== null ||
      day.recovery !== null,
  );
  const daysObserved = observed.length;

  if (daysObserved < MIN_DAYS_FOR_INSIGHTS) {
    return { status: "insufficient", daysObserved, daysRequired: MIN_DAYS_FOR_INSIGHTS };
  }

  const candidates: WeeklyInsight[] = [];

  const sleepEffect = nextDayEffect(observed, health, (d) => d.sleepMin, "sharpness");
  if (sleepEffect && Math.abs(sleepEffect.delta) >= MIN_EFFECT_POINTS) {
    const better = sleepEffect.delta > 0;
    candidates.push({
      id: "sleep-sharpness",
      headline: better
        ? `You focus better after longer sleep`
        : `More sleep has not improved your focus`,
      detail: better
        ? `On ${sleepEffect.sampleSize} tracked days, your Sharpness rose by about ${Math.abs(sleepEffect.delta)} points after longer nights.`
        : `On ${sleepEffect.sampleSize} tracked days, longer sleep was followed by ${Math.abs(sleepEffect.delta)} points lower Sharpness. Keep watching this pattern.`,
      metric: "sharpness",
      deltaPoints: sleepEffect.delta,
      sampleSize: sleepEffect.sampleSize,
      confidence: confidenceFor(sleepEffect.delta, sleepEffect.sampleSize),
    });
  }

  const movementEffect = nextDayEffect(
    observed,
    health,
    (d) => d.activeMin,
    "recovery",
  );
  if (movementEffect && Math.abs(movementEffect.delta) >= MIN_EFFECT_POINTS) {
    const better = movementEffect.delta > 0;
    candidates.push({
      id: "movement-recovery",
      headline: better
        ? `Active days are followed by better Recovery`
        : `Harder activity may lower next-day Recovery`,
      detail: better
        ? `On ${movementEffect.sampleSize} tracked days, Recovery rose by about ${Math.abs(movementEffect.delta)} points after more activity.`
        : `On ${movementEffect.sampleSize} tracked days, Recovery fell by about ${Math.abs(movementEffect.delta)} points after more activity.`,
      metric: "recovery",
      deltaPoints: movementEffect.delta,
      sampleSize: movementEffect.sampleSize,
      confidence: confidenceFor(movementEffect.delta, movementEffect.sampleSize),
    });
  }

  const rhythmEffect = nextDayEffect(
    observed,
    health,
    (d) => (d.bedtimeDevMin !== null ? -Math.abs(d.bedtimeDevMin) : null),
    "readiness",
  );
  if (rhythmEffect && Math.abs(rhythmEffect.delta) >= MIN_EFFECT_POINTS) {
    const better = rhythmEffect.delta > 0;
    candidates.push({
      id: "rhythm-readiness",
      headline: better
        ? `A regular bedtime helps your Readiness`
        : `A regular bedtime has not improved your Readiness`,
      detail: better
        ? `On ${rhythmEffect.sampleSize} tracked days, Readiness rose by about ${Math.abs(rhythmEffect.delta)} points after a more regular bedtime.`
        : `On ${rhythmEffect.sampleSize} tracked days, a regular bedtime was followed by ${Math.abs(rhythmEffect.delta)} points lower Readiness.`,
      metric: "readiness",
      deltaPoints: rhythmEffect.delta,
      sampleSize: rhythmEffect.sampleSize,
      confidence: confidenceFor(rhythmEffect.delta, rhythmEffect.sampleSize),
    });
  }

  if (candidates.length === 0) {
    const metrics: InsightMetricKey[] = ["sharpness", "readiness", "reasoningQuality", "recovery"];
    let best: { metric: InsightMetricKey; effect: SplitEffect } | null = null;
    for (const metric of metrics) {
      const effect = weekOverWeek(observed, metric);
      if (!effect) continue;
      if (!best || Math.abs(effect.delta) > Math.abs(best.effect.delta)) {
        best = { metric, effect };
      }
    }

    if (best && Math.abs(best.effect.delta) >= MIN_EFFECT_POINTS) {
      const rising = best.effect.delta > 0;
      candidates.push({
        id: `trend-${best.metric}`,
        headline: `${METRIC_LABEL[best.metric]} is ${rising ? "up" : "down"} ${Math.abs(best.effect.delta)} pts this week`,
        detail: rising
          ? `Your 7-day average is higher than last week. There is not enough data yet to say why.`
          : `Your 7-day average is lower than last week. There is not enough data yet to say why.`,
        metric: best.metric,
        deltaPoints: best.effect.delta,
        sampleSize: best.effect.sampleSize,
        confidence: confidenceFor(best.effect.delta, best.effect.sampleSize),
      });
    }
  }

  if (candidates.length === 0) {
    return { status: "no-signal", daysObserved };
  }

  const ranked = [...candidates].sort((a, b) => Math.abs(b.deltaPoints) - Math.abs(a.deltaPoints));
  return {
    status: "ready",
    daysObserved,
    insight: ranked[0],
    alternatives: ranked.slice(1),
  };
}
