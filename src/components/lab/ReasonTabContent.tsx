/**
 * Reason Tab Content - Strava-style session tracking
 * 
 * - Start Session CTA (reading/listening)
 * - Active session timer
 * - Reading Load dashboard
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import reasonReadingImg from "@/assets/reason-reading.jpg";
import reasonListeningImg from "@/assets/reason-listening.jpg";
import {
  useActiveReasonSession,
  SessionType } from
"@/hooks/useReasonSessions";
import { ReasonSessionTimer } from "./ReasonSessionTimer";
import { ReasonContentSelector } from "./ReasonContentSelector";
import { ActiveBooksView } from "./ActiveBooksView";
import { EveningReadingReminder } from "./EveningReadingReminder";


export function ReasonTabContent() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<SessionType>("reading");

  const { data: activeSession, isLoading } = useActiveReasonSession();

  // If there's an active session, show the timer
  if (activeSession) {
    return (
      <ReasonSessionTimer
        session={activeSession}
        onComplete={() => {}}
        onAbort={() => {}} />);
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

      {/* Active Books Section */}
      <ActiveBooksView />

      {/* Divider */}
      <div className="border-t border-border/30" />
      
      {/* Start Listening Session CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3">

        <h3 className="text-sm font-semibold">Start Listening</h3>
        
        <button
          onClick={() => {setSelectorMode("listening");setShowSelector(true);}}
          className="w-full group relative flex flex-col items-center justify-end gap-2 p-4 pt-20 rounded-2xl border border-violet-500/20 hover:border-violet-500/40 transition-all overflow-hidden">

          <img
            src={reasonListeningImg}
            alt="Listening"
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300" />

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
      
      {/* Content Selector Dialog (for listening) */}
      <ReasonContentSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        onSessionStarted={() => setShowSelector(false)}
        initialSessionType={selectorMode} />

      {/* Evening reading reminder */}
      <EveningReadingReminder />
    </div>);

}