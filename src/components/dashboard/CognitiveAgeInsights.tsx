/**
 * ============================================
 * COGNITIVE AGE INSIGHTS (WHOOP-style cards)
 * ============================================
 * 
 * Premium insight cards showing:
 * - Regression risk status
 * - Biggest improvement lever / Top performer
 */

import { motion } from "framer-motion";
import { AlertTriangle, Target, Sparkles, ChevronRight } from "lucide-react";
import { useCognitiveAge } from "@/hooks/useCognitiveAge";
import { useCognitiveAgeImpact } from "@/hooks/useCognitiveAgeImpact";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function CognitiveAgeInsights() {
  const { data } = useCognitiveAge();
  const { contributions } = useCognitiveAgeImpact();

  // Find biggest negative contributor (biggest lever for improvement)
  // OR find best performer if all are positive/neutral
  const getDriverInfo = () => {
    if (!contributions || contributions.length === 0) return null;
    
    // Find the variable with most negative contribution
    const negativeContributions = contributions.filter(c => c.contribution < -0.1);
    
    if (negativeContributions.length > 0) {
      // Sort by most negative
      const sorted = [...negativeContributions].sort((a, b) => a.contribution - b.contribution);
      const biggest = sorted[0];
      
      // Calculate potential years impact (10 pts = 1 year)
      const potentialYears = Math.abs(biggest.delta) * 0.25 / 10;
      
      return {
        type: "lever" as const,
        variable: biggest,
        potentialYears,
        ptsToRecover: Math.abs(Math.round(biggest.delta)),
      };
    }
    
    // No negative contributors - find best performer
    const positiveContributions = contributions.filter(c => c.contribution > 0.1);
    if (positiveContributions.length > 0) {
      const sorted = [...positiveContributions].sort((a, b) => b.contribution - a.contribution);
      const best = sorted[0];
      
      return {
        type: "performer" as const,
        variable: best,
        potentialYears: best.delta * 0.25 / 10,
        ptsGained: Math.round(best.delta),
      };
    }
    
    return null;
  };

  const driverInfo = getDriverInfo();
  const regressionRisk = data.regressionRisk;
  const streakDays = data.regressionStreakDays;
  const daysToRegression = Math.max(0, 21 - streakDays);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 space-y-2"
    >
      {/* Regression Risk Card - Only show if risk is medium or high */}
      {regressionRisk !== "low" && streakDays > 0 && (
        <div className={cn(
          "p-3 rounded-xl border",
          regressionRisk === "high" 
            ? "bg-red-500/5 border-red-500/20" 
            : "bg-amber-500/5 border-amber-500/20"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              regressionRisk === "high" ? "bg-red-500/10" : "bg-amber-500/10"
            )}>
              <AlertTriangle className={cn(
                "w-4 h-4",
                regressionRisk === "high" ? "text-red-400" : "text-amber-500"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                Regression Risk
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                <span className={cn(
                  "font-semibold",
                  regressionRisk === "high" ? "text-red-400" : "text-amber-500"
                )}>
                  {regressionRisk === "high" ? "High" : "Medium"}
                </span>
                <span className="text-muted-foreground">
                  {regressionRisk === "high" 
                    ? ` — regression applied. ${data.regressionPenaltyYears} year(s) added.`
                    : ` — ${streakDays} days below baseline. ${daysToRegression} days to +1y penalty.`
                  }
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Driver Card - Lever or Top Performer */}
      {driverInfo && (
        <Link 
          to="/app/training"
          className={cn(
            "block p-3 rounded-xl border transition-colors group",
            driverInfo.type === "lever" 
              ? "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10"
              : "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              driverInfo.type === "lever" ? "bg-amber-500/10" : "bg-emerald-500/10"
            )}>
              {driverInfo.type === "lever" 
                ? <Target className="w-4 h-4 text-amber-500" />
                : <Sparkles className="w-4 h-4 text-emerald-500" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                {driverInfo.type === "lever" ? "Biggest Lever" : "Top Performer"}
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                <span className="font-semibold" style={{ color: driverInfo.variable.color }}>
                  {driverInfo.variable.fullLabel}
                </span>
                <span className="text-muted-foreground">
                  {driverInfo.type === "lever" 
                    ? ` — recover +${driverInfo.ptsToRecover} pts to remove ~${driverInfo.potentialYears.toFixed(1)}y pressure.`
                    : ` — contributing +${driverInfo.ptsGained} pts to your cognitive youth.`
                  }
                </span>
              </p>
            </div>
            <ChevronRight className={cn(
              "w-4 h-4 flex-shrink-0 mt-2 transition-colors",
              driverInfo.type === "lever" 
                ? "text-muted-foreground group-hover:text-amber-500"
                : "text-muted-foreground group-hover:text-emerald-500"
            )} />
          </div>
        </Link>
      )}
    </motion.div>
  );
}
