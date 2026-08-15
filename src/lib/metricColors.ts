/**
 * Canonical metric colors.
 *
 * These values are the single source of truth for all metric visuals:
 * Home rings, detail-page score rings, trend charts, and the clinical report.
 */
export const METRIC_COLORS = {
  /** Hybrid blue — Sharpness is 60% S1 + 40% S2, so its colour sits between the two */
  sharpness: "hsl(210, 80%, 58%)",
  /** Vivid electric blue — System 1 / fast intuitive processing */
  system1: "hsl(205, 100%, 58%)",
  /** Muted blue-grey — System 2 / deliberate analytical reasoning */
  system2: "hsl(215, 28%, 58%)",
  /** Vivid sky blue — Readiness / deliberate analytical capacity */
  readiness: "hsl(205, 85%, 62%)",
  /** Teal-cyan — reasoning quality / structured judgment (Reasoning Quality) */
  reasoningQuality: "hsl(190, 80%, 52%)",
  /** Teal-green — restoration / capacity (Recovery) */
  recovery: "hsl(174, 72%, 45%)",
} as const;

export type MetricColorKey = keyof typeof METRIC_COLORS;
