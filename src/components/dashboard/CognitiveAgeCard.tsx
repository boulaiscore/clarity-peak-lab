/**
 * ============================================
 * COGNITIVE AGE CARD (v2)
 * ============================================
 * 
 * Slow-moving Cognitive Age display with:
 * - Calibrating badge when baseline not stabilized
 * - WHOOP-style Pace dial (30d vs 180d trend)
 * - Baseline visual (sparkline or text)
 * - Pre-regression warning banner with countdown
 * - Callout when cognitive age > chronological age
 */

import { motion } from "framer-motion";
import { AlertTriangle, Clock, Activity, TrendingDown, Info, Loader2 } from "lucide-react";
import { useCognitiveAge, getRegressionRiskLabel, getRegressionRiskColor } from "@/hooks/useCognitiveAge";
import { CognitiveAgeSphere } from "./CognitiveAgeSphere";
import { CognitiveAgeTrendChart } from "./CognitiveAgeTrendChart";
import { CognitiveAgeImpact } from "./CognitiveAgeImpact";
import { CognitiveAgeInsights } from "./CognitiveAgeInsights";
import { PaceOfAgingDial } from "./PaceOfAgingDial";
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
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="py-2 space-y-4">
      {/* Header with update info */}
      <div className="flex items-center justify-between px-2">
        {/* Left: Pace dial */}
        <div className="flex-shrink-0">
          <PaceOfAgingDial 
            pace={data.paceOfAgingX} 
            size="sm"
            showLabel={true}
          />
        </div>
        
        {/* Right: Status badges */}
        <div className="flex items-center gap-2">
          {/* Calibrating badge */}
          {data.isCalibrating && (
            <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Calibrating
            </span>
          )}
          
          {/* Weekly update indicator */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Daily</span>
          </div>
        </div>
      </div>

      {/* Main sphere visualization */}
      <CognitiveAgeSphere 
        cognitiveAge={displayAge} 
        delta={delta} 
        chronologicalAge={chronoAge} 
      />

      {/* Pre-regression warning (14-20 days) */}
      {data.preRegressionWarning && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Pre-Regression Warning
                </p>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {data.preRegressionWarning.daysToRegression}d left
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Performance ≥10 pts below baseline for {data.preRegressionWarning.streakDays} days.
                Complete a session to reset the streak.
              </p>
              <Link
                to="/app/training"
                className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-amber-500 hover:text-amber-400 transition-colors"
              >
                <Activity className="w-3 h-3" />
                Do a 10-min session now
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Warning when cognitive age > chronological age */}
      {isOlderThanChrono && !data.isCalibrating && !data.preRegressionWarning && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
        >
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
        </motion.div>
      )}

      {/* Regression risk warning (high = 21+ days) */}
      {data.regressionRisk === "high" && !data.preRegressionWarning && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20"
        >
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                Regression Applied
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                +1 year added to Cognitive Age. Total penalty: {data.regressionPenaltyYears} year(s).
                Consistent training can reverse this over time.
              </p>
              <Link
                to="/app/training"
                className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-red-500 hover:text-red-400 transition-colors"
              >
                <Activity className="w-3 h-3" />
                Start recovery today
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement indicator */}
      {data.engagementIndex !== null && data.engagementIndex < 0.5 && hasWeeklyData && (
        <div className="mx-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2">
            <Info className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">
              <span className="font-medium">Low engagement:</span> {data.sessions30d}/21 sessions this month. 
              More consistency = more accurate tracking.
            </p>
          </div>
        </div>
      )}

      {/* Baseline visual section */}
      {hasWeeklyData && data.baselineScore90d !== null && (
        <BaselineVisual
          baselineScore={data.baselineScore90d}
          perf30d={data.perf30d}
          perf180d={data.perf180d}
        />
      )}

      {/* Age comparison trend chart */}
      <CognitiveAgeTrendChart />

      {/* WHOOP-style insights */}
      <CognitiveAgeInsights />

      {/* Impact breakdown */}
      <CognitiveAgeImpact />

    </div>
  );
}

// ==========================================
// BASELINE VISUAL SUBCOMPONENT
// ==========================================

interface BaselineVisualProps {
  baselineScore: number;
  perf30d: number | null;
  perf180d: number | null;
}

function BaselineVisual({
  baselineScore,
  perf30d,
  perf180d
}: BaselineVisualProps) {
  return (
    <div className="mx-2 p-3 rounded-xl bg-muted/30 border border-border/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Performance Baseline
        </span>
      </div>

      {/* Score bars */}
      <div className="space-y-2">
        {/* Baseline */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-14">Baseline</span>
          <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/40 rounded-full"
              style={{ width: `${Math.min(100, baselineScore)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-foreground w-8 text-right">
            {Math.round(baselineScore)}
          </span>
        </div>

        {/* 180d average */}
        {perf180d !== null && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-14">180d avg</span>
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500/60 rounded-full"
                style={{ width: `${Math.min(100, perf180d)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-foreground w-8 text-right">
              {Math.round(perf180d)}
            </span>
          </div>
        )}

        {/* 30d average */}
        {perf30d !== null && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-14">30d avg</span>
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  perf30d >= (perf180d ?? baselineScore)
                    ? "bg-emerald-500/60"
                    : "bg-amber-500/60"
                )}
                style={{ width: `${Math.min(100, perf30d)}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-foreground w-8 text-right">
              {Math.round(perf30d)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
