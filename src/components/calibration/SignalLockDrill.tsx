/**
 * Signal Lock Drill (AE - Attentional Efficiency)
 * 
 * Fast drill (~20s): 20 trials, tap only on target
 * Stimulus: 300ms, inter-trial: 450ms
 * 
 * Measures: accuracy + reaction speed
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";

interface DrillResult {
  correct: number;
  total: number;
  avgReactionMs?: number;
  sessionScore: number;
  startedAt: string;
  finishedAt: string;
}

interface SignalLockDrillProps {
  onComplete: (result: DrillResult) => void;
}

const TOTAL_TRIALS = 20;
const STIMULUS_DURATION = 800;  // Increased from 300ms to give users time to tap
const INTER_TRIAL_DELAY = 400;  // Slightly reduced for better pacing
const T_FAST = 250;
const T_SLOW = 700;

type StimulusType = "target" | "distractor";

interface Trial {
  type: StimulusType;
  shape: "circle" | "square" | "diamond";
  color: string;
}

function generateTrials(): Trial[] {
  const trials: Trial[] = [];
  const targetCount = Math.floor(TOTAL_TRIALS * 0.4); // 40% targets
  
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    const isTarget = i < targetCount;
    trials.push({
      type: isTarget ? "target" : "distractor",
      shape: isTarget ? "circle" : (["square", "diamond"][Math.floor(Math.random() * 2)] as "square" | "diamond"),
      color: isTarget ? "bg-primary" : "bg-muted-foreground/30",
    });
  }
  
  // Shuffle
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  
  return trials;
}

export function SignalLockDrill({ onComplete }: SignalLockDrillProps) {
  const [phase, setPhase] = useState<"ready" | "running" | "complete">("ready");
  const [trials] = useState<Trial[]>(() => generateTrials());
  const [currentTrial, setCurrentTrial] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  
  const startedAt = useRef<string>("");
  const trialStartTime = useRef<number>(0);
  const correctCount = useRef(0);
  const reactionTimes = useRef<number[]>([]);
  const hasResponded = useRef(false);

  const processResult = useCallback(() => {
    const finishedAt = new Date().toISOString();
    const avgReactionMs = reactionTimes.current.length > 0
      ? reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length
      : T_SLOW;
    
    // Calculate scores
    const accScore = (correctCount.current / TOTAL_TRIALS) * 100;
    const speedScore = Math.max(0, Math.min(100, 
      ((T_SLOW - avgReactionMs) / (T_SLOW - T_FAST)) * 100
    ));
    const sessionScore = Math.round(0.60 * accScore + 0.40 * speedScore);
    
    onComplete({
      correct: correctCount.current,
      total: TOTAL_TRIALS,
      avgReactionMs: Math.round(avgReactionMs),
      sessionScore,
      startedAt: startedAt.current,
      finishedAt,
    });
  }, [onComplete]);

  const nextTrial = useCallback(() => {
    if (currentTrial >= TOTAL_TRIALS - 1) {
      setPhase("complete");
      processResult();
      return;
    }
    
    setCurrentTrial(prev => prev + 1);
    setShowStimulus(false);
    setFeedback(null);
    hasResponded.current = false;
    
    // Show next stimulus after delay
    setTimeout(() => {
      setShowStimulus(true);
      trialStartTime.current = performance.now();
    }, INTER_TRIAL_DELAY);
  }, [currentTrial, processResult]);

  const handleTap = useCallback(() => {
    if (phase !== "running" || !showStimulus || hasResponded.current) return;
    
    hasResponded.current = true;
    const reactionTime = performance.now() - trialStartTime.current;
    const trial = trials[currentTrial];
    
    if (trial.type === "target") {
      correctCount.current++;
      reactionTimes.current.push(reactionTime);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
    
    setTimeout(nextTrial, 200);
  }, [phase, showStimulus, trials, currentTrial, nextTrial]);

  // Handle missed targets
  useEffect(() => {
    if (phase !== "running" || !showStimulus) return;
    
    const timer = setTimeout(() => {
      if (!hasResponded.current) {
        // Missed - if it was a target, don't count as correct
        const trial = trials[currentTrial];
        if (trial.type !== "target") {
          // Correctly ignored distractor
          correctCount.current++;
        }
        nextTrial();
      }
    }, STIMULUS_DURATION);
    
    return () => clearTimeout(timer);
  }, [phase, showStimulus, currentTrial, trials, nextTrial]);

  // Start drill
  const handleStart = () => {
    startedAt.current = new Date().toISOString();
    setPhase("running");
    
    setTimeout(() => {
      setShowStimulus(true);
      trialStartTime.current = performance.now();
    }, 500);
  };

  const currentTrialData = trials[currentTrial];

  return (
    <div 
      className="h-full flex flex-col items-center justify-center px-6"
      onClick={phase === "running" ? handleTap : undefined}
    >
      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
            Attentional Efficiency
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Signal Lock</h2>
      </div>

      {/* Main area */}
      <div className="relative flex items-center justify-center w-full max-w-sm aspect-square">
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Target className="w-16 h-16 text-primary/30 mx-auto mb-6" />
            <p className="text-sm text-muted-foreground mb-2">
              Tap only when you see a <span className="text-primary font-medium">circle</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mb-8">
              Ignore squares and diamonds
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm"
            >
              Start
            </button>
          </motion.div>
        )}

        {phase === "running" && (
          <AnimatePresence mode="wait">
            {showStimulus && (
              <motion.div
                key={currentTrial}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className={`
                  ${currentTrialData.shape === "circle" ? "rounded-full" : ""}
                  ${currentTrialData.shape === "square" ? "rounded-lg" : ""}
                  ${currentTrialData.shape === "diamond" ? "rotate-45 rounded-lg" : ""}
                  ${currentTrialData.color}
                  ${feedback === "correct" ? "ring-4 ring-emerald-500" : ""}
                  ${feedback === "wrong" ? "ring-4 ring-red-500" : ""}
                  w-24 h-24
                `}
              />
            )}
          </AnimatePresence>
        )}

        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </motion.div>
        )}
      </div>

      {/* Progress */}
      {phase === "running" && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xs text-muted-foreground/50">
            {currentTrial + 1} / {TOTAL_TRIALS}
          </p>
        </div>
      )}

      {/* Instruction */}
      {phase === "running" && (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          Tap on circles only
        </p>
      )}
    </div>
  );
}
