/**
 * CognitiveInsightCard - Premium decision-readiness insights for the Home page
 * 
 * Displays primary insight (current cognitive state) and optional secondary insight (trends).
 * Focused on professional decision-making guidance, not training CTAs.
 */

import { motion } from "framer-motion";
import { CognitiveInsight, InsightType } from "@/hooks/useCognitiveInsights";

interface CognitiveInsightCardProps {
  primaryInsight: CognitiveInsight;
  secondaryInsight: CognitiveInsight | null;
  decisionReadiness: InsightType;
  isLoading?: boolean;
}

/**
 * Visual indicator for decision readiness level
 * 4 dots representing: avoid, caution, good, peak
 */
function ReadinessIndicator({ level }: { level: InsightType }) {
  const levels: InsightType[] = ["avoid", "caution", "good", "peak"];
  const activeIndex = levels.indexOf(level);

  return (
    <div className="flex items-center gap-1">
      {levels.map((_, index) => (
        <div
          key={index}
          className={`w-1.5 h-1.5 rounded-full transition-all ${
            index <= activeIndex
              ? "bg-foreground/60"
              : "bg-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

export function CognitiveInsightCard({
  primaryInsight,
  secondaryInsight,
  decisionReadiness,
  isLoading,
}: CognitiveInsightCardProps) {
  if (isLoading) {
    return (
      <div className="p-3.5 rounded-xl bg-muted/15 border border-border/20 animate-pulse">
        <div className="h-3 bg-muted rounded w-3/4 mb-3" />
        <div className="h-2.5 bg-muted rounded w-full mb-1.5" />
        <div className="h-2.5 bg-muted rounded w-5/6" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3.5 rounded-xl bg-muted/15 border border-border/20"
    >
      {/* Header with readiness indicator */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-xs font-medium text-foreground leading-snug">
          {primaryInsight.headline}
        </h3>
        <ReadinessIndicator level={decisionReadiness} />
      </div>

      {/* Primary insight body */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {primaryInsight.body}
      </p>

      {/* Secondary insight (trend-based) */}
      {secondaryInsight && (
        <div className="mt-3 pt-3 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
            <span className="font-medium text-foreground/70">
              {secondaryInsight.headline}
            </span>
            {" — "}
            {secondaryInsight.body}
          </p>
        </div>
      )}
    </motion.div>
  );
}
