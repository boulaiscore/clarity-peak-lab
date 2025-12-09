import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";
import {
  getReadinessHint,
  getReadinessColor,
  ReadinessClassification,
} from "@/lib/readiness";
import { cn } from "@/lib/utils";
import { Activity, Brain, Zap } from "lucide-react";

export function CognitiveReadinessCard() {
  const {
    cognitiveReadinessScore,
    readinessClassification,
    physioComponentScore,
    cognitivePerformanceScore,
    hasWearableData,
    isLoading,
  } = useCognitiveReadiness();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="h-16 w-24 bg-muted rounded mb-4" />
        <div className="h-4 w-full bg-muted rounded" />
      </div>
    );
  }

  const score = cognitiveReadinessScore ?? 50;
  const classification: ReadinessClassification = readinessClassification as ReadinessClassification ?? "MEDIUM";
  const colors = getReadinessColor(classification);
  const hint = getReadinessHint(classification);

  return (
    <div className={cn(
      "rounded-xl border p-5 transition-all duration-300",
      "bg-gradient-to-br from-card via-card/80 to-card/60",
      colors.border
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg)}>
            <Zap className={cn("w-4 h-4", colors.text)} />
          </div>
          <h3 className="font-semibold text-sm">Cognitive Readiness Today</h3>
        </div>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
          colors.bg,
          colors.text
        )}>
          {classification}
        </span>
      </div>

      {/* Score Display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className={cn("text-5xl font-bold", colors.text)}>
          {Math.round(score)}
        </span>
        <span className="text-muted-foreground text-sm">/100</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden mb-4">
        {/* Colored segments */}
        <div className="absolute inset-y-0 left-0 w-[40%] bg-red-500/30" />
        <div className="absolute inset-y-0 left-[40%] w-[30%] bg-amber-500/30" />
        <div className="absolute inset-y-0 left-[70%] w-[30%] bg-emerald-500/30" />
        
        {/* Current score indicator */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 rounded-full transition-all duration-500",
            classification === "LOW" ? "bg-red-400" :
            classification === "MEDIUM" ? "bg-amber-400" : "bg-emerald-400"
          )}
          style={{ left: `calc(${Math.min(100, Math.max(0, score))}% - 2px)` }}
        />
      </div>

      {/* Components breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
          <Brain className="w-4 h-4 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Cognitive</p>
            <p className="text-sm font-semibold">
              {cognitivePerformanceScore != null ? Math.round(cognitivePerformanceScore) : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
          <Activity className="w-4 h-4 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Physio</p>
            <p className="text-sm font-semibold">
              {physioComponentScore != null ? Math.round(physioComponentScore) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">{hint}</p>

      {/* Data source note */}
      <p className="text-[10px] text-muted-foreground/60 mt-3 pt-3 border-t border-border/30">
        {hasWearableData
          ? "Based on your recent sleep, HRV, and cognitive performance."
          : "Based on your recent cognitive performance (no wearable data connected)."}
      </p>
    </div>
  );
}
