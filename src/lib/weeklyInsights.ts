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

export const MIN_DAYS_FOR_INSIGHTS = 14;
const MIN_GROUP_SIZE = 4;
const MIN_EFFECT_POINTS = 3;
const SOLID_EFFECT_POINTS = 6;

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
  return Math.abs(delta) >= SOLID_EFFECT_POINTS && sampleSize >= 12 ? "solid" : "emerging";
}

interface SplitEffect {
  delta: number;
  sampleSize: number;
  lowCount: number;
  highCount: number;
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
    pairs.push({ driverValue, metricValue });
  }

  if (pairs.length < MIN_GROUP_SIZE * 2) return null;

  const threshold = median(pairs.map((pair) => pair.driverValue));
  const low = pairs.filter((pair) => pair.driverValue < threshold).map((pair) => pair.metricValue);
  const high = pairs.filter((pair) => pair.driverValue >= threshold).map((pair) => pair.metricValue);
  if (low.length < MIN_GROUP_SIZE || high.length < MIN_GROUP_SIZE) return null;

  return {
    delta: round1(mean(high) - mean(low)),
    sampleSize: pairs.length,
    lowCount: low.length,
    highCount: high.length,
  };
}

function trainingEffect(days: InsightDay[], metric: InsightMetricKey): SplitEffect | null {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const trained: number[] = [];
  const rested: number[] = [];

  for (const day of days) {
    const metricValue = day[metric];
    if (metricValue === null || metricValue === undefined) continue;
    const previous = byDate.get(previousDate(day.date));
    if (!previous || previous.didTraining === null || previous.didTraining === undefined) continue;
    (previous.didTraining ? trained : rested).push(metricValue);
  }

  if (trained.length < MIN_GROUP_SIZE || rested.length < MIN_GROUP_SIZE) return null;

  return {
    delta: round1(mean(trained) - mean(rested)),
    sampleSize: trained.length + rested.length,
    lowCount: rested.length,
    highCount: trained.length,
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
  const observed = days.filter(
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
        ? `Your longer nights lift next-day Sharpness by ${Math.abs(sleepEffect.delta)} pts`
        : `Your longer nights don't lift next-day Sharpness`,
      detail: better
        ? `Across ${sleepEffect.sampleSize} days, mornings after your longer nights score ${Math.abs(sleepEffect.delta)} points higher. Sleep is your strongest lever right now.`
        : `Across ${sleepEffect.sampleSize} days, sleep duration alone isn't moving your Sharpness — timing and load matter more for you.`,
      metric: "sharpness",
      deltaPoints: sleepEffect.delta,
      sampleSize: sleepEffect.sampleSize,
      confidence: confidenceFor(sleepEffect.delta, sleepEffect.sampleSize),
    });
  }

  const movementEffect = nextDayEffect(
    observed,
    health,
    (d) => (d.activeMin ?? (d.steps !== null ? d.steps / 100 : null)),
    "recovery",
  );
  if (movementEffect && Math.abs(movementEffect.delta) >= MIN_EFFECT_POINTS) {
    const better = movementEffect.delta > 0;
    candidates.push({
      id: "movement-recovery",
      headline: better
        ? `Active days raise your next-day Recovery by ${Math.abs(movementEffect.delta)} pts`
        : `Your most active days cost you ${Math.abs(movementEffect.delta)} pts of next-day Recovery`,
      detail: better
        ? `Over ${movementEffect.sampleSize} days, movement is consistently followed by a higher reserve. Keep it as a recovery tool, not a cost.`
        : `Over ${movementEffect.sampleSize} days, heavy activity is followed by a lower reserve. Schedule demanding output away from your hardest training days.`,
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
        ? `A steady bedtime is worth ${Math.abs(rhythmEffect.delta)} pts of Readiness`
        : `Bedtime consistency isn't driving your Readiness`,
      detail: better
        ? `On the ${rhythmEffect.highCount} days after you kept your usual bedtime, Readiness ran ${Math.abs(rhythmEffect.delta)} points higher than after irregular nights.`
        : `Across ${rhythmEffect.sampleSize} days, shifting your bedtime doesn't change your Readiness — your constraint sits elsewhere.`,
      metric: "readiness",
      deltaPoints: rhythmEffect.delta,
      sampleSize: rhythmEffect.sampleSize,
      confidence: confidenceFor(rhythmEffect.delta, rhythmEffect.sampleSize),
    });
  }

  const trainEffect = trainingEffect(observed, "reasoningQuality");
  if (trainEffect && Math.abs(trainEffect.delta) >= MIN_EFFECT_POINTS) {
    const better = trainEffect.delta > 0;
    candidates.push({
      id: "training-reasoning",
      headline: better
        ? `Days after a check run ${Math.abs(trainEffect.delta)} pts higher on Decision quality`
        : `Back-to-back training days cost you ${Math.abs(trainEffect.delta)} pts of Decision quality`,
      detail: better
        ? `Compared with ${trainEffect.lowCount} untrained days, the ${trainEffect.highCount} days following a check hold a measurably sharper reasoning profile.`
        : `The ${trainEffect.highCount} days following a check score lower than your ${trainEffect.lowCount} rest days — spacing your sessions may serve you better.`,
      metric: "reasoningQuality",
      deltaPoints: trainEffect.delta,
      sampleSize: trainEffect.sampleSize,
      confidence: confidenceFor(trainEffect.delta, trainEffect.sampleSize),
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
          ? `Your last 7 days average ${Math.abs(best.effect.delta)} points above the week before. Whatever changed, it is working — hold the pattern.`
          : `Your last 7 days average ${Math.abs(best.effect.delta)} points below the week before. Protect sleep and load before it compounds.`,
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
