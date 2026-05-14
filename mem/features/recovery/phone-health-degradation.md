---
name: Phone Health Partial Degradation
description: PHI computes with renormalized weights on available sources; confidence (0..1) blends targetRec with baseline 50 for smooth degradation
type: feature
---

# Phone Health Index — Partial Degradation + Confidence

Computed in `src/lib/phoneHealth.ts`. PHI never fails: it scales to whatever
HealthKit / Health Connect actually provides today.

## Weights (positive contributors)
- Sleep 0.50, Consistency 0.15, Steps 0.20, Active 0.15 → total 1.0
- Pickups: penalty source, weight 0.10 (not in confidence pool)

## Confidence
`confidence = sum(available_positive_weights) / 1.0`

## PHI
Renormalized over available sources, so PHI is always 0..100 even with one source:
`phi = (Σ w_i * score_i) / Σ w_i  −  0.10 * pickupPenalty`

## Target REC (blended)
Raw PHI target: `35 + (phi/100) * 30`
Final blended target stored in `phone_health_snapshots.target_rec`:

```
target_final = 50 * (1 - confidence) + targetRaw * confidence
```

Zero data → 50. Full data → personalized target. Smooth in between.

## Snapshot columns
`phone_health_snapshots` adds `confidence numeric` and `available_sources text[]`.

## UI (RecoveryBreakdown)
- Each source row shows ✓ when present, "Not available" otherwise.
- Confidence pill (Low / Medium / High) + 4-segment bar at top of Sources.
- PHI card discloses blend percentage when confidence < 1.
- "Unlock full Recovery precision" CTA only when confidence < 0.5.

## Sync
`usePhoneHealthSync` no longer requires sleep permission; it writes whatever
sources return data and persists `confidence` + `available_sources`.
