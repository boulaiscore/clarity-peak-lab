import assert from "node:assert/strict";
import {
  calculateReadiness,
  calculateReadinessCognitiveComponent,
  calculatePhysioComponent,
  calculatePhysioEstimate,
  calculateSCI as calculateCanonicalSCI,
  calculateSharpness,
  calculateSystemScores,
  deriveEffectiveCognitiveStates,
} from "../src/lib/cognitiveEngine";
import { calculateSCI, getTargetsForPlan } from "../src/lib/cognitiveNetworkScore";
import {
  applyRecoveryDecay,
  calculateDailyRecoveryTarget,
  recalibrateRecoveryForNewDay,
  resolveRecoveryForMetrics,
} from "../src/lib/recoveryV2";
import { calculateRQ, calculateTaskPriming } from "../src/lib/reasoningQuality";
import { TRAINING_PLANS } from "../src/lib/trainingPlans";
import { getStandardMetricStatus } from "../src/lib/metricStatusLabels";
import { buildDualProcessSeries, resolveHistoricalSystemScores } from "../src/lib/dualProcessHistory";
import { metricSnapshotNeedsSave } from "../src/lib/metricSnapshotIntegrity";
import { buildDailyPassiveState, calculateRelativeLoadEstimate } from "../src/lib/dailyPassiveState";

const closeTo = (actual: number, expected: number, message: string) => {
  assert.ok(Math.abs(actual - expected) < 0.0001, `${message}: expected ${expected}, got ${actual}`);
};

const states = { AE: 80, RA: 60, CT: 70, IN: 50 };
assert.deepEqual(calculateSystemScores(states), { S1: 70, S2: 60 });

closeTo(calculateSharpness(states, 0), 49.5, "Sharpness at zero Recovery");
closeTo(calculateSharpness(states, 50), 57.8, "Sharpness at mid Recovery");
closeTo(calculateSharpness(states, 100), 66, "Sharpness at full Recovery");
closeTo(calculateReadiness(states, 50, null), 62.5, "Readiness without passive context");
closeTo(
  calculateReadinessCognitiveComponent(states),
  67,
  "Context-aware Readiness cognitive component",
);
closeTo(
  calculateReadiness(states, 50, { score: 72, coverage: 0.5 }),
  66.3,
  "Readiness blends passive context according to coverage",
);
closeTo(
  calculateSharpness(states, 50, { score: 72, coverage: 1 }),
  60.5,
  "Sharpness uses daily state at full coverage",
);
const partialPhysio = calculatePhysioEstimate({
    hrvMs: 70,
    restingHr: 60,
    sleepDurationMin: 450,
    sleepEfficiency: null,
  });
assert.ok(partialPhysio, "A partial wearable snapshot remains usable");
closeTo(partialPhysio.confidence, 0.84, "Partial wearable confidence");
closeTo(partialPhysio.score, 56.3, "Partial wearable score is shrunk toward neutral");
const deduplicatedPhysio = calculatePhysioEstimate({
  hrvMs: 70,
  restingHr: 60,
  sleepDurationMin: 450,
  sleepEfficiency: null,
}, { includeSleepDuration: false });
assert.ok(deduplicatedPhysio, "Wearable context remains usable after duplicate sleep duration is excluded");
closeTo(deduplicatedPhysio.confidence, 0.6, "Duplicate sleep duration does not count toward wearable context coverage");
closeTo(
  calculatePhysioComponent({
    hrvMs: 70,
    restingHr: 60,
    sleepDurationMin: 450,
    sleepEfficiency: null,
  }) ?? 0,
  56.3,
  "Public wearable component supports partial data",
);

const passiveState = buildDailyPassiveState([
  { id: "health", label: "Health", score: 80, confidence: 1, updatedAt: "2026-08-09T08:00:00.000Z" },
  { id: "wearable", label: "Wearable", score: 60, confidence: 0.8, updatedAt: "2026-08-09T09:00:00.000Z" },
  { id: "attention", label: "Attention", score: 40, confidence: 0.5, updatedAt: "2026-08-09T10:00:00.000Z" },
]);
closeTo(passiveState.coverage, 0.68, "Passive coverage uses canonical source weights");
closeTo(passiveState.score, 65.9, "Missing passive sources do not count as zero");
assert.equal(passiveState.level, "Enhanced");
assert.equal(passiveState.updatedAt, "2026-08-09T10:00:00.000Z");

const attentionLoad = calculateRelativeLoadEstimate({
  current: 100,
  history: [50, 50, 50, 50, 50, 50, 50],
  sourceConfidence: 0.8,
  minimumBaseline: 30,
});
closeTo(attentionLoad.ratio ?? 0, 2, "Attention load compares with personal baseline");
closeTo(attentionLoad.score ?? 0, 26, "Above-baseline attention load lowers neutral daily state");
closeTo(attentionLoad.confidence, 0.8, "Seven baseline days reach full source maturity");

const derived = deriveEffectiveCognitiveStates({
  focus_stability: 80,
  fast_thinking: 60,
  reasoning_accuracy: 70,
  slow_thinking: 50,
  baseline_focus: 50,
  baseline_fast_thinking: 50,
  baseline_reasoning: 50,
  baseline_slow_thinking: 50,
});
assert.deepEqual(derived.states, states);
assert.deepEqual({ S1: derived.S1, S2: derived.S2 }, { S1: 70, S2: 60 });

const behavioral = { weeklyGamesXP: 70, xpTargetWeek: 140 };
const canonicalSCI = calculateCanonicalSCI(states, behavioral, 50);
const breakdownSCI = calculateSCI({
  focus_stability: states.AE,
  fast_thinking: states.RA,
  reasoning_accuracy: states.CT,
  slow_thinking: states.IN,
}, behavioral, { recovery: 50 });
closeTo(breakdownSCI.total, canonicalSCI.total, "SCI total uses canonical engine");
closeTo(breakdownSCI.cognitivePerformance.score, canonicalSCI.cognitivePerformance, "SCI CP");
closeTo(breakdownSCI.behavioralEngagement.score, canonicalSCI.behavioralEngagement, "SCI BE");
closeTo(breakdownSCI.recoveryFactor.score, canonicalSCI.recoveryFactor, "SCI Recovery");
closeTo(
  breakdownSCI.cognitivePerformance.score,
  (states.AE + states.RA + states.CT + states.IN) / 4,
  "SCI cognitive performance counts each canonical skill once",
);

for (const planId of ["light", "expert", "superhuman"] as const) {
  const targets = getTargetsForPlan(planId);
  assert.equal(targets.xpTargetWeek, TRAINING_PLANS[planId].xpTargetWeek);
  assert.equal(targets.detoxMinutes, TRAINING_PLANS[planId].detox.weeklyMinutes);
}

closeTo(
  applyRecoveryDecay(80, "2026-08-08T08:00:00.000Z", "2026-08-08T20:00:00.000Z"),
  80,
  "Recovery is frozen within a calendar day",
);
closeTo(
  applyRecoveryDecay(80, "2026-08-08T08:00:00.000Z", "2026-08-09T08:00:00.000Z"),
  60.5,
  "Recovery recalibrates once per new day",
);
closeTo(
  calculateDailyRecoveryTarget(60, { rawScore: 80, confidence: 1 }),
  59.5,
  "Recovery target combines Phone Health and complete wearable physiology",
);
closeTo(
  calculateDailyRecoveryTarget(null, { rawScore: 100, confidence: 0.5 }),
  57.5,
  "Partial wearable recovery target shrinks toward neutral without Phone Health",
);
closeTo(
  resolveRecoveryForMetrics(null, 62),
  62,
  "Missing Recovery uses the daily estimate rather than zero",
);
closeTo(
  resolveRecoveryForMetrics(null, null),
  50,
  "Missing Recovery without passive context remains neutral",
);
closeTo(
  recalibrateRecoveryForNewDay(80),
  60.5,
  "Historical Recovery uses the live daily recalibration step",
);

const rq = calculateRQ({
  S2: 60,
  s2GameScores: [60, 60, 60, 60, 60],
  taskCompletions: [],
  sessionWeightedMinutes: 0,
  lastS2GameAt: null,
  lastTaskAt: null,
});
closeTo(rq.rq, 60, "RQ canonical weighting");
closeTo(
  calculateTaskPriming([], new Date("2026-08-08T12:00:00.000Z"), 60),
  100,
  "A valid timer-only priming path is not capped at half score",
);

assert.deepEqual(
  [80, 65, 50, 35, 34].map((value) => getStandardMetricStatus(value).label),
  ["Strong", "Ready", "Steady", "Building", "Starting point"],
  "Metric state labels share one non-judgmental scale",
);

assert.deepEqual(
  resolveHistoricalSystemScores({ s1: 72, s2: 61, ae: null, ra: null, ct: null, in_score: null }),
  { s1: 72, s2: 61 },
  "Dual-process history uses persisted S1/S2 values",
);
assert.deepEqual(
  resolveHistoricalSystemScores({ s1: null, s2: null, ae: 80, ra: 60, ct: 70, in_score: 50 }),
  { s1: 70, s2: 60 },
  "Dual-process history derives legacy rows from complete components",
);
assert.deepEqual(
  resolveHistoricalSystemScores({ s1: null, s2: null, ae: 80, ra: null, ct: 70, in_score: null }),
  { s1: null, s2: null },
  "Dual-process history does not invent aggregates from partial components",
);

assert.deepEqual(
  buildDualProcessSeries(
    [
      { snapshot_date: "2026-07-31", s1: 60, s2: 50 },
      { snapshot_date: "2026-08-02", s1: 70, s2: null },
    ],
    ["2026-08-01", "2026-08-02", "2026-08-03"],
    { snapshot_date: "2026-08-03", s1: 75, s2: 55 },
  ),
  [
    { date: "2026-08-01", s1: 60, s2: 50 },
    { date: "2026-08-02", s1: 70, s2: 50 },
    { date: "2026-08-03", s1: 75, s2: 55 },
  ],
  "Dual-process history seeds the visible window and forward-fills each system independently",
);

assert.deepEqual(
  buildDualProcessSeries(
    [{ snapshot_date: "2026-08-03", s1: 64, s2: 52 }],
    ["2026-08-01", "2026-08-02", "2026-08-03"],
  ),
  [
    { date: "2026-08-01", s1: null, s2: null },
    { date: "2026-08-02", s1: null, s2: null },
    { date: "2026-08-03", s1: 64, s2: 52 },
  ],
  "Dual-process history does not backfill dates before the first valid observation",
);

const completeSnapshot = {
  readiness: 60,
  sharpness: 54,
  recovery: 50,
  reasoning_quality: 40,
  s1: 75,
  s2: 50,
  ae: 80,
  ra: 70,
  ct: 55,
  in_score: 45,
};
const completeCurrent = {
  readiness: 60,
  sharpness: 54,
  recovery: 50,
  rq: 40,
  s1: 75,
  s2: 50,
  ae: 80,
  ra: 70,
  ct: 55,
  inScore: 45,
};

assert.equal(
  metricSnapshotNeedsSave(completeCurrent, completeSnapshot),
  false,
  "Complete unchanged snapshots do not write repeatedly",
);
assert.equal(
  metricSnapshotNeedsSave(completeCurrent, { ...completeSnapshot, s1: null, ae: null }),
  true,
  "Summary-only snapshots are upgraded with system and component values",
);

console.log("Metric formula checks passed");
