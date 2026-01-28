import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { RechargingIntro } from "@/components/recharging/RechargingIntro";
import { RechargingCheck } from "@/components/recharging/RechargingCheck";
import { RechargingModeSelect } from "@/components/recharging/RechargingModeSelect";
import { RechargingSession } from "@/components/recharging/RechargingSession";
import { RechargingResults } from "@/components/recharging/RechargingResults";
import {
  RechargingCheckValues,
  RechargingMode,
  RechargingResult,
  suggestRechargingMode,
  calculateRechargingScore,
} from "@/lib/recharging";
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

type Phase = 
  | "intro" 
  | "pre-check" 
  | "mode-select" 
  | "session" 
  | "post-check" 
  | "results";

/**
 * Recharging Runner
 * 
 * A session-based cognitive reset to restore reasoning clarity.
 * Flow: Intro → Pre-check → Mode selection → Session → Post-check → Results
 * 
 * This does NOT affect long-term metrics or Recovery.
 * It provides a temporary cognitive boost measured by pre/post comparison.
 */
export default function RechargingRunner() {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState<Phase>("intro");
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  // Session data
  const [preCheckValues, setPreCheckValues] = useState<RechargingCheckValues | null>(null);
  const [selectedMode, setSelectedMode] = useState<RechargingMode | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [result, setResult] = useState<RechargingResult | null>(null);
  
  const startTimeRef = useRef<number | null>(null);

  const handleExitClick = useCallback(() => {
    if (currentPhase === "intro" || currentPhase === "results") {
      navigate("/neuro-lab");
    } else {
      setShowExitDialog(true);
    }
  }, [currentPhase, navigate]);

  const handleConfirmExit = useCallback(() => {
    navigate("/neuro-lab");
  }, [navigate]);

  // Phase handlers
  const handleBegin = useCallback(() => {
    setCurrentPhase("pre-check");
  }, []);

  const handlePreCheckComplete = useCallback((values: RechargingCheckValues) => {
    setPreCheckValues(values);
    setCurrentPhase("mode-select");
  }, []);

  const handleModeSelect = useCallback((mode: RechargingMode) => {
    setSelectedMode(mode);
    startTimeRef.current = Date.now();
    setCurrentPhase("session");
  }, []);

  const handleSessionComplete = useCallback((durationSeconds: number) => {
    setSessionDuration(durationSeconds);
    setCurrentPhase("post-check");
  }, []);

  const handlePostCheckComplete = useCallback((postCheckValues: RechargingCheckValues) => {
    if (!preCheckValues || !selectedMode) return;

    const { score, level, deltas } = calculateRechargingScore(preCheckValues, postCheckValues);
    
    setResult({
      preCheck: preCheckValues,
      postCheck: postCheckValues,
      mode: selectedMode,
      durationSeconds: sessionDuration,
      score,
      level,
      deltas,
    });
    
    setCurrentPhase("results");
  }, [preCheckValues, selectedMode, sessionDuration]);

  const handleFinish = useCallback(() => {
    navigate("/neuro-lab");
  }, [navigate]);

  const renderPhase = () => {
    switch (currentPhase) {
      case "intro":
        return <RechargingIntro onBegin={handleBegin} />;
      case "pre-check":
        return <RechargingCheck type="pre" onComplete={handlePreCheckComplete} />;
      case "mode-select":
        return (
          <RechargingModeSelect
            suggestedMode={preCheckValues ? suggestRechargingMode(preCheckValues) : "overloaded"}
            onSelect={handleModeSelect}
          />
        );
      case "session":
        return (
          <RechargingSession
            mode={selectedMode || "overloaded"}
            onComplete={handleSessionComplete}
          />
        );
      case "post-check":
        return (
          <RechargingCheck
            type="post"
            initialValues={preCheckValues || undefined}
            onComplete={handlePostCheckComplete}
          />
        );
      case "results":
        return result ? (
          <RechargingResults result={result} onFinish={handleFinish} />
        ) : null;
      default:
        return null;
    }
  };

  const isSessionActive = currentPhase === "session";

  return (
    <div className="min-h-screen bg-[#06070A] relative">
      {/* Exit Button - hidden during active session for focus */}
      {!isSessionActive && (
        <button
          onClick={handleExitClick}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Exit"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      )}

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
              Your progress will be lost. Are you sure you want to exit the Recharging session?
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
