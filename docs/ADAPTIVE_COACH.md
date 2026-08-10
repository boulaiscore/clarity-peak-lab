# Adaptive Cognitive Coach

## Release state

Version 3 is an explainable shadow system. It collects passive outcomes and
tests forecasts, but has no code path that can change a plan, game order,
gating, difficulty or active CTA.

No questionnaires, ratings or manual outcome logging are required. The Coach
page exposes signal coverage and validation quality, not a verbose daily advice
feed. Current hidden forecasts are not shown, so they cannot influence the
behavior being observed.

## Primary target: Focus Integrity

The primary target is next-observed-day **Focus Integrity**: a within-person
proxy for sustained attention. It can use only available aggregate signals:

- attention-app time relative to the user's own recent median;
- background interruptions during an existing Quality Time session;
- automatic session validity/completion.

Available components are normalized by their declared weights. A daily outcome
is evaluable only when coverage is at least 55% and source confidence is at
least 45%. Phone attention alone therefore needs a personal baseline; an
isolated in-app session cannot qualify as a passive daily outcome by itself.

Focus Integrity does **not** measure intelligence, productivity, decision
quality or the semantic quality of work. Those claims require a separate,
verifiable outcome source such as a privacy-safe desktop or work-tool
integration.

## Shadow forecast

Once per local day, `focus-integrity-shadow-v1` stores a forecast for the next
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
- explicit availability and coverage.

`passive_focus_observations` stores only the normalized daily score, component
scores, coverage, confidence and aggregate evidence counts.
`adaptive_focus_forecasts` stores the immutable shadow prior and its automatic
outcome check.

The existing `device_usage_snapshots` table contains only daily aggregate
minutes, active app count and recency. Package names, app names, domains,
content, contacts and social identities are removed on-device before upload.

## Privacy boundary

All rows are user-owned in Supabase and protected by Row Level Security. Model
inputs exclude name, email, demographics, free text, app identities and social
content. The system learns predictive associations inside one person's history;
it does not claim causality or compare people.

Desktop work continuity is not inferred unless a future browser/desktop sensor
supplies privacy-safe aggregates. The mobile implementation must not claim
universal professional-work detection before that source exists.
