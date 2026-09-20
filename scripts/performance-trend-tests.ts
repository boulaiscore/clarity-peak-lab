import {
  buildPerformanceTrend,
  normalizePerformanceSession,
  type PerformanceSession,
} from "../src/lib/performanceTrend";

let failures = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`ok: ${message}`);
  }
}

const today = new Date(2026, 0, 30, 12);
const session = (day: number, score: number, difficulty = "medium"): PerformanceSession => ({
  completedAt: new Date(2026, 0, day, 12).toISOString(),
  score,
  qualityScore: null,
  difficulty,
});

assert(
  normalizePerformanceSession(session(1, 60, "hard")) > normalizePerformanceSession(session(1, 60, "easy")),
  "difficulty normalization rewards equivalent hard performance",
);

const short = buildPerformanceTrend([session(10, 60), session(15, 65)], [], 30, today);
assert(short.status === "insufficient", "sparse checks do not claim a trend");
assert(short.changePercent === null, "sparse checks suppress the percentage claim");

const improvingSessions = [
  session(2, 50), session(4, 52), session(6, 51),
  session(22, 68), session(25, 70), session(29, 72),
];
const improving = buildPerformanceTrend(improvingSessions, [], 30, today);
assert(improving.status === "improving", "meaningful measured improvement is detected");
assert((improving.changePercent ?? 0) > 25, "improvement uses early versus recent measured checks");

const health = [{ date: "2026-01-25", sleepMin: 300 }, { date: "2026-01-24", sleepMin: 450 }];
const markers = buildPerformanceTrend([
  session(23, 60), session(24, 62), session(25, 64),
  session(26, 66), session(27, 68), session(28, 70),
], health, 30, today);
assert(markers.points.some((point) => point.lowSleep), "low-sleep day receives an event marker");
assert(markers.points.some((point) => point.streak), "three-day check streak receives an event marker");

if (failures > 0) {
  console.error(`\n${failures} performance-trend test(s) failed`);
  process.exit(1);
}

console.log("\nAll performance-trend tests passed");