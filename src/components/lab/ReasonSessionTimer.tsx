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
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
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

interface ReasonSessionTimerProps {
  session: ReasonSession;
  onComplete: () => void;
  onAbort: () => void;
}

const BACKGROUND_WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes in background

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
  const title = session.source === "looma_list" 
    ? session.item_id 
    : session.custom_title || "Custom Session";
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <button 
            onClick={() => setShowStopConfirm(true)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium capitalize">{session.session_type}</span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Session info */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-1">
              {session.source === "looma_list" ? "LOOMA Content" : "Custom"}
            </p>
            <h2 className="text-xl font-semibold line-clamp-2">{title}</h2>
            {session.custom_author && (
              <p className="text-sm text-muted-foreground mt-1">{session.custom_author}</p>
            )}
          </div>
          
          {/* Timer display */}
          <motion.div 
            className={cn(
              "text-7xl font-mono font-bold mb-4 tabular-nums",
              isPaused && "opacity-50"
            )}
            animate={{ scale: isPaused ? 0.95 : 1 }}
          >
            {formatTime(elapsedSeconds)}
          </motion.div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-3 mb-8">
            {isPaused && (
              <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                <Pause className="w-3 h-3" /> PAUSED
              </span>
            )}
            {proofLevel === "timer_only" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Reduced proof
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Weight: {session.weight.toFixed(1)}×
            </span>
          </div>
          
          {/* Control buttons */}
          <div className="flex items-center gap-4">
            {/* Pause/Resume */}
            <Button
              variant="outline"
              size="lg"
              className="w-16 h-16 rounded-full"
              onClick={handlePause}
            >
              {isPaused ? (
                <Play className="w-6 h-6 ml-0.5" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </Button>
            
            {/* Complete */}
            <Button
              size="lg"
              className="w-20 h-20 rounded-full bg-primary"
              onClick={handleComplete}
              disabled={completeSession.isPending}
            >
              <Check className="w-8 h-8" />
            </Button>
            
            {/* Stop/Cancel */}
            <Button
              variant="outline"
              size="lg"
              className="w-16 h-16 rounded-full"
              onClick={() => setShowStopConfirm(true)}
            >
              <Square className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            {elapsedSeconds < 300 
              ? `${Math.ceil((300 - elapsedSeconds) / 60)} min until this counts for RQ`
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
