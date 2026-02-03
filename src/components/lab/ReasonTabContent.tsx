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
  BookOpen, 
  Headphones, 
  Play,
  Library,
  ChevronRight
} from "lucide-react";
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
            className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Start Reading</p>
              <p className="text-[10px] text-muted-foreground">Books, articles, papers</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-3 h-3" />
              <span>Begin</span>
            </div>
          </button>
          
          <button
            onClick={() => { setSelectorMode("listening"); setShowSelector(true); }}
            className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Headphones className="w-7 h-7 text-violet-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Start Listening</p>
              <p className="text-[10px] text-muted-foreground">Podcasts, audiobooks</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
