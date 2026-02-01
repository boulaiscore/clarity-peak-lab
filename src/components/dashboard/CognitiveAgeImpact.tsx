/**
 * ============================================
 * COGNITIVE AGE IMPACT BREAKDOWN
 * ============================================
 * 
 * Shows per-variable contributions to Cognitive Age:
 * Impact Bars - horizontal bars showing each variable's contribution
 * 
 * Note: Trend chart has been moved to DualProcessTrendChart (under FastSlowBrainMap)
 */

import { motion } from "framer-motion";
import { Loader2, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useCognitiveAgeImpact } from "@/hooks/useCognitiveAgeImpact";
import { cn } from "@/lib/utils";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ==========================================
// COMPONENT
// ==========================================

export function CognitiveAgeImpact() {
  const { 
    contributions, 
    totalImprovementPoints, 
    isLoading,
    hasEnoughData,
    isCalibrated 
  } = useCognitiveAgeImpact();

  if (isLoading) {
    return (
      <div className="mx-2 p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2"
    >
      {/* Impact Bars Section - show only if we have data */}
      {hasEnoughData && (
        <ImpactBars 
          contributions={contributions} 
          totalImprovementPoints={totalImprovementPoints}
          isCalibrated={isCalibrated}
        />
      )}
    </motion.div>
  );
}

// ==========================================
// IMPACT BARS SUBCOMPONENT
// ==========================================

interface ImpactBarsProps {
  contributions: ReturnType<typeof useCognitiveAgeImpact>["contributions"];
  totalImprovementPoints: number;
  isCalibrated: boolean;
}

function ImpactBars({ contributions, totalImprovementPoints, isCalibrated }: ImpactBarsProps) {
  const yearsImpact = totalImprovementPoints / 10;

  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Impact Breakdown
        </h4>
        {!isCalibrated && (
          <span className="px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Est.
          </span>
        )}
      </div>

      {/* Variable bars */}
      <div className="space-y-2.5">
        {contributions.map((c) => (
          <TooltipProvider key={c.key} delayDuration={0}>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="group cursor-default">
                  <div className="flex items-center gap-2">
                    {/* Label */}
                    <span 
                      className="text-[10px] font-semibold w-6"
                      style={{ color: c.color }}
                    >
                      {c.label}
                    </span>

                    {/* Bar */}
                    <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, c.percentOfTotal)}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          c.status === "positive" && "bg-emerald-500/70",
                          c.status === "neutral" && "bg-muted-foreground/40",
                          c.status === "negative" && "bg-red-500/60"
                        )}
                      />
                    </div>

                    {/* Contribution value */}
                    <span className={cn(
                      "text-[10px] font-medium w-12 text-right",
                      c.status === "positive" && "text-emerald-500",
                      c.status === "neutral" && "text-muted-foreground",
                      c.status === "negative" && "text-red-400"
                    )}>
                      {c.contribution >= 0 ? "+" : ""}{c.contribution.toFixed(1)}
                    </span>

                    {/* Status icon */}
                    <div className="w-4">
                      {c.status === "positive" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                      {c.status === "neutral" && <Minus className="w-3 h-3 text-muted-foreground" />}
                      {c.status === "negative" && <TrendingDown className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="font-medium">{c.fullLabel}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Current: {c.currentValue.toFixed(0)} • Baseline: {c.baselineValue.toFixed(0)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Δ {c.delta >= 0 ? "+" : ""}{c.delta.toFixed(1)} pts × 20% = {c.contribution >= 0 ? "+" : ""}{c.contribution.toFixed(2)}
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Total impact */}
      <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Total improvement
        </span>
        <span className={cn(
          "text-xs font-semibold",
          totalImprovementPoints > 0 ? "text-emerald-500" : 
          totalImprovementPoints < 0 ? "text-red-400" : "text-muted-foreground"
        )}>
          {totalImprovementPoints >= 0 ? "+" : ""}{totalImprovementPoints.toFixed(1)} pts
          <span className="text-muted-foreground font-normal ml-1">
            = {yearsImpact >= 0 ? "-" : "+"}{Math.abs(yearsImpact).toFixed(1)}y
          </span>
        </span>
      </div>
    </div>
  );
}
