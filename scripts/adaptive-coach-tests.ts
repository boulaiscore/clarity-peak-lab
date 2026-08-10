import assert from "node:assert/strict";
import {
  evaluateCoachValidation,
  generateCoachShadowPredictions,
} from "../src/lib/adaptiveCoach";
import { aggregateAttentionUsage } from "../src/lib/deviceUsageAggregation";
import { buildPassiveFeaturePayload } from "../src/lib/passiveCoachFeatures";
import {
  buildFocusIntegrityObservation,
  evaluateFocusIntegrityValidation,
  generateFocusIntegrityForecast,
} from "../src/lib/focusIntegrity";

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

const attentionAggregate = aggregateAttentionUsage([
  { packageName: "private.social.one", appName: "Private One", usageMinutes: 18, lastUsed: now.getTime() - 1_000 },
  { packageName: "private.social.two", appName: "Private Two", usageMinutes: 27, lastUsed: now.getTime() },
]);
assert.deepEqual(attentionAggregate, {
  attentionUsageMin: 45,
  activeAppCount: 2,
  lastAttentionUseAt: now.toISOString(),
});
assert.doesNotMatch(JSON.stringify(attentionAggregate), /private|packageName|appName/);

const passivePayload = buildPassiveFeaturePayload({
  featureDate: "2026-08-08",
  currentMetrics: {
    sharpness: 62,
    readiness: 68,
    recovery: 64,
    reasoningQuality: 66,
    AE: 45,
    RA: 70,
    CT: 55,
    IN: 80,
    S1: 57.5,
    S2: 67.5,
    physioComponent: 70,
  },
  metricHistory: [
    { date: "2026-08-06", sharpness: 58, readiness: 64, reasoningQuality: 62, AE: 43, RA: 68, CT: 53, IN: 78 },
    { date: "2026-08-07", sharpness: 60, readiness: 66, reasoningQuality: 64, AE: 44, RA: 69, CT: 54, IN: 79 },
    { date: "2026-08-08", sharpness: 62, readiness: 68, reasoningQuality: 66, AE: 45, RA: 70, CT: 55, IN: 80 },
  ],
  games: [{ completedAt: "2026-08-08T10:00:00.000Z", durationSeconds: 180, score: 70 }],
  reasonSessions: [{ startedAt: "2026-08-07T10:00:00.000Z", durationSeconds: 1200, backgroundInterrupts: 1, isValidForRq: true }],
  recoverySessions: [{ completedAt: "2026-08-06T10:00:00.000Z", durationMinutes: 30 }],
  productEvents: [{ occurredAt: "2026-08-08T09:00:00.000Z" }],
  phoneHealth: [{ date: "2026-08-08", sleepMin: 450, bedtimeDeviationMin: 12, steps: 7200, activeMinutes: 35, pickups: null, phi: 72, confidence: 0.8, source: "health_connect" }],
  wearable: [{ date: "2026-08-08", hrvMs: 48, restingHr: 58, sleepDurationMin: 450, sleepEfficiency: 88, activityScore: 62, source: "health_connect" }],
  deviceUsage: [
    { date: "2026-08-06", attentionUsageMin: 40, activeAppCount: 3, lastAttentionUseAt: null, permissionState: "granted", confidence: 0.85, source: "android_usage_stats", coverage: "attention_apps" },
    { date: "2026-08-07", attentionUsageMin: 50, activeAppCount: 4, lastAttentionUseAt: null, permissionState: "granted", confidence: 0.85, source: "android_usage_stats", coverage: "attention_apps" },
    { date: "2026-08-08", attentionUsageMin: 90, activeAppCount: 5, lastAttentionUseAt: now.toISOString(), permissionState: "granted", confidence: 0.85, source: "android_usage_stats", coverage: "attention_apps" },
  ],
  primaryOutcome: "focus",
});
assert.equal(passivePayload.coachContext.healthScore, 72);
assert.equal(passivePayload.coachContext.attentionUsageBaselineMinutes, 45);
assert.equal(passivePayload.coachContext.attentionLoadRatio, 2);
assert.ok(passivePayload.coachContext.metricTrendPerDay > 0);
assert.equal(passivePayload.deviceUsage.privacyLevel, "aggregate_only_no_app_names_or_content");

const passivePredictions = generateCoachShadowPredictions({
  ...context,
  passive: passivePayload.coachContext,
}, observations);
const passiveAe = passivePredictions.find((candidate) => candidate.actionKey === "train_ae");
assert.ok(passiveAe);
assert.equal(passiveAe.features.healthScore, 72);
assert.equal(passiveAe.features.attentionLoadRatio, 2);
assert.ok(passiveAe.features.passiveDataCoverage > 0);

const focusObservation = buildFocusIntegrityObservation({
  attentionLoadRatio: 0.8,
  attentionBaselineDays: 5,
  attentionConfidence: 0.85,
  sessions: [],
});
assert.equal(focusObservation.isEvaluable, true);
assert.equal(focusObservation.coverage, 0.6);
assert.equal(focusObservation.score, 57);

const focusWithoutPassiveSignal = buildFocusIntegrityObservation({
  attentionLoadRatio: null,
  attentionBaselineDays: 0,
  attentionConfidence: null,
  sessions: [{ durationSeconds: 1800, backgroundInterrupts: 1, isValid: true }],
});
assert.equal(focusWithoutPassiveSignal.isEvaluable, false);
assert.ok((focusWithoutPassiveSignal.score ?? 0) > 0);

const focusForecast = generateFocusIntegrityForecast({
  sharpness: 66,
  readiness: 64,
  recovery: 62,
  healthScore: 70,
  attentionLoadRatio: 0.8,
  passiveCoverage: 0.75,
  history: [
    { date: "2026-08-03", score: 48 },
    { date: "2026-08-04", score: 50 },
    { date: "2026-08-05", score: 52 },
    { date: "2026-08-06", score: 54 },
    { date: "2026-08-07", score: 56 },
  ],
});
assert.equal(focusForecast.isEvaluable, true);
assert.ok(focusForecast.predictedDelta > 0);
assert.ok(focusForecast.reasons.length <= 3);

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

const validatedFocus = evaluateFocusIntegrityValidation(
  Array.from({ length: 24 }, (_, index) => ({
    predictedDelta: index % 2 === 0 ? 2 : -2,
    observedDelta: index % 2 === 0 ? 2.4 : -2.4,
  })),
);
assert.equal(validatedFocus.status, "ready_for_review");
assert.equal(validatedFocus.gates.minimumSample, true);
assert.equal(validatedFocus.gates.directionalAccuracy, true);
assert.equal(validatedFocus.gates.beatsNoChange, true);

console.log("Adaptive coach and passive feature checks passed");
