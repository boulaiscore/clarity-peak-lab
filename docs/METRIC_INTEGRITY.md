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

## Formulas

- `S1 = (AE + RA) / 2`
- `S2 = (CT + IN) / 2`
- `Sharpness = (0.60 × S1 + 0.40 × S2) × (0.75 + 0.25 × REC / 100)`
- Readiness without wearable: `0.35 × REC + 0.35 × S2 + 0.30 × AE`
- Readiness with wearable: `0.50 × Physio + 0.50 × Cognitive`, where
  `Cognitive = 0.30 × CT + 0.25 × AE + 0.20 × IN + 0.15 × S2 + 0.10 × S1`
- `RQ = 0.50 × S2 Core + 0.30 × S2 Consistency + 0.20 × Task Priming`
- `SCI = 0.50 × Cognitive Performance + 0.30 × Behavioral Engagement + 0.20 × REC`
- Cognitive Age performance uses the average of AE, RA, CT, and IN only. S2 is
  not counted a second time. The long window is 180 days and the short window
  is 30 days.

`REC` is Recovery v2 everywhere: the persisted value is recalibrated once per
calendar day toward the Phone Health target (or 50), then Detox/Walking gains
are applied. SCI does not calculate a second weekly Recovery approximation.

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
- Readiness factors must reflect its active mode: app-only or wearable. The UI
  must never show app-only weights when the wearable formula is active.

## Daily state and recommendation contract

- The Lab recommendation uses `deriveDailyCognitiveState`; other surfaces must
  not recreate a conflicting recommendation from the same inputs.
- The recommendation can read canonical Readiness, Recovery, Sharpness and RQ,
  plus privacy-safe Health, attention-load and schedule-load aggregates.
- Attention and schedule loads are ratios against the user's own rolling
  baseline. Raw app names, event titles and content never enter the rule.
- Recommendation priority is conservative: limited recovery first, then high
  attention or schedule load, then demanding-work readiness, trainable
  Sharpness/RQ opportunities, and finally the steady default.
- Home keeps its canonical metric rings and Recovery presentation unchanged;
  passive data collection and shadow evaluation run independently of its UI.
- The recommendation rules choose explanatory copy and navigation only. They never mutate a
  metric, training gate, protocol, difficulty or Adaptive Coach forecast.
- The Adaptive Coach remains in shadow mode. It may replace these active rules
  only after its documented evidence gates pass and a separate product release
  explicitly enables personalization.

## Change rule

Any formula change must update the canonical pure engine first, then its tests
and this document. Components may calculate only visual geometry and display
rounding; they must not introduce alternate metric coefficients.
