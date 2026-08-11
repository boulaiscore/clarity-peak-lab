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
import { BookOpen, Bookmark, ChevronRight, Headphones, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
      {/* XP Explanation — collapsed, expands on info tap */}
      <div className="flex items-center gap-2 border-b border-white/[0.055] px-0.5 pb-3">
        <p className="flex-1 text-[10px] leading-snug text-muted-foreground/70">
          Reading and listening build <span className="font-medium text-foreground/90">Reasoning Quality</span> through focused time.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="How Quality Time affects RQ"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/55 transition-colors hover:bg-white/[0.05] hover:text-foreground"
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

      {/* Session Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Read Card */}
        <button
          onClick={() => setShowBooks(true)}
          className="group relative min-h-[168px] w-full overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#0b0d10] p-4 text-left transition-all hover:border-white/[0.2]"
        >
          <div className="absolute inset-x-0 top-0 h-[94px] bg-[radial-gradient(circle_at_32%_35%,rgba(255,255,255,0.07),transparent_62%)]" />
          <div className="relative flex items-start justify-between">
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/60">Read</span>
            <BookOpen className="h-3.5 w-3.5 text-white/55" strokeWidth={1.4} />
          </div>
          <div className="relative mt-1 flex h-[68px] items-center justify-center">
            <QualityModeVisual type="reading" />
          </div>
          <div className="relative border-t border-white/[0.055] pt-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-white">Deep reading</p>
                <p className="mt-0.5 text-[9px] text-white/50">
                  {activeBooks.length > 0 ? `${activeBooks.length} in progress` : "Books · articles"}
                </p>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-white/75">
                {LOOMA_ITEM_WEIGHTS.book.toFixed(1)}× <span className="text-[8px] tracking-[0.1em] text-white/35">RQ</span>
              </span>
            </div>
          </div>
        </button>

        {/* Listen Card */}
        <button
          onClick={() => { setSelectorMode("listening"); setShowSelector(true); }}
          className="group relative min-h-[168px] w-full overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#0b0d10] p-4 text-left transition-all hover:border-white/[0.2]"
        >
          <div className="absolute inset-x-0 top-0 h-[94px] bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.055),transparent_62%)]" />
          <div className="relative flex items-start justify-between">
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/60">Listen</span>
            <Headphones className="h-3.5 w-3.5 text-white/55" strokeWidth={1.4} />
          </div>
          <div className="relative mt-1 flex h-[68px] items-center justify-center">
            <QualityModeVisual type="listening" />
          </div>
          <div className="relative border-t border-white/[0.055] pt-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-white">Focused listening</p>
                <p className="mt-0.5 text-[9px] text-white/50">Podcasts · audiobooks</p>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-white/75">
                {LOOMA_ITEM_WEIGHTS.podcast.toFixed(1)}× <span className="text-[8px] tracking-[0.1em] text-white/35">RQ</span>
              </span>
            </div>
          </div>
        </button>
      </motion.div>

      {activeBooks.length > 0 && (
        <button
          onClick={() => setShowContinue(true)}
          className="flex w-full items-center gap-3 rounded-[14px] border border-white/[0.055] bg-white/[0.018] px-4 py-3 text-left transition-colors hover:bg-white/[0.035]"
        >
          <Bookmark className="h-3.5 w-3.5 text-white/55" strokeWidth={1.5} />
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
        <DialogContent className="flex max-h-[88dvh] w-[calc(100%_-_20px)] max-w-sm flex-col gap-0 overflow-hidden rounded-[24px] border-white/[0.08] bg-[#0b0d10] p-0 shadow-[0_30px_100px_rgba(0,0,0,0.72)]">
          <DialogHeader className="border-b border-white/[0.06] px-5 pb-4 pt-5 pr-11 text-left">
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
