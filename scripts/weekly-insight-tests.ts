import {
  deriveWeeklyInsight,
  MIN_DAYS_FOR_INSIGHTS,
  type InsightDay,
  type InsightHealthDay,
} from "../src/lib/weeklyInsights";

let failures = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`ok: ${message}`);
  }
}

function dateFor(offset: number): string {
  const d = new Date(Date.UTC(2026, 0, 1));
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

// 1. Not enough history → honest "insufficient"
const shortHistory: InsightDay[] = Array.from({ length: 5 }, (_, i) => ({
  date: dateFor(i),
  sharpness: 50,
  readiness: 50,
  reasoningQuality: 50,
  recovery: 50,
  didTraining: false,
}));
const shortResult = deriveWeeklyInsight(shortHistory, []);
assert(shortResult.status === "insufficient", "short history reports insufficient data");
assert(
  shortResult.status === "insufficient" && shortResult.daysRequired === MIN_DAYS_FOR_INSIGHTS,
  "insufficient result exposes the required day count",
);

// 2. Flat history with enough days → no invented signal
const flatDays: InsightDay[] = Array.from({ length: 20 }, (_, i) => ({
  date: dateFor(i),
  sharpness: 50,
  readiness: 50,
  reasoningQuality: 50,
  recovery: 50,
  didTraining: false,
}));
assert(deriveWeeklyInsight(flatDays, []).status === "no-signal", "flat history yields no signal");

// 3. Sleep → next-day sharpness effect is detected
const sleepDays: InsightDay[] = [];
const sleepHealth: InsightHealthDay[] = [];
for (let i = 0; i < 24; i += 1) {
  const longNight = i % 2 === 0;
  sleepHealth.push({
    date: dateFor(i),
    sleepMin: longNight ? 470 : 340,
    steps: 6000,
    activeMin: 30,
    bedtimeDevMin: 10,
  });
  sleepDays.push({
    date: dateFor(i + 1),
    sharpness: longNight ? 68 : 52,
    readiness: 55,
    reasoningQuality: 55,
    recovery: 55,
    didTraining: false,
  });
}
const sleepResult = deriveWeeklyInsight(sleepDays, sleepHealth);
assert(sleepResult.status === "ready", "sleep pattern produces an insight");
if (sleepResult.status === "ready") {
  assert(sleepResult.insight.metric === "sharpness", "sleep insight targets Sharpness");
  assert(sleepResult.insight.deltaPoints > 10, "sleep insight reports the measured effect size");
  assert(sleepResult.insight.confidence === "solid", "large, well-sampled effect is marked solid");
}

// 4. Week-over-week fallback when no driver data exists
const trendDays: InsightDay[] = Array.from({ length: 16 }, (_, i) => ({
  date: dateFor(i),
  sharpness: i < 8 ? 50 : 62,
  readiness: 50,
  reasoningQuality: 50,
  recovery: 50,
  didTraining: false,
}));
const trendResult = deriveWeeklyInsight(trendDays, []);
assert(trendResult.status === "ready", "clear weekly trend surfaces as fallback insight");
if (trendResult.status === "ready") {
  assert(trendResult.insight.id.startsWith("trend-"), "fallback insight is a trend insight");
}

if (failures > 0) {
  console.error(`\n${failures} weekly-insight test(s) failed`);
  process.exit(1);
}
console.log("\nAll weekly-insight tests passed");
