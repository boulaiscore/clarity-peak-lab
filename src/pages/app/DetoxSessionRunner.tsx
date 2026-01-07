import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Sparkles, AlertTriangle } from "lucide-react";
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
import { ParticleWave } from "@/components/detox/ParticleWave";
import { DetoxWaveform } from "@/components/detox/DetoxWaveform";
import { HoldToCompleteButton } from "@/components/detox/HoldToCompleteButton";
import { useDetoxSession } from "@/hooks/useDetoxSession";
import { DETOX_COGNITIVE_MESSAGES } from "@/lib/cognitiveFeedback";

export default function DetoxSessionRunner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { duration = 60, blockedApps = [] } = (location.state as { duration?: number; blockedApps?: string[] }) || {};
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    activeSession,
    isActive,
    startSession,
    completeSession,
    cancelSession,
    violationCount,
    timerResetAt,
  } = useDetoxSession();

  // Start session on mount if not already active
  useEffect(() => {
    const initSession = async () => {
      if (!isActive && !sessionStarted) {
        setSessionStarted(true);
        const success = await startSession(duration, blockedApps);
        if (!success) {
          navigate("/neuro-lab");
        }
      }
    };
    initSession();
  }, [isActive, sessionStarted, duration, blockedApps, startSession, navigate]);

  // Timer sync with session - COUNTDOWN mode
  useEffect(() => {
    if (isActive && activeSession) {
      const effectiveStart = timerResetAt
        ? timerResetAt.getTime()
        : new Date(activeSession.started_at).getTime();

      const totalDurationSeconds = duration * 60;

      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - effectiveStart) / 1000);
        const remaining = Math.max(totalDurationSeconds - elapsed, 0);
        setDisplaySeconds(remaining);
        
        // Auto-complete when countdown reaches 0
        if (remaining === 0 && !showSuccess) {
          handleComplete();
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      // Initialize with full duration before session starts
      setDisplaySeconds(duration * 60);
    }
  }, [isActive, activeSession, timerResetAt, duration, showSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExitClick = () => {
    if (isActive) {
      setShowExitDialog(true);
    } else {
      navigate("/neuro-lab");
    }
  };

  const handleConfirmExit = async () => {
    await cancelSession();
    setShowExitDialog(false);
    navigate("/neuro-lab");
  };

  const handleComplete = async () => {
    // Calculate elapsed time (duration minus remaining)
    const elapsedSeconds = duration * 60 - displaySeconds;
    const sessionMinutes = Math.floor(elapsedSeconds / 60);
    if (sessionMinutes < 30) {
      return; // Button should be disabled anyway
    }
    
    const success = await completeSession();
    if (success) {
      setShowSuccess(true);
      const completedMinutes = Math.floor((duration * 60 - displaySeconds) / 60);
      setTimeout(() => {
        navigate("/neuro-lab");
      }, 2500);
    }
  };

  // Calculate elapsed seconds for completion check
  const elapsedSeconds = duration * 60 - displaySeconds;
  const canComplete = elapsedSeconds >= 30 * 60; // 30 minutes minimum
  // Success message uses elapsed time
  const completedMinutes = Math.floor(elapsedSeconds / 60);

  return (
    <div className="min-h-screen bg-[#06070A] text-white flex flex-col">
      {/* Exit button */}
      <button
        onClick={handleExitClick}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-[#06070A] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-semibold text-teal-400 mb-2"
            >
              {DETOX_COGNITIVE_MESSAGES.completion.headline}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/60 text-center px-8"
            >
              {DETOX_COGNITIVE_MESSAGES.completion.getDescription(completedMinutes)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Header */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/40 text-sm font-medium mb-8 tracking-wide"
        >
          TRACKING YOUR FOCUS
        </motion.p>

        {/* Particle Wave Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md mb-8"
        >
          <ParticleWave />
        </motion.div>

        {/* Timer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30">
              <span className="text-xs font-medium text-teal-400">Mental Recovery</span>
            </div>
          </div>
          
          <div className="relative">
            <h1 className="text-6xl font-mono font-bold tracking-wider text-white">
              {formatTime(displaySeconds)}
            </h1>
            {/* Glow effect */}
            <div className="absolute inset-0 text-6xl font-mono font-bold tracking-wider text-teal-400/20 blur-lg -z-10">
              {formatTime(displaySeconds)}
            </div>
          </div>

          {/* Violation indicator */}
          {violationCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-4 text-amber-400"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                {violationCount} violation{violationCount === 1 ? "" : "s"} — Timer reset
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
        >
          <Brain className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-white/70">Recovering clarity</span>
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        </motion.div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm mb-12"
        >
          <DetoxWaveform />
        </motion.div>
      </div>

      {/* Bottom buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-6 pb-8 flex gap-3"
      >
        <Button
          onClick={handleExitClick}
          variant="outline"
          className="flex-1 h-14 bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
        >
          Cancel
        </Button>
        <HoldToCompleteButton
          onComplete={handleComplete}
          disabled={!canComplete}
        />
      </motion.div>

      {/* Min time hint */}
      {!canComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-white/40 text-xs pb-6"
        >
          Minimum 30 minutes to complete recovery
        </motion.p>
      )}

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-[#0A0B0F] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Your progress will be lost. Are you sure you want to cancel this detox session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Keep Going
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExit}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
            >
              Cancel Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
