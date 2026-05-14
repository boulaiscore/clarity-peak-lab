# Phone Health → Recovery Integration

Integrate base health data from HealthKit (iOS) and Health Connect (Android) into the REC model, with a WHOOP-style breakdown report. Works without a wearable; HRV/RHR remain wearable-premium.

## Formula recap (Option A confirmed)

**Phone Health Index (PHI), 0–100**
```
SleepScore   = clamp01((sleep_min - 300) / 180) × 100
ConsistScore = clamp01(1 - bedtime_dev_min / 90) × 100
StepsScore   = clamp01((steps - 2000) / 6000) × 100
ActiveScore  = clamp01(active_min / 30) × 100
PickupPenalty= clamp01((pickups - 80) / 120) × 100   // 0 if unavailable

PHI = 0.50·Sleep + 0.15·Consist + 0.20·Steps + 0.15·Active − 0.10·Pickup
```

**Morning REC snapshot (replaces fixed baseline 50)**
```
target  = PHI available ? 35 + (PHI/100)·30 : 50
REC_new = target + (REC_prev - target) × 0.85
```

**Intra-day gain (unchanged)**: Detox `+0.12·min`, Walk `+0.06·min`, Fast Recover display-only.
**Read / Listen**: no effect on REC (per existing memory).

## What changes

### 1. Database
New table `phone_health_snapshots` (one row per user/day):
- `sleep_min`, `bedtime_dev_min`, `steps`, `active_min`, `pickups`
- computed `phi`, `target_rec`
- `source` ('healthkit' | 'health_connect'), `date`
- RLS: user can read/insert/update own rows.

### 2. Native plugins
Extend existing `ios-plugin/health/HealthPlugin.swift` and `android-plugin/health/HealthPlugin.kt` with:
- `readSteps(dayStart, dayEnd)`
- `readActiveMinutes(dayStart, dayEnd)`
- `readBedtimeHistory(7d)` for consistency deviation
- (iOS only, optional) `readScreenPickups` — gated, falls back to null on Android

Sleep is already implemented. Update Capacitor bridges accordingly.

### 3. Logic
- `src/lib/phoneHealth.ts` (new): `computePHI(inputs)`, `computeTargetRec(phi)`, sub-score helpers, types.
- `src/lib/recoveryV2.ts`: `applyRecoveryDecay` accepts optional `targetOverride`. Default stays 50 → zero regression for users without phone health.
- `src/hooks/usePhoneHealthSync.ts` (new): reads native APIs once per day on app foreground (between 04:00–11:00 local), upserts `phone_health_snapshots`, then triggers REC snapshot recomputation through `useRecoveryV2`.
- `src/hooks/useRecoveryV2.ts`: when fetching state, also fetches today's `target_rec` from `phone_health_snapshots` and passes it to `applyRecoveryDecay`.

### 4. UI — Recovery Breakdown report
New screen `src/pages/app/RecoveryBreakdown.tsx` reachable by tapping the Recovery card on Home. WHOOP-style layout:
- Hero: REC value + delta vs yesterday
- Section "Sources" with 5 rows (Sleep, Consistency, Steps, Move, Pickups): raw value, 0–100 bar, contribution
- Footer: PHI total, target REC tonight, today's cognitive actions (Detox/Walk minutes + delta), 1-line micro-coach copy
- Empty state when phone health not authorized: CTA "Enable Health access" deep-linking to existing wearable connection flow

Add navigation entry in `MonitorCardsRow` / Recovery card tap handler with "← Today" back button per existing nav pattern.

### 5. Gating
- Phone health: free for all users (zero hardware requirement).
- HRV / RHR / sleep stages: continue gated to Pro/Elite via existing `useWearableSync` flow.

### 6. Memory
Add `mem://features/recovery/phone-health-integration` documenting:
- PHI formula and weights
- Target REC range 35–65
- Sources included/excluded (no double-counting walk/steps)
- Free tier eligibility

## Files touched

**New**
- `src/lib/phoneHealth.ts`
- `src/hooks/usePhoneHealthSync.ts`
- `src/pages/app/RecoveryBreakdown.tsx`
- `mem://features/recovery/phone-health-integration`
- migration: `phone_health_snapshots` table + RLS

**Modified**
- `ios-plugin/health/HealthPlugin.swift` + `.m`
- `android-plugin/health/HealthPlugin.kt`
- `src/lib/capacitor/health.ts` + `health-web.ts`
- `src/lib/recoveryV2.ts` (add `targetOverride` param)
- `src/hooks/useRecoveryV2.ts` (fetch + apply target)
- `src/components/home/MonitorCardsRow.tsx` (link Recovery → breakdown)
- `src/App.tsx` (route)

## Out of scope
- HRV/RHR redesign (remains in `readiness.ts`)
- Backfill of historical phone health data
- Apple Screen Time deep integration beyond optional pickup count
