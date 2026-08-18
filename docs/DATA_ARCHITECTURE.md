# LOOMA user data architecture

## Decision

LOOMA uses one Supabase/Postgres production database. User data is not split
into one database or folder per person. Every user-owned row carries the
Supabase Auth `user_id`, is indexed by user and time, and is protected by Row
Level Security.

The architecture separates four responsibilities:

1. **Operational projections** provide the latest values to Home and Monitor.
2. **Immutable history** preserves source revisions and metric calculations.
3. **Model evidence** keeps features, predictions and later outcomes together.
4. **Permissions and connections** record what was authorized and when.

```text
Health / wearable / digital / calendar / LOOMA sessions
                         |
                         v
          canonical_observation_revisions
                         |
                         v
          adaptive_daily_feature_snapshots
                         |
                         v
                 metric_estimates
                         |
              +----------+----------+
              |                     |
              v                     v
 user_cognitive_metrics      daily_metric_snapshots
   (latest state cache)        (daily projection)
              |
              v
     Home / Monitor / Coach
```

## Canonical tables

| Responsibility | Canonical storage | Mutation model |
| --- | --- | --- |
| Account profile | `profiles` | Current state |
| Permission audit | `data_consent_events` | Append-only |
| Direct wearable connection | `wearable_provider_connections` | Current state |
| OAuth secrets | `wearable_provider_tokens` | Service-only current state |
| Health/wearable daily aggregates | `canonical_observation_revisions` | Append-only |
| Digital-fragmentation aggregates | `canonical_observation_revisions` | Append-only |
| Calendar-density aggregates | `canonical_observation_revisions` | Append-only |
| Training/recovery/content sessions | Existing session/completion tables | Event/final state |
| Product telemetry | `product_usage_events` | Append-only |
| Daily model features | `adaptive_daily_feature_snapshots` plus canonical revisions | Versioned + append-only revision |
| Metric calculations | `metric_estimates` | Append-only |
| Daily metric projection | `daily_metric_snapshots` | One current row/user/local day |
| Current cognitive state | `user_cognitive_metrics` | One current row/user |
| Coach predictions/outcomes | `adaptive_coach_predictions`, `adaptive_focus_forecasts` | Versioned lifecycle |
| Daily recommendation/outcome | `daily_outlooks` | Versioned lifecycle |

`daily_metric_snapshots` and `user_cognitive_metrics` remain intentionally
mutable because the mobile UI needs one fast read. Database triggers append
every changed metric to `metric_estimates` before those projections can hide
the previous value.

## Metric lineage contract

Every historical metric row includes:

- the user and metric code;
- value and effective timestamp;
- local date when known;
- formula version;
- signal coverage and confidence when available;
- one calculation ID shared by the same calculation batch;
- source table and source record ID;
- privacy-safe freshness/lineage metadata.

Coverage is the share of expected inputs observed. It must not be described as
model accuracy. Confidence remains nullable until a validated uncertainty
estimate exists.

## Source privacy contract

Only product-relevant aggregates leave the device:

- no app/package identity, domain, message or transition sequence;
- no calendar title, attendee, location, note or URL;
- no OAuth credential outside the service-only token table;
- no provider-native raw JSON in new wearable writes;
- no name or email in model features or product telemetry.

`canonical_observation_revisions` explicitly reconstructs payloads from the
allowed normalized columns. It never copies `wearable_snapshots.raw_json`.

## Access rules

- Authenticated users can read only their own histories.
- Users can append their own permission decisions.
- Metric history and canonical observation history are server/trigger written;
  clients cannot update or delete individual rows.
- OAuth tokens have no client policy and are available only to service-role
  Edge Functions.
- Service-role credentials must never be shipped in web or native bundles.

## Retention target

These are product-policy targets and must be reflected in the published
privacy policy before launch:

| Data | Target retention |
| --- | --- |
| Daily normalized health/context, metrics and sessions | Account lifetime |
| Model features, predictions and outcomes | Account lifetime |
| Product telemetry | 13 months |
| Any temporary high-frequency/raw diagnostic input | Maximum 30–90 days |
| OAuth tokens | Until disconnect/revocation |
| All user-owned rows | Exportable and deleted with the account |

Database backups are disaster recovery, not user-visible history. Production
must use managed backups and a tested restore procedure; Point-in-Time Recovery
is appropriate once paid users depend on the service.

## Scaling

Postgres remains the source of truth for the current product. Date partitioning
should be introduced only when append-only event tables become materially
large. A later analytics warehouse should receive pseudonymized exports and
must remain separate from operational identity and OAuth data.

## Deployment

Apply `20260818190000_user_data_history.sql` before releasing clients that
write lineage fields or consent events. Older clients remain compatible because
all new daily snapshot columns have server defaults.
