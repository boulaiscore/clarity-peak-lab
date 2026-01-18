import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Sparkles, AlertTriangle, MapPin, Footprints, CheckCircle2 } from "lucide-react";
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
import { useWalkingTracker, MIN_WALKING_MINUTES, NO_WALKING_XP_MULTIPLIER } from "@/hooks/useWalkingTracker";
import { DETOX_COGNITIVE_MESSAGES } from "@/lib/cognitiveFeedback";

export default function DetoxSessionRunner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { duration = 60, blockedApps = [] } = (location.state as { duration?: number; blockedApps?: string[] }) || {};
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completingRef = useRef(false); // Ref to prevent double-complete

  const {
    activeSession,
    isActive,
    startSession,
    completeSession,
    cancelSession,
    violationCount,
    timerResetAt,
  } = useDetoxSession();

  // Walking tracker
  const {
    progress: walkingProgress,
    isTracking: isWalkingTracking,
    startWalking,
    stopWalking,
    cancelWalking,
    meetsMinimum: walkingMeetsMinimum,
    permissionDenied: walkingPermissionDenied,
  } = useWalkingTracker(activeSession?.id);

  // Start session on mount if not already active
  useEffect(() => {
    const initSession = async () => {
      if (!isActive && !sessionStarted) {
        setSessionStarted(true);
        const success = await startSession(duration, blockedApps);
        if (!success) {
          navigate("/neuro-lab");
          return;
        }
        // Auto-start walking tracker
        await startWalking();
      }
    };
    initSession();
  }, [isActive, sessionStarted, duration, blockedApps, startSession, navigate, startWalking]);

  // Timer sync with session - COUNTDOWN mode
  useEffect(() => {
    if (isActive && activeSession) {
      const effectiveStart = timerResetAt
        ? timerResetAt.getTime()
        : new Date(activeSession.started_at).getTime();

      const totalDurationSeconds = duration * 60;

      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - effectiveStart) / 1000);
        // Clamp remaining to [0, totalDurationSeconds] to avoid showing more than set duration
        const remaining = Math.max(0, Math.min(totalDurationSeconds - elapsed, totalDurationSeconds));
        setDisplaySeconds(remaining);
        // Auto-complete is handled by the separate useEffect that watches canComplete
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
  }, [isActive, activeSession, timerResetAt, duration]);

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
    await cancelWalking();
    await cancelSession();
    setShowExitDialog(false);
    navigate("/neuro-lab");
  };

  const handleComplete = useCallback(async () => {
    // Prevent double-completion using ref (works across re-renders)
    if (completingRef.current) {
      console.log('[DetoxSessionRunner] Already completing, ignoring duplicate call');
      return;
    }
    completingRef.current = true;
    setIsCompleting(true);

    console.log('[DetoxSessionRunner] handleComplete called');

    // Stop walking tracker and get final progress
    const finalWalking = await stopWalking();
    
    const success = await completeSession(finalWalking?.durationMinutes || 0);
    console.log('[DetoxSessionRunner] completeSession result:', success);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/neuro-lab");
      }, 2500);
    } else {
      completingRef.current = false;
      setIsCompleting(false);
    }
  }, [stopWalking, completeSession, navigate]);

  // Calculate elapsed seconds for completion check
  const elapsedSeconds = duration * 60 - displaySeconds;
  const canComplete = elapsedSeconds >= 30 * 60; // 30 minutes minimum
  // Success message uses elapsed time
  const completedMinutes = Math.floor(elapsedSeconds / 60);

  // Auto-complete when 30 minutes is reached
  useEffect(() => {
    if (canComplete && isActive && !showSuccess && !isCompleting && !completingRef.current) {
      console.log('[DetoxSessionRunner] Auto-completing session at 30 minutes');
      handleComplete();
    }
  }, [canComplete, isActive, showSuccess, isCompleting, handleComplete]);

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
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-semibold text-primary mb-2"
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
            <div className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
              <span className="text-xs font-medium text-primary">Walk & Detox</span>
            </div>
          </div>
          
          <div className="relative">
            <h1 className="text-6xl font-mono font-bold tracking-wider text-white">
              {formatTime(displaySeconds)}
            </h1>
            {/* Glow effect */}
            <div className="absolute inset-0 text-6xl font-mono font-bold tracking-wider text-primary/20 blur-lg -z-10">
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

        {/* Status badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3 mb-8"
        >
          {/* Recovery status - main instruction */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm text-white/70">Put your phone down. Let your mind rest.</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          {/* Walking progress - only show if actually walking or completed */}
          {(walkingMeetsMinimum || (isWalkingTracking && walkingProgress.durationMinutes > 0)) && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              walkingMeetsMinimum 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <Footprints className={`w-4 h-4 ${
                walkingMeetsMinimum ? 'text-emerald-400' : 'text-amber-400'
              }`} />
              <span className={`text-sm ${
                walkingMeetsMinimum ? 'text-emerald-400' : 'text-amber-300'
              }`}>
                {walkingMeetsMinimum ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    Walking complete ({walkingProgress.durationMinutes} min)
                  </>
                ) : (
                  <>Walking: {walkingProgress.durationMinutes}/{MIN_WALKING_MINUTES} min</>
                )}
              </span>
              {isWalkingTracking && !walkingMeetsMinimum && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
          )}

          {/* Distance if tracking */}
          {isWalkingTracking && walkingProgress.distanceMeters > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <MapPin className="w-3 h-3 text-white/40" />
              <span className="text-xs text-white/50">
                Distance: {(walkingProgress.distanceMeters / 1000).toFixed(2)} km
              </span>
            </div>
          )}

          {/* Recovery message - show after 1 min if not walking */}
          {!walkingMeetsMinimum && elapsedSeconds > 60 && (
            <div className="flex flex-col gap-0.5 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <span className="text-xs font-medium text-teal-300">
                You're recovering. Good.
              </span>
              <span className="text-[11px] text-teal-400/70">
                Detox drives recovery. Add a 30-min walk to unlock full XP.
              </span>
            </div>
          )}
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

      {/* Bottom section - only show cancel before 30 min */}
      {!canComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-4 pb-6 pt-2 flex flex-col items-center gap-4"
        >
          <Button
            onClick={handleExitClick}
            variant="ghost"
            className="h-12 px-8 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-sm font-semibold"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Cancel
          </Button>
          <p className="text-white/40 text-xs">
            Minimum 30 minutes to complete session
          </p>
        </motion.div>
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
