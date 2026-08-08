/**
 * ============================================
 * DUAL PROCESS TREND CHART
 * ============================================
 * 
 * Shows S1 (Fast) vs S2 (Slow) trends over time.
 * S1 = (AE + RA) / 2
 * S2 = (CT + IN) / 2
 */

import { useState, useMemo } from "react";
import { Loader2, Info } from "lucide-react";
import { 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  CartesianGrid, 
  Tooltip,
  ComposedChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { buildDualProcessSeries } from "@/lib/dualProcessHistory";
import { METRIC_COLORS } from "@/lib/metricColors";

const HISTORY_LOOKBACK_DAYS = 90;

// ==========================================
// TYPES
// ==========================================

interface TrendDataPoint {
  date: string;
  dateLabel: string;
  s1: number | null;
  s2: number | null;
}

// ==========================================
// COMPONENT
// ==========================================

export function DualProcessTrendChart({
  currentS1,
  currentS2,
}: {
  currentS1: number;
  currentS2: number;
}) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [hiddenLines, setHiddenLines] = useState<Set<"s1" | "s2">>(new Set());

  // Fetch snapshots
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["daily-snapshots-dual-process", user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch an earlier seed so a valid system state recorded before the
      // visible window can be carried into 7/30/90-day views.
      const fetchDays = timeRange + HISTORY_LOOKBACK_DAYS;
      const startDate = format(subDays(new Date(), fetchDays - 1), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("snapshot_date, s1, s2, ae, ra, ct, in_score")
        .eq("user_id", user.id)
        .gte("snapshot_date", startDate)
        .order("snapshot_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Process trend data
  const trendData = useMemo((): TrendDataPoint[] => {
    if (!snapshots) return [];

    const now = new Date();
    const visibleDays: { date: Date; dateStr: string }[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "yyyy-MM-dd");
      visibleDays.push({ date, dateStr });
    }

    const todayStr = format(now, "yyyy-MM-dd");
    const series = buildDualProcessSeries(
      snapshots,
      visibleDays.map((day) => day.dateStr),
      { snapshot_date: todayStr, s1: currentS1, s2: currentS2 },
    );

    const labelStep = Math.floor(timeRange / 4);
    return series.map((point, dayIndex) => {
      const shouldLabel =
        timeRange === 7 ||
        dayIndex === 0 ||
        dayIndex === labelStep ||
        dayIndex === labelStep * 2 ||
        dayIndex === labelStep * 3 ||
        dayIndex === timeRange - 1;

      return {
        ...point,
        dateLabel: shouldLabel ? format(visibleDays[dayIndex].date, "d/M") : "",
      };
    });
  }, [currentS1, currentS2, snapshots, timeRange]);

  const hasData = trendData.some(d => d.s1 !== null || d.s2 !== null);

  // Calculate Y-axis domain
  const { yMin, yMax } = useMemo(() => {
    if (!hasData) return { yMin: 0, yMax: 100 };
    
    const allValues = trendData.flatMap(d => [d.s1, d.s2]).filter((v): v is number => v !== null);
    if (allValues.length === 0) return { yMin: 0, yMax: 100 };
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 10;
    
    const padding = range * 0.5;
    return {
      yMin: Math.max(0, Math.floor(min - padding)),
      yMax: Math.min(100, Math.ceil(max + padding)),
    };
  }, [trendData, hasData]);

  // Generate Y ticks
  const yTicks = useMemo(() => {
    const step = (yMax - yMin) / 4;
    return [yMin, yMin + step, yMin + 2 * step, yMin + 3 * step, yMax].map(Math.round);
  }, [yMin, yMax]);

  const toggleLine = (key: "s1" | "s2") => {
    setHiddenLines(prev => {
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
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/30 mt-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          System Trends
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
      <div className="h-[120px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <Info className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">No data yet</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">Complete training to see trends</p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hasData ? trendData : []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(100, 116, 139, 0.15)"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "rgba(148, 163, 184, 0.7)" }}
              interval={0}
              tickFormatter={(value) => trendData.find((point) => point.date === value)?.dateLabel || ""}
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
                formatter={(value: number, name: string) => [
                  value?.toFixed(1),
                  name === "s1" ? "System 1 (Fast)" : "System 2 (Slow)"
                ]}
              />
            )}

            {/* S1 Line - Amber */}
            {hasData && !hiddenLines.has("s1") && (
              <Line
                type="linear"
                dataKey="s1"
                name="s1"
                stroke={METRIC_COLORS.system1}
                strokeWidth={2}
                dot={{ r: 2, fill: METRIC_COLORS.system1, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                connectNulls
                isAnimationActive={false}
              />
            )}

            {/* S2 Line - Violet */}
            {hasData && !hiddenLines.has("s2") && (
              <Line
                type="linear"
                dataKey="s2"
                name="s2"
                stroke={METRIC_COLORS.system2}
                strokeWidth={2}
                dot={{ r: 2, fill: METRIC_COLORS.system2, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          onClick={() => toggleLine("s1")}
          className={cn(
            "flex items-center gap-1.5 text-[9px] transition-opacity px-2 py-1 rounded-md hover:bg-muted/50",
            hiddenLines.has("s1") ? "opacity-40" : "opacity-100"
          )}
        >
          <span
            className="w-2.5 h-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: METRIC_COLORS.system1 }}
          />
          <span className="text-muted-foreground">System 1 (Fast)</span>
        </button>
        <button
          onClick={() => toggleLine("s2")}
          className={cn(
            "flex items-center gap-1.5 text-[9px] transition-opacity px-2 py-1 rounded-md hover:bg-muted/50",
            hiddenLines.has("s2") ? "opacity-40" : "opacity-100"
          )}
        >
          <span
            className="w-2.5 h-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: METRIC_COLORS.system2 }}
          />
          <span className="text-muted-foreground">System 2 (Slow)</span>
        </button>
      </div>
    </div>
  );
}
