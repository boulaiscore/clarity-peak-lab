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
import { motion } from "framer-motion";
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

export function DualProcessTrendChart() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [hiddenLines, setHiddenLines] = useState<Set<"s1" | "s2">>(new Set());

  // Fetch snapshots
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["daily-snapshots-dual-process", user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_metric_snapshots")
        .select("snapshot_date, ae, ra, ct, in_score")
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
    
    // Create a map of existing snapshots by date
    const snapshotMap = new Map(
      snapshots.map(s => [s.snapshot_date, s])
    );

    // Generate all days in the range
    const allDays: TrendDataPoint[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const snapshot = snapshotMap.get(dateStr);
      
      // Calculate S1 and S2 from the 4 variables
      let s1: number | null = null;
      let s2: number | null = null;
      
      if (snapshot) {
        const ae = snapshot.ae ? Number(snapshot.ae) : null;
        const ra = snapshot.ra ? Number(snapshot.ra) : null;
        const ct = snapshot.ct ? Number(snapshot.ct) : null;
        const inScore = snapshot.in_score ? Number(snapshot.in_score) : null;
        
        // S1 = (AE + RA) / 2
        if (ae !== null && ra !== null) {
          s1 = (ae + ra) / 2;
        } else if (ae !== null) {
          s1 = ae;
        } else if (ra !== null) {
          s1 = ra;
        }
        
        // S2 = (CT + IN) / 2
        if (ct !== null && inScore !== null) {
          s2 = (ct + inScore) / 2;
        } else if (ct !== null) {
          s2 = ct;
        } else if (inScore !== null) {
          s2 = inScore;
        }
      }
      
      // Format label based on time range
      let dateLabel = "";
      const dayIndex = timeRange - 1 - i;
      const total = timeRange;
      
      if (timeRange === 7) {
        dateLabel = format(date, "d/M");
      } else if (timeRange === 30) {
        const step = Math.floor(total / 4);
        if (dayIndex === 0 || dayIndex === step || dayIndex === step * 2 || dayIndex === step * 3 || dayIndex === total - 1) {
          dateLabel = format(date, "d/M");
        }
      } else {
        const step = Math.floor(total / 4);
        if (dayIndex === 0 || dayIndex === step || dayIndex === step * 2 || dayIndex === step * 3 || dayIndex === total - 1) {
          dateLabel = format(date, "d/M");
        }
      }

      allDays.push({
        date: dateStr,
        dateLabel,
        s1,
        s2,
      });
    }

    return allDays;
  }, [snapshots, timeRange]);

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-muted/30 border border-border/30 mt-3"
    >
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
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 2, fill: "#f59e0b", strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                connectNulls
              />
            )}

            {/* S2 Line - Violet */}
            {hasData && !hiddenLines.has("s2") && (
              <Line
                type="linear"
                dataKey="s2"
                name="s2"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 2, fill: "#8b5cf6", strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                connectNulls
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
            style={{ backgroundColor: "#f59e0b" }}
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
            style={{ backgroundColor: "#8b5cf6" }}
          />
          <span className="text-muted-foreground">System 2 (Slow)</span>
        </button>
      </div>
    </motion.div>
  );
}
