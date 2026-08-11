# Adaptive Cognitive Coach

## Release state

Version 6 is mobile-first and remains in explainable shadow mode. It collects
passive context, stores forecasts and evaluates later outcomes, but has no code
path that can change a plan, drill order, gating, difficulty or active CTA.

No questionnaires, ratings or manual outcome logging are required. The only
user actions are the operating-system permission grants needed for health,
calendar and device-use data.

## Mobile signal contract

The app can learn from these privacy-safe sources:

- HealthKit and Apple Watch data on iPhone;
- Health Connect and compatible wearables on Android;
- daily calendar density and open windows from EventKit or Calendar Provider;
- aggregate attention-app use from Android UsageStats;
- LOOMA metric trajectories and automatically recorded in-app outcomes.

Calendar data is reduced on-device to busy minutes, meeting count, longest
meeting and longest open window. Event titles, notes, attendees, locations,
URLs and calendar identities are never queried or uploaded.

Android app identities are reduced on-device to aggregate attention minutes,
active-app count and recency. Package names, app names, content, contacts and
social identities never reach Supabase.

iOS device-use data is not treated as available until the production app has
Apple's Family Controls entitlement and a privacy-preserving DeviceActivity
extension. Health and calendar context still work without it. The model must
never fabricate missing Screen Time data.

## Cognitive rhythm

Monitor exposes one lean `Cognitive rhythm` panel. It reports:

- today's next open calendar window, capped to a two-hour display;
- attention load against the person's own recent median when available;
- schedule load from daily busy minutes and meeting count;
- the strongest within-person association with cognitive state after at least
  six paired days.

Status is `learning` below 7 passive days, `emerging` from 7 days and
`reliable` after 21 days. These are personal associations, not causal claims.
The card does not claim to observe desktop work, task quality or productivity.

## Focus Integrity shadow outcome

Focus Integrity remains a secondary within-person proxy based on aggregate
attention load and automatically recorded continuity/completion of existing
LOOMA Quality Time sessions. It does not measure intelligence, productivity,
decision quality or the semantic quality of work.

The `focus-integrity-shadow-v2-mobile` forecast uses current Sharpness,
Readiness and Recovery, permitted health context, aggregate attention load and
up to 14 prior evaluable observations. The first five observations remain
cold-start data.

## Passive feature bundle

`adaptive_daily_feature_snapshots` stores one versioned daily feature bundle:

- current cognitive signals and 14-day within-person slopes;
- first-party behavior aggregated over seven days;
- latest permitted phone-health and wearable inputs;
- aggregate attention load against a personal median;
- aggregate schedule load against a personal median;
- explicit availability and data coverage.

The embedded state estimator uses the versioned registry in
`SCIENTIFIC_PRIORS.md`. It selects sleep duration once across Health and
wearable sources, applies sensor-reliability attenuation, and fits attention
and executive outcomes separately. HRV and resting HR wait for a personal
baseline rather than using population-wide absolute ranges.

`device_usage_snapshots` and `calendar_context_snapshots` contain only daily
aggregates. All rows are user-owned and protected by Row Level Security.

## Validation gate

Focus Integrity activation still requires all evidence gates:

- at least 21 evaluable forecast/outcome pairs;
- at least 60% directional accuracy;
- at least 10% lower mean absolute error than predicting no change.

Passing the gates permits manual review only. A later active release requires
controlled exposure, rollback and a separate product decision.

The broader domain estimator has a stricter maturity label: 45 prior outcomes
in both attention and executive domains. Maturity never replaces prospective
validation against the fixed formula and a no-change baseline.
