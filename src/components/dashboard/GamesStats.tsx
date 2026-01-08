import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format, subDays, parseISO } from "date-fns";
import { Gamepad2, Zap, Brain, Target, Lightbulb, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

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

// Hook to get 14-day games history for trend chart
function useGamesHistory(days: number = 14) {
  const { user } = useAuth();
  
  // Stable userId
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();

  return useQuery({
    queryKey: ["games-history-14d", stableUserId, days],
    queryFn: async () => {
      if (!stableUserId) return [];

      const startDate = subDays(new Date(), days);

      // Games are stored in neuro_gym_sessions (with score), not exercise_completions
      // We calculate XP based on score: simplified formula
      const { data, error } = await supabase
        .from("neuro_gym_sessions")
        .select("score, completed_at")
        .eq("user_id", stableUserId)
        .gte("completed_at", startDate.toISOString());

      if (error) throw error;

      // Group by date - calculate XP from score (score is already XP-like)
      const byDate: Record<string, number> = {};
      (data || []).forEach((row) => {
        const date = format(parseISO(row.completed_at), "yyyy-MM-dd");
        // Score is the XP earned per session
        byDate[date] = (byDate[date] || 0) + (row.score || 0);
      });

      // Build 14-day array with dd/MM format
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        result.push({
          date: dateStr,
          dateLabel: format(date, "d/M"), // dd/MM format
          xp: byDate[dateStr] || 0,
        });
      }
      return result;
    },
    enabled: !!stableUserId,
    staleTime: 60_000,
  });
}

export function GamesStats() {
  const { user } = useAuth();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Stable userId
  const stableUserId = user?.id ?? (() => {
    try { return localStorage.getItem("nl:lastUserId") || undefined; } catch { return undefined; }
  })();
  
  // Use neuro_gym_sessions for accurate game/session counts
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["neuro-gym-sessions-stats", stableUserId, weekStart],
    queryFn: async () => {
      if (!stableUserId) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("neuro_gym_sessions")
        .select("*")
        .eq("user_id", stableUserId)
        .gte("completed_at", sevenDaysAgo.toISOString())
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!stableUserId,
    staleTime: 60_000,
  });

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

    let totalCorrectAnswers = 0;
    let totalQuestions = 0;

    sessions.forEach(session => {
      const area = (session.area as string) || "focus";
      const correctAnswers = session.correct_answers || 0;
      const questions = session.total_questions || 1;
      const sessionAccuracy = questions > 0 ? (correctAnswers / questions) * 100 : 0;
      const isGoodSession = sessionAccuracy >= 50;

      totalCorrectAnswers += correctAnswers;
      totalQuestions += questions;

      // By System - focus/memory/visual are System 1, reasoning/creativity/control are System 2
      const isSystem1 = ["focus", "memory", "visual"].includes(area);
      if (isSystem1) {
        result.system1.total++;
        result.system1.correct += correctAnswers;
        result.system1.wrong += (questions - correctAnswers);
      } else {
        result.system2.total++;
        result.system2.correct += correctAnswers;
        result.system2.wrong += (questions - correctAnswers);
      }

      // By Area
      if (area === "focus" || area === "memory" || area === "visual") {
        result.focus.total++;
        result.focus.correct += correctAnswers;
        result.focus.wrong += (questions - correctAnswers);
      } else if (area === "reasoning" || area === "control") {
        result.reasoning.total++;
        result.reasoning.correct += correctAnswers;
        result.reasoning.wrong += (questions - correctAnswers);
      } else if (area === "creativity") {
        result.creativity.total++;
        result.creativity.correct += correctAnswers;
        result.creativity.wrong += (questions - correctAnswers);
      } else {
        // Default to focus for unknown areas
        result.focus.total++;
        result.focus.correct += correctAnswers;
        result.focus.wrong += (questions - correctAnswers);
      }
    });

    // Calculate accuracies based on total correct/wrong answers
    const s1Total = result.system1.correct + result.system1.wrong;
    const s2Total = result.system2.correct + result.system2.wrong;
    const focusTotal = result.focus.correct + result.focus.wrong;
    const reasoningTotal = result.reasoning.correct + result.reasoning.wrong;
    const creativityTotal = result.creativity.correct + result.creativity.wrong;

    result.system1.accuracy = s1Total > 0 ? Math.round((result.system1.correct / s1Total) * 100) : 0;
    result.system2.accuracy = s2Total > 0 ? Math.round((result.system2.correct / s2Total) * 100) : 0;
    result.focus.accuracy = focusTotal > 0 ? Math.round((result.focus.correct / focusTotal) * 100) : 0;
    result.reasoning.accuracy = reasoningTotal > 0 ? Math.round((result.reasoning.correct / reasoningTotal) * 100) : 0;
    result.creativity.accuracy = creativityTotal > 0 ? Math.round((result.creativity.correct / creativityTotal) * 100) : 0;
    result.overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrectAnswers / totalQuestions) * 100) : 0;

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

  // Calculate weekly XP from games (sum of scores)
  const weeklyGamesXP = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
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
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="gamesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  width={30}
                  tickCount={4}
                  domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.1))]}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  labelFormatter={(label) => label}
                  formatter={(value: number) => [`${value} XP`, 'Games']}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#gamesGradient)"
                  dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </AreaChart>
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
