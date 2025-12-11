import { useMemo } from "react";
import { Flame, Check, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyTrainingHistory, useDailyTrainingStreak } from "@/hooks/useDailyTraining";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

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
      <Card className="animate-pulse">
        <CardContent className="p-5">
          <div className="h-6 bg-muted rounded w-1/2 mb-4" />
          <div className="h-10 bg-muted rounded w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Daily Training</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>This Week</span>
          </div>
        </div>
        
        {/* Streak Counter */}
        <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-pastel-pink">
          <div className="w-12 h-12 rounded-xl bg-orange-400/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground">{streakData?.streak || 0}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {completedThisWeek}/7 days this week
            </p>
          </div>
          {(streakData?.streak || 0) > 0 && (
            <div className="ml-auto flex items-center gap-1 text-xs text-success font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Active</span>
            </div>
          )}
        </div>
        
        {/* Weekly Calendar */}
        <div className="flex justify-between gap-2 mb-4">
          {last7Days.map((day) => (
            <div 
              key={day.date}
              className="flex flex-col items-center gap-1.5"
            >
              <span className={cn(
                "text-[10px] font-medium",
                day.isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day.dayName}
              </span>
              <div 
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  day.completed 
                    ? "bg-pastel-green" 
                    : "bg-muted",
                  day.isToday && !day.completed && "ring-2 ring-primary/30"
                )}
              >
                {day.completed ? (
                  <Check className="w-5 h-5 text-success" />
                ) : day.isToday ? (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                ) : null}
              </div>
              {day.completed && (
                <span className="text-[10px] text-muted-foreground font-medium">{day.score}</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Average Score */}
        {history && history.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">30-day average</span>
            <span className="text-base font-semibold text-foreground">{averageScore} pts</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
