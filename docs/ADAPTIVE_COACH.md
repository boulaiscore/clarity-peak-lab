# Adaptive Cognitive Coach

## Release state

Version 4 is an explainable shadow system. It collects passive outcomes and
tests forecasts, but has no code path that can change a plan, game order,
gating, difficulty or active CTA.

No questionnaires, ratings or manual outcome logging are required. The Coach
page exposes signal coverage and validation quality, not a verbose daily advice
feed. Current hidden forecasts are not shown, so they cannot influence the
behavior being observed.

## Primary target: Focus Integrity

The primary target is next-observed-day **Focus Integrity**: a within-person
proxy for sustained attention. It can use only available aggregate signals:

- automatically detected desktop work blocks, continuity and switching;
- attention-app time relative to the user's own recent median;
- background interruptions during an existing Quality Time session;
- automatic session validity/completion.

Desktop work integrity has 65% of the outcome contract. Available components
are normalized by their declared weights. A daily outcome is evaluable only
when coverage is at least 60% and source confidence is at least 45%. Phone
attention or an isolated in-app session cannot qualify as a professional-work
outcome by themselves.

Focus Integrity does **not** measure intelligence, productivity, decision
quality or the semantic quality of work. It measures observable continuity and
attention leakage only.

## Shadow forecast

Once per local day, `focus-integrity-shadow-v2-desktop` stores a forecast for the next
observed day. The bounded interpretable prior uses:

- current Sharpness, Readiness and Recovery;
- permitted health/wearable context;
- aggregate attention load versus the personal baseline;
- up to 14 prior evaluable Focus Integrity observations;
- the personal trend and regression toward the personal rolling mean.

The first five observed days are cold-start data. The forecast is stored but is
excluded from validation until a personal baseline exists.

When an evaluable observation arrives for the target date, a database trigger
records the observed score and delta automatically. Repeated same-day aggregate
syncs update the matched shadow outcome; active product behavior remains
unchanged.

## Secondary calibration target

The earlier drill model remains in the background as a secondary calibration
sensor. It forecasts the next same-skill drill delta for AE, RA, CT and IN. Its
results are not the Coach's primary product outcome and must not be presented as
evidence of professional performance.

## Validation gate

Focus-based personalization requires all personal evidence gates:

- at least 21 evaluable forecast/outcome pairs;
- at least 60% directional accuracy;
- at least 10% lower mean absolute error than predicting no change.

Passing the gates permits manual review only. It never activates suggestions by
itself. A later active release still needs controlled exposure, rollback and a
separate product decision.

## Passive feature contract

`adaptive_daily_feature_snapshots` stores one versioned daily feature bundle:

- current cognitive signals and 14-day within-person slopes;
- first-party behavior aggregated over seven days;
- latest permitted phone-health and wearable inputs;
- aggregate attention time relative to a personal median;
- desktop block counts, focused minutes and integrity aggregates;
- explicit availability and coverage.

`passive_focus_observations` stores only the normalized daily score, component
scores, coverage, confidence and aggregate evidence counts.
`adaptive_focus_forecasts` stores the immutable shadow prior and its automatic
outcome check.

The existing `device_usage_snapshots` table contains only daily aggregate
minutes, active app count and recency. Package names, app names, domains,
content, contacts and social identities are removed on-device before upload.

`desktop_work_blocks` stores only timestamps, local time bucket, durations,
interruption/switch counts, attention minutes, continuity, confidence and the
derived integrity score. The extension holds the current hostname only in
`chrome.storage.session` to detect a switch. URLs, hostnames, titles and page
content never enter its completed-block queue or Supabase.

Monitor exposes a single `Focus patterns` panel. Best window and sustainable
duration remain blank until enough work blocks exist. Pattern status is
`learning` below 7 blocks, `emerging` from 7 blocks and `reliable` only after 30
blocks across at least 7 days.

## Privacy boundary

All rows are user-owned in Supabase and protected by Row Level Security. Model
inputs exclude name, email, demographics, free text, app identities and social
content. The system learns predictive associations inside one person's history;
it does not claim causality or compare people.

Calendar context is not yet connected. The desktop sensor detects browser work
continuity, not work performed entirely in native desktop applications. Those
limits must remain visible in product and validation decisions.
