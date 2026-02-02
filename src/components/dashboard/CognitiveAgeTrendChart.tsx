/**
 * ============================================
 * COGNITIVE AGE TREND CHART
 * ============================================
 * 
 * Monthly comparison chart: Cognitive Age vs Real Age
 * WHOOP-style visual with two lines.
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO, startOfWeek } from "date-fns";
import { Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine, ComposedChart, Legend } from "recharts";
import { Brain, User } from "lucide-react";

// Colors
const COGNITIVE_AGE_COLOR = "hsl(210, 100%, 60%)"; // Electric blue (like sharpness)
const REAL_AGE_COLOR = "hsl(0, 0%, 50%)"; // Gray for real age baseline
const GRID_COLOR = "rgba(100, 116, 139, 0.15)";
const MUTED_TEXT = "rgba(100, 116, 139, 0.7)";

interface ChartDataPoint {
  weekLabel: string;
  cognitiveAge: number | null;
  realAge: number;
  weekStart: string;
}

// Custom X-axis tick
const CustomXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (!payload || x === undefined || y === undefined) return null;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={14}
        textAnchor="middle"
        fill={MUTED_TEXT}
        fontSize={10}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {payload.value}
      </text>
    </g>
  );
};

// Custom dot
const CustomDot = ({ cx, cy, payload, dataKey }: { cx?: number; cy?: number; payload?: Record<string, number | null>; dataKey?: string }) => {
  if (!payload || cx === undefined || cy === undefined || !dataKey) return null;
  const value = payload[dataKey];
  if (value === null || value === undefined) return null;
  
  const color = dataKey === 'cognitiveAge' ? COGNITIVE_AGE_COLOR : REAL_AGE_COLOR;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="#0f172a"
      stroke={color}
      strokeWidth={1.5}
    />
  );
};

export function CognitiveAgeTrendChart() {
  const { user } = useAuth();

  // Fetch weekly cognitive age data (last 30 days = ~4 weeks)
  const { data: weeklyData, isLoading } = useQuery({
    queryKey: ["cognitive-age-trend", user?.id],
    queryFn: async () => {
      if (!user?.id) return { weekly: [], baseline: null };

      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const [weeklyResult, baselineResult] = await Promise.all([
        supabase
          .from("user_cognitive_age_weekly")
          .select("week_start, cognitive_age")
          .eq("user_id", user.id)
          .gte("week_start", thirtyDaysAgo)
          .order("week_start", { ascending: true }),
        supabase
          .from("user_cognitive_baselines")
          .select("chrono_age_at_onboarding")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      if (weeklyResult.error) throw weeklyResult.error;
      
      return {
        weekly: weeklyResult.data || [],
        baseline: baselineResult.data
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!weeklyData?.weekly || weeklyData.weekly.length === 0) return [];
    
    const realAge = weeklyData.baseline?.chrono_age_at_onboarding 
      ? Number(weeklyData.baseline.chrono_age_at_onboarding)
      : 30;

    return weeklyData.weekly.map((w) => ({
      weekLabel: format(parseISO(w.week_start), "d MMM"),
      cognitiveAge: w.cognitive_age ? Number(w.cognitive_age) : null,
      realAge: realAge,
      weekStart: w.week_start,
    }));
  }, [weeklyData]);

  const hasData = chartData.some(d => d.cognitiveAge !== null);

  // Calculate Y-axis domain
  const { yMin, yMax, yGridTicks } = useMemo(() => {
    if (!hasData) {
      return { yMin: 20, yMax: 50, yGridTicks: [25, 30, 35, 40, 45] };
    }

    const allValues = chartData
      .filter(d => d.cognitiveAge !== null)
      .flatMap(d => [d.cognitiveAge!, d.realAge]);
    
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const range = dataMax - dataMin;
    const padding = Math.max(range * 0.3, 3); // At least 3 years padding
    
    const min = Math.floor(dataMin - padding);
    const max = Math.ceil(dataMax + padding);
    const step = Math.ceil((max - min) / 4);
    
    const ticks = [];
    for (let i = min + step; i < max; i += step) {
      ticks.push(i);
    }
    
    return { yMin: min, yMax: max, yGridTicks: ticks };
  }, [chartData, hasData]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
        <div className="h-[180px] flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Generate placeholder data if no real data exists
  const displayData = hasData ? chartData : (() => {
    const realAge = weeklyData?.baseline?.chrono_age_at_onboarding 
      ? Number(weeklyData.baseline.chrono_age_at_onboarding)
      : 30;
    
    // Create 4 placeholder weeks
    const today = new Date();
    const placeholderWeeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekDate = subDays(today, i * 7);
      placeholderWeeks.push({
        weekLabel: format(weekDate, "d MMM"),
        cognitiveAge: null,
        realAge: realAge,
        weekStart: format(weekDate, "yyyy-MM-dd"),
      });
    }
    return placeholderWeeks;
  })();

  return (
    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Age Comparison
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground/60">Last 30 days</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: COGNITIVE_AGE_COLOR }}
          />
          <span className="text-[9px] text-muted-foreground">Cognitive Age</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div 
            className="w-2.5 h-2.5 rounded-full border border-dashed" 
            style={{ borderColor: REAL_AGE_COLOR, backgroundColor: 'transparent' }}
          />
          <span className="text-[9px] text-muted-foreground">Real Age</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid 
              horizontal={true}
              vertical={false}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
            <XAxis
              dataKey="weekLabel"
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              interval={0}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              domain={[yMin, yMax]}
              ticks={yGridTicks}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: MUTED_TEXT }}
              width={25}
            />
            {/* Real Age - dashed line */}
            <Line
              type="linear"
              dataKey="realAge"
              stroke={REAL_AGE_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            {/* Cognitive Age - solid line */}
            <Line
              type="linear"
              dataKey="cognitiveAge"
              stroke={COGNITIVE_AGE_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls
              dot={(props) => <CustomDot {...props} dataKey="cognitiveAge" />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <p className="text-[9px] text-muted-foreground/60 text-center mt-1">
        Weekly cognitive age vs chronological age
      </p>
    </div>
  );
}
