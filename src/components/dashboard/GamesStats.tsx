import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, Zap, Brain, Target, Lightbulb, CheckCircle2, XCircle } from "lucide-react";

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

export function GamesStats() {
  const { user } = useAuth();
  
  const { data: completions = [], isLoading } = useQuery({
    queryKey: ["exercise-completions-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("exercise_completions")
        .select("*")
        .eq("user_id", user.id)
        .neq("gym_area", "content") // Exclude content/tasks
        .gte("completed_at", sevenDaysAgo.toISOString())
        .order("completed_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const stats = useMemo((): GamesStatsData | null => {
    if (!completions.length) return null;

    const result: GamesStatsData = {
      totalGames: completions.length,
      system1: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      system2: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      focus: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      reasoning: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      creativity: { total: 0, correct: 0, wrong: 0, accuracy: 0 },
      overallAccuracy: 0,
    };

    let totalCorrect = 0;
    let totalWrong = 0;

    completions.forEach(completion => {
      const mode = completion.thinking_mode as string;
      const area = (completion.gym_area as string) || "focus";
      const score = completion.score || 0;
      const isCorrect = score >= 50;

      // Count overall
      if (isCorrect) totalCorrect++;
      else totalWrong++;

      // By System
      const isSystem1 = mode === "fast" || ["focus", "memory"].includes(area);
      if (isSystem1) {
        result.system1.total++;
        if (isCorrect) result.system1.correct++;
        else result.system1.wrong++;
      } else {
        result.system2.total++;
        if (isCorrect) result.system2.correct++;
        else result.system2.wrong++;
      }

      // By Area
      if (area === "focus" || area === "memory") {
        result.focus.total++;
        if (isCorrect) result.focus.correct++;
        else result.focus.wrong++;
      } else if (area === "reasoning" || area === "control") {
        result.reasoning.total++;
        if (isCorrect) result.reasoning.correct++;
        else result.reasoning.wrong++;
      } else if (area === "creativity") {
        result.creativity.total++;
        if (isCorrect) result.creativity.correct++;
        else result.creativity.wrong++;
      } else {
        // Default to focus for unknown areas
        result.focus.total++;
        if (isCorrect) result.focus.correct++;
        else result.focus.wrong++;
      }
    });

    // Calculate accuracies
    result.system1.accuracy = result.system1.total > 0 
      ? Math.round((result.system1.correct / result.system1.total) * 100) : 0;
    result.system2.accuracy = result.system2.total > 0 
      ? Math.round((result.system2.correct / result.system2.total) * 100) : 0;
    result.focus.accuracy = result.focus.total > 0 
      ? Math.round((result.focus.correct / result.focus.total) * 100) : 0;
    result.reasoning.accuracy = result.reasoning.total > 0 
      ? Math.round((result.reasoning.correct / result.reasoning.total) * 100) : 0;
    result.creativity.accuracy = result.creativity.total > 0 
      ? Math.round((result.creativity.correct / result.creativity.total) * 100) : 0;
    result.overallAccuracy = result.totalGames > 0 
      ? Math.round((totalCorrect / result.totalGames) * 100) : 0;

    return result;
  }, [completions]);

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

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-card/40 border border-border/30 text-center"
      >
        <Gamepad2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No games this week</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Play games in the Lab to see stats</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with total games and overall accuracy */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">This Week</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{stats.totalGames} games</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
            <span className="text-xs font-medium text-primary">{stats.overallAccuracy}% accuracy</span>
          </div>
        </div>
      </div>

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
    </motion.div>
  );
}
