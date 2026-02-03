/**
 * Reading Load Dashboard
 * 
 * Shows reading/listening analytics:
 * - Today's stats with weight classification
 * - Weekly trends
 * - Session type breakdown
 */

import { motion } from "framer-motion";
import { 
  BookOpen, 
  Headphones, 
  TrendingUp, 
  Clock,
  Zap,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReasonSessionStats, useReasonSessions } from "@/hooks/useReasonSessions";

interface ReadingLoadDashboardProps {
  className?: string;
}

function getLoadClassification(weightedMinutes: number): {
  label: string;
  description: string;
  color: string;
} {
  if (weightedMinutes === 0) {
    return {
      label: "No activity",
      description: "Start a session to build RQ",
      color: "text-muted-foreground",
    };
  }
  if (weightedMinutes < 20) {
    return {
      label: "Light touch",
      description: "Brief engagement",
      color: "text-slate-400",
    };
  }
  if (weightedMinutes < 40) {
    return {
      label: "Moderate focus",
      description: "Solid priming session",
      color: "text-emerald-500",
    };
  }
  if (weightedMinutes < 60) {
    return {
      label: "Deep work",
      description: "Substantial reasoning boost",
      color: "text-primary",
    };
  }
  return {
    label: "Intensive",
    description: "Maximum cognitive priming",
    color: "text-violet-500",
  };
}

export function ReadingLoadDashboard({ className }: ReadingLoadDashboardProps) {
  const { data: stats, isLoading } = useReasonSessionStats();
  const { data: recentSessions } = useReasonSessions(7);
  
  if (isLoading || !stats) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-24 bg-muted/30 rounded-xl" />
        <div className="h-16 bg-muted/30 rounded-xl" />
      </div>
    );
  }
  
  const todayClassification = getLoadClassification(stats.today.weightedMinutes);
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Today's Reading Load */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-card border border-border/50"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Today's Load
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {Math.round(stats.today.weightedMinutes)}
              </span>
              <span className="text-sm text-muted-foreground">
                weighted min
              </span>
            </div>
          </div>
          <div className={cn("text-right", todayClassification.color)}>
            <p className="text-sm font-semibold">{todayClassification.label}</p>
            <p className="text-[10px] opacity-80">{todayClassification.description}</p>
          </div>
        </div>
        
        {/* Raw vs Weighted comparison */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{Math.round(stats.today.totalMinutes)} min actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>{stats.avgWeight.toFixed(1)}× avg weight</span>
          </div>
        </div>
      </motion.div>
      
      {/* Week Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Weekly total */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">This Week</span>
          </div>
          <p className="text-xl font-bold">{Math.round(stats.week.weightedMinutes)}</p>
          <p className="text-[10px] text-muted-foreground">
            weighted min • {stats.week.sessions} sessions
          </p>
        </div>
        
        {/* Valid for RQ */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Valid for RQ</span>
          </div>
          <p className="text-xl font-bold">{stats.validForRQ}</p>
          <p className="text-[10px] text-muted-foreground">
            sessions ≥5 min
          </p>
        </div>
      </motion.div>
      
      {/* Type breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3"
      >
        <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reading</p>
            <p className="text-sm font-semibold">
              {Math.round(stats.byType.reading.minutes)} min
            </p>
          </div>
        </div>
        
        <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Listening</p>
            <p className="text-sm font-semibold">
              {Math.round(stats.byType.listening.minutes)} min
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Recent sessions preview */}
      {recentSessions && recentSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-2"
        >
          <p className="text-xs text-muted-foreground mb-2">Recent Sessions</p>
          <div className="space-y-2">
            {recentSessions.slice(0, 3).map((session) => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/10"
              >
                <div className="flex items-center gap-2">
                  {session.session_type === "reading" ? (
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Headphones className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className="text-xs truncate max-w-[140px]">
                    {session.source === "looma_list" 
                      ? session.item_id 
                      : session.custom_title || "Custom"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{Math.round(session.duration_seconds / 60)} min</span>
                  <span className="text-primary font-medium">
                    {session.weight.toFixed(1)}×
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
