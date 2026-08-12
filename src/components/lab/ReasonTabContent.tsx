/**
 * Reason Tab Content - Strava-style session tracking
 * 
 * - Card CTAs for Read and Listen (matching UI)
 * - Active session timer
 * - Reading Load dashboard
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Bookmark, ChevronRight, Headphones } from "lucide-react";
import {
  useActiveReasonSession,
  SessionType,
  LOOMA_ITEM_WEIGHTS,
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

function QualityModeVisual({ type }: { type: SessionType }) {
  const reduceMotion = useReducedMotion();
  const isReading = type === "reading";

  if (isReading) {
    return (
      <div className="relative flex h-12 w-16 flex-col justify-center gap-1.5" aria-hidden="true">
        {[78, 100, 86, 62].map((width, index) => (
          <motion.span
            key={width}
            className="block h-px origin-left bg-gradient-to-r from-white/70 to-white/[0.08]"
            style={{ width: `${width}%` }}
            animate={reduceMotion ? undefined : { opacity: [0.28, 0.9, 0.28], scaleX: [0.86, 1, 0.86] }}
            transition={reduceMotion ? undefined : { duration: 3.8, repeat: Infinity, delay: index * 0.38, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute -left-2 inset-y-1 w-px bg-white/35" />
      </div>
    );
  }

  const bars = [14, 25, 38, 22, 34, 18, 28];
  return (
    <div className="flex h-12 items-center gap-1" aria-hidden="true">
      {bars.map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          className="w-1 rounded-full bg-gradient-to-t from-white/[0.14] to-white/75"
          style={{ height }}
          animate={reduceMotion ? undefined : { scaleY: [0.68, 1.08, 0.68], opacity: [0.35, 0.95, 0.35] }}
          transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

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
    <div className="space-y-4">
      {/* Session Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Read Card */}
        <button
          onClick={() => setShowBooks(true)}
          className="group relative h-[168px] w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/90 to-card/55 p-4 text-left transition-all hover:border-border/75 hover:from-card hover:to-card/70"
        >
          <div className="absolute inset-x-0 top-0 h-[94px] bg-[radial-gradient(circle_at_32%_35%,rgba(255,255,255,0.07),transparent_62%)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex h-4 shrink-0 items-start justify-between">
              <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-foreground/60">Read</span>
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-foreground/55" strokeWidth={1.4} />
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <QualityModeVisual type="reading" />
            </div>
            <div className="h-[52px] shrink-0 border-t border-border/35 pt-2.5">
              <p className="truncate whitespace-nowrap text-[12px] font-semibold leading-none tracking-tight text-foreground">Deep reading</p>
              <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                <p className="min-w-0 truncate whitespace-nowrap text-[9px] leading-none text-foreground/50">
                  {activeBooks.length > 0 ? `${activeBooks.length} in progress` : "Books · articles"}
                </p>
                <span className="shrink-0 text-[10px] font-semibold leading-none tabular-nums text-foreground/75">
                  {LOOMA_ITEM_WEIGHTS.book.toFixed(1)}× <span className="text-[8px] tracking-[0.1em] text-foreground/35">RQ</span>
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Listen Card */}
        <button
          onClick={() => { setSelectorMode("listening"); setShowSelector(true); }}
          className="group relative h-[168px] w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/90 to-card/55 p-4 text-left transition-all hover:border-border/75 hover:from-card hover:to-card/70"
        >
          <div className="absolute inset-x-0 top-0 h-[94px] bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.055),transparent_62%)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex h-4 shrink-0 items-start justify-between">
              <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-foreground/60">Listen</span>
              <Headphones className="h-3.5 w-3.5 shrink-0 text-foreground/55" strokeWidth={1.4} />
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <QualityModeVisual type="listening" />
            </div>
            <div className="h-[52px] shrink-0 border-t border-border/35 pt-2.5">
              <p className="truncate whitespace-nowrap text-[12px] font-semibold leading-none tracking-tight text-foreground">Focused listening</p>
              <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                <p className="min-w-0 truncate whitespace-nowrap text-[9px] leading-none text-foreground/50">Podcasts · audiobooks</p>
                <span className="shrink-0 text-[10px] font-semibold leading-none tabular-nums text-foreground/75">
                  {LOOMA_ITEM_WEIGHTS.podcast.toFixed(1)}× <span className="text-[8px] tracking-[0.1em] text-foreground/35">RQ</span>
                </span>
              </div>
            </div>
          </div>
        </button>
      </motion.div>

      {activeBooks.length > 0 && (
        <button
          onClick={() => setShowContinue(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card/40 px-4 py-3 text-left transition-colors hover:border-border/60 hover:bg-card/60"
        >
          <Bookmark className="h-3.5 w-3.5 text-foreground/55" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-foreground/85">Continue reading</p>
            <p className="truncate text-[9px] text-muted-foreground/55">
              {activeBooks.length === 1 ? activeBooks[0].title : `${activeBooks.length} active books`}
            </p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" />
        </button>
      )}

      {/* Active Books Dialog (opens when Read card is tapped) */}
      <Dialog open={showBooks} onOpenChange={setShowBooks}>
        <DialogContent className="flex max-h-[88dvh] w-[calc(100%_-_20px)] max-w-sm flex-col gap-0 overflow-hidden rounded-[24px] border-border/50 bg-card p-0 shadow-[0_30px_100px_rgba(0,0,0,0.72)]">
          <DialogHeader className="border-b border-border/40 px-5 pb-4 pt-5 pr-11 text-left">
            <DialogTitle className="text-[17px]">Reading</DialogTitle>
            <DialogDescription className="text-[11px] leading-relaxed text-muted-foreground/65">
              Manage your active books, start a timer, or log reading time.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
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
