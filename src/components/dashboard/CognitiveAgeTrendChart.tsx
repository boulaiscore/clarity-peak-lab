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
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ComposedChart, LabelList } from "recharts";
import { useCognitiveAge } from "@/hooks/useCognitiveAge";
// Colors
const COGNITIVE_AGE_GOOD_COLOR = "hsl(142, 76%, 45%)"; // Emerald green - younger than real age
const COGNITIVE_AGE_BAD_COLOR = "hsl(0, 84%, 60%)"; // Red - older than real age
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

// Custom dot - color based on comparison with real age
const CustomDot = ({ cx, cy, payload, dataKey }: { cx?: number; cy?: number; payload?: Record<string, number | null>; dataKey?: string }) => {
  if (!payload || cx === undefined || cy === undefined || !dataKey) return null;
  const value = payload[dataKey];
  if (value === null || value === undefined) return null;
  
  let color: string;
  if (dataKey === 'cognitiveAge') {
    const cogAge = payload.cognitiveAge;
    const realAge = payload.realAge;
    // Green if cognitive age <= real age, red if older
    color = (cogAge !== null && realAge !== null && cogAge <= realAge) 
      ? COGNITIVE_AGE_GOOD_COLOR 
      : COGNITIVE_AGE_BAD_COLOR;
  } else {
    color = REAL_AGE_COLOR;
  }
  
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
  const { data: cognitiveAgeData } = useCognitiveAge();

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

  // Calculate current real age from birth_date (dynamic, 1 decimal)
  const currentRealAge = useMemo(() => {
    const birthDate = weeklyData?.profile?.birth_date;
    if (birthDate) {
      const birth = parseISO(birthDate);
      const today = new Date();
      const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return Math.round((ageInDays / 365.25) * 10) / 10;
    }
    // Fallback to chrono_age_at_onboarding if no birth_date
    return weeklyData?.baseline?.chrono_age_at_onboarding 
      ? Number(weeklyData.baseline.chrono_age_at_onboarding)
      : 30;
  }, [weeklyData?.profile?.birth_date, weeklyData?.baseline?.chrono_age_at_onboarding]);

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!weeklyData?.weekly || weeklyData.weekly.length === 0) return [];

    return weeklyData.weekly.map((w) => {
      // Round cognitive age to 1 decimal for consistency
      const cogAge = w.cognitive_age 
        ? Math.round(Number(w.cognitive_age) * 10) / 10 
        : null;
      
      return {
        weekLabel: format(parseISO(w.week_start), "d MMM"),
        cognitiveAge: cogAge,
        realAge: currentRealAge, // Use dynamic current real age
        weekStart: w.week_start,
      };
    });
  }, [weeklyData?.weekly, currentRealAge]);

  const hasData = chartData.some(d => d.cognitiveAge !== null);

  // Calculate Y-axis domain with exactly 5 ticks, centered on real age
  const { yMin, yMax, yGridTicks, centeredRealAge } = useMemo(() => {
    // Always use currentRealAge (dynamically calculated from birth_date)
    const rawRealAge = currentRealAge;
    const centerAge = Math.round(rawRealAge * 10) / 10; // Keep 1 decimal
    const centerAgeInt = Math.round(rawRealAge); // Integer for Y-axis ticks
    
    if (!hasData) {
      // Default range centered around the user's real age with 5 ticks
      const min = centerAgeInt - 2;
      const max = centerAgeInt + 2;
      const ticks = [min, min + 1, centerAgeInt, max - 1, max];
      return { yMin: min, yMax: max, yGridTicks: ticks, centeredRealAge: centerAge };
    }

    // Get cognitive age values to determine needed range
    const cognitiveAges = chartData
      .filter(d => d.cognitiveAge !== null)
      .map(d => d.cognitiveAge!);
    
    const cognitiveMin = Math.min(...cognitiveAges);
    const cognitiveMax = Math.max(...cognitiveAges);
    
    // Calculate distance from center (real age) to furthest cognitive age
    const distanceToMin = centerAgeInt - Math.floor(cognitiveMin);
    const distanceToMax = Math.ceil(cognitiveMax) - centerAgeInt;
    const maxDistance = Math.max(distanceToMin, distanceToMax, 2); // At least 2 years on each side
    
    // Create symmetric range around real age
    const min = centerAgeInt - maxDistance;
    const max = centerAgeInt + maxDistance;
    
    // Create exactly 5 ticks with real age exactly in the middle
    const ticks = [
      min,
      centerAgeInt - Math.floor(maxDistance / 2),
      centerAgeInt,
      centerAgeInt + Math.floor(maxDistance / 2),
      max
    ];
    
    return { yMin: min, yMax: max, yGridTicks: ticks, centeredRealAge: centerAge };
  }, [currentRealAge, chartData, hasData]);

  // Override real age in chart data to use the centered integer value
  // Include live cognitive age during calibration
  const displayData = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const todayLabel = format(today, "d MMM");
    
    // Get current live cognitive age from the hook
    const liveCognitiveAge = cognitiveAgeData?.cognitiveAge ?? null;
    
    if (hasData) {
      // Use real data with centered real age
      const data = chartData.map(d => ({
        ...d,
        realAge: centeredRealAge
      }));
      
      // Add today's live value if not already in the data
      const hasToday = data.some(d => d.weekStart === todayStr);
      if (!hasToday && liveCognitiveAge !== null) {
        data.push({
          weekLabel: todayLabel,
          cognitiveAge: liveCognitiveAge,
          realAge: centeredRealAge,
          weekStart: todayStr,
        });
      }
      
      return data;
    }
    
    // No weekly data - show placeholder weeks with today's live cognitive age
    const placeholderWeeks: ChartDataPoint[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekDate = subDays(today, i * 7);
      const weekDateStr = format(weekDate, "yyyy-MM-dd");
      
      placeholderWeeks.push({
        weekLabel: format(weekDate, "d MMM"),
        // Only show live value for today (i === 0)
        cognitiveAge: i === 0 ? liveCognitiveAge : null,
        realAge: centeredRealAge,
        weekStart: weekDateStr,
      });
    }
    return placeholderWeeks;
  }, [hasData, chartData, centeredRealAge, cognitiveAgeData?.cognitiveAge]);

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

      {/* Legend - dynamic color based on current cognitive age vs real age */}
      {(() => {
        // Get latest cognitive age comparison
        const latestData = displayData.find(d => d.cognitiveAge !== null);
        const isYounger = latestData && latestData.cognitiveAge !== null && latestData.cognitiveAge <= latestData.realAge;
        const legendColor = isYounger ? COGNITIVE_AGE_GOOD_COLOR : COGNITIVE_AGE_BAD_COLOR;
        
        return (
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: legendColor }}
              />
              <span className="text-[9px] text-muted-foreground">Cognitive Age</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full border border-dashed" 
                style={{ borderColor: REAL_AGE_COLOR, backgroundColor: 'transparent' }}
              />
              <span className="text-[9px] text-muted-foreground">Chronological Age</span>
            </div>
          </div>
        );
      })()}

      {/* Chart */}
      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 20, right: 35, left: 10, bottom: 20 }}>
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
            >
              <LabelList
                dataKey="realAge"
                position="right"
                offset={8}
                fill={REAL_AGE_COLOR}
                fontSize={10}
                fontWeight={600}
                formatter={(value: number, entry: { index: number }) => {
                  // Only show label on last point
                  const lastIndex = displayData.length - 1;
                  return entry?.index === lastIndex ? value.toFixed(1) : '';
                }}
                content={({ x, y, value, index }: { x?: number; y?: number; value?: number; index?: number }) => {
                  const lastIndex = displayData.length - 1;
                  if (index !== lastIndex || !value || x === undefined || y === undefined) return null;
                  return (
                    <text x={x + 8} y={y + 3} fill={REAL_AGE_COLOR} fontSize={10} fontWeight={600}>
                      {value.toFixed(1)}
                    </text>
                  );
                }}
              />
            </Line>
            {/* Cognitive Age - color based on comparison */}
            <Line
              type="linear"
              dataKey="cognitiveAge"
              stroke={COGNITIVE_AGE_GOOD_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls
              dot={(props) => <CustomDot {...props} dataKey="cognitiveAge" />}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="cognitiveAge"
                position="right"
                offset={8}
                fontSize={10}
                fontWeight={600}
                content={({ x, y, value, index }: { x?: number; y?: number; value?: number | null; index?: number }) => {
                  // Find last non-null cognitive age index
                  let lastValidIndex = -1;
                  for (let i = displayData.length - 1; i >= 0; i--) {
                    if (displayData[i].cognitiveAge !== null) {
                      lastValidIndex = i;
                      break;
                    }
                  }
                  if (index !== lastValidIndex || value === null || value === undefined || x === undefined || y === undefined) return null;
                  
                  const realAge = displayData[lastValidIndex]?.realAge ?? 0;
                  const color = value <= realAge ? COGNITIVE_AGE_GOOD_COLOR : COGNITIVE_AGE_BAD_COLOR;
                  return (
                    <text x={x + 8} y={y + 3} fill={color} fontSize={10} fontWeight={600}>
                      {value.toFixed(1)}
                    </text>
                  );
                }}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <p className="text-[9px] text-muted-foreground/60 text-center mt-1">
        Weekly cognitive vs chronological age
      </p>
    </div>
  );
}
