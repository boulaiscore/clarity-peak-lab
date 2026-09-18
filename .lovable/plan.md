# Monitor-first: LOOMA for the "lazy" user

Goal: make LOOMA deliver value to users who only want to monitor themselves and get
guidance — without requiring training. Training becomes the optional improvement tool,
not the prerequisite.

## Current state (verified)

- Onboarding (`src/pages/Onboarding.tsx`) has 2 steps (goal + self-reported context),
  then forces a 2-minute calibration. Health permissions are never requested during
  onboarding.
- Health access is only prompted later on first Home visit (`FirstRunHealthAccess`),
  native-only, and it routes to "choose a wearable" instead of directly requesting
  HealthKit/Health Connect authorization.
- Home is fully blocked until baseline calibration is completed
  (`Home.tsx` calibration gate) — a monitoring-only user cannot see anything without
  training first.
- The three rings show fallback values (neutral 50) silently when no passive signals
  exist — the user cannot distinguish a real score from "we don't know yet".
  `SignalCoverageRow` exists but the scores themselves carry no confidence marking.
- `DailyOutlookCard` already computes a daily headline + one action + evidence with
  vs-yesterday comparisons, but it sits below the rings and recovery battery.

## Changes

### 1. Permission-first onboarding (native)

- Add a new onboarding step (after step 2, before calibration) that directly requests
  HealthKit / Health Connect authorization with value framing:
  "LOOMA tracks your cognitive state automatically from signals your phone already
  collects — no training required."
- Show the exact signals used (sleep, movement, HRV if wearable), "read only" and
  privacy-safe aggregate disclosure.
- Skippable ("Not now") but with a clear cost statement: "Without these signals,
  LOOMA can only show estimates."
- On web, the step is hidden (no native health APIs).
- Files: `src/pages/Onboarding.tsx`, new `src/components/onboarding/HealthPermissionStep.tsx`,
  reuse `src/lib/capacitor/health.ts` permission APIs and `usePhoneHealthSync`.

### 2. Confidence over score (honesty layer)

- When signal coverage is low, ring values and Recovery display are marked as
  estimates: a small "Estimated · connect Health for precision" caption under the
  affected rings, reusing `signalCoverageLevel` already returned by `useTodayMetrics`.
- Same marking in the three breakdown tabs (Intuition / Reasoning / Capacity) where
  fallback (target-based) values are displayed.
- No change to formulas — this is display-only, per the metric integrity contract.
- Files: `src/pages/app/Home.tsx`, `src/components/home/IntuitionTab.tsx`,
  `src/components/home/ReasoningTab.tsx`, `src/components/home/CapacityTab.tsx`.

### 3. Home: one number, one reason, one action

- Move `DailyOutlookCard` above the three rings on the Overview tab: it becomes the
  primary answer ("how am I today and what matters"), rings become the supporting
  detail below.
- No changes to the outlook policy itself (already has yesterday comparisons and
  evidence); only placement and visual hierarchy.
- File: `src/pages/app/Home.tsx`.

### 4. Monitoring without forced calibration

- Replace the full-screen calibration gate on Home: a non-calibrated user can enter
  Home and see Recovery + Daily Outlook (passive monitoring works without baseline).
- Sharpness/Readiness/Reasoning rings and Train remain locked behind calibration,
  shown with a discrete "2-minute check to unlock" state on the rings.
- The Train tab keeps its existing calibration gate unchanged.
- Files: `src/pages/app/Home.tsx` (gate logic), ring empty-state treatment.

### 5. Drill reframing as "daily check" (copy only)

- Where drills are presented to non-training users (Home locked states, outlook
  action copy), present the short drill as a quick measurement ("60-second check to
  sharpen today's read") rather than as training. No game-logic changes.
- Files: copy in `Home.tsx` locked ring state; verify no other copy regressions.

## Technical notes

- No database or migration changes.
- No formula changes: `docs/METRIC_INTEGRITY.md` contract respected; all new UI
  consumes `useTodayMetrics` / existing hooks.
- Health permission APIs already exist in `src/lib/capacitor/health.ts` and
  `usePhoneHealthSync` already tolerates partial grants.
- `FirstRunHealthAccess` remains as the fallback prompt for users who skip the
  onboarding step.
- Verify with `npm run build` and the existing metric formula test scripts.

## Out of scope

- Activating the shadow adaptive estimator (separate release decision).
- Wearable pairing flow redesign.
- Notification permission step (can follow later).
