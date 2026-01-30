/**
 * ============================================
 * METRIC TREND CHARTS - WHOOP Style
 * ============================================
 * 
 * Premium line charts for cognitive metrics.
 * Exact WHOOP/Oura visual specification.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import { useMetricHistory } from "@/hooks/useMetricHistory";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Target, Zap, Battery, Brain } from "lucide-react";

type MetricKey = "readiness" | "sharpness" | "recovery" | "reasoningQuality";

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: React.ElementType;
}

const METRICS: MetricConfig[] = [
  { key: "readiness", label: "READINESS", icon: Target },
  { key: "sharpness", label: "SHARPNESS", icon: Zap },
  { key: "recovery", label: "RECOVERY", icon: Battery },
  { key: "reasoningQuality", label: "REASONING QUALITY", icon: Brain },
];

// WHOOP color palette
const CHART_COLOR = "#7CB3E8";
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

interface SingleMetricChartProps {
  metric: MetricConfig;
  data: ChartDataPoint[];
}

// Custom X-axis tick - WHOOP style (anchored to the baseline)
const CustomXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (!payload || x === undefined || y === undefined) return null;
  
  const [dayName, dayNum, isLast] = payload.value.split('|');
  const isLastBool = isLast === 'true';
  
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Highlight band for last day (rightmost) - extends above top line */}
      {isLastBool && (
        <rect
          x={-18}
          y={-148}
          width={36}
          height={182}
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

// Custom dot - filled black circle
const CustomDot = ({ cx, cy, payload }: { cx?: number; cy?: number; payload?: ChartDataPoint }) => {
  if (!payload || payload.value === null || cx === undefined || cy === undefined) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#0f172a"
      stroke={CHART_COLOR}
      strokeWidth={2}
    />
  );
};

// Custom label above each point
const CustomLabel = ({ x, y, value }: { x?: number; y?: number; value?: number | null }) => {
  if (value === null || value === undefined || x === undefined || y === undefined) return null;
  
  return (
    <text
      x={x}
      y={y - 14}
      textAnchor="middle"
      fill={CHART_COLOR}
      fontSize={11}
      fontWeight={500}
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {Math.round(value)}
    </text>
  );
};

function SingleMetricChart({ metric, data }: SingleMetricChartProps) {
  const hasAnyValue = data.some((d) => d.value !== null);

  // Prepare chart data with xLabel for axis
  const chartData = data.map(d => ({
    ...d,
    xLabel: `${d.dayName}|${d.dayNum}|${d.isLast}`,
  }));

  // Calculate min/max for dynamic Y axis
  const values = data.filter(d => d.value !== null).map(d => d.value as number);
  const dataMin = values.length > 0 ? Math.min(...values) : 50;
  const dataMax = values.length > 0 ? Math.max(...values) : 50;

  // Baseline is ALWAYS 0 - if a value is 0, the dot sits on baseline
  // First data line (line 2) = dataMin - minimum value dot sits here
  // Exception: if dataMin = 0, it sits on baseline
  
  const yBaseline = 0;
  
  // Calculate yMax so that dataMin sits on line 2 (first line above baseline)
  // 5 equidistant lines: 0 (baseline), yMax/4, yMax/2, 3*yMax/4, yMax
  // Line 2 = yMax/4 = dataMin → yMax = 4 * dataMin
  // But if dataMax > yMax, extend to fit all data
  const yMaxFromMin = dataMin > 0 ? 4 * dataMin : 80; // fallback if dataMin is 0
  const yMax = Math.max(yMaxFromMin, dataMax * 1.15);
  
  // 5 equidistant lines from 0 to yMax (baseline drawn separately)
  const bandHeight = yMax / 4;
  const yGridTicks = [
    bandHeight,        // Line 2 (≈ dataMin when dataMin > 0)
    bandHeight * 2,    // Line 3
    bandHeight * 3,    // Line 4
    yMax,              // Line 5 (top)
  ];

  const yMin = yBaseline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden bg-transparent"
    >
      {/* Header with metric name */}
      <div className="px-4 pt-3 pb-0">
        <span 
          className="text-[11px] font-semibold tracking-wider"
          style={{ color: 'rgba(148, 163, 184, 0.95)' }}
        >
          {metric.label}
        </span>
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
            <LineChart data={chartData} margin={{ top: 36, right: 16, left: 16, bottom: 32 }}>
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
              <ReferenceLine y={yBaseline} stroke={GRID_COLOR} strokeWidth={1} ifOverflow="extendDomain" />
              <XAxis
                dataKey="xLabel"
                axisLine={false}
                tickLine={false}
                tick={<CustomXAxisTick />}
                padding={{ left: 10, right: 10 }}
                interval={0}
                orientation="bottom"
              />
              <YAxis
                domain={[yMin, yMax]}
                ticks={yGridTicks}
                hide
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_COLOR}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                connectNulls
                dot={(props) => (
                  <CustomDot
                    cx={props.cx}
                    cy={props.cy}
                    payload={props.payload}
                  />
                )}
                label={(props) => (
                  <CustomLabel
                    x={props.x}
                    y={props.y}
                    value={props.value}
                  />
                )}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

export function MetricTrendCharts() {
  const { history, isLoading } = useMetricHistory({ days: 7 });

  // Generate exactly 7 days (today - 6 days ago) regardless of available data
  const chartDataByMetric = useMemo(() => {
    const today = startOfDay(new Date());
    
    // Create a map of existing data by date
    const dataByDate: Record<string, { 
      readiness: number | null; 
      sharpness: number | null; 
      recovery: number | null; 
      reasoningQuality: number | null 
    }> = {};
    
    history.forEach((point) => {
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

    // Generate 7 days
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
  }, [history]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="h-[175px] rounded-xl animate-pulse bg-muted/20"
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
            data={chartDataByMetric[metric.key]}
          />
        </motion.div>
      ))}
    </div>
  );
}
