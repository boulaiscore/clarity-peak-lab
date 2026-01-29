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
import { format, parseISO } from "date-fns";
import { useMetricHistory } from "@/hooks/useMetricHistory";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Target, Zap, Battery, Brain } from "lucide-react";

type MetricKey = "readiness" | "sharpness" | "recovery" | "reasoningQuality";

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: React.ElementType;
  color: string;
}

const METRICS: MetricConfig[] = [
  { key: "readiness", label: "Readiness", icon: Target, color: "#7CB3E8" },
  { key: "sharpness", label: "Sharpness", icon: Zap, color: "#7CB3E8" },
  { key: "recovery", label: "Recovery", icon: Battery, color: "#7CB3E8" },
  { key: "reasoningQuality", label: "Reasoning Quality", icon: Brain, color: "#7CB3E8" },
];

interface ChartDataPoint {
  date: string;
  value: number | null;
  dayName: string;
  dayNum: string;
  isToday: boolean;
  xLabel: string;
}

interface SingleMetricChartProps {
  metric: MetricConfig;
  data: ChartDataPoint[];
}

// Custom X-axis tick with WHOOP-style formatting
const CustomXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (!payload || x === undefined || y === undefined) return null;
  
  const [dayName, dayNum, isToday] = payload.value.split('|');
  const isTodayBool = isToday === 'true';
  
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Highlight band for current day */}
      {isTodayBool && (
        <rect
          x={-20}
          y={-85}
          width={40}
          height={120}
          fill="rgba(100, 116, 139, 0.12)"
          rx={4}
        />
      )}
      {/* Day name */}
      <text
        x={0}
        y={8}
        textAnchor="middle"
        fill={isTodayBool ? "rgba(148, 163, 184, 1)" : "rgba(100, 116, 139, 0.7)"}
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
        fill={isTodayBool ? "rgba(226, 232, 240, 1)" : "rgba(100, 116, 139, 0.6)"}
        fontSize={11}
        fontWeight={isTodayBool ? 600 : 400}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {dayNum}
      </text>
    </g>
  );
};

// Custom dot - hollow circle with background fill
const CustomDot = ({ cx, cy, payload, color }: { cx?: number; cy?: number; payload?: ChartDataPoint; color: string }) => {
  if (!payload || payload.value === null || cx === undefined || cy === undefined) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#1E293B"
      stroke={color}
      strokeWidth={2}
    />
  );
};

// Custom label above each point
const CustomLabel = ({ x, y, value, color }: { x?: number; y?: number; value?: number | null; color: string }) => {
  if (value === null || value === undefined || x === undefined || y === undefined) return null;
  
  return (
    <text
      x={x}
      y={y - 14}
      textAnchor="middle"
      fill={color}
      fontSize={12}
      fontWeight={500}
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {Math.round(value)}
    </text>
  );
};

function SingleMetricChart({ metric, data }: SingleMetricChartProps) {
  const Icon = metric.icon;
  const hasData = data.some((d) => d.value !== null);

  // Prepare chart data with xLabel for axis
  const chartData = data.map(d => ({
    ...d,
    xLabel: `${d.dayName}|${d.dayNum}|${d.isToday}`,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#1E293B' }}
    >
      {/* Minimal header */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: metric.color, opacity: 0.8 }} />
        <span 
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: 'rgba(148, 163, 184, 0.9)' }}
        >
          {metric.label}
        </span>
      </div>

      {!hasData ? (
        <div className="h-[120px] flex items-center justify-center">
          <p className="text-[11px]" style={{ color: 'rgba(100, 116, 139, 0.6)' }}>
            No data yet
          </p>
        </div>
      ) : (
        <div className="h-[140px] w-full px-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 30, right: 15, left: 15, bottom: 35 }}>
              <XAxis
                dataKey="xLabel"
                axisLine={false}
                tickLine={false}
                tick={<CustomXAxisTick />}
                interval={0}
                height={35}
              />
              <YAxis
                domain={[0, 100]}
                hide
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2}
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
                    color={metric.color}
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
  const { history, isLoading, hasData } = useMetricHistory({ days: 7 });

  // Transform data for each metric
  const chartDataByMetric = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    const result: Record<MetricKey, ChartDataPoint[]> = {
      readiness: [],
      sharpness: [],
      recovery: [],
      reasoningQuality: [],
    };

    history.forEach((point) => {
      const parsedDate = parseISO(point.date);
      const dayName = format(parsedDate, "EEE");
      const dayNum = format(parsedDate, "d");
      const isToday = point.date === today;
      
      const base = { date: point.date, dayName, dayNum, isToday, xLabel: "" };
      
      result.readiness.push({ ...base, value: point.readiness });
      result.sharpness.push({ ...base, value: point.sharpness });
      result.recovery.push({ ...base, value: point.recovery });
      result.reasoningQuality.push({ ...base, value: point.reasoningQuality });
    });

    return result;
  }, [history]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="h-[170px] rounded-xl animate-pulse"
            style={{ backgroundColor: '#1E293B' }}
          />
        ))}
      </div>
    );
  }

  if (!hasData) {
    return (
      <div 
        className="p-6 rounded-xl text-center"
        style={{ backgroundColor: '#1E293B' }}
      >
        <p className="text-sm" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
          No historical data yet. Your trends will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {METRICS.map((metric, index) => (
        <motion.div
          key={metric.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
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
