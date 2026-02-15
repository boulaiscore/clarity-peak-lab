/**
 * ============================================
 * COGNITIVE AGE TREND CHART
 * ============================================
 * 
 * Comparison chart: Cognitive Age vs Chronological Age.
 * Uses daily_metric_snapshots during calibration (no weekly data),
 * and user_cognitive_age_weekly when available.
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ComposedChart, LabelList } from "recharts";

// Colors
const COGNITIVE_AGE_GOOD_COLOR = "hsl(142, 76%, 45%)";
const COGNITIVE_AGE_BAD_COLOR = "hsl(0, 84%, 60%)";
const REAL_AGE_COLOR = "hsl(0, 0%, 50%)";
const GRID_COLOR = "rgba(100, 116, 139, 0.15)";
const MUTED_TEXT = "rgba(100, 116, 139, 0.7)";

interface ChartDataPoint {
  label: string;
  cognitiveAge: number | null;
  realAge: number;
  date: string;
}

// Custom X-axis tick
const CustomXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  if (!payload || x === undefined || y === undefined) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={14} textAnchor="middle" fill={MUTED_TEXT} fontSize={10} fontFamily="system-ui, -apple-system, sans-serif">
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
    color = (cogAge !== null && realAge !== null && cogAge <= realAge)
      ? COGNITIVE_AGE_GOOD_COLOR
      : COGNITIVE_AGE_BAD_COLOR;
  } else {
    color = REAL_AGE_COLOR;
  }
  
  return (
    <circle cx={cx} cy={cy} r={3} fill="#0f172a" stroke={color} strokeWidth={1.5} />
  );
};

/**
 * Calculate cognitive age from daily snapshot performance.
 * perf = avg(AE, RA, CT, IN) for available values
 * During calibration: baseline = 50 (population average)
 * Each 10 pts improvement = -1 year
 */
function calcCognitiveAgeFromSnapshot(
  ae: number | null,
  ra: number | null,
  ct: number | null,
  inScore: number | null,
  realAge: number,
  baselineScore: number | null
): number | null {
  const skills = [ae, ra, ct, inScore].filter((v): v is number => v !== null).map(Number);
  if (skills.length < 2) return null;
  
  const perf = skills.reduce((a, b) => a + b, 0) / skills.length;
  const baseline = baselineScore !== null ? baselineScore : 50;
  const improvement = (perf - baseline) / 10; // 10 points = 1 year
  
  return Math.round((realAge - improvement) * 10) / 10;
}

/**
 * Calculate precise age at a given date from birth_date.
 */
function calcAgeAtDate(birthDate: string, targetDate: string): number {
  const birth = parseISO(birthDate);
  const target = parseISO(targetDate);
  const ageInDays = differenceInDays(target, birth);
  return Math.round((ageInDays / 365.25) * 10) / 10;
}

export function CognitiveAgeTrendChart() {
  const { user } = useAuth();

  // Fetch all necessary data in parallel
  const { data: chartSources, isLoading } = useQuery({
    queryKey: ["cognitive-age-trend-v2", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const [weeklyResult, baselineResult, profileResult, dailyResult] = await Promise.all([
        supabase
          .from("user_cognitive_age_weekly")
          .select("week_start, cognitive_age")
          .eq("user_id", user.id)
          .gte("week_start", thirtyDaysAgo)
          .order("week_start", { ascending: true }),
        supabase
          .from("user_cognitive_baselines")
          .select("chrono_age_at_onboarding, baseline_score_90d, is_baseline_calibrated")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("birth_date")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("daily_metric_snapshots")
          .select("snapshot_date, ae, ra, ct, in_score")
          .eq("user_id", user.id)
          .gte("snapshot_date", thirtyDaysAgo)
          .order("snapshot_date", { ascending: true }),
      ]);

      return {
        weekly: weeklyResult.data || [],
        baseline: baselineResult.data,
        profile: profileResult.data,
        daily: dailyResult.data || [],
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  // Build chart data from either weekly or daily sources
  const { displayData, currentRealAge } = useMemo(() => {
    if (!chartSources) return { displayData: [], currentRealAge: 30 };

    const { weekly, baseline, profile, daily } = chartSources;

    // Calculate current real age from birth_date
    let realAge: number;
    if (profile?.birth_date) {
      realAge = calcAgeAtDate(profile.birth_date, format(new Date(), "yyyy-MM-dd"));
    } else {
      realAge = baseline?.chrono_age_at_onboarding
        ? Number(baseline.chrono_age_at_onboarding)
        : 30;
    }

    const baselineScore = baseline?.baseline_score_90d
      ? Number(baseline.baseline_score_90d)
      : null;

    // Build a full 30-day skeleton
    const today = new Date();
    const allDays: ChartDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dateRealAge = profile?.birth_date
        ? calcAgeAtDate(profile.birth_date, dateStr)
        : realAge;
      allDays.push({
        label: format(d, "d MMM"),
        cognitiveAge: null,
        realAge: dateRealAge,
        date: dateStr,
      });
    }

    // Index weekly data by week_start
    const weeklyMap = new Map(weekly.map((w) => [w.week_start, w]));
    // Index daily data by snapshot_date
    const dailyMap = new Map(daily.map((d) => [d.snapshot_date, d]));

    // Fill cognitive age from weekly or daily sources
    for (const point of allDays) {
      const w = weeklyMap.get(point.date);
      if (w?.cognitive_age) {
        point.cognitiveAge = Math.round(Number(w.cognitive_age) * 10) / 10;
        continue;
      }
      const d = dailyMap.get(point.date);
      if (d) {
        point.cognitiveAge = calcCognitiveAgeFromSnapshot(
          d.ae ? Number(d.ae) : null,
          d.ra ? Number(d.ra) : null,
          d.ct ? Number(d.ct) : null,
          d.in_score ? Number(d.in_score) : null,
          point.realAge,
          baselineScore
        );
      }
    }

    return { displayData: allDays, currentRealAge: realAge };
  }, [chartSources]);

  const hasData = displayData.some((d) => d.cognitiveAge !== null);

  // Calculate Y-axis domain: 5 ticks centered on real age
  const { yMin, yMax, yGridTicks } = useMemo(() => {
    const centerAgeInt = Math.round(currentRealAge);

    if (!hasData) {
      const min = centerAgeInt - 2;
      const max = centerAgeInt + 2;
      return { yMin: min, yMax: max, yGridTicks: [min, min + 1, centerAgeInt, max - 1, max] };
    }

    const cognitiveAges = displayData
      .filter((d) => d.cognitiveAge !== null)
      .map((d) => d.cognitiveAge!);

    const cogMin = Math.min(...cognitiveAges);
    const cogMax = Math.max(...cognitiveAges);

    const distMin = centerAgeInt - Math.floor(cogMin);
    const distMax = Math.ceil(cogMax) - centerAgeInt;
    const maxDist = Math.max(distMin, distMax, 2);

    const min = centerAgeInt - maxDist;
    const max = centerAgeInt + maxDist;

    const ticks = [
      min,
      centerAgeInt - Math.floor(maxDist / 2),
      centerAgeInt,
      centerAgeInt + Math.floor(maxDist / 2),
      max,
    ];

    return { yMin: min, yMax: max, yGridTicks: ticks };
  }, [currentRealAge, displayData, hasData]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
        <div className="h-[180px] flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Determine legend color from latest data point
  const latestWithCog = [...displayData].reverse().find((d) => d.cognitiveAge !== null);
  const isYounger = latestWithCog && latestWithCog.cognitiveAge !== null && latestWithCog.cognitiveAge <= latestWithCog.realAge;
  const legendColor = isYounger ? COGNITIVE_AGE_GOOD_COLOR : COGNITIVE_AGE_BAD_COLOR;

  return (
    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Age Comparison
        </span>
        <span className="text-[9px] text-muted-foreground/60">Last 30 days</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: legendColor }} />
          <span className="text-[9px] text-muted-foreground">Cognitive Age</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full border border-dashed"
            style={{ borderColor: REAL_AGE_COLOR, backgroundColor: "transparent" }}
          />
          <span className="text-[9px] text-muted-foreground">Chronological Age</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 20, right: 35, left: 10, bottom: 20 }}>
            <CartesianGrid horizontal vertical={false} stroke={GRID_COLOR} strokeWidth={1} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              interval={4}
              padding={{ left: 5, right: 5 }}
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
            {/* Chronological Age - dashed line */}
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
                content={({ x, y, value, index }: { x?: number; y?: number; value?: number; index?: number }) => {
                  if (index !== displayData.length - 1 || !value || x === undefined || y === undefined) return null;
                  return (
                    <text x={x + 8} y={y + 3} fill={REAL_AGE_COLOR} fontSize={10} fontWeight={600}>
                      {value.toFixed(1)}
                    </text>
                  );
                }}
              />
            </Line>
            {/* Cognitive Age - solid line with dots */}
            <Line
              type="linear"
              dataKey="cognitiveAge"
              stroke={legendColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              connectNulls
              dot={(props) => <CustomDot {...props} dataKey="cognitiveAge" />}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="cognitiveAge"
                content={({ x, y, value, index }: { x?: number; y?: number; value?: number | null; index?: number }) => {
                  // Only label last non-null point
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
        {displayData.length > 0 && displayData[0].date !== displayData[displayData.length - 1]?.date
          ? "Daily cognitive vs chronological age"
          : "Weekly cognitive vs chronological age"}
      </p>
    </div>
  );
}
