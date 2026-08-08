/** Canonical product palette for the metrics shown across Home and Monitor. */
export const METRIC_COLORS = {
  sharpness: "hsl(var(--chart-1))",
  readiness: "hsl(var(--chart-2))",
  recovery: "hsl(var(--recovery))",
  reasoningQuality: "hsl(var(--primary))",
  system1: "hsl(var(--area-fast))",
  system2: "hsl(var(--area-slow))",
} as const;
