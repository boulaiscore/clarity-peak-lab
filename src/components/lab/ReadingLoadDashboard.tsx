/**
 * Reading Load Dashboard — Compact premium version
 * Single card with essential metrics only
 */

import { motion } from "framer-motion";
import { BookOpen, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReasonSessionStats, useReasonSessions } from "@/hooks/useReasonSessions";

interface ReadingLoadDashboardProps {
  className?: string;
}

function getLoadClassification(weightedMinutes: number) {
  if (weightedMinutes === 0) return { label: "No activity", color: "text-muted-foreground" };
  if (weightedMinutes < 20) return { label: "Light", color: "text-muted-foreground" };
  if (weightedMinutes < 40) return { label: "Moderate", color: "text-emerald-500" };
  if (weightedMinutes < 60) return { label: "Deep", color: "text-primary" };
  return { label: "Intensive", color: "text-violet-500" };
}

export function ReadingLoadDashboard({ className }: ReadingLoadDashboardProps) {
  const { data: stats, isLoading } = useReasonSessionStats();
  const { data: recentSessions } = useReasonSessions(7);

  if (isLoading || !stats) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-20 bg-muted/30 rounded-xl" />
      </div>
    );
  }

  const today = getLoadClassification(stats.today.weightedMinutes);
  const todayMin = Math.round(stats.today.weightedMinutes);
  const weekMin = Math.round(stats.week.weightedMinutes);
  const weekSessions = stats.week.sessions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", className)}
    >
      {/* Primary stats row */}
      <div className="flex items-center gap-3">
        {/* Today */}
        <div className="flex-1 p-3 rounded-xl bg-card border border-border/40">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">Today</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums">{todayMin}</span>
            <span className="text-[10px] text-muted-foreground/40">wt min</span>
          </div>
          <p className={cn("text-[10px] font-semibold mt-0.5", today.color)}>{today.label}</p>
        </div>

        {/* This week */}
        <div className="flex-1 p-3 rounded-xl bg-card border border-border/40">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">This Week</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums">{weekMin}</span>
            <span className="text-[10px] text-muted-foreground/40">wt min</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {weekSessions} session{weekSessions !== 1 ? "s" : ""} · {stats.validForRQ} valid
          </p>
        </div>
      </div>

      {/* Recent sessions — minimal list */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="space-y-1.5">
          {recentSessions.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/10"
            >
              <div className="flex items-center gap-2 min-w-0">
                {session.session_type === "reading" ? (
                  <BookOpen className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                ) : (
                  <Headphones className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                )}
                <span className="text-[11px] text-muted-foreground truncate">
                  {session.source === "looma_list"
                    ? session.item_id
                    : session.custom_title || "Custom"}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/60 tabular-nums shrink-0 ml-2">
                {Math.round(session.duration_seconds / 60)}m · {session.weight.toFixed(1)}×
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
