
# Plan: Fix Delta Display Format and Recovery Logic

## Summary
Update the delta indicators on the Home page to:
1. Display only the percentage number (e.g., `+12%`) without extra text like "vs ieri"
2. Calculate **percentage change** instead of absolute change
3. Handle edge cases where yesterday's value is 0 or null
4. Confirm Recovery minimum value behavior

---

## Analysis: Recovery Minimum Value

Based on the codebase review, **Recovery CAN technically reach 0%** after initialization:

- **Initialization**: RRI is clamped between 35-55% via `calculateRRI()` - users never START at 0%
- **Decay**: The formula `REC = REC × 2^(-Δt_hours / 72)` asymptotically approaches 0%
- **Current logic**: `applyRecoveryDecay()` uses `Math.max(0, ...)` which allows 0% but not negative

So while users start between 35-55%, extended inactivity (many days without Detox/Walking) will decay the value toward 0%.

---

## Technical Changes

### 1. Update `formatDeltaPercent` helper (useYesterdayMetrics.ts)

**Current behavior**:
```typescript
const delta = current - previous;
return `${sign}${Math.round(delta)}`; // Returns absolute difference
```

**New behavior**:
```typescript
// Return percentage change as string, e.g., "+12%"
const percentChange = ((current - previous) / previous) * 100;
return `${sign}${Math.round(percentChange)}%`;
```

**Edge case handling**:
- If `previous === null`: return `null` (no data)
- If `previous === 0` AND `current > 0`: return `null` (cannot compute % from 0)
- If `previous === 0` AND `current === 0`: return `null` (no change)
- If delta is 0: return `null` (no meaningful change to show)

### 2. Update ProgressRing display (Home.tsx)

Remove "vs ieri" text from the delta display:

**Current (line 118)**:
```tsx
{deltaIndicator} vs ieri
```

**New**:
```tsx
{deltaIndicator}
```

### 3. Update ReasoningQualityCard display (ReasoningQualityCard.tsx)

Remove "(... vs ieri)" wrapper:

**Current (line 99)**:
```tsx
({deltaVsYesterday} vs ieri)
```

**New**:
```tsx
{deltaVsYesterday}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useYesterdayMetrics.ts` | Update `formatDeltaPercent` to calculate % change with edge case handling |
| `src/pages/app/Home.tsx` | Remove "vs ieri" text from delta display |
| `src/components/dashboard/ReasoningQualityCard.tsx` | Remove "(... vs ieri)" wrapper |

---

## Expected Result

| Scenario | Yesterday | Today | Display |
|----------|-----------|-------|---------|
| Normal improvement | 50 | 60 | `+20%` (green) |
| Normal decline | 50 | 40 | `-20%` (red) |
| No change | 50 | 50 | (nothing shown) |
| Yesterday was 0 | 0 | 30 | (nothing shown) |
| Yesterday null | null | 50 | (nothing shown) |
| Large improvement | 20 | 80 | `+300%` (green) |
