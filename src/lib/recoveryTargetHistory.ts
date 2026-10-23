import { calculatePhysioEstimate, type ReadinessPhysioData } from "@/lib/cognitiveEngine";
import { buildHrvBaseline, hrvMetricForSource, type HrvHistoryRow } from "@/lib/hrv";
import { calculateDailyRecoveryTarget, type RecoveryTargetResolver } from "@/lib/recoveryV2";

export interface PhoneTargetRow {
  date: string;
  target_rec: number | null;
  sleep_min: number | null;
}

export interface WearableTargetRow extends HrvHistoryRow {
  resting_hr: number | null;
  sleep_duration_min: number | null;
  sleep_efficiency: number | null;
}

/** Physio input for a wearable row, with HRV type + personal same-type baseline. */
export function physioInputFromWearable(
  row: WearableTargetRow | Omit<WearableTargetRow, "date"> | null | undefined,
  history: HrvHistoryRow[],
  date: string,
): ReadinessPhysioData | null {
  if (!row) return null;
  const hrvMetric = hrvMetricForSource(row.source);
  return {
    hrvMs: row.hrv_ms ?? null,
    restingHr: row.resting_hr ?? null,
    sleepDurationMin: row.sleep_duration_min ?? null,
    sleepEfficiency: row.sleep_efficiency ?? null,
    hrvMetric,
    hrvBaseline: buildHrvBaseline(history, date, hrvMetric),
  };
}

/**
 * Single source for "what was the Recovery target on date X". Used by the
 * live Recovery engine and by Monitor history so both reconstruct missed days
 * identically. Days without any passive data return null (→ neutral 50).
 */
export function buildRecoveryTargetResolver(
  phoneRows: PhoneTargetRow[],
  wearableRows: WearableTargetRow[],
): RecoveryTargetResolver {
  const phoneByDate = new Map(phoneRows.map((r) => [r.date, r]));
  const wearableByDate = new Map(wearableRows.map((r) => [r.date, r]));
  return (date: string) => {
    const phone = phoneByDate.get(date);
    const wearable = wearableByDate.get(date);
    if (!phone && !wearable) return null;
    const estimate = calculatePhysioEstimate(physioInputFromWearable(wearable, wearableRows, date), {
      includeSleepDuration: phone?.sleep_min == null,
    });
    return calculateDailyRecoveryTarget(phone?.target_rec, estimate);
  };
}
