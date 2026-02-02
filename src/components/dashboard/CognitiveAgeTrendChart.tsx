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
      if (!user?.id) return { weekly: [], baseline: null, profile: null };

      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const [weeklyResult, baselineResult, profileResult] = await Promise.all([
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
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("birth_date")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      if (weeklyResult.error) throw weeklyResult.error;
      
      return {
        weekly: weeklyResult.data || [],
        baseline: baselineResult.data,
        profile: profileResult.data
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // Helper function to calculate age at a specific date
  const calculateAgeAtDate = (birthDate: string, targetDate: string): number => {
    const birth = parseISO(birthDate);
    const target = parseISO(targetDate);
    
    let age = target.getFullYear() - birth.getFullYear();
    const monthDiff = target.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
      age--;
    }
    
    // Add fractional year based on days since last birthday
    const lastBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (lastBirthday > target) {
      lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
    }
    const nextBirthday = new Date(lastBirthday);
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    
    const daysSinceLastBirthday = Math.floor((target.getTime() - lastBirthday.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = Math.floor((nextBirthday.getTime() - lastBirthday.getTime()) / (1000 * 60 * 60 * 24));
    
    const fractionalAge = age + (daysSinceLastBirthday / daysInYear);
    return Math.round(fractionalAge * 10) / 10; // Round to 1 decimal
  };

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!weeklyData?.weekly || weeklyData.weekly.length === 0) return [];
    
    const birthDate = weeklyData.profile?.birth_date;
    const fallbackAge = weeklyData.baseline?.chrono_age_at_onboarding 
      ? Number(weeklyData.baseline.chrono_age_at_onboarding)
      : 30;

    return weeklyData.weekly.map((w) => {
      // Calculate real age at this week's date
      const realAge = birthDate 
        ? calculateAgeAtDate(birthDate, w.week_start)
        : fallbackAge;
      
      return {
        weekLabel: format(parseISO(w.week_start), "d MMM"),
        cognitiveAge: w.cognitive_age ? Number(w.cognitive_age) : null,
        realAge: realAge,
        weekStart: w.week_start,
      };
    });
  }, [weeklyData, calculateAgeAtDate]);

  const hasData = chartData.some(d => d.cognitiveAge !== null);

  // Calculate Y-axis domain with exactly 5 ticks, centered on real age
  const { yMin, yMax, yGridTicks, centeredRealAge } = useMemo(() => {
    const fallbackAge = weeklyData?.baseline?.chrono_age_at_onboarding 
      ? Number(weeklyData.baseline.chrono_age_at_onboarding)
      : 30;
    
    // Get the real age (use the first data point's real age or fallback)
    const rawRealAge = chartData.length > 0 ? chartData[0].realAge : fallbackAge;
    const centerAge = Math.round(rawRealAge); // Integer value for centering
    
    if (!hasData) {
      // Default range centered around the user's real age with 5 ticks
      const min = centerAge - 2;
      const max = centerAge + 2;
      const ticks = [min, min + 1, centerAge, max - 1, max];
      return { yMin: min, yMax: max, yGridTicks: ticks, centeredRealAge: centerAge };
    }

    // Get cognitive age values to determine needed range
    const cognitiveAges = chartData
      .filter(d => d.cognitiveAge !== null)
      .map(d => d.cognitiveAge!);
    
    const cognitiveMin = Math.min(...cognitiveAges);
    const cognitiveMax = Math.max(...cognitiveAges);
    
    // Calculate distance from center (real age) to furthest cognitive age
    const distanceToMin = centerAge - Math.floor(cognitiveMin);
    const distanceToMax = Math.ceil(cognitiveMax) - centerAge;
    const maxDistance = Math.max(distanceToMin, distanceToMax, 2); // At least 2 years on each side
    
    // Create symmetric range around real age
    const min = centerAge - maxDistance;
    const max = centerAge + maxDistance;
    
    // Create exactly 5 ticks with real age exactly in the middle
    const ticks = [
      min,
      centerAge - Math.floor(maxDistance / 2),
      centerAge,
      centerAge + Math.floor(maxDistance / 2),
      max
    ];
    
    return { yMin: min, yMax: max, yGridTicks: ticks, centeredRealAge: centerAge };
  }, [chartData, hasData, weeklyData]);

  // Override real age in chart data to use the centered integer value
  // Override real age in chart data to use the centered integer value
  // Also generate sample cognitive age data when no real data exists
  const displayData = useMemo(() => {
    if (hasData) {
      return chartData.map(d => ({
        ...d,
        realAge: centeredRealAge // Use the exact center value
      }));
    }
    
    // Generate placeholder data with sample cognitive age values
    const today = new Date();
    const placeholderWeeks = [];
    
    // Sample cognitive age trend: slightly better than real age with small variations
    const sampleCognitiveAges = [
      centeredRealAge - 1.2,
      centeredRealAge - 0.8,
      centeredRealAge - 1.5,
      centeredRealAge - 1.0
    ];
    
    for (let i = 3; i >= 0; i--) {
      const weekDate = subDays(today, i * 7);
      const weekDateStr = format(weekDate, "yyyy-MM-dd");
      
      placeholderWeeks.push({
        weekLabel: format(weekDate, "d MMM"),
        cognitiveAge: sampleCognitiveAges[3 - i],
        realAge: centeredRealAge,
        weekStart: weekDateStr,
      });
    }
    return placeholderWeeks;
  }, [hasData, chartData, centeredRealAge]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
        <div className="h-[180px] flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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
              interval={0}
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
