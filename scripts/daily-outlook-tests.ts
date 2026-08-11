import assert from "node:assert/strict";
import { deriveDailyOutlook } from "../src/lib/dailyOutlook";

const base = {
  sharpness: 62,
  readiness: 64,
  recovery: 60,
  reasoningQuality: 55,
  healthScore: 62,
  attentionLoadRatio: 1,
  scheduleLoadRatio: 1,
  signalCoverage: 0.7,
  primaryOutcome: "focus" as const,
  canPersonalize: true,
  rhythm: {
    status: "reliable" as const,
    observedDays: 24,
    openWindow: "09:30–10:45",
    topDriver: null,
  },
};

const recoveryFirst = deriveDailyOutlook({ ...base, recovery: 30 });
assert.equal(recoveryFirst.action.key, "recover");
assert.equal(recoveryFirst.intensity, "protective");

const attentionProtection = deriveDailyOutlook({ ...base, attentionLoadRatio: 1.5 });
assert.equal(attentionProtection.action.key, "protect_attention");
assert.ok(attentionProtection.evidence.some((item) => item.code === "ATT" && item.tone === "limit"));

const strongDecisionDay = deriveDailyOutlook({
  ...base,
  sharpness: 78,
  readiness: 82,
  recovery: 76,
  primaryOutcome: "decide",
});
assert.equal(strongDecisionDay.action.key, "decision_block");
assert.equal(strongDecisionDay.action.durationMinutes, 75);
assert.equal(strongDecisionDay.windowLabel, "09:30–10:45");

const freeState = deriveDailyOutlook({ ...base, canPersonalize: false });
assert.equal(freeState.personalization, "state");
assert.equal(freeState.windowLabel, null);
assert.ok(freeState.confidence <= 0.65);

const missingSignals = deriveDailyOutlook({
  ...base,
  healthScore: null,
  attentionLoadRatio: null,
  scheduleLoadRatio: null,
  signalCoverage: 0,
  canPersonalize: false,
  rhythm: null,
});
assert.equal(missingSignals.confidenceLabel, "Baseline");
assert.ok(missingSignals.evidence.every((item) => item.code !== "HLT" && item.code !== "ATT" && item.code !== "CAL"));

console.log("Daily Outlook policy tests passed");
