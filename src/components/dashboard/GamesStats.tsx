import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNeuroLabSessions } from "@/hooks/useNeuroLab";
import { Gamepad2, Target, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function GamesStats() {
  const { user } = useAuth();
  const { data: sessions = [], isLoading } = useNeuroLabSessions(user?.id);

  const stats = useMemo(() => {
    if (!sessions.length) return null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions.filter(
      s => new Date(s.completed_at) >= sevenDaysAgo
    );

    if (recentSessions.length === 0) return null;

    const avgScore = Math.round(
      recentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / recentSessions.length
    );

    const totalCorrect = recentSessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
    const totalQuestions = recentSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return {
      totalSessions: recentSessions.length,
      avgScore,
      accuracy,
    };
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
      className="p-5 rounded-xl bg-card/50 border border-border/30"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">This Week</h3>
      </div>

      {/* Stats - Simple horizontal layout */}
      <div className="flex items-center justify-around">
        {/* Sessions */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xl font-bold">{stats.totalSessions}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Games</p>
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-border/50" />

        {/* Score */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-xl font-bold">{stats.avgScore}%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Score</p>
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-border/50" />

        {/* Accuracy */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <Target className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-xl font-bold">{stats.accuracy}%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</p>
        </div>
      </div>
    </motion.div>
  );
}
