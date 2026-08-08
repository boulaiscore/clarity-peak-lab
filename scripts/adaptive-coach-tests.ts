import assert from "node:assert/strict";
import {
  evaluateCoachValidation,
  generateCoachShadowPredictions,
} from "../src/lib/adaptiveCoach";

const now = new Date("2026-08-08T12:00:00.000Z");
const context = {
  states: { AE: 45, RA: 70, CT: 55, IN: 80 },
  sharpness: 62,
  readiness: 68,
  recovery: 64,
  recoveryInitialized: true,
  now,
};

const coldStart = generateCoachShadowPredictions(context, []);
assert.equal(coldStart.length, 4);
assert.deepEqual(coldStart.map((candidate) => candidate.rank), [1, 2, 3, 4]);
assert.equal(coldStart.filter((candidate) => candidate.isTopCandidate).length, 1);
assert.equal(coldStart.every((candidate) => !candidate.isEvaluable), true);
assert.equal(coldStart.every((candidate) => candidate.confidence < 0.5), true);

const observations = [
  { skill: "AE" as const, score: 50, completedAt: new Date("2026-08-01T12:00:00.000Z") },
  { skill: "AE" as const, score: 54, completedAt: new Date("2026-08-03T12:00:00.000Z") },
  { skill: "AE" as const, score: 58, completedAt: new Date("2026-08-05T12:00:00.000Z") },
  { skill: "AE" as const, score: 62, completedAt: new Date("2026-08-07T12:00:00.000Z") },
];
const withHistory = generateCoachShadowPredictions(context, observations);
const aePrediction = withHistory.find((candidate) => candidate.actionKey === "train_ae");
assert.ok(aePrediction);
assert.equal(aePrediction.isEvaluable, true);
assert.equal(aePrediction.baselineScore, 56);
assert.ok(aePrediction.predictedDelta > 0, "Positive recent trend should produce a positive AE forecast");

const lowRecovery = generateCoachShadowPredictions({ ...context, recovery: 25 }, observations);
assert.equal(lowRecovery.every((candidate) => candidate.features.trainingState === "defer"), true);

const calibrated = generateCoachShadowPredictions(context, observations, [
  { actionKey: "train_ae", predictedDelta: 1, observedDelta: 5 },
  { actionKey: "train_ae", predictedDelta: 2, observedDelta: 6 },
]);
const calibratedAe = calibrated.find((candidate) => candidate.actionKey === "train_ae");
assert.ok(calibratedAe);
assert.equal(calibratedAe.features.personalCalibrationSamples, 2);
assert.ok(calibratedAe.features.personalCalibrationAdjustment > 0);

const collecting = evaluateCoachValidation([
  { actionKey: "train_ae", predictedDelta: 2, observedDelta: 3 },
]);
assert.equal(collecting.status, "collecting");
assert.equal(collecting.sampleSize, 1);

const strongRecords = Array.from({ length: 32 }, (_, index) => ({
  actionKey: (["train_ae", "train_ra", "train_ct", "train_in"] as const)[index % 4],
  predictedDelta: index % 2 === 0 ? 2 : -2,
  observedDelta: index % 2 === 0 ? 2.4 : -2.4,
}));
const validated = evaluateCoachValidation(strongRecords);
assert.equal(validated.status, "ready_for_review");
assert.equal(validated.gates.minimumSample, true);
assert.equal(validated.gates.directionalAccuracy, true);
assert.equal(validated.gates.beatsNoChange, true);
assert.equal(validated.gates.actionCoverage, true);

console.log("Adaptive coach checks passed");
