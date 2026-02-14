/**
 * Reading Load Dashboard — Activity-row style (WHOOP-inspired)
 * Compact colored pill rows for today's reading/listening activity
 */

import { motion } from "framer-motion";
import { BookOpen, Headphones, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReasonSessionStats, useReasonSessions } from "@/hooks/useReasonSessions";

interface ReadingLoadDashboardProps {
  className?: string;
}

export function ReadingLoadDashboard({ className }: ReadingLoadDashboardProps) {
  const { data: stats, isLoading } = useReasonSessionStats();
  const { data: recentSessions } = useReasonSessions(7);

  if (isLoading || !stats) {
    return (
      <div className={cn("animate-pulse space-y-2", className)}>
        <div className="h-12 bg-muted/20 rounded-xl" />
        <div className="h-12 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  const readingMin = Math.round(stats.byType.reading.minutes);
  const listeningMin = Math.round(stats.byType.listening.minutes);
  const weekTotal = Math.round(stats.week.weightedMinutes);

  // Find most recent reading & listening sessions for time display
  const lastReading = recentSessions?.find(s => s.session_type === "reading");
  const lastListening = recentSessions?.find(s => s.session_type === "listening");

  const formatSessionTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Reading row */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-2 rounded-xl bg-muted/10 border border-border/20"
      >
        {/* Colored pill with icon + value */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 min-w-[72px]">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-sm font-bold text-amber-300 tabular-nums">{readingMin}</span>
        </div>

        {/* Label */}
        <span className="text-xs font-semibold text-foreground/80 flex-1">READING</span>

        {/* Time details */}
        <div className="text-right text-[10px] text-muted-foreground/50 tabular-nums leading-tight">
          {lastReading ? (
            <>
              <div>{formatSessionTime(lastReading.started_at)}</div>
              <div>{lastReading.ended_at ? formatSessionTime(lastReading.ended_at) : "—"}</div>
            </>
          ) : (
            <div>—</div>
          )}
        </div>
      </motion.div>

      {/* Listening row */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-3 p-2 rounded-xl bg-muted/10 border border-border/20"
      >
        {/* Colored pill with icon + value */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 min-w-[72px]">
          <Headphones className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-sm font-bold text-violet-300 tabular-nums">{listeningMin}</span>
        </div>

        {/* Label */}
        <span className="text-xs font-semibold text-foreground/80 flex-1">LISTENING</span>

        {/* Time details */}
        <div className="text-right text-[10px] text-muted-foreground/50 tabular-nums leading-tight">
          {lastListening ? (
            <>
              <div>{formatSessionTime(lastListening.started_at)}</div>
              <div>{lastListening.ended_at ? formatSessionTime(lastListening.ended_at) : "—"}</div>
            </>
          ) : (
            <div>—</div>
          )}
        </div>
      </motion.div>

      {/* Week summary — subtle footer */}
      {(stats.week.sessions > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between px-1 pt-1"
        >
          <span className="text-[10px] text-muted-foreground/40">
            This week: {weekTotal} wt min · {stats.week.sessions} sessions
          </span>
        </motion.div>
      )}
    </div>
  );
}
