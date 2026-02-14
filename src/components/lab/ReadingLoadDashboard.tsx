/**
 * Reading Load Dashboard — WHOOP "Today's Activities" style
 * Daily pills (today's minutes), weekly session count, RQ score, real timestamps
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReasonSessionStats, useReasonSessions } from "@/hooks/useReasonSessions";
import { startOfDay } from "date-fns";

interface ReadingLoadDashboardProps {
  className?: string;
}

export function ReadingLoadDashboard({ className }: ReadingLoadDashboardProps) {
  const { data: stats, isLoading } = useReasonSessionStats();
  const { data: recentSessions } = useReasonSessions(7);


  // Compute today's and weekly per-type minutes from recent sessions (real data)
  const { todayByType, weekByType } = useMemo(() => {
    const empty = { reading: 0, listening: 0, readingSessions: 0, listeningSessions: 0, readingWeighted: 0, listeningWeighted: 0 };
    if (!recentSessions) return { todayByType: empty, weekByType: { ...empty } };
    const todayStart = startOfDay(new Date());
    const today = { ...empty };
    const week = { ...empty };
    for (const s of recentSessions) {
      const min = s.duration_seconds / 60;
      const weighted = min * s.weight;
      const isReading = s.session_type === "reading";
      // Week (all recentSessions are within 7 days)
      if (isReading) {week.reading += min;week.readingSessions++;week.readingWeighted += weighted;} else
      {week.listening += min;week.listeningSessions++;week.listeningWeighted += weighted;}
      // Today
      if (new Date(s.started_at) >= todayStart) {
        if (isReading) {today.reading += min;today.readingSessions++;today.readingWeighted += weighted;} else
        {today.listening += min;today.listeningSessions++;today.listeningWeighted += weighted;}
      }
    }
    return { todayByType: today, weekByType: week };
  }, [recentSessions]);

  // Weekly session counts (from stats hook — real data)
  const weekReadingSessions = weekByType.readingSessions;
  const weekListeningSessions = weekByType.listeningSessions;

  if (isLoading || !stats) {
    return (
      <div className={cn("animate-pulse space-y-2", className)}>
        <div className="h-5 w-40 bg-muted/20 rounded" />
        <div className="h-[56px] bg-muted/20 rounded-xl" />
        <div className="h-[56px] bg-muted/20 rounded-xl" />
        <div className="h-[56px] bg-muted/20 rounded-xl" />
      </div>);

  }

  const fmtTime = (totalMin: number) => {
    const hrs = Math.floor(totalMin / 60);
    const mins = Math.round(totalMin % 60);
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  };

  const readingDisplay = fmtTime(todayByType.reading);
  const listeningDisplay = fmtTime(todayByType.listening);

  const lastReading = recentSessions?.find((s) => s.session_type === "reading");
  const lastListening = recentSessions?.find((s) => s.session_type === "listening");

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const fmtDay = (iso: string) => {
    const d = new Date(iso);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[d.getDay()];
  };



  return (
    <div className={cn("space-y-2", className)}>
      {/* Header — WHOOP style */}
      <div className="flex items-center justify-between px-1 mb-1">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/70">THIS WEEK ACTIVITIES

        </h4>
        <Maximize2 className="w-3 h-3 text-muted-foreground/40" />
      </div>

      {/* Reading row */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 rounded-xl px-2 py-2"
        style={{ background: "hsl(220 20% 13%)" }}>

        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 min-w-[76px]"
          style={{ background: "hsl(210 55% 30%)" }}>

          <BookOpen className="w-4 h-4 shrink-0" style={{ color: "hsl(210 80% 72%)" }} />
          <span className="text-[16px] font-bold tabular-nums text-white leading-none">
            {readingDisplay}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold tracking-wide text-foreground/80 block">
            READING
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {weekReadingSessions} session{weekReadingSessions !== 1 ? "s" : ""} · {Math.round(weekByType.readingWeighted)} pts this week
          </span>
        </div>

        <div className="text-right text-[11px] tabular-nums leading-[1.5] text-muted-foreground/50 font-medium shrink-0">
          {lastReading ?
          <>
              <div>
                <span className="text-muted-foreground/30">[{fmtDay(lastReading.started_at)}]</span>{" "}
                {fmt(lastReading.started_at)}
              </div>
              <div className="text-foreground/40">
                {lastReading.ended_at ? fmt(lastReading.ended_at) : "—"}
              </div>
            </> :

          <div className="text-muted-foreground/25">—</div>
          }
        </div>
      </motion.div>

      {/* Listening row */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.06 }}
        className="flex items-center gap-3 rounded-xl px-2 py-2"
        style={{ background: "hsl(220 20% 13%)" }}>

        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 min-w-[76px]"
          style={{ background: "hsl(180 40% 26%)" }}>

          <Headphones className="w-4 h-4 shrink-0" style={{ color: "hsl(180 65% 62%)" }} />
          <span className="text-[16px] font-bold tabular-nums text-white leading-none">
            {listeningDisplay}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold tracking-wide text-foreground/80 block">
            LISTENING
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {weekListeningSessions} session{weekListeningSessions !== 1 ? "s" : ""} · {Math.round(weekByType.listeningWeighted)} pts this week
          </span>
        </div>

        <div className="text-right text-[11px] tabular-nums leading-[1.5] text-muted-foreground/50 font-medium shrink-0">
          {lastListening ?
          <>
              <div>
                <span className="text-muted-foreground/30">[{fmtDay(lastListening.started_at)}]</span>{" "}
                {fmt(lastListening.started_at)}
              </div>
              <div className="text-foreground/40">
                {lastListening.ended_at ? fmt(lastListening.ended_at) : "—"}
              </div>
            </> :

          <div className="text-muted-foreground/25">—</div>
          }
        </div>
      </motion.div>

    </div>);

}