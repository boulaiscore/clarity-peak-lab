import { useMemo } from "react";
import { Flame, Check, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyTrainingHistory, useDailyTrainingStreak } from "@/hooks/useDailyTraining";
import { useAuth } from "@/contexts/AuthContext";

export function DailyTrainingHistory() {
  const { user } = useAuth();
  const { data: history, isLoading } = useDailyTrainingHistory(user?.id);
  const { data: streakData } = useDailyTrainingStreak(user?.id);
  
  // Get last 7 days with completion status
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const session = history?.find(s => 
        new Date(s.completed_at).toISOString().split('T')[0] === dateStr
      );
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: !!session,
        score: session?.score || 0,
        isToday: i === 0,
      });
    }
    
    return days;
  }, [history]);
  
  // Calculate average score
  const averageScore = useMemo(() => {
    if (!history || history.length === 0) return 0;
    const sum = history.reduce((acc, s) => acc + (s.score || 0), 0);
    return Math.round(sum / history.length);
  }, [history]);
  
  // Count completed days this week
  const completedThisWeek = last7Days.filter(d => d.completed).length;

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-card/50 border border-border/30 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/2 mb-4" />
        <div className="h-10 bg-muted/30 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card/50 border border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-foreground">Daily Training</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>This Week</span>
        </div>
      </div>
      
      {/* Streak Counter */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{streakData?.streak || 0}</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {completedThisWeek}/7 days this week
          </p>
        </div>
        {(streakData?.streak || 0) > 0 && (
          <div className="ml-auto flex items-center gap-1 text-xs text-green-400">
            <TrendingUp className="w-3 h-3" />
            <span>Active</span>
          </div>
        )}
      </div>
      
      {/* Weekly Calendar */}
      <div className="flex justify-between gap-1.5 mb-4">
        {last7Days.map((day) => (
          <div 
            key={day.date}
            className="flex flex-col items-center gap-1.5"
          >
            <span className={cn(
              "text-[9px] font-medium uppercase",
              day.isToday ? "text-primary" : "text-muted-foreground"
            )}>
              {day.dayName}
            </span>
            <div 
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                day.completed 
                  ? "bg-green-500/20 border border-green-500/30" 
                  : "bg-muted/30 border border-border/30",
                day.isToday && !day.completed && "border-primary/40"
              )}
            >
              {day.completed ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : day.isToday ? (
                <div className="w-2 h-2 rounded-full bg-primary/50" />
              ) : null}
            </div>
            {day.completed && (
              <span className="text-[9px] text-muted-foreground">{day.score}</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Average Score */}
      {history && history.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground">30-day average</span>
          <span className="text-sm font-semibold text-foreground">{averageScore} pts</span>
        </div>
      )}
    </div>
  );
}
