import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, Zap, Brain, CheckCircle2, XCircle } from "lucide-react";

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

  const stats = useMemo(() => {
    if (!completions.length) return null;

    let fastCorrect = 0;
    let fastWrong = 0;
    let slowCorrect = 0;
    let slowWrong = 0;
    let totalGames = completions.length;

    completions.forEach(completion => {
      const mode = completion.thinking_mode as string;
      const score = completion.score || 0;
      
      // Score > 50 counts as correct, otherwise wrong
      const isCorrect = score >= 50;
      
      if (mode === "fast") {
        if (isCorrect) fastCorrect++;
        else fastWrong++;
      } else if (mode === "slow") {
        if (isCorrect) slowCorrect++;
        else slowWrong++;
      } else {
        // Unknown or null - split based on gym_area
        const area = completion.gym_area as string;
        const isFastArea = ["focus", "memory"].includes(area);
        if (isFastArea) {
          if (isCorrect) fastCorrect++;
          else fastWrong++;
        } else {
          if (isCorrect) slowCorrect++;
          else slowWrong++;
        }
      }
    });

    return {
      totalGames,
      fastCorrect,
      fastWrong,
      slowCorrect,
      slowWrong,
    };
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

  const fastTotal = stats.fastCorrect + stats.fastWrong;
  const slowTotal = stats.slowCorrect + stats.slowWrong;
  const fastAccuracy = fastTotal > 0 ? Math.round((stats.fastCorrect / fastTotal) * 100) : 0;
  const slowAccuracy = slowTotal > 0 ? Math.round((stats.slowCorrect / slowTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">This Week</h3>
        </div>
        <span className="text-xs text-muted-foreground">{stats.totalGames} exercises</span>
      </div>

      {/* Fast Thinking Stats */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-card/50 to-transparent border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Fast Thinking</p>
            <p className="text-[10px] text-muted-foreground">System 1 • Intuitive</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-amber-400">{fastAccuracy}%</p>
            <p className="text-[9px] text-muted-foreground uppercase">Accuracy</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">{stats.fastCorrect}</span>
            <span className="text-xs text-muted-foreground">correct</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400/70" />
            <span className="text-sm font-semibold text-red-400/70">{stats.fastWrong}</span>
            <span className="text-xs text-muted-foreground">wrong</span>
          </div>
        </div>
      </div>

      {/* Slow Thinking Stats */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-card/50 to-transparent border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Slow Thinking</p>
            <p className="text-[10px] text-muted-foreground">System 2 • Deliberate</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-cyan-400">{slowAccuracy}%</p>
            <p className="text-[9px] text-muted-foreground uppercase">Accuracy</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">{stats.slowCorrect}</span>
            <span className="text-xs text-muted-foreground">correct</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400/70" />
            <span className="text-sm font-semibold text-red-400/70">{stats.slowWrong}</span>
            <span className="text-xs text-muted-foreground">wrong</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
