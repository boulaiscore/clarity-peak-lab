/**
 * ============================================
 * METRIC TREND CHARTS
 * ============================================
 * 
 * WHOOP-style line charts for core cognitive metrics:
 * - Readiness
 * - Sharpness
 * - Recovery
 * - Reasoning Quality
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { useMetricHistory, MetricDataPoint } from "@/hooks/useMetricHistory";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  Zap, 
  Battery, 
  Target,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type MetricKey = "readiness" | "sharpness" | "recovery" | "reasoningQuality";

interface MetricConfig {
  key: MetricKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  gradientId: string;
}

const METRICS: MetricConfig[] = [
  {
    key: "readiness",
    label: "Readiness",
    shortLabel: "RDN",
    icon: Target,
    color: "hsl(var(--readiness))",
    gradientId: "readinessGradient",
  },
  {
    key: "sharpness",
    label: "Sharpness",
    shortLabel: "SHP",
    icon: Zap,
    color: "hsl(var(--sharpness))",
    gradientId: "sharpnessGradient",
  },
  {
    key: "recovery",
    label: "Recovery",
    shortLabel: "REC",
    icon: Battery,
    color: "hsl(var(--recovery))",
    gradientId: "recoveryGradient",
  },
  {
    key: "reasoningQuality",
    label: "Reasoning Quality",
    shortLabel: "RQ",
    icon: Brain,
    color: "hsl(var(--primary))",
    gradientId: "rqGradient",
  },
];

interface SingleMetricChartProps {
  metric: MetricConfig;
  data: Array<{ date: string; value: number | null; displayDate: string }>;
  trend: number | null;
  average: number | null;
  latestValue: number | null;
}

function SingleMetricChart({ metric, data, trend, average, latestValue }: SingleMetricChartProps) {
  const Icon = metric.icon;
  
  const chartConfig = {
    value: {
      label: metric.label,
      color: metric.color,
    },
  };

  const hasData = data.some((d) => d.value !== null);

  // Calculate trend direction
  const trendDirection = trend === null ? "flat" : trend > 2 ? "up" : trend < -2 ? "down" : "flat";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-card/60 border border-border/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${metric.color}20` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: metric.color }} />
          </div>
          <span className="text-[12px] font-semibold text-foreground uppercase tracking-wide">
            {metric.label}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {!hasData ? (
        <div className="h-[100px] flex items-center justify-center">
          <p className="text-[10px] text-muted-foreground">No data yet</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-[100px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                  tickCount={3}
                  width={30}
                />
                {average !== null && (
                  <ReferenceLine 
                    y={average} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="3 3" 
                    strokeOpacity={0.4}
                  />
                )}
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [`${Math.round(Number(value))}`, metric.label]}
                    />
                  }
                  cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={metric.color}
                  strokeWidth={2}
                  fill={`url(#${metric.gradientId})`}
                  connectNulls
                  dot={(props) => {
                    if (props.payload.value === null) return null;
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={metric.color}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ 
                    r: 6, 
                    fill: metric.color, 
                    strokeWidth: 2, 
                    stroke: "hsl(var(--background))" 
                  }}
                />
              </LineChart>
            </ChartContainer>
          </div>

          {/* Footer with stats */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
            <div className="flex items-center gap-3">
              {/* Latest value */}
              <div className="flex items-center gap-1">
                <span 
                  className="text-lg font-bold"
                  style={{ color: metric.color }}
                >
                  {latestValue !== null ? Math.round(latestValue) : "--"}
                </span>
              </div>
              
              {/* Trend indicator */}
              <div className="flex items-center gap-1">
                {trendDirection === "up" && (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-medium text-emerald-400">
                      +{Math.round(trend!)}
                    </span>
                  </>
                )}
                {trendDirection === "down" && (
                  <>
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] font-medium text-rose-400">
                      {Math.round(trend!)}
                    </span>
                  </>
                )}
                {trendDirection === "flat" && (
                  <>
                    <Minus className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Stable</span>
                  </>
                )}
              </div>
            </div>

            {/* Date range label */}
            <span className="text-[8px] text-muted-foreground/60">
              Last 14 days
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}

export function MetricTrendCharts() {
  const { history, trends, averages, isLoading, hasData } = useMetricHistory({ days: 14 });

  // Transform data for each metric
  const chartDataByMetric = useMemo(() => {
    const result: Record<MetricKey, Array<{ date: string; value: number | null; displayDate: string }>> = {
      readiness: [],
      sharpness: [],
      recovery: [],
      reasoningQuality: [],
    };

    history.forEach((point) => {
      const displayDate = format(parseISO(point.date), "dd");
      
      result.readiness.push({ date: point.date, value: point.readiness, displayDate });
      result.sharpness.push({ date: point.date, value: point.sharpness, displayDate });
      result.recovery.push({ date: point.date, value: point.recovery, displayDate });
      result.reasoningQuality.push({ date: point.date, value: point.reasoningQuality, displayDate });
    });

    return result;
  }, [history]);

  // Get latest values
  const latestValues = useMemo(() => {
    if (history.length === 0) {
      return { readiness: null, sharpness: null, recovery: null, reasoningQuality: null };
    }
    const latest = history[history.length - 1];
    return {
      readiness: latest.readiness,
      sharpness: latest.sharpness,
      recovery: latest.recovery,
      reasoningQuality: latest.reasoningQuality,
    };
  }, [history]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[180px] rounded-2xl bg-card/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="p-6 rounded-2xl bg-card/60 border border-border/40 text-center">
        <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">No Historical Data Yet</h3>
        <p className="text-xs text-muted-foreground">
          Your metric trends will appear here as you use the app daily.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {METRICS.map((metric, index) => (
        <motion.div
          key={metric.key}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <SingleMetricChart
            metric={metric}
            data={chartDataByMetric[metric.key]}
            trend={trends[metric.key]}
            average={averages[metric.key]}
            latestValue={latestValues[metric.key]}
          />
        </motion.div>
      ))}
    </div>
  );
}
