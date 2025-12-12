import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useDailyTrainingStreak, useDailyTrainingHistory } from "@/hooks/useDailyTraining";
import { useAuth } from "@/contexts/AuthContext";

export const TrainingProgressHeader = () => {
  const { user } = useAuth();
  const { data: streakData } = useDailyTrainingStreak(user?.id);
  const { data: history = [] } = useDailyTrainingHistory(user?.id);

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
    if (streak >= 7) return "🔥 Una settimana perfetta! Continua così";
    if (streak >= 3) return "🚀 Ottimo ritmo! La costanza paga";
    if (weeklyStats.trend === "up") return `📈 Stai migliorando! +${weeklyStats.trendValue}% questa settimana`;
    if (weeklyStats.completedDays === 0) return "🎯 Inizia il tuo percorso cognitivo";
    return "💪 Ogni sessione conta. Continua ad allenarti";
  }, [streak, weeklyStats]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (weeklyStats.percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/30"
    >
      <div className="flex items-center gap-4">
        {/* Animated Progress Ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--muted)/0.2)"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary)/0.6)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-2xl font-bold text-foreground"
            >
              {weeklyStats.completedDays}
            </motion.span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">/7 giorni</span>
          </div>
          
          {/* Pulse glow when streak active */}
          {streak >= 3 && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/10"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>

        {/* Stats and Message */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground mb-1">
            Il tuo progresso
          </h3>
          
          {/* Streak and Trend */}
          <div className="flex items-center gap-3 mb-2">
            {streak > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-medium text-foreground">{streak}</span>
                <span className="text-[10px] text-muted-foreground">streak</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              {weeklyStats.trend === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : weeklyStats.trend === "down" ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={`text-[11px] font-medium ${
                weeklyStats.trend === "up" ? "text-emerald-400" : 
                weeklyStats.trend === "down" ? "text-red-400" : 
                "text-muted-foreground"
              }`}>
                {weeklyStats.trend === "up" ? `+${weeklyStats.trendValue}%` : 
                 weeklyStats.trend === "down" ? `${weeklyStats.trendValue}%` : 
                 "Stabile"}
              </span>
            </div>
          </div>
          
          {/* Motivational Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[11px] text-muted-foreground leading-relaxed"
          >
            {motivationalMessage}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
