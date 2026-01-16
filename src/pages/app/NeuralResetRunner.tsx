import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity } from "lucide-react";
import { RhythmicBreathingPhase } from "@/components/neural-reset/phases/RhythmicBreathingPhase";
import { AttentionAnchorPhase } from "@/components/neural-reset/phases/AttentionAnchorPhase";
import { OpenAwarenessPhase } from "@/components/neural-reset/phases/OpenAwarenessPhase";
import { useCompleteNeuralReset } from "@/hooks/useNeuralReset";
import { getNeuralResetPhases, NEURAL_RESET_CONFIG } from "@/lib/neuralReset";
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

type Phase = "intro" | "breathing" | "anchoring" | "awareness" | "complete";

/**
 * Neural Reset Runner
 * 
 * A short session (3-5 min) to stabilize cognitive activity.
 * Does NOT award XP, does NOT increase skills.
 * ONLY contributes to Consolidation (Recovery).
 * 
 * Phases:
 * 1. Rhythmic Breathing - Regulation (not relaxation)
 * 2. Attention Anchoring - Neutral focal point
 * 3. Open Awareness - Observation without reaction
 */
export default function NeuralResetRunner() {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState<Phase>("intro");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  
  const { mutate: completeSession } = useCompleteNeuralReset();
  
  const phases = getNeuralResetPhases(NEURAL_RESET_CONFIG.defaultDuration);
  
  const handleExitClick = useCallback(() => {
    if (currentPhase === "intro" || currentPhase === "complete") {
      navigate("/app");
    } else {
      setShowExitDialog(true);
    }
  }, [currentPhase, navigate]);
  
  const handleConfirmExit = useCallback(() => {
    navigate("/app");
  }, [navigate]);
  
  const handleBegin = useCallback(() => {
    startTimeRef.current = Date.now();
    setCurrentPhase("breathing");
  }, []);
  
  const handleBreathingComplete = useCallback(() => {
    setCurrentPhase("anchoring");
  }, []);
  
  const handleAnchoringComplete = useCallback(() => {
    setCurrentPhase("awareness");
  }, []);
  
  const handleAwarenessComplete = useCallback(() => {
    // Calculate actual duration
    const durationSeconds = startTimeRef.current 
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : NEURAL_RESET_CONFIG.defaultDuration;
    
    // Record completion (contributes to Recovery)
    completeSession(durationSeconds);
    
    setCurrentPhase("complete");
  }, [completeSession]);
  
  const handleFinish = useCallback(() => {
    navigate("/app");
  }, [navigate]);
  
  const renderPhase = () => {
    switch (currentPhase) {
      case "intro":
        return <IntroScreen onBegin={handleBegin} />;
      case "breathing":
        return <RhythmicBreathingPhase duration={phases.breathing} onComplete={handleBreathingComplete} />;
      case "anchoring":
        return <AttentionAnchorPhase duration={phases.anchoring} onComplete={handleAnchoringComplete} />;
      case "awareness":
        return <OpenAwarenessPhase duration={phases.awareness} onComplete={handleAwarenessComplete} />;
      case "complete":
        return <CompletionScreen onFinish={handleFinish} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-[#06070A] relative">
      {/* Exit Button */}
      <button
        onClick={handleExitClick}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        aria-label="Exit"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderPhase()}
        </motion.div>
      </AnimatePresence>
      
      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-[#0E1014] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Exit Session?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Your progress will be lost. Are you sure you want to exit the Neural Reset session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Continue
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmExit}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/20"
            >
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Intro Screen Component
function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-[#06070A]">
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
          <Activity className="w-8 h-8 text-white/60" />
        </div>
        
        {/* Title */}
        <motion.h1 
          className="text-2xl font-semibold tracking-tight text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Neural Reset
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          className="text-sm text-white/50 leading-relaxed mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          A short session to stabilize cognitive activity.
        </motion.p>
        
        {/* Duration indicator */}
        <motion.div 
          className="flex items-center gap-2 text-xs text-white/40 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="px-2 py-1 rounded bg-white/5 text-white/60 font-medium">4 MIN</span>
          <span>•</span>
          <span>3 Phases</span>
        </motion.div>
        
        {/* Phase overview */}
        <motion.div 
          className="flex items-center gap-3 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {["Breathing", "Anchoring", "Awareness"].map((phase, i) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{phase}</span>
            </div>
          ))}
        </motion.div>
        
        {/* Begin button */}
        <motion.button
          onClick={onBegin}
          className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/15 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.98 }}
        >
          Begin Reset
        </motion.button>
        
        {/* Footer note */}
        <motion.p
          className="mt-6 text-[10px] text-white/20 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Cognitive Regulation
        </motion.p>
      </motion.div>
    </div>
  );
}

// Completion Screen Component
function CompletionScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[#06070A]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        {/* Success indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-6"
        >
          <div className="w-4 h-4 rounded-full bg-white/60" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl font-semibold text-white mb-2"
        >
          Activity stabilized.
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-white/40 mb-8"
        >
          Contributed to recovery. No XP awarded.
        </motion.p>
        
        <motion.button
          onClick={onFinish}
          className="px-8 py-3 rounded-xl bg-white/10 text-white font-medium text-sm border border-white/10 hover:bg-white/15 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
        >
          Done
        </motion.button>
      </motion.div>
    </div>
  );
}
