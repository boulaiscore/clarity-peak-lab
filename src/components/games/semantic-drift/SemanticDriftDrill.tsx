/**
 * SEMANTIC DRIFT — Main Game Component
 * 
 * S1-RA (Rapid Association) training game.
 * Fast intuitive semantic linking under time pressure.
 * 
 * NO explanations during play.
 * NO analytical prompts.
 * NO learning text mid-session.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  generateSessionNodes,
  DIFFICULTY_CONFIG,
  SemanticNode,
  SemanticOption,
} from "./semanticDriftContent";

// Safe haptic function
const safeHaptic = (duration: number) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  } catch {}
};

export interface RoundResult {
  roundIndex: number;
  seed: string;
  options: SemanticOption[];
  correctOption: string;
  chosenOption: string | null;
  reactionTimeMs: number | null;
  timeoutFlag: boolean;
  chosenTag: "directional" | "literal" | "remote" | "distractor" | null;
}

interface SemanticDriftDrillProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (results: RoundResult[], durationSeconds: number) => void;
}

export function SemanticDriftDrill({ difficulty, onComplete }: SemanticDriftDrillProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Session state
  const [nodes] = useState<SemanticNode[]>(() => generateSessionNodes(difficulty, config.rounds));
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"ready" | "playing" | "feedback" | "complete">("ready");
  
  // Round state
  const [timeRemaining, setTimeRemaining] = useState<number>(config.timePerRound);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | "timeout" | null>(null);
  
  // Refs for timing
  const roundStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  
  // Get current node
  const currentNode = nodes[currentRound];
  
  // Shuffle options for display (but track original indices)
  const [shuffledOptions, setShuffledOptions] = useState<{ option: SemanticOption; originalIndex: number }[]>([]);
  
  useEffect(() => {
    if (currentNode) {
      const indexed = currentNode.options.map((opt, idx) => ({ option: opt, originalIndex: idx }));
      setShuffledOptions(indexed.sort(() => Math.random() - 0.5));
    }
  }, [currentNode]);
  
  // Start round timer
  const startRoundTimer = useCallback(() => {
    roundStartTimeRef.current = Date.now();
    setTimeRemaining(config.timePerRound);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 100;
        if (newTime <= 0) {
          // Timeout - handle it
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return newTime;
      });
    }, 100);
  }, [config.timePerRound]);
  
  // Handle timeout
  const handleTimeout = useCallback(() => {
    setFeedbackState("timeout");
    
    // Subtle haptic
    try {
      if (typeof navigator !== "undefined" && navigator?.vibrate) {
        navigator.vibrate(30);
      }
    } catch {}
    
    const correctOption = currentNode.options.find(o => o.tag === "directional")!;
    
    const result: RoundResult = {
      roundIndex: currentRound,
      seed: currentNode.seed,
      options: currentNode.options,
      correctOption: correctOption.word,
      chosenOption: null,
      reactionTimeMs: null,
      timeoutFlag: true,
      chosenTag: null,
    };
    
    setResults(prev => [...prev, result]);
    
    // Brief pause then next round
    setTimeout(() => proceedToNextRound(), 400);
  }, [currentNode, currentRound]);
  
  // Handle option selection
  const handleSelect = useCallback((optionIndex: number) => {
    if (phase !== "playing" || selectedIndex !== null) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    const reactionTime = Date.now() - roundStartTimeRef.current;
    const selected = shuffledOptions[optionIndex];
    const isCorrect = selected.option.tag === "directional";
    
    setSelectedIndex(optionIndex);
    setFeedbackState(isCorrect ? "correct" : "wrong");
    
    // Subtle haptic feedback
    safeHaptic(isCorrect ? 20 : 30);
    
    const correctOption = currentNode.options.find(o => o.tag === "directional")!;
    
    const result: RoundResult = {
      roundIndex: currentRound,
      seed: currentNode.seed,
      options: currentNode.options,
      correctOption: correctOption.word,
      chosenOption: selected.option.word,
      reactionTimeMs: reactionTime,
      timeoutFlag: false,
      chosenTag: selected.option.tag,
    };
    
    setResults(prev => [...prev, result]);
    
    // Brief pause then next round
    setTimeout(() => proceedToNextRound(), 300);
  }, [phase, selectedIndex, shuffledOptions, currentNode, currentRound]);
  
  // Proceed to next round
  const proceedToNextRound = useCallback(() => {
    if (currentRound + 1 >= config.rounds) {
      // Session complete
      setPhase("complete");
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      onComplete(results, durationSeconds);
    } else {
      setCurrentRound(prev => prev + 1);
      setSelectedIndex(null);
      setFeedbackState(null);
      setPhase("playing");
      startRoundTimer();
    }
  }, [currentRound, config.rounds, results, onComplete, startRoundTimer]);
  
  // Start game after initial ready state
  useEffect(() => {
    if (phase === "ready") {
      const timeout = setTimeout(() => {
        setPhase("playing");
        sessionStartRef.current = Date.now();
        startRoundTimer();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [phase, startRoundTimer]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  // Progress calculation
  const progress = ((currentRound + 1) / config.rounds) * 100;
  const timeProgress = (timeRemaining / config.timePerRound) * 100;
  
  if (phase === "complete") {
    return null; // Results handled by parent
  }
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted/30 w-full">
        <motion.div
          className="h-full bg-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Timer bar */}
      <div className="h-0.5 bg-muted/20 w-full">
        <motion.div
          className={cn(
            "h-full transition-colors",
            timeProgress > 30 ? "bg-primary/40" : "bg-destructive/60"
          )}
          style={{ width: `${timeProgress}%` }}
        />
      </div>
      
      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm flex flex-col items-center gap-8"
          >
            {/* Seed word - central concept */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-4 rounded-2xl bg-card border border-border/50"
              >
                <span className="text-2xl font-semibold text-foreground">
                  {currentNode?.seed}
                </span>
              </motion.div>
            </div>
            
            {/* Options grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {shuffledOptions.map((item, index) => {
                const isSelected = selectedIndex === index;
                const isCorrect = item.option.tag === "directional";
                
                let bgClass = "bg-card hover:bg-card/80";
                let borderClass = "border-border/30";
                
                if (feedbackState && isSelected) {
                  if (feedbackState === "correct") {
                    bgClass = "bg-primary/20";
                    borderClass = "border-primary/50";
                  } else {
                    bgClass = "bg-muted/50";
                    borderClass = "border-muted";
                  }
                } else if (feedbackState === "timeout" && isCorrect) {
                  // Subtly indicate correct on timeout
                  bgClass = "bg-muted/30";
                  borderClass = "border-muted/50";
                }
                
                return (
                  <motion.button
                    key={`${currentRound}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelect(index)}
                    disabled={feedbackState !== null || phase !== "playing"}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-150",
                      "text-center text-base font-medium",
                      "active:scale-[0.98]",
                      bgClass,
                      borderClass,
                      feedbackState !== null && "pointer-events-none"
                    )}
                  >
                    {item.option.word}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Round counter */}
      <div className="pb-6 text-center">
        <span className="text-xs text-muted-foreground">
          {currentRound + 1} / {config.rounds}
        </span>
      </div>
    </div>
  );
}
