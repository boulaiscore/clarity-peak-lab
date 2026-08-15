/**
 * Canonical metric colors.
 *
 * These values are the single source of truth for all metric visuals:
 * Home rings, detail-page score rings, trend charts, and the clinical report.
 */
export const METRIC_COLORS = {
  /** Vivid electric blue — System 1 / fast intuitive processing (Sharpness) */
  sharpness: "hsl(205, 100%, 58%)",
  /** Muted blue-grey — System 2 / deliberate analytical reasoning (Readiness) */
  readiness: "hsl(215, 28%, 58%)",
  /** Teal-cyan — reasoning quality / structured judgment (Reasoning Quality) */
  reasoningQuality: "hsl(190, 80%, 52%)",
  /** Teal-green — restoration / capacity (Recovery) */
  recovery: "hsl(174, 72%, 45%)",
} as const;

export type MetricColorKey = keyof typeof METRIC_COLORS;
