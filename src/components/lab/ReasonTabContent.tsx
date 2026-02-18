/**
 * Reason Tab Content - Strava-style session tracking
 * 
 * - Card CTAs for Read and Listen (matching UI)
 * - Active session timer
 * - Reading Load dashboard
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, BookOpen } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ReasonTabContent() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<SessionType>("reading");
  const [showBooks, setShowBooks] = useState(false);

  const { data: activeSession } = useActiveReasonSession();
  const { data: activeBooks = [] } = useActiveBooks();

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
      {/* XP Explanation */}
      <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Quality Time sessions don't award XP</span> — they improve your{" "}
          <span className="font-medium text-foreground">Reasoning Quality (RQ)</span> through cognitive priming.
          Track reading and listening time for weighted RQ contribution.
        </p>
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
    </div>
  );
}
