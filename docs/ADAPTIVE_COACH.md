# Adaptive Cognitive Coach

## Release state

Version 2 is an explainable shadow model. It generates forecasts and evaluates
them, but it has no code path that can change the user's training plan, game
order, gating, difficulty, or active CTA.

There is no daily coach card in Home. Passive inputs are collected in the
background so the product can validate predictions without influencing the
behavior it is trying to observe. The previously created
`daily_work_recommendations` table remains an optional historical outcome source
but no visible flow writes new recommendations in this release.

The product must not describe this phase as generic AI or claim that a training
action caused an improvement. The observed relationship is predictive and can
still contain selection bias because the user chooses which session to perform.

## Daily prediction contract

Once per local day, the app creates four candidates:

- `train_ae` — Attentional Efficiency
- `train_ra` — Rapid Association
- `train_ct` — Critical Thinking
- `train_in` — Insight

Each candidate stores:

- its rank and priority score;
- the rolling pre-prediction performance baseline;
- predicted next-session score and delta;
- confidence and whether the baseline is evaluable;
- the exact input features and three strongest reasons;
- model version, prediction time, and seven-day outcome window.

The interpretable prior uses development gap, time since matching training,
current state fit, recent same-skill performance trend, longitudinal metric
trend, health availability, aggregate attention load, and data uncertainty.
After evaluated outcomes exist, a shrinkage calibration adds only a bounded
fraction of the user's mean prior forecast error. One noisy observation cannot
dominate a forecast.

Recovery below 35 marks every candidate `defer`. The flag is stored for later
validation but does not block or reorder training.

## Outcome contract

The objective outcome is the score of the next completed game routed to the
same skill within seven days. The observed delta is:

`next matching game score - rolling score baseline at prediction time`

A database trigger resolves only the newest eligible prediction. Older
overlapping predictions for the same action become `superseded`, which prevents
one game from being counted more than once. Predictions with fewer than three
prior matching sessions are collected but excluded from validation metrics.

This remains a drill-forecast validation target only. It must not be presented
as evidence that the coach improved professional performance.

## Passive feature contract

`adaptive_daily_feature_snapshots` stores one versioned, user-owned feature
bundle per day:

- current cognitive signals and their 14-day within-person slopes;
- drill, quality-time and recovery behavior aggregated over seven days;
- first-party product activity counts and active days;
- latest permitted phone-health and wearable inputs;
- aggregate device attention time relative to the user's own 14-day median;
- explicit source availability and a coverage score.

`device_usage_snapshots` contains only daily aggregate minutes, active app count
and recency. Package/app names, domains, content, contacts and social identities
are removed on-device before upload. Android uses explicit Usage Access. iOS
Device Activity requires a separate Family Controls entitlement and user
authorization, so no iOS Screen Time data is claimed or synthesized in this
release.

Passive context is bounded to a small adjustment in the shadow forecast. Skill
trends can affect *where* training may help; health and attention load affect
*when* a session may be well-timed. These remain predictive associations, not
causal conclusions.

An active personalized policy requires controlled exposure data (for example,
safe micro-randomization between eligible recommendations), calibration and a
demonstrated uplift on real-work outcomes. Correlation between a recommendation
and a later outcome is not sufficient.

## Validation gate

Active personalization must not start automatically. Version 1 can become
`ready_for_review` only when all personal evidence gates pass:

- at least 30 evaluable outcomes;
- at least 60% directional accuracy;
- at least 10% lower mean absolute error than predicting no change;
- at least three skills with five or more evaluated outcomes each.

Passing these gates permits a manual model and product review only. A later
release must separately define experimentation, rollback, consent, safety, and
the exact authority granted to active recommendations.

## Privacy and storage

Predictions and passive feature snapshots live inside the project's Supabase
cloud. Row Level Security restricts users to their own data. Model inputs exclude
name, email, demographics, free text, app identities and social content.
Cognitive and health values stay in dedicated user-owned tables and are never
added to privacy-safe product usage telemetry.

The user-facing status page exposes validation progress and completed forecasts,
not the current hidden candidate, so shadow predictions do not influence the
behavior they are intended to observe.
