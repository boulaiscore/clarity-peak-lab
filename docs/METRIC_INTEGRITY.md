# Metric integrity contract

This file is the implementation contract for every user-facing metric. UI tabs
must consume these engines/hooks instead of recreating formulas locally.

## Canonical state mapping

| Product state | Database column |
| --- | --- |
| AE — Attentional Efficiency | `focus_stability` |
| RA — Rapid Association | `fast_thinking` |
| CT — Critical Thinking | `reasoning_accuracy` |
| IN — Insight | `slow_thinking` |

Effective states include inactivity decay and never fall below their effective
baseline. The single derivation is `deriveEffectiveCognitiveStates`.

For a completed, cap-eligible Train drill, the routed state is refined from the
objective 0–100 session score with a conservative online update:
`state_new = max(baseline, state_old + 0.12 × (score − state_old))`.
XP remains a reward/load currency and does not directly define cognitive
performance. Aborted drills and practice sessions beyond the XP cap are stored
for history and Coach outcomes but do not move the persistent state.

## Formulas

- `S1 = (AE + RA) / 2`
- `S2 = (CT + IN) / 2`
- `Capacity = 0.60 × S1 + 0.40 × S2`
- `Sharpness app = Capacity × (0.75 + 0.25 × REC / 100)`
- `Sharpness context = Capacity × (0.70 + 0.30 × DailyState / 100)`
- `Sharpness = (1 − coverage) × Sharpness app + coverage × Sharpness context`
- `Readiness app = 0.35 × REC + 0.35 × S2 + 0.30 × AE`
- `Cognitive = 0.30 × CT + 0.25 × AE + 0.20 × IN + 0.15 × S2 + 0.10 × S1`
- `Readiness context = 0.60 × DailyState + 0.40 × Cognitive`
- `Readiness = (1 − coverage) × Readiness app + coverage × Readiness context − decay`
- `RQ = 0.50 × S2 Core + 0.30 × S2 Consistency + 0.20 × Task Priming`
  where Task Priming uses the stronger of curated completions and valid timer
  sessions; these are alternative capture paths, not two mandatory halves.
  Valid timer sessions include both curated and custom content.
- `Cognitive Performance = (AE + RA + CT + IN) / 4`; S2 is not counted again.
- `SCI = 0.50 × Cognitive Performance + 0.30 × Behavioral Engagement + 0.20 × REC`
- Cognitive Age performance uses the average of AE, RA, CT, and IN only. S2 is
  not counted a second time. The long window is 180 days and the short window
  is 30 calendar days; missing days do not silently extend either window.
- `Cognitive Age = chronological age − ((Performance180d − personal baseline) / 10) × RQ multiplier + regression/inactivity overlays`, capped to ±15 years. It remains equal to chronological age until the personal baseline is calibrated. The daily edge function is the only server calculator; the legacy weekly endpoint delegates to it.

`REC` is Recovery v2 everywhere: the persisted value closes 65% of the gap
toward the current Health target once per calendar day, then Detox/Walking
gains are applied. The target uses confidence-blended Phone Health and adds up
to 50% wearable physiology influence as wearable coverage becomes complete;
without either source it is 50. SCI does not calculate a second weekly Recovery
approximation. When Phone Health already contains sleep duration, wearable
context excludes that same duration observation; HRV, resting HR and sleep
efficiency remain distinct inputs. Live, gating, intraday and historical paths
all apply this de-duplication rule.

When Recovery is not initialized, Sharpness and Readiness use the current
confidence-aware Recovery target (neutral 50 without passive evidence). Missing
Recovery is never converted to zero. Historical projections use the same daily
recalibration and the historical Health/wearable target when available.

## Passive daily state

Daily State is separate from the slower trainable capacity layer. It can alter
Sharpness and Readiness, but never writes AE, RA, CT, IN, S1, S2, RQ or
Cognitive Age.

- Health contributes 30% of possible coverage (sleep, consistency and movement).
- Wearable contributes 35% (HRV, resting heart rate, sleep duration and efficiency).
- Attention contributes 20% (aggregate attention-app minutes and active-app count).
- Schedule contributes 15% (busy minutes and meeting density).
- Wearable inputs degrade partially: available signal weights are renormalized
  and missing weights reduce confidence instead of disabling wearable mode.
- Attention and schedule are evaluated against the user's own rolling median.
  A partially elapsed day cannot create an artificial positive score; only
  load above baseline reduces their neutral state value of 50.
- The Daily State score uses only observed sources. `coverage` is the weighted
  confidence across all four source groups and determines how strongly Daily
  State may replace the app-only formula.
- Coverage labels are Basic below 35%, Enhanced from 35% to 74%, and High from
  75%. These labels describe input coverage, not medical or predictive accuracy.
- App names, domains, content, calendar titles, attendees and locations are
  never part of these inputs or stored in the cloud.

## Update and cloud contract

- Live values come from `useTodayMetrics`, `useReasoningQuality`,
  `useCognitiveNetworkScore`, and `useCognitiveAge`.
- Daily values are upserted to `daily_metric_snapshots` by local user date.
- Post-action values are inserted into `intraday_metric_events` after games,
  content, reasoning sessions, Detox, and Walking.
- RQ activity timestamps are maintained by database triggers so updates from
  every client/device affect decay consistently.
- Privacy-safe product usage is queued offline and inserted into
  `product_usage_events`. It excludes identity fields, cognitive scores, and
  health values and respects browser Do Not Track.
- All user-owned metric tables use Row Level Security keyed by `auth.uid()`.
- Adaptive Coach forecasts and their matched outcomes are stored separately in
  `adaptive_coach_predictions`. Shadow predictions may read canonical metrics,
  but they must never write metric values or alter active training behavior.
- `adaptive_daily_feature_snapshots.metrics.adaptiveStateEstimate` stores the
  shadow adaptive estimator: prediction, uncertainty, coverage, coefficients,
  objective-outcome count and projected headline metrics. It is never active
  until time-forward validation approves a separate product release.

## Adaptive estimator contract

- The estimator is a pair of explainable ridge models with versioned,
  literature-informed priors, not a generative-AI score. Attention and
  executive outcomes are modelled separately; the evidence registry and
  coefficient rationale live in `SCIENTIFIC_PRIORS.md`.
- It learns only from prior-day objective outcomes: drill scores and valid
  focus-session integrity. Today's outcome cannot enter today's prediction.
- Historical aggregate attention is used for training only when its latest
  captured use precedes that day's first outcome; otherwise it is treated as
  missing to prevent within-day future leakage.
- Atomic sleep duration, sleep consistency, sleep efficiency, HRV, resting HR,
  activity, aggregate attention load and aggregate schedule load are the
  contextual features. Sleep duration is selected once across Health and
  wearable sources. HRV and resting HR do not receive population-wide absolute
  scores and enter only after at least five prior readings establish a robust
  within-person baseline.
- Missing sources are neutral-imputed and reduce coverage/confidence; they never
  become zero performance. Uncertainty grows as source coverage or outcome
  history falls.
- Per-domain status is `learning` below 14 evaluable outcomes, `emerging` from
  14 to 44 and `personalized` from 45. The combined model is personalized only
  when both domains qualify. These describe maturity, not accuracy.
- Synthetic data may test invariants, missingness and calibration plumbing but
  must not be used as evidence that production predictions are accurate.
- The Coach is a separate decision layer. It may consume validated state
  estimates later, but it must not be used to define or self-confirm them.

## Display contract

- Every primary metric uses the same 0–100 ring, integer display, navigation,
  spacing, and factor-card structure.
- Factor cards always expose canonical code, value, weight or rule, exact score
  impact, and the data window behind the value.
- Canonical labels are AE — Attentional Efficiency, RA — Rapid Association,
  CT — Critical Thinking, IN — Insight, S1 — Fast Processing, S2 — Deliberate
  Reasoning, REC — Recovery, and RQ — Reasoning Quality.
- Icons are reserved for navigation and actions. Metric factors use their
  canonical codes rather than decorative icons.
- Every 0–100 score shares one qualitative scale: Strong (80+), Ready (65+),
  Steady (50+), Building (35+), and Starting point (<35). These are state
  labels, not ability or intelligence labels; numerical thresholds are unchanged.
- Provisional inputs must be marked as estimated. In particular, S2
  Consistency remains provisional until at least five S2 sessions exist.
- Readiness factors must expose the current App State, Cognitive State, Daily
  State and effective coverage weights. The UI must not show the retired
  all-or-nothing wearable formula.

## Daily state and recommendation contract

- The Lab recommendation uses `deriveDailyCognitiveState`; other surfaces must
  not recreate a conflicting recommendation from the same inputs.
- The recommendation can read canonical Readiness, Recovery, Sharpness and RQ,
  plus privacy-safe Health, attention-load and schedule-load aggregates.
- Attention and schedule loads are ratios against the user's own rolling
  baseline. Raw app names, event titles and content never enter the rule.
- Daily Outlook is a textual metric briefing, not a timer generator. Every
  recommendation exposes the exact source metric and value; generic work-block
  durations are forbidden. Only a metric-linked Lab intervention can present a
  navigation CTA, while steady/strong states remain guidance rather than a new
  task to complete.
- Recommendation priority is conservative: limited recovery first, then high
  attention or schedule load, then demanding-work readiness, trainable
  Sharpness/RQ opportunities, and finally the steady default.
- Home keeps its canonical metric rings and Recovery presentation unchanged.
  A single compact coverage row may disclose source status and freshness;
  passive inputs affect only the canonical formulas documented above.
- The recommendation rules choose explanatory copy and navigation only. They never mutate a
  metric, training gate, protocol, difficulty or Adaptive Coach forecast.
- The Adaptive Coach remains in shadow mode. It may replace these active rules
  only after its documented evidence gates pass and a separate product release
  explicitly enables personalization.

## Change rule

Any formula change must update the canonical pure engine first, then its tests
and this document. Components may calculate only visual geometry and display
rounding; they must not introduce alternate metric coefficients.
