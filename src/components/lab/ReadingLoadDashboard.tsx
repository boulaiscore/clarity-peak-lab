/**
 * Reading Load Dashboard — WHOOP activity-row style
 * Exact match: colored pill (icon + bold value), uppercase label, right-aligned times with separator
 */

import { motion } from "framer-motion";
import { BookOpen, Headphones } from "lucide-react";
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
      <div className={cn("animate-pulse space-y-2.5", className)}>
        <div className="h-[52px] bg-muted/20 rounded-xl" />
        <div className="h-[52px] bg-muted/20 rounded-xl" />
      </div>
    );
  }

  const readingMin = Math.round(stats.byType.reading.minutes);
  const listeningMin = Math.round(stats.byType.listening.minutes);

  const lastReading = recentSessions?.find(s => s.session_type === "reading");
  const lastListening = recentSessions?.find(s => s.session_type === "listening");

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Reading row */}
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/0.12)] px-2.5 py-2"
      >
        {/* Blue-tinted pill */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "hsl(210 60% 28%)" }}>
          <BookOpen className="w-4 h-4" style={{ color: "hsl(210 80% 70%)" }} />
          <span className="text-[15px] font-bold tabular-nums text-white">{readingMin}</span>
        </div>

        {/* Label */}
        <span className="text-[13px] font-semibold tracking-wide text-foreground/80 flex-1">READING</span>

        {/* Times column */}
        <div className="text-right text-[11px] tabular-nums leading-[1.4] text-muted-foreground/50 font-medium">
          {lastReading ? (
            <>
              <div>{fmt(lastReading.started_at)}</div>
              <div>{lastReading.ended_at ? fmt(lastReading.ended_at) : "—"}</div>
            </>
          ) : (
            <div className="text-muted-foreground/30">—</div>
          )}
        </div>
      </motion.div>

      {/* Listening row */}
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.04 }}
        className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/0.12)] px-2.5 py-2"
      >
        {/* Teal-tinted pill */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "hsl(180 45% 25%)" }}>
          <Headphones className="w-4 h-4" style={{ color: "hsl(180 70% 65%)" }} />
          <span className="text-[15px] font-bold tabular-nums text-white">{listeningMin}</span>
        </div>

        {/* Label */}
        <span className="text-[13px] font-semibold tracking-wide text-foreground/80 flex-1">LISTENING</span>

        {/* Times column */}
        <div className="text-right text-[11px] tabular-nums leading-[1.4] text-muted-foreground/50 font-medium">
          {lastListening ? (
            <>
              <div>{fmt(lastListening.started_at)}</div>
              <div>{lastListening.ended_at ? fmt(lastListening.ended_at) : "—"}</div>
            </>
          ) : (
            <div className="text-muted-foreground/30">—</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
