/**
 * Reason Tab Content - Strava-style session tracking
 * 
 * - Card CTAs for Read and Listen (matching UI)
 * - Active session timer
 * - Reading Load dashboard
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, BookOpen, Bookmark, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import reasonReadingImg from "@/assets/reason-reading.jpg";
import reasonListeningImg from "@/assets/reason-listening.jpg";
import {
  useActiveReasonSession,
  SessionType,
} from "@/hooks/useReasonSessions";
import { useActiveBooks } from "@/hooks/useActiveBooks";
import { ReasonSessionTimer } from "./ReasonSessionTimer";
import { ReasonContentSelector } from "./ReasonContentSelector";
import { ActiveBooksView } from "./ActiveBooksView";
import { EveningReadingReminder } from "./EveningReadingReminder";
import { ContinueReadingSheet } from "./ContinueReadingSheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ReasonTabContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSelector, setShowSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<SessionType>("reading");
  const [showBooks, setShowBooks] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const { data: activeSession } = useActiveReasonSession();
  const { data: activeBooks = [] } = useActiveBooks();

  // Auto-open Read or Listen flow when navigated with ?open=reading|listening
  useEffect(() => {
    const open = searchParams.get("open");
    if (open === "reading") {
      setShowBooks(true);
    } else if (open === "listening") {
      setSelectorMode("listening");
      setShowSelector(true);
    }
    if (open) {
      // Clean the param so it doesn't re-trigger
      const next = new URLSearchParams(searchParams);
      next.delete("open");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // If there's an active session, show the timer
  if (activeSession) {
    return (
      <ReasonSessionTimer
        session={activeSession}
        onComplete={() => {}}
        onAbort={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* XP Explanation — collapsed, expands on info tap */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">
        <p className="flex-1 text-[11px] text-muted-foreground leading-snug">
          No XP — boosts <span className="font-medium text-foreground">Reasoning Quality</span> via cognitive priming.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="How Quality Time affects RQ"
              className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-72 text-[11px] leading-relaxed text-muted-foreground"
          >
            <p className="font-medium text-foreground mb-1.5">Why no XP?</p>
            <p>
              Quality Time sessions don't award XP — they improve your{" "}
              <span className="font-medium text-foreground">Reasoning Quality (RQ)</span>{" "}
              through cognitive priming. Track reading and listening time for a weighted RQ contribution.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick access: Continue Reading */}
      <div className="flex items-center justify-end -mb-2">
        <button
          onClick={() => setShowContinue(true)}
          className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border border-border/40 bg-muted/20 hover:bg-muted/30 hover:border-border/60 text-foreground/80 text-[10px] font-medium uppercase tracking-[0.14em] transition-all"
        >
          <Bookmark className="w-3 h-3 text-amber-400" />
          Continue Reading
        </button>
      </div>

      {/* Session Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Read Card */}
        <button
          onClick={() => setShowBooks(true)}
          className="w-full group relative flex flex-col items-center justify-end gap-2 p-4 pt-20 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all overflow-hidden"
        >
          <img
            src={reasonReadingImg}
            alt="Reading"
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Active books indicator on card */}
          {activeBooks.length > 0 && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-amber-500/30">
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-300">
                {activeBooks.length} in progress
              </span>
            </div>
          )}

          <div className="relative z-10 text-center">
            <p className="font-semibold text-sm text-white">Read</p>
            <p className="text-[10px] text-white/70">Books, articles, deep reading</p>
          </div>
          <div className="relative z-10 flex items-center gap-1 text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-3 h-3" />
            <span>Open</span>
          </div>
        </button>

        {/* Listen Card */}
        <button
          onClick={() => { setSelectorMode("listening"); setShowSelector(true); }}
          className="w-full group relative flex flex-col items-center justify-end gap-2 p-4 pt-20 rounded-2xl border border-violet-500/20 hover:border-violet-500/40 transition-all overflow-hidden"
        >
          <img
            src={reasonListeningImg}
            alt="Listening"
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 text-center">
            <p className="font-semibold text-sm text-white">Listen</p>
            <p className="text-[10px] text-white/70">Podcasts, audiobooks</p>
          </div>
          <div className="relative z-10 flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-3 h-3" />
            <span>Begin</span>
          </div>
        </button>
      </motion.div>

      {/* Active Books Dialog (opens when Read card is tapped) */}
      <Dialog open={showBooks} onOpenChange={setShowBooks}>
        <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Reading</DialogTitle>
            <DialogDescription>
              Manage your active books, start a timer, or log reading time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ActiveBooksView />
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Selector Dialog (for listening) */}
      <ReasonContentSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        onSessionStarted={() => setShowSelector(false)}
        initialSessionType={selectorMode}
      />

      {/* Evening reading reminder */}
      <EveningReadingReminder />

      {/* Continue Reading bottom sheet (Pro/Elite gated) */}
      <ContinueReadingSheet open={showContinue} onOpenChange={setShowContinue} />
    </div>
  );
}
