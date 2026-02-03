/**
 * Reason Tab Content - Strava-style session tracking
 * 
 * Replaces the old SpotifyTasksView with:
 * - Start Session CTA (reading/listening)
 * - Active session timer
 * - Reading Load dashboard
 * - Legacy LOOMA Library access
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play,
  Library,
  ChevronRight
} from "lucide-react";
import reasonReadingImg from "@/assets/reason-reading.jpg";
import reasonListeningImg from "@/assets/reason-listening.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  useActiveReasonSession,
  SessionType,
} from "@/hooks/useReasonSessions";
import { ReasonSessionTimer } from "./ReasonSessionTimer";
import { ReasonContentSelector } from "./ReasonContentSelector";
import { ReadingLoadDashboard } from "./ReadingLoadDashboard";
import { SpotifyTasksView } from "@/components/app/SpotifyTasksView";

export function ReasonTabContent() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<SessionType>("reading");
  const [showLegacyLibrary, setShowLegacyLibrary] = useState(false);
  
  const { data: activeSession, isLoading } = useActiveReasonSession();
  
  // If there's an active session, show the timer
  if (activeSession) {
    return (
      <ReasonSessionTimer
        session={activeSession}
        onComplete={() => {}} // Will refetch and show no active session
        onAbort={() => {}}
      />
    );
  }
  
  // Show legacy library if user wants browse mode
  if (showLegacyLibrary) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowLegacyLibrary(false)}
          className="-ml-2"
        >
          ← Back to Reason
        </Button>
        <SpotifyTasksView />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* XP Explanation */}
      <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Reason sessions don't award XP</span> — they improve your{" "}
          <span className="font-medium text-foreground">Reasoning Quality (RQ)</span> through cognitive priming. 
          Track reading and listening time for weighted RQ contribution.
        </p>
      </div>
      
      {/* Start Session CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-semibold">Start a Session</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setSelectorMode("reading"); setShowSelector(true); }}
            className="group relative flex flex-col items-center justify-end gap-2 p-4 pt-24 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all overflow-hidden"
          >
            <img 
              src={reasonReadingImg} 
              alt="Reading" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 text-center">
              <p className="font-semibold text-sm text-white">Start Reading</p>
              <p className="text-[10px] text-white/70">Books, articles, papers</p>
            </div>
            <div className="relative z-10 flex items-center gap-1 text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-3 h-3" />
              <span>Begin</span>
            </div>
          </button>
          
          <button
            onClick={() => { setSelectorMode("listening"); setShowSelector(true); }}
            className="group relative flex flex-col items-center justify-end gap-2 p-4 pt-24 rounded-2xl border border-violet-500/20 hover:border-violet-500/40 transition-all overflow-hidden"
          >
            <img 
              src={reasonListeningImg} 
              alt="Listening" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 text-center">
              <p className="font-semibold text-sm text-white">Start Listening</p>
              <p className="text-[10px] text-white/70">Podcasts, audiobooks</p>
            </div>
            <div className="relative z-10 flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-3 h-3" />
              <span>Begin</span>
            </div>
          </button>
        </div>
      </motion.div>
      
      {/* Reading Load Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold mb-3">Reading Load</h3>
        <ReadingLoadDashboard />
      </motion.div>
      
      {/* Browse LOOMA Library link */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => setShowLegacyLibrary(true)}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-all group"
      >
        <div className="flex items-center gap-3">
          <Library className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="text-left">
            <p className="text-sm font-medium">Browse LOOMA Library</p>
            <p className="text-[10px] text-muted-foreground">
              Curated podcasts, books & articles with instant completion
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </motion.button>
      
      {/* Content Selector Dialog */}
      <ReasonContentSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        onSessionStarted={() => setShowSelector(false)}
        initialSessionType={selectorMode}
      />
    </div>
  );
}
