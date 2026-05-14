---
name: Phone Health → Recovery Integration
description: Phone Health Index (PHI) from HealthKit/Health Connect drives a dynamic morning REC target (35–65) instead of fixed baseline 50; works without wearable; free for all users
type: feature
---

## Sources used (phone-only, no wearable)
- Sleep duration → weight 0.50
- Bedtime consistency (|today − 7-day median| min) → weight 0.15
- Daily steps → weight 0.20
- Active / Move minutes → weight 0.15
- Phone pickups (iOS optional) → penalty weight −0.10

## Sub-scores (0..100)
- SleepScore   = clamp01((sleep_min − 300) / 180) × 100
- ConsistScore = clamp01(1 − bedtime_dev_min / 90) × 100
- StepsScore   = clamp01((steps − 2000) / 6000) × 100
- ActiveScore  = clamp01(active_min / 30) × 100
- PickupPenalty= clamp01((pickups − 80) / 120) × 100

## PHI
PHI = 0.50·Sleep + 0.15·Consist + 0.20·Steps + 0.15·Active − 0.10·Pickup, clamped 0..100.

## Morning REC target
- target = hasData ? 35 + (PHI/100)·30 : 50
- REC_new = target + (REC_prev − target) × 0.85
- Without phone health → behaves exactly like the legacy baseline 50 (zero regression).

## Excluded from PHI / morning target (avoid double counting)
- Detox, Walk LOOMA sessions → continue to feed intra-day REC gain only
- Fast Recover → display-only per memory `acute-boost-spec`
- Read / Listen → independent from REC per `recovery-independence-from-quality-time`

## Storage
Table `phone_health_snapshots`: one row per (user, date) with sleep_min, bedtime_dev_min, steps, active_min, pickups, phi, target_rec, source.

## Sync
`usePhoneHealthSync` runs once/day in 04:00–11:00 local window when native HealthKit/Health Connect permissions are granted. Skipped on web.

## Gating
- Phone health: free for all users.
- HRV / RHR / sleep stages: continue gated to Pro/Elite via `useWearableSync`.

## UI
`/app/recovery-breakdown` — WHOOP-style breakdown reachable from the Recovery monitor card on Home.
