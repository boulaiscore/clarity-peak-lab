import { motion } from "framer-motion";
import { useWeeklyInsight } from "@/hooks/useWeeklyInsight";
import { METRIC_COLORS } from "@/lib/metricColors";
import type { InsightMetricKey } from "@/lib/weeklyInsights";

const INSIGHT_COLORS: Record<InsightMetricKey, string> = {
  sharpness: METRIC_COLORS.sharpness,
  readiness: METRIC_COLORS.readiness,
  reasoningQuality: METRIC_COLORS.reasoningQuality,
  recovery: METRIC_COLORS.recovery,
};

interface WeeklyInsightCardProps {
  visible?: boolean;
}

export function WeeklyInsightCard({ visible = true }: WeeklyInsightCardProps) {
  const { result, isLoading } = useWeeklyInsight();

  if (!visible || isLoading || !result) return null;

  const isReady = result.status === "ready";
  const accent = isReady ? INSIGHT_COLORS[result.insight.metric] : "hsl(var(--muted-foreground) / 0.45)";

  const headline = isReady
    ? result.insight.headline
    : result.status === "insufficient"
    ? `Learning your patterns · ${result.daysObserved} of ${result.daysRequired} days`
    : "No clear pattern this week";

  const detail = isReady
    ? result.insight.detail
    : result.status === "insufficient"
    ? "Personal correlations appear once there is enough of your own history to be honest about them."
    : "Your signals moved within normal range — nothing worth changing based on this week alone.";

  return (
    <motion.section
      initial={false}
      className="mb-4 rounded-[18px] border border-foreground/[0.07] bg-card/70 px-4 py-4"
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
        />
        <span className="text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
          We noticed
        </span>
        {isReady && (
          <span className="ml-auto text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">
            {result.insight.confidence === "solid" ? "Solid" : "Emerging"} · {result.insight.sampleSize}d
          </span>
        )}
      </div>

      <p className="mt-2 text-[14px] font-medium leading-snug text-foreground">{headline}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/75">{detail}</p>
    </motion.section>
  );
}
