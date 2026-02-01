/**
 * ============================================
 * COGNITIVE AGE IMPACT BREAKDOWN
 * ============================================
 * 
 * Shows per-variable contributions to Cognitive Age:
 * 1. Impact Bars - horizontal bars showing each variable's contribution
 * 2. Trend Chart - multi-line chart with time range toggle
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  CartesianGrid, 
  Tooltip,
  ComposedChart,
  Legend
} from "recharts";
import { useCognitiveAgeImpact, VARIABLE_CONFIG, VariableKey } from "@/hooks/useCognitiveAgeImpact";
import { cn } from "@/lib/utils";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ==========================================
// COMPONENT
// ==========================================

export function CognitiveAgeImpact() {
  const { 
    contributions, 
    totalImprovementPoints, 
    trendData,
    timeRange,
    setTimeRange,
    isLoading,
    hasEnoughData,
    isCalibrated 
  } = useCognitiveAgeImpact();
  
  const [hiddenVariables, setHiddenVariables] = useState<Set<VariableKey>>(new Set());

  // Toggle variable visibility in chart
  const toggleVariable = (key: VariableKey) => {
    setHiddenVariables(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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
      className="mx-2 space-y-4"
    >
      {/* Impact Bars Section - show only if we have data */}
      {hasEnoughData ? (
        <ImpactBars 
          contributions={contributions} 
          totalImprovementPoints={totalImprovementPoints}
          isCalibrated={isCalibrated}
        />
      ) : (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">Collecting data...</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Need at least 7 days of training to show impact breakdown.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart Section - always visible */}
      <TrendChart
        data={trendData}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        hiddenVariables={hiddenVariables}
        toggleVariable={toggleVariable}
      />
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

// ==========================================
// TREND CHART SUBCOMPONENT
// ==========================================

interface TrendChartProps {
  data: ReturnType<typeof useCognitiveAgeImpact>["trendData"];
  timeRange: 7 | 30 | 90;
  setTimeRange: (range: 7 | 30 | 90) => void;
  hiddenVariables: Set<VariableKey>;
  toggleVariable: (key: VariableKey) => void;
}

function TrendChart({ data, timeRange, setTimeRange, hiddenVariables, toggleVariable }: TrendChartProps) {
  const hasData = data.length > 0;

  // Calculate Y-axis domain
  const { yMin, yMax } = useMemo(() => {
    if (!hasData) return { yMin: 0, yMax: 100 };
    
    const allValues = data.flatMap(d => [d.ae, d.ra, d.ct, d.in, d.s2]).filter((v): v is number => v !== null);
    if (allValues.length === 0) return { yMin: 0, yMax: 100 };
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 10;
    
    // Scale so min is at 25%, max is at 75%
    const padding = range * 0.5;
    return {
      yMin: Math.max(0, Math.floor(min - padding)),
      yMax: Math.min(100, Math.ceil(max + padding)),
    };
  }, [data, hasData]);

  // Generate Y ticks (5 horizontal lines)
  const yTicks = useMemo(() => {
    const step = (yMax - yMin) / 4;
    return [yMin, yMin + step, yMin + 2 * step, yMin + 3 * step, yMax].map(Math.round);
  }, [yMin, yMax]);

  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Variable Trends
        </h4>

        {/* Time range toggle */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
          {([7, 30, 90] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-2 py-0.5 text-[9px] font-medium rounded transition-colors",
                timeRange === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[140px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">No data yet</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">Complete training sessions to see trends</p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hasData ? data : []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(100, 116, 139, 0.15)"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "rgba(148, 163, 184, 0.7)" }}
              interval={0}
              tickFormatter={(value) => value || ""}
            />
            <YAxis
              domain={[yMin, yMax]}
              ticks={yTicks}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "rgba(148, 163, 184, 0.8)" }}
              width={28}
            />
            {hasData && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
            )}

            {/* Lines for each variable */}
            {hasData && (["ae", "ra", "ct", "in", "s2"] as VariableKey[]).map((key) => (
              !hiddenVariables.has(key) && (
                <Line
                  key={key}
                  type="linear"
                  dataKey={key}
                  name={VARIABLE_CONFIG[key].label}
                  stroke={VARIABLE_CONFIG[key].color}
                  strokeWidth={2}
                  dot={{ r: 2, fill: VARIABLE_CONFIG[key].color, strokeWidth: 0 }}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  connectNulls
                />
              )
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive legend */}
      <div className="flex items-center justify-center gap-x-3 gap-y-1.5 mt-3 flex-wrap">
        {(["ae", "ra", "ct", "in", "s2"] as VariableKey[]).map((key) => (
          <button
            key={key}
            onClick={() => toggleVariable(key)}
            className={cn(
              "flex items-center gap-1.5 text-[9px] transition-opacity px-1.5 py-0.5 rounded-md hover:bg-muted/50",
              hiddenVariables.has(key) ? "opacity-40" : "opacity-100"
            )}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: VARIABLE_CONFIG[key].color }}
            />
            <span className="text-muted-foreground whitespace-nowrap">{VARIABLE_CONFIG[key].fullLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
