/**
 * SEMANTIC DRIFT — Main Game Component
 * 
 * S1-RA (Rapid Association) training game.
 * Fast intuitive semantic linking under time pressure.
 * 
 * MOTION SPEC v1.0:
 * - All animations < 250ms
 * - Use ease-out or cubic-bezier(0.22, 1, 0.36, 1)
 * - Motion guides attention, never explains logic
 * - Respect "Reduce Motion" OS setting
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  generateSessionNodes,
  DIFFICULTY_CONFIG,
  SemanticNode,
  SemanticOption,
} from "./semanticDriftContent";
import { GameExitButton } from "@/components/games/GameExitButton";

// Premium easing curve
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

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
  onExit?: () => void;
}

export function SemanticDriftDrill({ difficulty, onComplete, onExit }: SemanticDriftDrillProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const prefersReducedMotion = useReducedMotion();
  
  // Session state
  const [nodes] = useState<SemanticNode[]>(() => generateSessionNodes(difficulty, config.rounds));
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"ready" | "playing" | "feedback" | "transitioning" | "complete">("ready");
  
  // Round state
  const [timeRemaining, setTimeRemaining] = useState<number>(config.timePerRound);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | "timeout" | null>(null);
  
  // Transition state for semantic drift animation
  const [driftingOption, setDriftingOption] = useState<{ word: string; index: number } | null>(null);
  
  // Refs for timing
  const roundStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  
  // Get current node
  const currentNode = nodes[currentRound];
  
  // Shuffle options for display (but track original indices)
  const [shuffledOptions, setShuffledOptions] = useState<{ option: SemanticOption; originalIndex: number }[]>([]);
  
  useEffect(() => {
    if (currentNode && phase !== "transitioning") {
      const indexed = currentNode.options.map((opt, idx) => ({ option: opt, originalIndex: idx }));
      setShuffledOptions(indexed.sort(() => Math.random() - 0.5));
    }
  }, [currentNode, phase]);
  
  // Motion variants - respects reduce motion
  const motionConfig = useMemo(() => ({
    seed: {
      initial: prefersReducedMotion 
        ? { opacity: 0 } 
        : { opacity: 0, scale: 0.96 },
      animate: prefersReducedMotion 
        ? { opacity: 1 } 
        : { opacity: 1, scale: 1 },
      exit: prefersReducedMotion 
        ? { opacity: 0 } 
        : { opacity: 0, scale: 0.96 },
      transition: { duration: 0.18, ease: EASE_PREMIUM },
    },
    option: (index: number) => ({
      initial: prefersReducedMotion 
        ? { opacity: 0 } 
        : { opacity: 0, scale: 0.98 },
      animate: prefersReducedMotion 
        ? { opacity: 1 } 
        : { opacity: 1, scale: 1 },
      transition: { 
        duration: 0.16, 
        delay: prefersReducedMotion ? 0 : index * 0.04,
        ease: EASE_PREMIUM,
      },
    }),
    drift: {
      // Correct option moves to center
      transition: { duration: 0.22, ease: EASE_PREMIUM },
    },
  }), [prefersReducedMotion]);
  
  // Start round timer
  const startRoundTimer = useCallback(() => {
    roundStartTimeRef.current = Date.now();
    setTimeRemaining(config.timePerRound);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 100;
        if (newTime <= 0) {
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
    safeHaptic(30);
    
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
    
    // Brief dim then next round (< 120ms transition feel)
    setTimeout(() => proceedToNextRound(false), 100);
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
    safeHaptic(isCorrect ? 15 : 25);
    
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
    
    if (isCorrect) {
      // Semantic drift animation - correct option becomes next seed
      setDriftingOption({ word: selected.option.word, index: optionIndex });
      setPhase("transitioning");
      setTimeout(() => proceedToNextRound(true), 220);
    } else {
      // Wrong choice - brief dim then continue
      setTimeout(() => proceedToNextRound(false), 160);
    }
  }, [phase, selectedIndex, shuffledOptions, currentNode, currentRound]);
  
  // Proceed to next round
  const proceedToNextRound = useCallback((wasCorrect: boolean) => {
    const allResults = [...results];
    // Get latest result from state might be stale, so we add +1 if needed
    
    if (currentRound + 1 >= config.rounds) {
      // Session complete
      setPhase("complete");
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      // Need to pass actual results array
      setTimeout(() => {
        onComplete(allResults, durationSeconds);
      }, 60);
    } else {
      setCurrentRound(prev => prev + 1);
      setSelectedIndex(null);
      setFeedbackState(null);
      setDriftingOption(null);
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
      }, 400);
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
  
  // Calculate option positions for drift animation
  const getOptionPosition = (index: number) => {
    // 2x2 grid positions relative to center
    const positions = [
      { x: -60, y: -40 },  // top-left
      { x: 60, y: -40 },   // top-right
      { x: -60, y: 40 },   // bottom-left
      { x: 60, y: 40 },    // bottom-right
    ];
    return positions[index] || { x: 0, y: 0 };
  };
  
  if (phase === "complete") {
    return (
      <motion.div 
        className="fixed inset-0 bg-background"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      />
    );
  }
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Exit button */}
      {onExit && <GameExitButton onExit={onExit} />}
      {/* Progress bar */}
      <div className="h-1 bg-muted/30 w-full">
        <motion.div
          className="h-full bg-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2, ease: EASE_PREMIUM }}
        />
      </div>
      
      {/* Timer bar */}
      <div className="h-0.5 bg-muted/20 w-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full",
            timeProgress > 30 ? "bg-primary/40" : "bg-orange-500/50"
          )}
          animate={{ width: `${timeProgress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
      
      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-sm flex flex-col items-center gap-8 relative">
          
          {/* Seed word - central concept */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`seed-${currentRound}`}
              {...motionConfig.seed}
              className="text-center relative z-10"
            >
              <div className={cn(
                "px-6 py-4 rounded-2xl bg-card border transition-all duration-150",
                feedbackState === "timeout" 
                  ? "border-muted/50 opacity-90" 
                  : "border-border/50"
              )}>
                <span className="text-2xl font-semibold text-foreground">
                  {currentNode?.seed}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Options grid - 2x2 */}
          <div className="grid grid-cols-2 gap-3 w-full relative">
            <AnimatePresence mode="sync">
              {shuffledOptions.map((item, index) => {
                const isSelected = selectedIndex === index;
                const isCorrect = item.option.tag === "directional";
                const isDrifting = driftingOption?.index === index;
                
                // Feedback-based styling
                let glowClass = "";
                let opacityClass = "";
                let scaleClass = "";
                
                if (feedbackState === "correct" && isSelected) {
                  // Correct selection - stronger glow
                  glowClass = "shadow-[0_0_20px_rgba(var(--primary),0.35)]";
                  scaleClass = "scale-[1.03]";
                } else if (feedbackState === "wrong" && isSelected) {
                  // Wrong selection - weaker glow, neutral
                  glowClass = "shadow-[0_0_12px_rgba(var(--muted-foreground),0.15)]";
                } else if (feedbackState === "timeout") {
                  // Timeout - all dim uniformly
                  opacityClass = "opacity-50";
                } else if (feedbackState && !isSelected) {
                  // Non-selected during feedback - dim slightly
                  opacityClass = "opacity-90";
                }
                
                // During drift transition, hide the drifting option from grid
                if (isDrifting && phase === "transitioning") {
                  return null;
                }
                
                const optionMotion = motionConfig.option(index);
                
                return (
                  <motion.button
                    key={`${currentRound}-${index}`}
                    initial={optionMotion.initial}
                    animate={{
                      ...optionMotion.animate,
                      scale: feedbackState === "correct" && isSelected ? 1.03 : 1,
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={optionMotion.transition}
                    onClick={() => handleSelect(index)}
                    disabled={feedbackState !== null || phase !== "playing"}
                    whileHover={phase === "playing" && !feedbackState ? { 
                      scale: 1.02,
                      filter: "brightness(1.06)",
                    } : undefined}
                    whileTap={phase === "playing" && !feedbackState ? { 
                      scale: 0.98 
                    } : undefined}
                    className={cn(
                      "p-4 rounded-xl border bg-card transition-all duration-90",
                      "text-center text-base font-medium",
                      "border-border/30",
                      feedbackState !== null && "pointer-events-none",
                      glowClass,
                      opacityClass,
                      scaleClass
                    )}
                    style={{
                      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {item.option.word}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Drifting option overlay - moves to center */}
          <AnimatePresence>
            {driftingOption && phase === "transitioning" && !prefersReducedMotion && (
              <motion.div
                key="drifting"
                initial={{ 
                  opacity: 1,
                  x: getOptionPosition(driftingOption.index).x,
                  y: getOptionPosition(driftingOption.index).y + 60, // Offset for grid position
                  scale: 1,
                }}
                animate={{ 
                  opacity: 1,
                  x: 0,
                  y: -60, // Move to seed position
                  scale: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.22, 
                  ease: EASE_PREMIUM,
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <div className={cn(
                  "px-6 py-4 rounded-xl border bg-card",
                  "shadow-[0_0_24px_rgba(var(--primary),0.25)]",
                  "border-primary/40"
                )}>
                  <span className="text-base font-medium text-foreground">
                    {driftingOption.word}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Round counter */}
      <motion.div 
        className="pb-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-xs text-muted-foreground">
          {currentRound + 1} / {config.rounds}
        </span>
      </motion.div>
    </div>
  );
}
