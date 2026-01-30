/**
 * ============================================
 * METRIC TREND CHARTS - WHOOP Style
 * ============================================
 * 
 * Premium line charts for cognitive metrics.
 * Exact WHOOP/Oura visual specification.
 * Supports both weekly (7-day) and intraday (today) views.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, startOfDay } from "date-fns";
import { useMetricHistory } from "@/hooks/useMetricHistory";
import { useIntradayMetricHistory } from "@/hooks/useIntradayMetricHistory";
import { Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine, Area, ComposedChart } from "recharts";
import { Target, Zap, Battery, Brain } from "lucide-react";

type MetricKey = "readiness" | "sharpness" | "recovery" | "reasoningQuality";
type ViewMode = "week" | "today";

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: React.ElementType;
  color: string;
}

// Metric colors matching Home page
const METRIC_COLORS = {
  sharpness: "hsl(210, 100%, 60%)",     // Electric blue
  readiness: "hsl(245, 58%, 65%)",      // Soft indigo
  recovery: "hsl(174, 72%, 45%)",       // Teal
  reasoningQuality: "hsl(215, 45%, 42%)", // Primary steel blue (matches Home)
};

const METRICS: MetricConfig[] = [
  { key: "sharpness", label: "SHARPNESS", icon: Zap, color: METRIC_COLORS.sharpness },
  { key: "readiness", label: "READINESS", icon: Target, color: METRIC_COLORS.readiness },
  { key: "recovery", label: "RECOVERY", icon: Battery, color: METRIC_COLORS.recovery },
  { key: "reasoningQuality", label: "REASONING QUALITY", icon: Brain, color: METRIC_COLORS.reasoningQuality },
];

// Grid and text colors
const GRID_COLOR = "rgba(100, 116, 139, 0.15)";
const MUTED_TEXT = "rgba(100, 116, 139, 0.7)";
const BRIGHT_TEXT = "rgba(226, 232, 240, 1)";

interface ChartDataPoint {
  date: string;
  value: number | null;
  dayName: string;
  dayNum: string;
  isLast: boolean;
  xLabel: string;
}

interface IntradayChartDataPoint {
  timestamp: string;
  value: number | null;
  hour: string;
  isNow: boolean;
  xLabel: string;
}

interface SingleMetricChartProps {
  metric: MetricConfig;
  weeklyData: ChartDataPoint[];
  intradayData: IntradayChartDataPoint[];
}

// Custom X-axis tick - WHOOP style for WEEKLY view (anchored to the baseline)
const WeeklyXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (!payload || x === undefined || y === undefined) return null;
  
  const [dayName, dayNum, isLast] = payload.value.split('|');
  const isLastBool = isLast === 'true';
  
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Highlight band for last day (rightmost) - extends above top line */}
      {isLastBool && (
        <rect
          x={-18}
          y={-132}
          width={36}
          height={162}
          fill="rgba(100, 116, 139, 0.12)"
          rx={6}
        />
      )}
      {/* Day name - positioned below baseline */}
      <text
        x={0}
        y={8}
        textAnchor="middle"
        fill={isLastBool ? "rgba(148, 163, 184, 1)" : MUTED_TEXT}
        fontSize={11}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {dayName}
      </text>
      {/* Day number */}
      <text
        x={0}
        y={22}
        textAnchor="middle"
        fill={isLastBool ? BRIGHT_TEXT : "rgba(100, 116, 139, 0.6)"}
        fontSize={11}
        fontWeight={isLastBool ? 600 : 400}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {dayNum}
      </text>
    </g>
  );
};

// Custom X-axis tick for INTRADAY view (shows hours)
const IntradayXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (!payload || x === undefined || y === undefined) return null;
  
  const [hour, isNow] = payload.value.split('|');
  const isNowBool = isNow === 'true';
  
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Highlight band for current time */}
      {isNowBool && (
        <rect
          x={-18}
          y={-132}
          width={36}
          height={162}
          fill="rgba(100, 116, 139, 0.12)"
          rx={6}
        />
      )}
      {/* Hour label */}
      <text
        x={0}
        y={14}
        textAnchor="middle"
        fill={isNowBool ? BRIGHT_TEXT : MUTED_TEXT}
        fontSize={11}
        fontWeight={isNowBool ? 600 : 400}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {hour}
      </text>
    </g>
  );
};

// Custom dot - filled black circle with metric color
const CustomDot = ({ cx, cy, payload, color }: { cx?: number; cy?: number; payload?: { value: number | null }; color: string }) => {
  if (!payload || payload.value === null || cx === undefined || cy === undefined) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill="#0f172a"
      stroke={color}
      strokeWidth={1.5}
    />
  );
};

// Custom label above each point - only Recovery shows % suffix
const CustomLabel = ({ x, y, value, isRecovery, color }: { x?: number; y?: number; value?: number | null; isRecovery?: boolean; color: string }) => {
  if (value === null || value === undefined || x === undefined || y === undefined) return null;
  
  return (
    <text
      x={x}
      y={y - 14}
      textAnchor="middle"
      fill={color}
      fontSize={11}
      fontWeight={500}
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {Math.round(value)}{isRecovery ? "%" : ""}
    </text>
  );
};

function SingleMetricChart({ metric, weeklyData, intradayData }: SingleMetricChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  
  // For intraday, we need to build a proper timeline from midnight to now
  const intradayChartData = useMemo(() => {
    if (intradayData.length === 0) return [];
    
    // Sort by timestamp
    const sorted = [...intradayData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Mark the last point as "isNow" (rightmost, highlighted)
    return sorted.map((d, idx) => ({
      ...d,
      isNow: idx === sorted.length - 1, // Last point is the current one
      xLabel: `${d.hour}|${idx === sorted.length - 1}`,
    }));
  }, [intradayData]);
  
  const data = viewMode === 'week' ? weeklyData : intradayChartData;
  const hasAnyValue = data.some((d) => d.value !== null);

  // Prepare chart data with xLabel for axis based on viewMode
  const chartData = viewMode === 'week' 
    ? weeklyData.map(d => ({
        ...d,
        xLabel: `${d.dayName}|${d.dayNum}|${d.isLast}`,
      }))
    : intradayChartData;

  // Calculate min/max for dynamic Y axis - use chartData which is properly processed
  const values = chartData.filter(d => d.value !== null).map(d => d.value as number);
  const dataMin = values.length > 0 ? Math.min(...values) : 50;
  const dataMax = values.length > 0 ? Math.max(...values) : 50;

  // Y-axis layout with 5 equidistant lines:
  // - Line 1 = yMin (baseline)
  // - Line 2 = 25% (dataMin should sit here)
  // - Line 3 = 50% (intermediate)
  // - Line 4 = 75% (dataMax should sit here - penultimate)
  // - Line 5 = yMax (top line - always empty)
  
  const dataRange = dataMax - dataMin;
  
  let yMin: number;
  let yMax: number;
  
  if (dataRange === 0) {
    // CASE 1: All values are equal - treat as minimum (place on line 2)
    // value should be at 25% of visual range
    const padding = dataMax * 0.5 || 10;
    yMax = dataMax + padding;
    // To place value at 25%: value = yMin + totalRange * 0.25
    // Solving: yMin = value - totalRange * 0.25 = value - (yMax - yMin) * 0.25
    // 0.75 * yMin = value - 0.25 * yMax
    // yMin = (value - 0.25 * yMax) / 0.75
    yMin = (dataMax - 0.25 * yMax) / 0.75;
  } else {
    // CASE 2: Different values - place min at 25%, max at 75%
    // Normal formula: visualRange = 2 * dataRange
    const idealYMin = dataMin - dataRange * 0.5;
    const idealYMax = dataMax + dataRange * 0.5;
    
    if (idealYMin >= 0) {
      // Normal case - both constraints can be satisfied
      yMin = idealYMin;
      yMax = idealYMax;
    } else {
      // CASE 3: yMin would be negative (dataMin is close to 0)
      // Clamp yMin to 0 and calculate yMax so dataMax is at 75%
      yMin = 0;
      yMax = dataMax / 0.75;
    }
  }
  
  // Ensure yMin doesn't go below 0 (safety check)
  if (yMin < 0) yMin = 0;
  
  // 4 grid lines (line 1 is yMin baseline, drawn separately)
  const totalRange = yMax - yMin;
  const yGridTicks = [
    yMin + totalRange * 0.25,  // Line 2 = 25% (dataMin position)
    yMin + totalRange * 0.50,  // Line 3 = 50% (midpoint)
    yMin + totalRange * 0.75,  // Line 4 = 75% (dataMax position - penultimate)
    yMax,                       // Line 5 = top (always empty)
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden bg-transparent"
    >
      {/* Header with metric name and toggle */}
      <div className="px-4 pt-3 pb-0 flex items-center justify-between">
        <span 
          className="text-[11px] font-semibold tracking-wider"
          style={{ color: 'rgba(148, 163, 184, 0.95)' }}
        >
          {metric.label}
        </span>
        
        {/* Elegant On/Off style toggle */}
        <div className="flex items-center gap-1.5">
          <span 
            className={`text-[10px] font-medium transition-colors ${
              viewMode === 'week' ? 'text-foreground' : 'text-muted-foreground/50'
            }`}
          >
            7d
          </span>
          <button
            onClick={() => setViewMode(viewMode === 'week' ? 'today' : 'week')}
            className={`
              relative w-9 h-5 rounded-full transition-all duration-200
              ${viewMode === 'today' 
                ? 'bg-primary/80' 
                : 'bg-muted/40'
              }
            `}
            aria-label="Toggle view mode"
          >
            <span
              className={`
                absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                transition-all duration-200 ease-out
                ${viewMode === 'today' ? 'left-[18px]' : 'left-0.5'}
              `}
            />
          </button>
          <span 
            className={`text-[10px] font-medium transition-colors ${
              viewMode === 'today' ? 'text-foreground' : 'text-muted-foreground/50'
            }`}
          >
            1d
          </span>
        </div>
      </div>

      {!hasAnyValue ? (
        <div className="h-[130px] flex items-center justify-center">
          <p className="text-[11px]" style={{ color: MUTED_TEXT }}>
            No data yet
          </p>
        </div>
      ) : (
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 36, right: 16, left: 16, bottom: 32 }}>
              <defs>
                <linearGradient id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                horizontal={true}
                vertical={false}
                stroke={GRID_COLOR}
                strokeWidth={1}
                horizontalCoordinatesGenerator={({ height, offset }) => {
                  // IMPORTANT: use inner plot height (excluding margins) to avoid grid/axis drift
                  const innerHeight = height - offset.top - offset.bottom;
                  const scale = innerHeight / (yMax - yMin);
                  return yGridTicks.map((tick) => offset.top + (yMax - tick) * scale);
                }}
              />
              {/* Baseline for dates (bottom-most line) */}
              <ReferenceLine y={yMin} stroke={GRID_COLOR} strokeWidth={1} ifOverflow="extendDomain" />
              <XAxis
                dataKey="xLabel"
                axisLine={false}
                tickLine={false}
                tick={viewMode === 'today' ? <IntradayXAxisTick /> : <WeeklyXAxisTick />}
                padding={{ left: 10, right: 10 }}
                interval={0}
                orientation="bottom"
              />
              <YAxis
                domain={[yMin, yMax]}
                ticks={yGridTicks}
                hide
              />
              <Area
                type="linear"
                dataKey="value"
                stroke="none"
                fill={`url(#gradient-${metric.key})`}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                connectNulls
                dot={(props) => (
                  <CustomDot
                    cx={props.cx}
                    cy={props.cy}
                    payload={props.payload}
                    color={metric.color}
                  />
                )}
                label={(props) => (
                  <CustomLabel
                    x={props.x}
                    y={props.y}
                    value={props.value}
                    isRecovery={metric.key === "recovery"}
                    color={metric.color}
                  />
                )}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

export function MetricTrendCharts() {
  const { history: weeklyHistory, isLoading: weeklyLoading } = useMetricHistory({ days: 7 });
  const { history: intradayHistory, isLoading: intradayLoading } = useIntradayMetricHistory();
  
  const isLoading = weeklyLoading || intradayLoading;

  // Generate weekly data (7 days)
  const weeklyChartData = useMemo(() => {
    const today = startOfDay(new Date());
    
    const dataByDate: Record<string, { 
      readiness: number | null; 
      sharpness: number | null; 
      recovery: number | null; 
      reasoningQuality: number | null 
    }> = {};
    
    weeklyHistory.forEach((point) => {
      dataByDate[point.date] = {
        readiness: point.readiness,
        sharpness: point.sharpness,
        recovery: point.recovery,
        reasoningQuality: point.reasoningQuality,
      };
    });

    const result: Record<MetricKey, ChartDataPoint[]> = {
      readiness: [],
      sharpness: [],
      recovery: [],
      reasoningQuality: [],
    };

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayName = format(date, "EEE");
      const dayNum = format(date, "d");
      const isLast = i === 0;
      
      const existingData = dataByDate[dateStr];
      
      const base = { date: dateStr, dayName, dayNum, isLast, xLabel: "" };
      
      result.readiness.push({ ...base, value: existingData?.readiness ?? null });
      result.sharpness.push({ ...base, value: existingData?.sharpness ?? null });
      result.recovery.push({ ...base, value: existingData?.recovery ?? null });
      result.reasoningQuality.push({ ...base, value: existingData?.reasoningQuality ?? null });
    }

    return result;
  }, [weeklyHistory]);

  // Generate intraday data
  const intradayChartData = useMemo(() => {
    const result: Record<MetricKey, IntradayChartDataPoint[]> = {
      readiness: [],
      sharpness: [],
      recovery: [],
      reasoningQuality: [],
    };

    intradayHistory.forEach((point) => {
      const base = { 
        timestamp: point.timestamp, 
        hour: point.hour, 
        isNow: point.isNow, 
        xLabel: "" 
      };
      
      result.readiness.push({ ...base, value: point.readiness });
      result.sharpness.push({ ...base, value: point.sharpness });
      result.recovery.push({ ...base, value: point.recovery });
      result.reasoningQuality.push({ ...base, value: point.reasoningQuality });
    });

    return result;
  }, [intradayHistory]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="h-[210px] rounded-xl animate-pulse bg-muted/20"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {METRICS.map((metric, index) => (
        <motion.div
          key={metric.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.04 }}
        >
          <SingleMetricChart
            metric={metric}
            weeklyData={weeklyChartData[metric.key]}
            intradayData={intradayChartData[metric.key]}
          />
        </motion.div>
      ))}
    </div>
  );
}
