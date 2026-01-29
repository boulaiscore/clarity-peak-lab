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
  data: Array<{ date: string; value: number | null; displayDate: string; dayName: string; dayNum: string; isToday: boolean }>;
  trend: number | null;
  average: number | null;
  latestValue: number | null;
}

// Custom label component to show values above points
const CustomLabel = ({ x, y, value, color }: { x?: number; y?: number; value?: number | null; color: string }) => {
  if (value === null || value === undefined || x === undefined || y === undefined) return null;
  return (
    <text
      x={x}
      y={y - 12}
      fill={color}
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
    >
      {Math.round(value)}
    </text>
  );
};

// Custom dot component - hollow circles like WHOOP
const CustomDot = ({ cx, cy, value, color }: { cx?: number; cy?: number; value?: number | null; color: string }) => {
  if (value === null || value === undefined || cx === undefined || cy === undefined) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="hsl(var(--background))"
      stroke={color}
      strokeWidth={2}
    />
  );
};

// Custom X-axis tick with day name and number
const CustomXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (!payload || x === undefined || y === undefined) return null;
  
  // Parse the payload value which contains dayName|dayNum|isToday
  const [dayName, dayNum, isToday] = payload.value.split('|');
  const isTodayBool = isToday === 'true';
  
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Highlight background for today */}
      {isTodayBool && (
        <rect
          x={-16}
          y={-2}
          width={32}
          height={36}
          rx={4}
          fill="hsl(var(--muted)/0.5)"
        />
      )}
      <text
        x={0}
        y={8}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={10}
      >
        {dayName}
      </text>
      <text
        x={0}
        y={22}
        textAnchor="middle"
        fill={isTodayBool ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground)/0.7)"}
        fontSize={10}
        fontWeight={isTodayBool ? 600 : 400}
      >
        {dayNum}
      </text>
    </g>
  );
};

function SingleMetricChart({ metric, data, trend, average, latestValue }: SingleMetricChartProps) {
  const Icon = metric.icon;
  
  const hasData = data.some((d) => d.value !== null);

  // Calculate trend direction
  const trendDirection = trend === null ? "flat" : trend > 2 ? "up" : trend < -2 ? "down" : "flat";

  // Transform data for custom x-axis
  const chartData = data.map(d => ({
    ...d,
    xAxisLabel: `${d.dayName}|${d.dayNum}|${d.isToday}`,
  }));

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
        
        {/* Trend indicator in header */}
        {hasData && (
          <div className="flex items-center gap-1">
            {trendDirection === "up" && (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">
                  +{Math.round(trend!)}
                </span>
              </>
            )}
            {trendDirection === "down" && (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] font-medium text-rose-400">
                  {Math.round(trend!)}
                </span>
              </>
            )}
            {trendDirection === "flat" && (
              <>
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Stable</span>
              </>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="h-[140px] flex items-center justify-center">
          <p className="text-[10px] text-muted-foreground">No data yet</p>
        </div>
      ) : (
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 25, right: 10, left: 10, bottom: 30 }}>
              <XAxis
                dataKey="xAxisLabel"
                axisLine={false}
                tickLine={false}
                tick={<CustomXAxisTick />}
                interval={0}
                height={40}
              />
              <YAxis
                domain={[0, 100]}
                hide
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={1.5}
                connectNulls
                dot={(props) => (
                  <CustomDot
                    cx={props.cx}
                    cy={props.cy}
                    value={props.payload.value}
                    color={metric.color}
                  />
                )}
                label={(props) => (
                  <CustomLabel
                    x={props.x}
                    y={props.y}
                    value={props.value}
                    color={metric.color}
                  />
                )}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

export function MetricTrendCharts() {
  const { history, trends, averages, isLoading, hasData } = useMetricHistory({ days: 14 });

  // Transform data for each metric with WHOOP-style x-axis labels
  const chartDataByMetric = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    const result: Record<MetricKey, Array<{ date: string; value: number | null; displayDate: string; dayName: string; dayNum: string; isToday: boolean }>> = {
      readiness: [],
      sharpness: [],
      recovery: [],
      reasoningQuality: [],
    };

    history.forEach((point) => {
      const parsedDate = parseISO(point.date);
      const displayDate = format(parsedDate, "dd");
      const dayName = format(parsedDate, "EEE"); // Sat, Sun, Mon, etc.
      const dayNum = format(parsedDate, "d"); // 1, 2, 3, etc.
      const isToday = point.date === today;
      
      result.readiness.push({ date: point.date, value: point.readiness, displayDate, dayName, dayNum, isToday });
      result.sharpness.push({ date: point.date, value: point.sharpness, displayDate, dayName, dayNum, isToday });
      result.recovery.push({ date: point.date, value: point.recovery, displayDate, dayName, dayNum, isToday });
      result.reasoningQuality.push({ date: point.date, value: point.reasoningQuality, displayDate, dayName, dayNum, isToday });
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
