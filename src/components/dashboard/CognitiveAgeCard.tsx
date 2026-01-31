/**
 * ============================================
 * COGNITIVE AGE CARD (v1.1)
 * ============================================
 * 
 * Slow-moving Cognitive Age display with:
 * - Calibrating badge when baseline not stabilized
 * - Weekly update indicator
 * - Baseline visual (sparkline or text)
 * - Regression risk warning banner
 * - Callout when cognitive age > chronological age
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Activity, TrendingDown, TrendingUp, Info, Loader2 } from "lucide-react";
import { useCognitiveAge, getRegressionRiskLabel, getRegressionRiskColor } from "@/hooks/useCognitiveAge";
import { CognitiveAgeSphere } from "./CognitiveAgeSphere";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
export function CognitiveAgeCard() {
  const {
    data,
    isLoading,
    hasWeeklyData
  } = useCognitiveAge();

  // Calculate display values
  const displayAge = data.cognitiveAge ?? data.chronoAgeAtOnboarding ?? 30;
  const delta = data.delta;
  const chronoAge = data.chronoAgeAtOnboarding ?? 30;

  // Determine if we should show warning for age > chrono
  const isOlderThanChrono = data.cognitiveAge !== null && data.cognitiveAge > chronoAge;
  if (isLoading) {
    return <div className="py-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>;
  }
  return <div className="py-2 space-y-4">
      {/* Header with update info */}
      <div className="flex items-center justify-between px-2">
        <h3 className="label-uppercase">Cognitive Age</h3>
        
        <div className="flex items-center gap-2">
          {/* Calibrating badge */}
          {data.isCalibrating && <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Calibrating
            </span>}
          
          {/* Weekly update indicator */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Weekly</span>
          </div>
        </div>
      </div>

      {/* Main sphere visualization */}
      <CognitiveAgeSphere cognitiveAge={displayAge} delta={delta} chronologicalAge={chronoAge} />

      {/* Calibrating message */}
      {data.isCalibrating && <motion.div initial={{
      opacity: 0,
      y: 4
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mx-2 p-3 border border-muted rounded-sm bg-card">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-primary-foreground">
                Calibrating...
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Your Cognitive Age will stabilize as we collect more data. Keep training!
              </p>
            </div>
          </div>
        </motion.div>}

      {/* Warning when cognitive age > chronological age */}
      {isOlderThanChrono && !data.isCalibrating && <motion.div initial={{
      opacity: 0,
      y: 4
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mx-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Above chronological age
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                This reflects recent performance below your personal baseline—not irreversible decline. Small, consistent sessions typically reverse this within weeks.
              </p>
            </div>
          </div>
        </motion.div>}

      {/* Regression risk warning */}
      {(data.regressionRisk === "medium" || data.regressionRisk === "high") && <motion.div initial={{
      opacity: 0,
      y: 4
    }} animate={{
      opacity: 1,
      y: 0
    }} className={cn("mx-2 p-3 rounded-xl border", data.regressionRisk === "high" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20")}>
          <div className="flex items-start gap-2">
            <TrendingDown className={cn("w-4 h-4 mt-0.5 flex-shrink-0", data.regressionRisk === "high" ? "text-red-500" : "text-amber-500")} />
            <div className="flex-1">
              <p className={cn("text-xs font-medium", data.regressionRisk === "high" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
                {data.regressionRisk === "high" ? "Regression Imminent" : "At Risk"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                You've been ≥10 points below baseline for{" "}
                <span className="font-medium">{data.regressionStreakDays}</span> consecutive days.
              </p>
              <Link to="/app/training" className={cn("inline-flex items-center gap-1 mt-2 text-[10px] font-medium transition-colors", data.regressionRisk === "high" ? "text-red-500 hover:text-red-400" : "text-amber-500 hover:text-amber-400")}>
                <Activity className="w-3 h-3" />
                Do a 10-min session today
              </Link>
            </div>
          </div>
        </motion.div>}

      {/* Baseline visual section */}
      {hasWeeklyData && data.baselineScore90d !== null && <BaselineVisual baselineScore={data.baselineScore90d} score30d={data.score30d} score90d={data.score90d} />}

      {/* Next update countdown */}
      {data.daysUntilNextUpdate !== null && <p className="text-center text-[10px] text-muted-foreground/60">
          Next update in {data.daysUntilNextUpdate} day{data.daysUntilNextUpdate !== 1 ? "s" : ""} (Sunday)
        </p>}
    </div>;
}

// ==========================================
// BASELINE VISUAL SUBCOMPONENT
// ==========================================

interface BaselineVisualProps {
  baselineScore: number;
  score30d: number | null;
  score90d: number | null;
}
function BaselineVisual({
  baselineScore,
  score30d,
  score90d
}: BaselineVisualProps) {
  const trend = useMemo(() => {
    if (score30d === null || score90d === null) return null;
    const diff = score30d - score90d;
    if (Math.abs(diff) < 1) return "stable";
    return diff > 0 ? "up" : "down";
  }, [score30d, score90d]);
  return <div className="mx-2 p-3 rounded-xl bg-muted/30 border border-border/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Performance Baseline
        </span>
        {trend && <div className="flex items-center gap-1">
            {trend === "up" ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : trend === "down" ? <TrendingDown className="w-3 h-3 text-amber-500" /> : <span className="w-3 h-3 text-muted-foreground">—</span>}
            <span className={cn("text-[10px] font-medium", trend === "up" ? "text-emerald-500" : trend === "down" ? "text-amber-500" : "text-muted-foreground")}>
              30d vs 90d
            </span>
          </div>}
      </div>

      {/* Score bars */}
      <div className="space-y-2">
        {/* Baseline */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-12">Baseline</span>
          <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-primary/40 rounded-full" style={{
            width: `${Math.min(100, baselineScore)}%`
          }} />
          </div>
          <span className="text-[10px] font-medium text-foreground w-8 text-right">
            {Math.round(baselineScore)}
          </span>
        </div>

        {/* 90d average */}
        {score90d !== null && <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-12">90d avg</span>
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500/60 rounded-full" style={{
            width: `${Math.min(100, score90d)}%`
          }} />
            </div>
            <span className="text-[10px] font-medium text-foreground w-8 text-right">
              {Math.round(score90d)}
            </span>
          </div>}

        {/* 30d average */}
        {score30d !== null && <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-12">30d avg</span>
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", score30d >= (score90d ?? baselineScore) ? "bg-emerald-500/60" : "bg-amber-500/60")} style={{
            width: `${Math.min(100, score30d)}%`
          }} />
            </div>
            <span className="text-[10px] font-medium text-foreground w-8 text-right">
              {Math.round(score30d)}
            </span>
          </div>}
      </div>
    </div>;
}