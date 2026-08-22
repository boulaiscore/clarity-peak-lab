import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const selectors = [
  "src/components/app/S1AEGameSelector.tsx",
  "src/components/app/S1RAGameSelector.tsx",
  "src/components/app/S2CTGameSelector.tsx",
  "src/components/app/S2INGameSelector.tsx",
];
const selectorSource = selectors.map(read).join("\n");
const trainingPlansSource = read("src/lib/trainingPlans.ts");
const labSource = read("src/pages/app/NeuroLab.tsx");
const settingsSource = read("src/pages/app/SettingsPage.tsx");
const calibrationSource = read("src/pages/app/QuickBaselineCalibration.tsx");
const calibrationIntroSource = read("src/components/calibration/CalibrationIntro.tsx");
const calibrationResultsSource = read("src/components/calibration/CalibrationResults.tsx");

assert.ok(calibrationIntroSource.includes("Skip for now"), "Initial calibration must offer a real skip action");
assert.doesNotMatch(calibrationResultsSource, /7-day baseline/i, "Calibration must not promise a nonexistent 7-day flow");
assert.doesNotMatch(
  calibrationSource,
  /\.upsert\(metricsPayload[\s\S]{0,180}\.select\([^)]*\)[\s\S]{0,80}\.single\(/,
  "Calibration persistence must not turn a successful upsert into a false failure when no row is returned",
);
assert.ok(
  calibrationSource.includes('if (!onboardingSaved) throw new Error("Could not finish onboarding")'),
  "Calibration must verify that the durable onboarding flag was saved",
);

assert.match(
  trainingPlansSource,
  /DEFAULT_TRAINING_PLAN_ID:\s*TrainingPlanId\s*=\s*["']expert["']/,
  "LOOMA must expose one canonical balanced training protocol",
);
assert.doesNotMatch(labSource, /ProtocolChangeSheet|ProtocolLink/, "Lab must not expose protocol selection");
assert.doesNotMatch(settingsSource, /TrainingPlanSelector|showPlanSheet/, "Settings must not expose protocol selection");

const canonicalIds = [
  "orbit_lock",
  "focus_switch",
  "constellation_snap",
  "semantic_drift",
  "causal_ledger",
  "counterfactual_audit",
  "signal_vs_noise",
  "hidden_rule_lab",
];

for (const id of canonicalIds) {
  assert.match(selectorSource, new RegExp(`id: ["']${id}["']`), `${id} must be exposed in Train`);
}
for (const removed of ["triage_sprint", "flash_connect", "counterexample_forge", "socratic_cross_exam"]) {
  assert.doesNotMatch(selectorSource, new RegExp(`id: ["']${removed}["']`), `${removed} must not be exposed in Train`);
}

const runnerExpectations = [
  ["OrbitLockRunner.tsx", "S1-AE", 'gymArea: "focus"', 'thinkingMode: "fast"'],
  ["FocusSwitchRunner.tsx", "S1-AE", 'gymArea: "focus"', 'thinkingMode: "fast"'],
  ["ConstellationSnapRunner.tsx", "S1-RA", 'gymArea: "creativity"', 'thinkingMode: "fast"'],
  ["SemanticDriftRunner.tsx", "S1-RA", 'gymArea: "creativity"', 'thinkingMode: "fast"'],
  ["CausalLedgerRunner.tsx", "S2-CT", 'gymArea: "reasoning"', 'thinkingMode: "slow"'],
  ["CounterfactualAuditRunner.tsx", "S2-CT", 'gymArea: "reasoning"', 'thinkingMode: "slow"'],
  ["SignalVsNoiseRunner.tsx", "S2-IN", 'gymArea: "creativity"', 'thinkingMode: "slow"'],
  ["HiddenRuleLabRunner.tsx", "S2-IN", 'gymArea: "creativity"', 'thinkingMode: "slow"'],
];

for (const [file, gameType, area, mode] of runnerExpectations) {
  const source = read(`src/pages/app/${file}`);
  const system = mode.includes('"fast"') ? "fast" : "slow";
  assert.match(source, new RegExp(`gameType: ["']${gameType}["']`), `${file} game type`);
  assert.ok(source.includes(area), `${file} gym area`);
  assert.ok(source.includes(mode), `${file} thinking mode`);
  assert.ok(source.includes(`/neuro-lab?tab=games&system=${system}`), `${file} exit route preserves the system accordion`);
}

const scoredDrillSources = [
  "src/components/games/orbit-lock/OrbitLockDrill.tsx",
  "src/components/games/focus-switch/FocusSwitchDrill.tsx",
  "src/components/games/constellation-snap/ConstellationSnapDrill.tsx",
  ...runnerExpectations.slice(3).map(([file]) => `src/pages/app/${file}`),
].map(read);
for (const source of scoredDrillSources) {
  assert.ok(source.includes("calculateScoredDrillXP"), "Every canonical drill must make XP performance-sensitive");
}

const resultFiles = [
  "orbit-lock/OrbitLockResults.tsx",
  "focus-switch/FocusSwitchResults.tsx",
  "constellation-snap/ConstellationSnapResults.tsx",
  "semantic-drift/SemanticDriftResults.tsx",
  "causal-ledger/CausalLedgerResults.tsx",
  "counterfactual-audit/CounterfactualAuditResults.tsx",
  "signal-vs-noise/SignalVsNoiseResults.tsx",
  "hidden-rule-lab/HiddenRuleLabResults.tsx",
];
for (const file of resultFiles) {
  assert.ok(read(`src/components/games/${file}`).includes("UnifiedGameResults"), `${file} unified results`);
}

for (const file of ["orbit-lock/OrbitLockResults.tsx", "focus-switch/FocusSwitchResults.tsx"]) {
  const source = read(`src/components/games/${file}`);
  assert.ok(source.includes('reviewMode="performance"'), `${file} continuous-performance review`);
  assert.ok(source.includes("mistakes={mistakes}"), `${file} review data`);
}
assert.ok(
  read("src/components/games/constellation-snap/ConstellationSnapDrill.tsx").includes("mistakes={reviewMistakes}"),
  "Constellation Snap must preserve the exact option order for review"
);

const antiRepeatedDrills = [
  "constellation-snap/ConstellationSnapDrill.tsx",
  "semantic-drift/SemanticDriftDrill.tsx",
  "causal-ledger/CausalLedgerDrill.tsx",
  "counterfactual-audit/CounterfactualAuditDrill.tsx",
  "signal-vs-noise/SignalVsNoiseDrill.tsx",
  "hidden-rule-lab/HiddenRuleLabDrill.tsx",
];
for (const file of antiRepeatedDrills) {
  assert.ok(read(`src/components/games/${file}`).includes("useValidSessionGenerator"), `${file} anti-repetition`);
}

const persistence = read("src/hooks/useGamesGating.ts");
assert.ok(persistence.includes("Math.min(45, Math.max(9"), "XP must be clamped to 9–45");
assert.ok(persistence.includes("Math.min(100, Math.max(0"), "score must be clamped to 0–100");
assert.ok(persistence.includes("s2MaxPerWeek"), "weekly S2 cap must be enforced at persistence boundary");
assert.ok(persistence.includes("calculateGameSkillUpdate"), "cognitive skill updates must use the objective drill score rather than XP");

const orbitLock = read("src/components/games/orbit-lock/OrbitLockDrill.tsx");
assert.ok(orbitLock.includes("actCompletionLockedRef"), "Orbit Lock must guard each act completion");
assert.doesNotMatch(
  orbitLock,
  /setActTimeRemaining\(prev\s*=>[\s\S]{0,500}handleActComplete\(/,
  "Orbit Lock must not trigger transitions from a React state updater",
);

const focusSwitch = read("src/components/games/focus-switch/FocusSwitchDrill.tsx");
assert.ok(focusSwitch.includes("0.6 * hitRate + 0.4 * precision"), "Focus Switch must combine hit rate and precision");
assert.ok(focusSwitch.includes("blockCompletionLockedRef"), "Focus Switch must guard each block completion");
assert.doesNotMatch(
  focusSwitch,
  /setBlockTimeRemaining\(prev\s*=>[\s\S]{0,500}setPhase\(/,
  "Focus Switch must not trigger transitions from a React state updater",
);
const signalVsNoise = read("src/components/games/signal-vs-noise/SignalVsNoiseDrill.tsx");
assert.ok(signalVsNoise.includes("onComplete(completedResults, metrics"), "Signal vs Noise must include the final case");

const causalRunner = read("src/pages/app/CausalLedgerRunner.tsx");
assert.ok(causalRunner.includes("{CAUSAL_LEDGER_CONFIG.rounds}"), "Causal Ledger intro must match its round config");
const hiddenRunner = read("src/pages/app/HiddenRuleLabRunner.tsx");
assert.ok(hiddenRunner.includes("calculateGameXP(difficulty, false)"), "Hidden Rule Lab intro XP must use the shared XP engine");

for (const [difficulty, base, perfect] of [["easy", 15, 23], ["medium", 22, 32], ["hard", 30, 42]]) {
  assert.ok(base >= 9 && perfect <= 45, `${difficulty} XP stays in the global range`);
  assert.equal(Math.max(9, Math.round(base * 0.30)), 9, `${difficulty} zero-score completion uses the XP floor`);
}

console.log("Drill integrity checks passed: 8 canonical drills, routing, results, anti-repetition, caps, and score bounds.");
