import { calculatePhysioEstimate, type ReadinessPhysioData } from "@/lib/cognitiveEngine";
import { buildHrvBaseline, hrvMetricForSource, type HrvHistoryRow } from "@/lib/hrv";
import {
  applyDigitalLoadToRecoveryTarget,
  calculateDailyRecoveryTarget,
  type RecoveryTargetResolver,
} from "@/lib/recoveryV2";
import {
  calculateDigitalAttentionEstimate,
  type DigitalAttentionEstimate,
} from "@/lib/digitalFragmentation";

export interface DeviceTargetRow {
  snapshot_date: string;
  attention_usage_min: number | null;
  active_app_count: number | null;
  attention_session_count: number | null;
  attention_switch_count: number | null;
  brief_session_count: number | null;
  permission_state: string | null;
  confidence: number | null;
}

export const DEVICE_TARGET_COLUMNS =
  "snapshot_date, attention_usage_min, active_app_count, attention_session_count, attention_switch_count, brief_session_count, permission_state, confidence";

const toPoint = (row: DeviceTargetRow) => ({
  attentionUsageMin: row.attention_usage_min,
  activeAppCount: row.active_app_count,
  attentionSessionCount: row.attention_session_count,
  attentionSwitchCount: row.attention_switch_count,
  briefSessionCount: row.brief_session_count,
});

/** Digital attention for `date`, compared only with the user's preceding days. */
export function digitalEstimateForDate(
  rows: DeviceTargetRow[],
  date: string,
): DigitalAttentionEstimate {
  const granted = rows.filter((r) => r.permission_state === "granted");
  const current = granted.find((r) => r.snapshot_date === date);
  return calculateDigitalAttentionEstimate({
    current: current ? toPoint(current) : null,
    history: granted.filter((r) => r.snapshot_date < date).slice(-14).map(toPoint),
    sourceConfidence: current?.confidence ?? 0,
  });
}

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
  deviceRows: DeviceTargetRow[] = [],
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
    const base = calculateDailyRecoveryTarget(phone?.target_rec, estimate);
    return applyDigitalLoadToRecoveryTarget(base, digitalEstimateForDate(deviceRows, date));
  };
}
