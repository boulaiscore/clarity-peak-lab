/**
 * ============================================
 * COGNITIVE AGE INSIGHTS (WHOOP-style cards)
 * ============================================
 * 
 * Premium insight cards showing:
 * - Trajectory (30d vs 180d trend)
 * - Regression risk status
 * - Biggest improvement lever
 */

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, ChevronRight } from "lucide-react";
import { useCognitiveAge } from "@/hooks/useCognitiveAge";
import { useCognitiveAgeImpact, VARIABLE_CONFIG, type VariableKey } from "@/hooks/useCognitiveAgeImpact";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function CognitiveAgeInsights() {
  const { data, hasWeeklyData } = useCognitiveAge();
  const { contributions, hasEnoughData, totalImprovementPoints } = useCognitiveAgeImpact();

  // Calculate trajectory from contributions data if weekly data not available
  const getTrajectory = () => {
    // First try weekly data
    if (data.perf30d !== null && data.perf180d !== null) {
      const diff = data.perf30d - data.perf180d;
      if (diff > 2) return { status: "improving" as const, diff };
      if (diff < -2) return { status: "declining" as const, diff };
      return { status: "stable" as const, diff };
    }
    
    // Fallback: use totalImprovementPoints from contributions
    if (hasEnoughData && contributions.length > 0) {
      if (totalImprovementPoints > 1) return { status: "improving" as const, diff: totalImprovementPoints };
      if (totalImprovementPoints < -1) return { status: "declining" as const, diff: totalImprovementPoints };
      return { status: "stable" as const, diff: totalImprovementPoints };
    }
    
    return null;
  };

  // Find biggest negative contributor (biggest lever for improvement)
  const getBiggestLever = () => {
    if (!contributions || contributions.length === 0) return null;
    
    // Find the variable with most negative contribution
    const negativeContributions = contributions.filter(c => c.contribution < 0);
    if (negativeContributions.length === 0) return null;
    
    // Sort by most negative
    const sorted = [...negativeContributions].sort((a, b) => a.contribution - b.contribution);
    const biggest = sorted[0];
    
    // Calculate potential years impact (10 pts = 1 year)
    const potentialYears = Math.abs(biggest.delta) * 0.25 / 10;
    
    return {
      ...biggest,
      potentialYears,
      ptsToRecover: Math.abs(Math.round(biggest.delta)),
    };
  };

  const trajectory = getTrajectory();
  const biggestLever = getBiggestLever();
  const regressionRisk = data.regressionRisk;
  const streakDays = data.regressionStreakDays;
  const daysToRegression = Math.max(0, 21 - streakDays);

  // Show if we have any meaningful data
  const hasAnyData = hasWeeklyData || hasEnoughData || trajectory !== null;
  
  // Don't render if no data at all
  if (!hasAnyData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 space-y-2"
    >
      {/* Trajectory Card */}
      {trajectory && (
        <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              trajectory.status === "improving" && "bg-emerald-500/10",
              trajectory.status === "declining" && "bg-red-500/10",
              trajectory.status === "stable" && "bg-blue-500/10"
            )}>
              {trajectory.status === "improving" && <TrendingUp className="w-4 h-4 text-emerald-500" />}
              {trajectory.status === "declining" && <TrendingDown className="w-4 h-4 text-red-400" />}
              {trajectory.status === "stable" && <Minus className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                Trajectory
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                {trajectory.status === "improving" && (
                  <>
                    <span className="font-semibold text-emerald-500">Improving</span>
                    <span className="text-muted-foreground"> — your last 30 days are above your 6-month line.</span>
                  </>
                )}
                {trajectory.status === "declining" && (
                  <>
                    <span className="font-semibold text-red-400">Declining</span>
                    <span className="text-muted-foreground"> — your last 30 days are below your 6-month line.</span>
                  </>
                )}
                {trajectory.status === "stable" && (
                  <>
                    <span className="font-semibold text-blue-400">Steady</span>
                    <span className="text-muted-foreground"> — your 30-day and 6-month trends are aligned.</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Regression Risk Card */}
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
                    : ` — ${streakDays} days below baseline −10. ${daysToRegression} days to a +1y penalty.`
                  }
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Biggest Lever Card */}
      {biggestLever && biggestLever.ptsToRecover >= 3 && (
        <Link 
          to="/app/training"
          className="block p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                Biggest Lever
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                <span className="font-semibold" style={{ color: biggestLever.color }}>
                  {biggestLever.fullLabel}
                </span>
                <span className="text-muted-foreground">
                  {" "}— recover +{biggestLever.ptsToRecover} pts to remove ~{biggestLever.potentialYears.toFixed(1)} years of pressure.
                </span>
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-2" />
          </div>
        </Link>
      )}
    </motion.div>
  );
}
