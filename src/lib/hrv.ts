/**
 * HRV scoring.
 *
 * iOS HealthKit reports SDNN, while Health Connect, WHOOP and Oura report
 * RMSSD. The two are different statistics and the same milliseconds do not
 * mean the same physiology, so they are never scored on a shared scale.
 *
 * - Personal mode (>= HRV_MIN_BASELINE_DAYS same-type days in the last 30):
 *   score = 50 + 50 * clamp(ln(today / median) / 0.25, -1, 1)
 * - Cold start: type-specific absolute range, with half signal confidence.
 */

export type HrvMetric = "sdnn" | "rmssd";

export const HRV_MIN_BASELINE_DAYS = 7;
export const HRV_BASELINE_WINDOW_DAYS = 30;
export const HRV_LOG_SPAN = 0.25;
export const HRV_COLD_START_CONFIDENCE = 0.5;

const ABSOLUTE_RANGES: Record<HrvMetric | "unknown", [number, number]> = {
  sdnn: [20, 100],
  rmssd: [15, 90],
  unknown: [20, 120],
};

export function hrvMetricForSource(source: string | null | undefined): HrvMetric | null {
  if (!source) return null;
  const s = source.toLowerCase();
  if (s.includes("apple") || s.includes("healthkit") || s === "ios") return "sdnn";
  if (s.includes("health_connect") || s.includes("healthconnect") || s.includes("android") || s.includes("whoop") || s.includes("oura")) return "rmssd";
  return null;
}

export interface HrvScore {
  score: number;
  /** Multiplier applied to the HRV signal weight (1 personal, 0.5 cold start). */
  confidence: number;
  personal: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function scoreHrv(
  valueMs: number,
  metric: HrvMetric | null | undefined,
  baseline?: { medianMs: number | null; sampleDays: number } | null,
): HrvScore {
  if (baseline && baseline.medianMs && baseline.sampleDays >= HRV_MIN_BASELINE_DAYS && valueMs > 0) {
    const ratio = Math.log(valueMs / baseline.medianMs) / HRV_LOG_SPAN;
    return { score: 50 + 50 * clamp(ratio, -1, 1), confidence: 1, personal: true };
  }
  const [lo, hi] = ABSOLUTE_RANGES[metric ?? "unknown"];
  return {
    score: ((clamp(valueMs, lo, hi) - lo) / (hi - lo)) * 100,
    confidence: HRV_COLD_START_CONFIDENCE,
    personal: false,
  };
}

export interface HrvHistoryRow {
  date: string;
  hrv_ms: number | null;
  source?: string | null;
}

/**
 * Personal baseline for `date`: median of the previous 30 days (excluding the
 * day itself) with the same HRV metric type. Switching device type restarts it.
 */
export function buildHrvBaseline(
  rows: HrvHistoryRow[],
  date: string,
  metric: HrvMetric | null,
): { medianMs: number | null; sampleDays: number } {
  if (!metric) return { medianMs: null, sampleDays: 0 };
  const start = new Date(`${date}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - HRV_BASELINE_WINDOW_DAYS);
  const startStr = start.toISOString().slice(0, 10);
  const values = rows
    .filter((r) => r.date < date && r.date >= startStr && r.hrv_ms != null && hrvMetricForSource(r.source) === metric)
    .map((r) => Number(r.hrv_ms));
  return { medianMs: median(values), sampleDays: values.length };
}
