import assert from "node:assert/strict";
import {
  calculateReadiness,
  calculateReadinessCognitiveComponent,
  calculatePhysioComponent,
  calculateSCI as calculateCanonicalSCI,
  calculateSharpness,
  calculateSystemScores,
  deriveEffectiveCognitiveStates,
} from "../src/lib/cognitiveEngine";
import { calculateSCI, getTargetsForPlan } from "../src/lib/cognitiveNetworkScore";
import { applyRecoveryDecay } from "../src/lib/recoveryV2";
import { calculateRQ } from "../src/lib/reasoningQuality";
import { TRAINING_PLANS } from "../src/lib/trainingPlans";
import { getStandardMetricStatus } from "../src/lib/metricStatusLabels";

const closeTo = (actual: number, expected: number, message: string) => {
  assert.ok(Math.abs(actual - expected) < 0.0001, `${message}: expected ${expected}, got ${actual}`);
};

const states = { AE: 80, RA: 60, CT: 70, IN: 50 };
assert.deepEqual(calculateSystemScores(states), { S1: 70, S2: 60 });

closeTo(calculateSharpness(states, 0), 49.5, "Sharpness at zero Recovery");
closeTo(calculateSharpness(states, 50), 57.8, "Sharpness at mid Recovery");
closeTo(calculateSharpness(states, 100), 66, "Sharpness at full Recovery");
closeTo(calculateReadiness(states, 50, null), 62.5, "Readiness without wearable");
closeTo(
  calculateReadinessCognitiveComponent(states),
  67,
  "Wearable Readiness cognitive component",
);
closeTo(calculateReadiness(states, 50, 72), 69.5, "Readiness with wearable");
assert.equal(
  calculatePhysioComponent({
    hrvMs: 70,
    restingHr: 60,
    sleepDurationMin: 450,
    sleepEfficiency: null,
  }),
  null,
  "An incomplete wearable snapshot must not activate wearable mode",
);

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
  75.5,
  "Recovery recalibrates once per new day",
);

const rq = calculateRQ({
  S2: 60,
  s2GameScores: [60, 60, 60, 60, 60],
  taskCompletions: [],
  customWeightedMinutes: 0,
  lastS2GameAt: null,
  lastTaskAt: null,
});
closeTo(rq.rq, 60, "RQ canonical weighting");

assert.deepEqual(
  [80, 65, 50, 35, 34].map((value) => getStandardMetricStatus(value).label),
  ["Strong", "Ready", "Steady", "Building", "Starting point"],
  "Metric state labels share one non-judgmental scale",
);

console.log("Metric formula checks passed");
