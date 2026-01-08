import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format, subDays, parseISO } from "date-fns";
import { Gamepad2, Zap, Brain, Target, Lightbulb, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface AreaStats {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

interface GamesStatsData {
  totalGames: number;
  // By System
  system1: { total: number; correct: number; wrong: number; accuracy: number };
  system2: { total: number; correct: number; wrong: number; accuracy: number };
  // By Area
  focus: AreaStats;
  reasoning: AreaStats;
  creativity: AreaStats;
  // Overall
  overallAccuracy: number;
}

// Area colors matching the Lab
const AREA_COLORS: Record<string, string> = {
  focus: "#3b82f6",     // blue
  memory: "#22c55e",    // green
  visual: "#f97316",    // orange
  reasoning: "#a855f7", // purple
  control: "#06b6d4",   // cyan
  creativity: "#f59e0b", // amber
};

// Hook to get 14-day games history for trend chart with area breakdown
function useGamesHistory(days: number = 14) {
  const { user } = useAuth();
  
  // Stable userId
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();

  return useQuery({
    queryKey: ["games-history-14d-breakdown-v2", stableUserId, days],
    queryFn: async () => {
      if (!stableUserId) return [];

      const startDate = subDays(new Date(), days);

      // Games are stored in exercise_completions with gym_area != 'content'
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("xp_earned, completed_at, gym_area, thinking_mode")
        .eq("user_id", stableUserId)
        .gte("completed_at", startDate.toISOString())
        .neq("gym_area", "content");

      if (error) throw error;

      // Group by date and area
      const byDateAndArea: Record<string, Record<string, number>> = {};
      (data || []).forEach((row) => {
        const date = format(parseISO(row.completed_at), "yyyy-MM-dd");
        const area = (row.gym_area as string) || "focus";
        if (!byDateAndArea[date]) {
          byDateAndArea[date] = { focus: 0, memory: 0, visual: 0, reasoning: 0, control: 0, creativity: 0 };
        }
        byDateAndArea[date][area] = (byDateAndArea[date][area] || 0) + (row.xp_earned || 0);
      });

      // Build 14-day array with dd/MM format
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayData = byDateAndArea[dateStr] || { focus: 0, memory: 0, visual: 0, reasoning: 0, control: 0, creativity: 0 };
        const totalXp = Object.values(dayData).reduce((sum, v) => sum + v, 0);
        result.push({
          date: dateStr,
          dateLabel: format(date, "d/M"),
          xp: totalXp,
          ...dayData,
        });
      }
      return result;
    },
    enabled: !!stableUserId,
    staleTime: 60_000,
  });
}

// Hook to get weekly game completions from exercise_completions
function useWeeklyGameCompletions() {
  const { user } = useAuth();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  // Stable userId
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();

  return useQuery({
    queryKey: ["weekly-game-completions-v2", stableUserId, weekStart],
    queryFn: async () => {
      if (!stableUserId) return [];
      
      // Get game completions from exercise_completions where gym_area is not 'content'
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("*")
        .eq("user_id", stableUserId)
        .eq("week_start", weekStart)
        .neq("gym_area", "content")
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!stableUserId,
    staleTime: 60_000,
  });
}

export function GamesStats() {
  // Use the new hook for game completions
  const { data: sessions = [], isLoading } = useWeeklyGameCompletions();
  
  // 14-day trend data
  const { data: historyData } = useGamesHistory(14);

  const stats = useMemo((): GamesStatsData | null => {
    if (!sessions.length) return null;

    const result: GamesStatsData = {
      totalGames: sessions.length,
      system1: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      system2: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      focus: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      reasoning: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      creativity: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      overallAccuracy: 0,
    };

    let totalXP = 0;
    let totalGamesCount = 0;

    sessions.forEach(session => {
      const area = (session.gym_area as string) || "focus";
      const xpEarned = session.xp_earned || 0;
      const thinkingMode = session.thinking_mode || "fast";
      const scorePercent = session.score || 0;

      totalXP += xpEarned;
      totalGamesCount++;

      // By System - fast = S1, slow = S2
      const isSystem1 = thinkingMode === "fast";
      if (isSystem1) {
        result.system1.total++;
        result.system1.correct += xpEarned; // Use XP as "correct" proxy
      } else {
        result.system2.total++;
        result.system2.correct += xpEarned;
      }

      // By Area - map to our 3 display areas
      if (area === "focus" || area === "memory" || area === "visual") {
        result.focus.total++;
        result.focus.correct += xpEarned;
      } else if (area === "reasoning" || area === "control") {
        result.reasoning.total++;
        result.reasoning.correct += xpEarned;
      } else if (area === "creativity") {
        result.creativity.total++;
        result.creativity.correct += xpEarned;
      } else {
        // Default to focus for unknown areas
        result.focus.total++;
        result.focus.correct += xpEarned;
      }
    });

    // For accuracy, use average score (if available) or default to 100%
    const avgScore = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;

    result.system1.accuracy = result.system1.total > 0 ? avgScore : 0;
    result.system2.accuracy = result.system2.total > 0 ? avgScore : 0;
    result.focus.accuracy = result.focus.total > 0 ? avgScore : 0;
    result.reasoning.accuracy = result.reasoning.total > 0 ? avgScore : 0;
    result.creativity.accuracy = result.creativity.total > 0 ? avgScore : 0;
    result.overallAccuracy = avgScore;

    return result;
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-card/40 border border-border/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  // Calculate weekly XP from games (sum of xp_earned)
  const weeklyGamesXP = sessions.reduce((sum, s) => sum + (s.xp_earned || 0), 0);
  const weeklyGamesTarget = 200; // Default target, could be from plan
  const gamesProgress = Math.min(100, (weeklyGamesXP / weeklyGamesTarget) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Games Progress - similar to Tasks */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-card/50 to-amber-500/5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-primary" />
            <h3 className="text-[13px] font-semibold">Games Progress</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">{weeklyGamesXP}</span>
            <span className="text-[10px] text-muted-foreground">/{weeklyGamesTarget} XP</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${gamesProgress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
          />
        </div>
        
        {/* Stats summary */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">S1 · Fast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] text-muted-foreground">S2 · Slow</span>
          </div>
        </div>
      </div>

      {/* 14-Day Trend Chart - always shown */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium text-foreground">14-Day Trend</span>
          <span className="text-[9px] text-muted-foreground ml-auto">XP / day</span>
        </div>
        {historyData && historyData.some(d => d.xp > 0) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                  tickFormatter={(value) => `${Math.round(value)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  labelFormatter={(label) => label}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      focus: 'Focus',
                      memory: 'Memory',
                      visual: 'Visual',
                      reasoning: 'Reasoning',
                      control: 'Control',
                      creativity: 'Creativity',
                    };
                    return [`${value} XP`, labels[name] || name];
                  }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                />
                <Bar 
                  dataKey="focus" 
                  stackId="games"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill={AREA_COLORS.focus}
                  name="focus"
                />
                <Bar 
                  dataKey="memory" 
                  stackId="games"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill={AREA_COLORS.memory}
                  name="memory"
                />
                <Bar 
                  dataKey="visual" 
                  stackId="games"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill={AREA_COLORS.visual}
                  name="visual"
                />
                <Bar 
                  dataKey="reasoning" 
                  stackId="games"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill={AREA_COLORS.reasoning}
                  name="reasoning"
                />
                <Bar 
                  dataKey="control" 
                  stackId="games"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={20}
                  fill={AREA_COLORS.control}
                  name="control"
                />
                <Bar 
                  dataKey="creativity" 
                  stackId="games"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                  fill={AREA_COLORS.creativity}
                  name="creativity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center text-center">
            <Gamepad2 className="h-6 w-6 text-muted-foreground/30 mb-2" />
            <p className="text-[10px] text-muted-foreground">No games in the last 14 days</p>
            <p className="text-[9px] text-muted-foreground/60">Play games in the Lab to see your trend</p>
          </div>
        )}
      </div>

      {/* System stats - only show if there are games */}
      {stats && (
        <>

      {/* System 1 (Fast) Stats */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-card/50 to-transparent border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">System 1 · Fast</p>
            <p className="text-[10px] text-muted-foreground">Intuitive responses</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-amber-400">{stats.system1.accuracy}%</p>
            <p className="text-[9px] text-muted-foreground">{stats.system1.total} games</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">{stats.system1.correct}</span>
            <span className="text-xs text-muted-foreground">correct</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400/70" />
            <span className="text-sm font-semibold text-red-400/70">{stats.system1.wrong}</span>
            <span className="text-xs text-muted-foreground">wrong</span>
          </div>
        </div>
      </div>

      {/* System 2 (Slow) Stats */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-card/50 to-transparent border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">System 2 · Slow</p>
            <p className="text-[10px] text-muted-foreground">Deliberate analysis</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-cyan-400">{stats.system2.accuracy}%</p>
            <p className="text-[9px] text-muted-foreground">{stats.system2.total} games</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">{stats.system2.correct}</span>
            <span className="text-xs text-muted-foreground">correct</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400/70" />
            <span className="text-sm font-semibold text-red-400/70">{stats.system2.wrong}</span>
            <span className="text-xs text-muted-foreground">wrong</span>
          </div>
        </div>
      </div>

      {/* By Area Breakdown */}
      <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">By Cognitive Area</p>
        
        <div className="space-y-3">
          {/* Focus */}
          {stats.focus.total > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-blue-500/15 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Focus</span>
                  <span className="text-xs text-muted-foreground">{stats.focus.total} games</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.focus.accuracy}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-blue-400 w-12 text-right">{stats.focus.accuracy}%</span>
            </div>
          )}

          {/* Reasoning */}
          {stats.reasoning.total > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-purple-500/15 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Reasoning</span>
                  <span className="text-xs text-muted-foreground">{stats.reasoning.total} games</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.reasoning.accuracy}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-purple-400 w-12 text-right">{stats.reasoning.accuracy}%</span>
            </div>
          )}

          {/* Creativity */}
          {stats.creativity.total > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-amber-500/15 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Creativity</span>
                  <span className="text-xs text-muted-foreground">{stats.creativity.total} games</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.creativity.accuracy}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-amber-400 w-12 text-right">{stats.creativity.accuracy}%</span>
            </div>
          )}

          {/* No area data message */}
          {stats.focus.total === 0 && stats.reasoning.total === 0 && stats.creativity.total === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No area data available</p>
          )}
        </div>
      </div>
        </>
      )}
    </motion.div>
  );
}
