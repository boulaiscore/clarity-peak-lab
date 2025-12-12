import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
};

export function PerformanceChart() {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["performance-chart", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const fourteenDaysAgo = subDays(new Date(), 14);

      const { data, error } = await supabase
        .from("neuro_gym_sessions")
        .select("completed_at, score, area")
        .eq("user_id", user.id)
        .gte("completed_at", fourteenDaysAgo.toISOString())
        .order("completed_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    // Group sessions by date and calculate average score per day
    const dailyScores: Record<string, { total: number; count: number }> = {};

    sessions.forEach((session) => {
      const date = format(parseISO(session.completed_at), "yyyy-MM-dd");
      // Cap score at 100 for display purposes
      const score = Math.min(session.score, 100);
      
      if (!dailyScores[date]) {
        dailyScores[date] = { total: 0, count: 0 };
      }
      dailyScores[date].total += score;
      dailyScores[date].count += 1;
    });

    // Create array with last 14 days
    const result = [];
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dayLabel = format(subDays(new Date(), i), "dd/MM");

      if (dailyScores[date]) {
        result.push({
          date: dayLabel,
          score: Math.round(dailyScores[date].total / dailyScores[date].count),
        });
      } else {
        result.push({
          date: dayLabel,
          score: null,
        });
      }
    }

    return result;
  }, [sessions]);

  // Calculate trend
  const trend = useMemo(() => {
    const validScores = chartData.filter((d) => d.score !== null);
    if (validScores.length < 2) return { direction: "flat", percentage: 0 };

    const recentScores = validScores.slice(-3);
    const olderScores = validScores.slice(0, Math.max(1, validScores.length - 3));

    const recentAvg =
      recentScores.reduce((sum, d) => sum + (d.score || 0), 0) / recentScores.length;
    const olderAvg =
      olderScores.reduce((sum, d) => sum + (d.score || 0), 0) / olderScores.length;

    const diff = recentAvg - olderAvg;
    const percentage = Math.abs(Math.round(diff));

    if (diff > 3) return { direction: "up", percentage };
    if (diff < -3) return { direction: "down", percentage };
    return { direction: "flat", percentage: 0 };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-card/40 border border-border/20">
        <div className="h-[160px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const hasData = chartData.some((d) => d.score !== null);

  if (!hasData) {
    return (
      <div className="p-4 rounded-xl bg-card/40 border border-border/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[12px] font-semibold text-foreground">Performance Timeline</h3>
        </div>
        <div className="h-[120px] flex items-center justify-center">
          <p className="text-[11px] text-muted-foreground">Complete sessions to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card/40 border border-border/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-foreground">Performance Timeline</h3>
        <div className="flex items-center gap-1.5">
          {trend.direction === "up" && (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">+{trend.percentage}%</span>
            </>
          )}
          {trend.direction === "down" && (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-medium text-rose-400">-{trend.percentage}%</span>
            </>
          )}
          {trend.direction === "flat" && (
            <>
              <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Stable</span>
            </>
          )}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[120px] w-full">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickCount={3}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            connectNulls
            dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ChartContainer>

      <p className="text-[9px] text-muted-foreground/60 text-center mt-2">
        Average daily score • Last 14 days
      </p>
    </div>
  );
}
