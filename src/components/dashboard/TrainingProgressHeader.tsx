import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, TrendingDown, Minus, Dumbbell, BookMarked, Smartphone, Ban, Zap, Calendar, Target, Clock } from "lucide-react";
import { useDailyTrainingStreak, useDailyTrainingHistory } from "@/hooks/useDailyTraining";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { useWeeklyTrainingTime } from "@/hooks/useWeeklyTrainingTime";
import { useAuth } from "@/contexts/AuthContext";

export const TrainingProgressHeader = () => {
  const { user } = useAuth();
  const { data: streakData } = useDailyTrainingStreak(user?.id);
  const { data: history = [] } = useDailyTrainingHistory(user?.id);
  const { totalMinutes: weeklyTrainingMinutes } = useWeeklyTrainingTime();
  
  // Get capped weekly progress for macro stats
  const {
    cappedTotalXP,
    totalXPTarget,
    cappedGamesXP,
    gamesXPTarget,
    gamesBreakdown,
    totalProgress,
    recoveryMinutesTarget,
    recoveryMinutesEarned,
    contentCompletionsCount,
    isLoading: progressLoading,
  } = useCappedWeeklyProgress();

  const streak = typeof streakData === 'object' ? streakData.streak : (streakData ?? 0);

  // Calculate weekly completion (last 7 days)
  const weeklyStats = useMemo(() => {
    // Get dates from last 7 days
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }
    
    // Check which days have sessions
    const sessionDates = new Set(
      history.map(s => new Date(s.completed_at).toISOString().split('T')[0])
    );
    
    const completedDays = last7Days.filter(d => sessionDates.has(d)).length;
    const percentage = (completedDays / 7) * 100;
    
    // Calculate trend from scores
    const recentSessions = history.slice(0, 7);
    const olderSessions = history.slice(7, 14);
    
    const recentScores = recentSessions.map(s => s.score);
    const olderScores = olderSessions.map(s => s.score);
    
    let trend: "up" | "down" | "flat" = "flat";
    let trendValue = 0;
    
    if (recentScores.length >= 2 && olderScores.length >= 2) {
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
      trendValue = Math.round(recentAvg - olderAvg);
      trend = trendValue > 2 ? "up" : trendValue < -2 ? "down" : "flat";
    }
    
    return { completedDays, percentage, trend, trendValue };
  }, [history]);

  // Get motivational message
  const motivationalMessage = useMemo(() => {
    if (streak >= 7) return "🔥 Perfect week! Keep it up";
    if (streak >= 3) return "🚀 Great rhythm! Consistency pays off";
    if (weeklyStats.trend === "up") return `📈 You're improving! +${weeklyStats.trendValue}% this week`;
    if (weeklyStats.completedDays === 0) return "🎯 Start your cognitive journey";
    return "💪 Every session counts. Keep training";
  }, [streak, weeklyStats]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (totalProgress / 100) * circumference;
  
  // Total games sessions this week
  const gamesSessionsCount = gamesBreakdown?.completionsCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 rounded-2xl bg-card/60 border border-border/40"
    >
      {/* Main content row */}
      <div className="flex items-center gap-4">
        {/* Progress Ring - Compact */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--muted)/0.3)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-foreground">{Math.round(totalProgress)}%</span>
          </div>
        </div>

        {/* Stats Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground">Weekly Progress</h3>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] font-medium text-orange-400">{streak}d</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-medium text-foreground">{cappedTotalXP}</span>
              <span className="text-[10px] text-muted-foreground">/ {totalXPTarget} XP</span>
            </div>
            
            <div className="flex items-center gap-1">
              {weeklyStats.trend === "up" ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : weeklyStats.trend === "down" ? (
                <TrendingDown className="w-3 h-3 text-red-400" />
              ) : (
                <Minus className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground">{motivationalMessage}</p>
        </div>
      </div>
      
      {/* Activity Summary - Clean 3-column grid */}
      <div className="mt-4 pt-3 border-t border-border/20">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Dumbbell className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">{cappedGamesXP}</p>
            <p className="text-[8px] text-muted-foreground">/{gamesXPTarget} XP</p>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Smartphone className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">{recoveryMinutesEarned}m</p>
            <p className="text-[8px] text-muted-foreground">/{recoveryMinutesTarget}m Recovery</p>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-muted/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BookMarked className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">{contentCompletionsCount}</p>
            <p className="text-[8px] text-muted-foreground">Tasks done</p>
          </div>
        </div>
        
        {/* Quick stats row - cleaner */}
        <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{weeklyTrainingMinutes >= 60 ? `${Math.floor(weeklyTrainingMinutes / 60)}h ${Math.round(weeklyTrainingMinutes % 60)}m` : `${Math.round(weeklyTrainingMinutes)}m`}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{weeklyStats.completedDays}/7 days</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>{gamesSessionsCount} games</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
