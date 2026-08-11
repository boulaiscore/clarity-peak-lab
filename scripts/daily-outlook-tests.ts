import assert from "node:assert/strict";
import { deriveDailyOutlook } from "../src/lib/dailyOutlook";

const base = {
  sharpness: 62,
  readiness: 64,
  recovery: 60,
  reasoningQuality: 55,
  healthScore: 62,
  healthSignals: {
    sleepDurationMin: 435,
    sleepEfficiency: 88,
    hrvMs: 54,
    restingHr: 61,
    steps: 6_800,
    activeMinutes: 42,
    observedDate: "2026-08-11",
    sources: ["health_connect"],
  },
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
assert.equal(recoveryFirst.action.metricCode, "REC");
assert.match(recoveryFirst.summary, /30/);

const attentionProtection = deriveDailyOutlook({ ...base, attentionLoadRatio: 1.5 });
assert.equal(attentionProtection.action.key, "protect_attention");
assert.equal(attentionProtection.action.metricCode, "ATT");
assert.ok(attentionProtection.evidence.some((item) => item.code === "ATT" && item.tone === "limit"));

const strongDecisionDay = deriveDailyOutlook({
  ...base,
  sharpness: 78,
  readiness: 82,
  recovery: 76,
  primaryOutcome: "decide",
});
assert.equal(strongDecisionDay.action.key, "use_capacity");
assert.equal(strongDecisionDay.action.kind, "guidance");
assert.equal(strongDecisionDay.action.durationMinutes, null);
assert.equal(strongDecisionDay.action.metricCode, "RDY");
assert.equal(strongDecisionDay.windowLabel, "09:30–10:45");

const scheduleProtection = deriveDailyOutlook({ ...base, readiness: 60, scheduleLoadRatio: 1.5 });
assert.equal(scheduleProtection.action.key, "protect_capacity");
assert.equal(scheduleProtection.action.kind, "guidance");
assert.match(scheduleProtection.summary, /50% above baseline/);

const focusTraining = deriveDailyOutlook({ ...base, recovery: 65, sharpness: 42 });
assert.equal(focusTraining.action.key, "train_focus");
assert.equal(focusTraining.action.metricCode, "SHP");
assert.equal(focusTraining.action.route, "/neuro-lab?tab=games&system=fast");

const steadyState = deriveDailyOutlook(base);
assert.equal(steadyState.action.key, "normal_plan");
assert.equal(steadyState.action.durationMinutes, null);
assert.doesNotMatch(`${steadyState.headline} ${steadyState.summary} ${steadyState.action.label}`, /\b50 min|50-minute|block\b/i);
assert.equal(steadyState.healthSignals?.hrvMs, 54);
assert.ok(steadyState.evidence.some((item) => ["SLP", "HRV", "RHR", "ACT"].includes(item.code)));
assert.ok(steadyState.evidence.some((item) => item.code === "SLP" && /7h 15m/.test(item.detail)));

const freeState = deriveDailyOutlook({ ...base, canPersonalize: false });
assert.equal(freeState.personalization, "state");
assert.equal(freeState.windowLabel, null);
assert.ok(freeState.confidence <= 0.65);

const missingSignals = deriveDailyOutlook({
  ...base,
  healthScore: null,
  healthSignals: null,
  attentionLoadRatio: null,
  scheduleLoadRatio: null,
  signalCoverage: 0,
  canPersonalize: false,
  rhythm: null,
});
assert.equal(missingSignals.confidenceLabel, "Baseline");
assert.ok(missingSignals.evidence.every((item) => !["HLT", "SLP", "HRV", "RHR", "ACT", "ATT", "CAL"].includes(item.code)));

for (const outlook of [recoveryFirst, attentionProtection, strongDecisionDay, scheduleProtection, focusTraining, steadyState, missingSignals]) {
  assert.ok(outlook.action.metricCode, "Every recommendation must identify its source metric");
  assert.ok(outlook.action.metricDetail, "Every recommendation must explain the linked metric value");
}

console.log("Daily Outlook policy tests passed");
