# LOOMA — Reviewer Guide

Orientation document for an external technical or business reviewer. It maps the
codebase, states the invariants the metric engine must hold, and lists what is
not yet real. Read this before opening individual files.

Repository: LOOMA (product name) / NeuroLoop Pro (internal project name).
Stack: Vite + React 18 + TypeScript, Tailwind, Radix/shadcn primitives,
HashRouter, PWA, Capacitor for iOS/Android, Lovable Cloud (managed Postgres +
edge functions + auth).

---

## 1. What the product claims to do

LOOMA is a cognitive-state system for professionals doing high-impact work. It
combines three signal sources — drill performance, passive phone/wearable
signals, and the user's own history — into a small set of state metrics, then
uses them to decide what the user should do next: focus, analyze, train, or
recover.

It explicitly does **not** claim to be a medical device, a diagnostic tool, an
intelligence test, or a predictor of decision outcomes. Every score is a
within-person comparison that gets more meaningful as personal history grows.
That framing is load-bearing: the copy, the formulas, and the disclaimers are
built around it.

## 2. Run it

```sh
npm install
npm run dev        # http://localhost:8080
npm run build      # production bundle
```

Environment files (`.env`, `.env.development`, `.env.production`) hold only
client-visible values: project id, publishable key, API base URL, payments
client token. They are intentionally **not** in this archive — supply your own.
Secret keys live server-side in the hosted platform's secret store and are
never in the repository.

Verification commands (all must pass before hand-off):

```sh
npm run lint
npm run test:metrics        # metric formulas
npm run test:coach          # adaptive coach + privacy contracts
npm run test:drills         # drill library integrity
npm run test:subscriptions  # entitlement rules
npm run test:outlook        # daily outlook generation
npm run test:insights       # weekly insights
npm run test:performance    # performance trend math
npm run build
```

## 3. Repository map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Route table (HashRouter), auth guard, native bootstrap |
| `src/pages/app/` | One file per screen: Home, NeuroLab (drills), Coach, Wearable, Premium, Settings, runners per drill |
| `src/components/` | `home/`, `games/`, `metrics/`, `health/`, `lab/`, `onboarding/`, `ui/` (shadcn primitives) |
| `src/lib/` | The engine. Pure functions, no UI — this is where the logic lives |
| `src/hooks/` | Data fetching + composition of `src/lib` into live values |
| `src/contexts/` | `AuthContext`, `SessionContext`, `NativeSecurityContext` |
| `src/integrations/` | Generated client for the hosted backend (do not hand-edit) |
| `supabase/functions/` | 25 server-side edge functions |
| `supabase/migrations/` | 68 SQL migrations: schema, RLS policies, grants |
| `drizzle/` | Parallel schema history used by the ORM layer |
| `scripts/` | Standalone test harnesses (no test framework installed) |
| `android-plugin/`, `ios-plugin/` | Custom native Capacitor plugins |
| `docs/` | Design records: metric integrity, data architecture, adaptive coach, scientific priors, subscription architecture, drill audit |
| `AGENTS.md` | Engineering rules the team enforces on every change |

## 4. Metric engine — the invariants a reviewer should check

These are the rules that make the numbers defensible. Each is enforced in code,
not in copy.

1. **HRV is scored by type, never across types.** iOS reports SDNN, Android
   reports RMSSD, WHOOP and Oura report their own statistic. Those are not
   interchangeable numbers. `src/lib/hrv.ts` resolves the metric type per
   source and scores it against the user's own 30-day **same-type** median.
2. **Recovery targets come from one resolver.** Every consumer — live hooks,
   the intraday recorder, the Monitor history chart — goes through
   `buildRecoveryTargetResolver` + `advanceRecoveryByDays`
   (`src/lib/recoveryTargetHistory.ts`). This is what prevents the number on
   Home and the number on the chart from disagreeing.
3. **Phone-use is penalty-only.** `applyDigitalLoadToRecoveryTarget`
   (`src/lib/recoveryV2.ts`) can lower a Recovery target, never raise it. It is
   bounded, confidence-scaled, and partial-day data must never produce a
   reward.
4. **Personal baselines before population norms.** `src/lib/adaptiveThresholds.ts`
   and `src/lib/adaptiveMetricEstimator.ts` gate every judgement on enough
   personal history; without it the app says "not enough data" instead of
   inventing a verdict.
5. **Acute boosts are display-layer only.** Fast Recover's transient +3..+8
   Recovery never touches stored raw values, snapshots, or trend lines.
6. **Drill gating is adaptive, not fixed.** `src/lib/gamesGating.ts` decides
   which drills are appropriate from current state and history, rather than
   hard thresholds.
7. **Everything is recomputable.** `src/lib/dataLineage.ts` and
   `src/lib/metricSnapshotIntegrity.ts` track what a number was built from.

Read `docs/METRIC_INTEGRITY.md` and `docs/DATA_ARCHITECTURE.md` first — they
state the formulas in full.

## 5. Privacy boundary

What the app can see, and what it cannot, is a design constraint, not a
setting.

**Collected:**
- Wearable/health aggregates via the OS layer (Health Connect on Android,
  HealthKit on iOS): sleep, HRV, resting heart rate, steps.
- Phone-use **durations** in a fixed list of 13 attention apps, read from the
  Android usage-access API. Minutes, app switches, short checks.
- Drill performance, Quality Time sessions, recovery actions, self-reported
  context.

**Never collected:**
- Email, call, SMS, or contact content.
- Message content from WhatsApp, Telegram, Messenger, or any social app.
- Which post, video, or thread the user opened.
- Calendar event titles, notes, attendees, locations, or calendar names — the
  calendar connector queries event times only and returns daily aggregates.

App names stay on the device. The server receives six aggregate numbers per
day. Background upload authenticates with a revocable device token
(`device-usage-ingest` function), never with the login session, so a refresh
can't sign the web layer out.

## 6. Data model

48 public tables. Grouped by role:

- **State**: `daily_metric_snapshots`, `intraday_metric_events`,
  `metric_estimates`, `user_cognitive_metrics`, `user_metric_latest`,
  `user_cognitive_baselines`
- **Cognitive age**: `user_cognitive_age_daily`, `user_cognitive_age_weekly`
- **Training**: `game_sessions`, `cognitive_exercises`, `exercise_completions`,
  `weekly_training_progress`, `training_sessions`
- **Quality Time**: `reason_sessions`, `active_books`, `user_listened_podcasts`
- **Recover**: `detox_sessions`, `detox_completions`, `walking_sessions`,
  `neuro_gym_sessions`
- **Passive signals**: `wearable_snapshots`, `wearable_daily_canonical`,
  `phone_health_snapshots`, `device_usage_snapshots`,
  `calendar_context_snapshots`, `passive_focus_observations`
- **Coach**: `coach_messages`, `coach_memory`, `adaptive_coach_predictions`,
  `adaptive_daily_feature_snapshots`, `adaptive_focus_forecasts`,
  `daily_outlooks`, `daily_work_recommendations`
- **Consent & lineage**: `data_consent_events`, `current_data_consents`,
  `canonical_observation_revisions`
- **Commercial**: `subscriptions`, `report_purchases`, `report_credit_purchases`,
  `report_generations`, `profiles`, `user_roles`, `device_ingest_tokens`
- **Analytics**: `product_usage_events`, `user_badges`, `waitlist_signups`,
  `team_waitlist`

Every table has row-level security enabled with explicit grants. Roles live in
`public.user_roles`, never in user-editable auth metadata.

## 7. Server-side functions

`supabase/functions/`:
- **Coach & inference**: `looma-coach`, `generate-daily-outlook`,
  `suggest-content`, `compute-cognitive-age-daily`, `compute-cognitive-age-weekly`,
  `initialize-cognitive-baseline`
- **Ingest**: `wearables-ingest`, `device-usage-ingest`
- **Wearable OAuth**: `wearable-oauth-start`, `wearable-oauth-callback`,
  `sync-wearable-provider`, `wearable-provider-manage`
- **Billing**: `create-checkout-session`, `create-report-checkout`,
  `create-report-credits-checkout`, `create-billing-portal-session`,
  `paddle-customer-portal`, `payments-webhook`, `stripe-webhook`,
  `get-paddle-price`, `verify-apple-receipt`
- **Ops**: `send-email`, `seed-exercises`, `claim-beta-access`

## 8. Native layer

- `android-plugin/app-blocker/` — usage-access reader, attention-app
  aggregation, background sync worker (WorkManager, 15-minute cadence), app
  blocking.
- `ios-plugin/device-usage/` — iOS usage request path; **inactive in
  production** pending the Family Controls entitlement.
- `ios-plugin/`, `android-plugin/` also carry biometric auth and secure
  storage wrappers.

## 9. Known gaps (state them plainly to a reviewer)

- iOS phone-use collection is not live; Android only.
- Coach session persistence is incomplete — conversations don't fully survive
  a reload.
- Wearable data depends on the OS layer: a device that doesn't write to Health
  Connect / HealthKit contributes nothing.
- B2B surface (licenses, org admin, aggregate-only reporting) does not exist
  yet — it is a proposal, not code.
- No automated test framework: the harnesses in `scripts/` are hand-rolled and
  must be run explicitly.

## 10. Suggested reading order

1. `README.md` → this guide
2. `docs/METRIC_INTEGRITY.md` → formulas
3. `src/lib/recoveryV2.ts`, `src/lib/hrv.ts`, `src/lib/recoveryTargetHistory.ts`
   → the state engine
4. `src/lib/adaptiveThresholds.ts`, `src/lib/gamesGating.ts` → judgement logic
5. `src/lib/digitalFragmentation.ts`, `src/lib/deviceUsageAggregation.ts` →
   privacy-safe phone-use path
6. `supabase/migrations/` (newest last) → schema, RLS, grants
7. `supabase/functions/looma-coach/` → inference path and its guardrails
8. `docs/SUBSCRIPTION_ARCHITECTURE.md` → entitlements
