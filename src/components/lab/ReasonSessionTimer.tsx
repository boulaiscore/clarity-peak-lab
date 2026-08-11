/**
 * Reason Session Timer - Strava-style live timer
 * 
 * Features:
 * - Live countdown/countup display
 * - Pause/Resume functionality
 * - Background detection (anti-cheat soft)
 * - Session completion flow
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  BookOpen, 
  Headphones,
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { 
  ReasonSession, 
  useCompleteReasonSession,
  useAbortReasonSession,
  ProofLevel
} from "@/hooks/useReasonSessions";
import { toast } from "sonner";
import { CONTENT_LIBRARY } from "@/lib/contentLibrary";

interface ReasonSessionTimerProps {
  session: ReasonSession;
  onComplete: () => void;
  onAbort: () => void;
}

const BACKGROUND_WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes in background
const RQ_MINIMUM_SECONDS = 5 * 60;
const TIMER_RING_RADIUS = 108;
const TIMER_RING_CIRCUMFERENCE = 2 * Math.PI * TIMER_RING_RADIUS;

export function ReasonSessionTimer({ session, onComplete, onAbort }: ReasonSessionTimerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [backgroundInterrupts, setBackgroundInterrupts] = useState(0);
  const [showBackgroundWarning, setShowBackgroundWarning] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [proofLevel, setProofLevel] = useState<ProofLevel>("timer_foreground");
  
  const lastVisibleRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);
  
  const completeSession = useCompleteReasonSession();
  const abortSession = useAbortReasonSession();
  
  // Calculate elapsed time
  useEffect(() => {
    if (isPaused) return;
    
    const startedAt = new Date(session.started_at).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = now - startedAt - totalPausedTimeRef.current;
      setElapsedSeconds(Math.floor(totalElapsed / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session.started_at, isPaused]);
  
  // Background detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background
        lastVisibleRef.current = Date.now();
      } else {
        // App came back to foreground
        const timeInBackground = Date.now() - lastVisibleRef.current;
        
        if (timeInBackground > BACKGROUND_WARNING_THRESHOLD_MS && !isPaused) {
          // User was away too long
          setBackgroundInterrupts(prev => prev + 1);
          setProofLevel("timer_only");
          setShowBackgroundWarning(true);
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPaused]);
  
  // Pause/Resume
  const handlePause = useCallback(() => {
    if (isPaused) {
      // Resuming
      if (pausedAtRef.current) {
        totalPausedTimeRef.current += Date.now() - pausedAtRef.current;
      }
      pausedAtRef.current = null;
    } else {
      // Pausing
      pausedAtRef.current = Date.now();
    }
    setIsPaused(!isPaused);
  }, [isPaused]);
  
  // Complete session
  const handleComplete = useCallback(async () => {
    const now = new Date();
    const startedAt = new Date(session.started_at);
    const durationMs = now.getTime() - startedAt.getTime() - totalPausedTimeRef.current;
    const durationSeconds = Math.floor(durationMs / 1000);
    
    try {
      await completeSession.mutateAsync({
        sessionId: session.id,
        ended_at: now.toISOString(),
        duration_seconds: durationSeconds,
        proof_level: proofLevel,
        background_interrupts: backgroundInterrupts,
        is_valid_for_rq: durationSeconds >= 5 * 60, // 5 min minimum
      });
      
      if (durationSeconds >= 5 * 60) {
        toast.success("Session completed!", {
          description: "Your Reasoning Quality will be updated.",
        });
      } else {
        toast.info("Session saved", {
          description: "Sessions under 5 min don't count for RQ.",
        });
      }
      
      onComplete();
    } catch (error) {
      toast.error("Failed to save session");
    }
  }, [session, proofLevel, backgroundInterrupts, completeSession, onComplete]);
  
  // Abort session
  const handleAbort = useCallback(async () => {
    try {
      await abortSession.mutateAsync(session.id);
      toast.info("Session cancelled");
      onAbort();
    } catch (error) {
      toast.error("Failed to cancel session");
    }
  }, [session.id, abortSession, onAbort]);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  const Icon = session.session_type === "reading" ? BookOpen : Headphones;
  const isReading = session.session_type === "reading";
  const libraryItem = session.item_id
    ? CONTENT_LIBRARY.find((item) => item.id === session.item_id)
    : null;
  const title = session.source === "looma_list"
    ? libraryItem?.title || "LOOMA selection"
    : session.custom_title || "Custom session";
  const author = session.custom_author || libraryItem?.author;
  const validityProgress = Math.min(1, elapsedSeconds / RQ_MINIMUM_SECONDS);
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-[#090b0e]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.055] px-4 py-3">
          <button 
            onClick={() => setShowStopConfirm(true)}
            className="rounded-full p-2 transition-colors hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Icon className={cn("h-3.5 w-3.5", isReading ? "text-amber-200/75" : "text-violet-200/75")} strokeWidth={1.5} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/75">{session.session_type}</span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
        
        {/* Main content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4">
          {/* Session info */}
          <div className="mb-5 max-w-xs text-center">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/45">
              {session.source === "looma_list" ? "LOOMA selection" : "Personal selection"}
            </p>
            <h2 className="line-clamp-2 text-[18px] font-semibold tracking-tight text-foreground/95">{title}</h2>
            {author && (
              <p className="mt-1 text-[11px] text-muted-foreground/60">{author}</p>
            )}
          </div>
          
          {/* Five-minute validity ring */}
          <div className="relative mb-5 h-[248px] w-[248px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 248 248" aria-hidden="true">
              <circle cx="124" cy="124" r={TIMER_RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="8" />
              <motion.circle
                cx="124"
                cy="124"
                r={TIMER_RING_RADIUS}
                fill="none"
                stroke={isReading ? "rgba(253,230,138,0.82)" : "rgba(221,214,254,0.82)"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={TIMER_RING_CIRCUMFERENCE}
                animate={{ strokeDashoffset: TIMER_RING_CIRCUMFERENCE * (1 - validityProgress) }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </svg>
            <motion.div
              className={cn("absolute inset-0 flex flex-col items-center justify-center", isPaused && "opacity-50")}
              animate={{ scale: isPaused ? 0.96 : 1 }}
            >
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/45">
                {isPaused ? "Paused" : validityProgress >= 1 ? "RQ active" : "Focused time"}
              </span>
              <span className="mt-2 font-mono text-[48px] font-semibold leading-none tabular-nums tracking-[-0.06em] text-foreground">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="mt-3 text-[9px] tabular-nums text-muted-foreground/45">
                {session.weight.toFixed(1)}× RQ weight
              </span>
            </motion.div>
          </div>
          
          {/* Status indicators */}
          <div className="mb-6 flex min-h-5 items-center gap-3">
            {isPaused && (
              <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200/75">
                <Pause className="h-3 w-3" /> Paused
              </span>
            )}
            {proofLevel === "timer_only" && (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                <AlertTriangle className="h-3 w-3" /> Reduced proof
              </span>
            )}
          </div>
          
          {/* Control buttons */}
          <div className="flex w-full max-w-[292px] items-center gap-3">
            {/* Pause/Resume */}
            <Button
              variant="subtle"
              size="lg"
              className="h-14 w-14 shrink-0 rounded-[14px] px-0"
              onClick={handlePause}
            >
              {isPaused ? (
                <Play className="ml-0.5 h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </Button>
            
            {/* Complete */}
            <Button
              size="lg"
              variant="premium"
              className="h-14 flex-1 rounded-[14px]"
              onClick={handleComplete}
              disabled={completeSession.isPending}
            >
              <Check className="h-4 w-4" />
              Finish session
            </Button>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="p-4 text-center">
          <p className="text-[10px] text-muted-foreground/50">
            {elapsedSeconds < RQ_MINIMUM_SECONDS
              ? `${Math.ceil((RQ_MINIMUM_SECONDS - elapsedSeconds) / 60)} min until this counts for RQ`
              : "✓ Valid for Reasoning Quality"
            }
          </p>
        </div>
      </motion.div>
      
      {/* Background warning dialog */}
      <AlertDialog open={showBackgroundWarning} onOpenChange={setShowBackgroundWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Still reading?</AlertDialogTitle>
            <AlertDialogDescription>
              You were away for a while. Your session continues, but proof level has been reduced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowBackgroundWarning(false)}>
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Stop confirmation dialog */}
      <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End session?</AlertDialogTitle>
            <AlertDialogDescription>
              {elapsedSeconds >= 300 
                ? "Your session will be saved and count toward Reasoning Quality."
                : "Sessions under 5 minutes don't count for RQ, but will still be saved."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleComplete}
              disabled={completeSession.isPending}
            >
              Save & Exit
            </AlertDialogAction>
            <Button 
              variant="ghost" 
              onClick={handleAbort}
              disabled={abortSession.isPending}
              className="text-destructive"
            >
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
