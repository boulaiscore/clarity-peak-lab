# Adaptive Cognitive Coach

## Release state

Version 1 is an explainable shadow model. It generates forecasts and evaluates
them, but it has no code path that can change the user's training plan, game
order, gating, difficulty, or active CTA.

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
current state fit, recent same-skill performance trend, and data uncertainty.
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

Predictions live in `adaptive_coach_predictions` inside the project's Supabase
cloud. Row Level Security restricts users to their own data. Model inputs exclude
name, email, demographics, and free text. Cognitive values stay in this dedicated
user-owned table and are never added to privacy-safe product usage telemetry.

The user-facing status page exposes validation progress and completed forecasts,
not the current hidden candidate, so shadow predictions do not influence the
behavior they are intended to observe.
