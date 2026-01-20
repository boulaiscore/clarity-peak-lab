/**
 * ============================================
 * FLASH CONNECT DRILL – S1-RA Game v1.0
 * ============================================
 * 
 * Trains Rapid Association (RA): fast, intuitive, non-deliberate associations.
 * 
 * Core Mechanic:
 * - 12 rounds per session
 * - 3 cue words displayed, 4 connector options
 * - User selects the best associative link
 * - Incubation pulses after rounds 4 and 8
 * 
 * XP Routes: 100% to RA (fast_thinking)
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FlashConnectResults } from "./FlashConnectResults";
import { getPuzzlesForSession, FlashConnectPuzzle } from "./flashConnectContent";

// ============================================
// TYPES & CONFIGURATION
// ============================================

export interface FlashConnectFinalResults {
  score: number;
  xpAwarded: number;
  connectionRate: number;
  farLinkHitRate: number | null;
  medianReactionTime: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  roundData: RoundResult[];
}

interface FlashConnectDrillProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (results: FlashConnectFinalResults) => void;
}

interface RoundResult {
  roundIndex: number;
  puzzleId: string;
  cueIds: string[];
  optionIds: string[];
  correctOptionId: string;
  selectedOptionId: string | null;
  reactionTimeMs: number;
  isCorrect: boolean;
  integrationScore: number;
  prematureClick: boolean;
  isPostIncubation: boolean;
}

interface DifficultyConfig {
  timerMs: number;
}

// v1.5: XP imported from centralized config
import { GAME_XP_BY_DIFFICULTY, calculateGameXP } from "@/lib/trainingPlans";

const DIFFICULTY_CONFIGS: Record<"easy" | "medium" | "hard", DifficultyConfig> = {
  easy: { timerMs: 5000 },
  medium: { timerMs: 4000 },
  hard: { timerMs: 3200 },
};

const TOTAL_ROUNDS = 12;
const INCUBATION_ROUNDS = [4, 8]; // After these rounds
const INCUBATION_DURATION_MS = 2500;
const PREMATURE_THRESHOLD_MS = 350;
const FEEDBACK_DURATION_MS = 800;

// ============================================
// MAIN COMPONENT
// ============================================

export function FlashConnectDrill({ difficulty, onComplete }: FlashConnectDrillProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  // Game phases
  const [phase, setPhase] = useState<"instruction" | "countdown" | "playing" | "feedback" | "incubation" | "results">("instruction");
  const [countdown, setCountdown] = useState(3);
  
  // Round state
  const [currentRound, setCurrentRound] = useState(0);
  const [puzzles, setPuzzles] = useState<FlashConnectPuzzle[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(config.timerMs);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  
  // Tracking
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const roundStartTime = useRef<number>(0);
  
  // Initialize puzzles
  useEffect(() => {
    setPuzzles(getPuzzlesForSession(difficulty, TOTAL_ROUNDS));
  }, [difficulty]);
  
  const currentPuzzle = puzzles[currentRound];
  
  // ============================================
  // COUNTDOWN TIMER
  // ============================================
  
  useEffect(() => {
    if (phase !== "countdown") return;
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("playing");
          roundStartTime.current = Date.now();
          setTimeRemaining(config.timerMs);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, config.timerMs]);
  
  // ============================================
  // ROUND TIMER
  // ============================================
  
  useEffect(() => {
    if (phase !== "playing") return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, config.timerMs - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        handleTimeUp();
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [phase, currentRound, config.timerMs]);
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const handleTimeUp = useCallback(() => {
    if (!currentPuzzle) return;
    
    const correctOption = currentPuzzle.options.find(o => o.isCorrect);
    
    const result: RoundResult = {
      roundIndex: currentRound + 1,
      puzzleId: currentPuzzle.id,
      cueIds: currentPuzzle.cues,
      optionIds: currentPuzzle.options.map(o => o.id),
      correctOptionId: correctOption?.id || "",
      selectedOptionId: null,
      reactionTimeMs: config.timerMs,
      isCorrect: false,
      integrationScore: 0,
      prematureClick: false,
      isPostIncubation: INCUBATION_ROUNDS.includes(currentRound),
    };
    
    setRoundResults(prev => [...prev, result]);
    setIsCorrectFeedback(false);
    setPhase("feedback");
    
    setTimeout(() => {
      proceedToNextRound();
    }, FEEDBACK_DURATION_MS);
  }, [currentPuzzle, currentRound, config.timerMs]);
  
  const handleOptionSelect = useCallback((optionId: string) => {
    if (phase !== "playing" || !currentPuzzle) return;
    
    const reactionTime = Date.now() - roundStartTime.current;
    const selectedOpt = currentPuzzle.options.find(o => o.id === optionId);
    const correctOption = currentPuzzle.options.find(o => o.isCorrect);
    const isCorrect = selectedOpt?.isCorrect || false;
    
    const result: RoundResult = {
      roundIndex: currentRound + 1,
      puzzleId: currentPuzzle.id,
      cueIds: currentPuzzle.cues,
      optionIds: currentPuzzle.options.map(o => o.id),
      correctOptionId: correctOption?.id || "",
      selectedOptionId: optionId,
      reactionTimeMs: reactionTime,
      isCorrect,
      integrationScore: selectedOpt?.integrationScore || 0,
      prematureClick: reactionTime < PREMATURE_THRESHOLD_MS,
      isPostIncubation: INCUBATION_ROUNDS.includes(currentRound),
    };
    
    setRoundResults(prev => [...prev, result]);
    setSelectedOption(optionId);
    setIsCorrectFeedback(isCorrect);
    setPhase("feedback");
    
    setTimeout(() => {
      proceedToNextRound();
    }, FEEDBACK_DURATION_MS);
  }, [phase, currentPuzzle, currentRound]);
  
  const proceedToNextRound = useCallback(() => {
    const nextRound = currentRound + 1;
    
    // Check if session complete
    if (nextRound >= TOTAL_ROUNDS) {
      setPhase("results");
      return;
    }
    
    // Check if incubation pulse needed
    if (INCUBATION_ROUNDS.includes(currentRound + 1)) {
      setPhase("incubation");
      setTimeout(() => {
        setCurrentRound(nextRound);
        setSelectedOption(null);
        setIsCorrectFeedback(null);
        setTimeRemaining(config.timerMs);
        roundStartTime.current = Date.now();
        setPhase("playing");
      }, INCUBATION_DURATION_MS);
    } else {
      setCurrentRound(nextRound);
      setSelectedOption(null);
      setIsCorrectFeedback(null);
      setTimeRemaining(config.timerMs);
      roundStartTime.current = Date.now();
      setPhase("playing");
    }
  }, [currentRound, config.timerMs]);
  
  // ============================================
  // CALCULATE FINAL RESULTS
  // ============================================
  
  const finalResults = useMemo((): FlashConnectFinalResults | null => {
    if (phase !== "results" || roundResults.length === 0) return null;
    
    const correctCount = roundResults.filter(r => r.isCorrect).length;
    const connectionRate = (correctCount / TOTAL_ROUNDS) * 100;
    
    // Far-link hit rate (only for hard mode)
    let farLinkHitRate: number | null = null;
    if (difficulty === "hard") {
      const hardRounds = roundResults.filter(r => r.isPostIncubation || r.roundIndex > 8);
      if (hardRounds.length > 0) {
        const hardCorrect = hardRounds.filter(r => r.isCorrect).length;
        farLinkHitRate = (hardCorrect / hardRounds.length) * 100;
      }
    }
    
    // Median reaction time (correct rounds only)
    const correctReactionTimes = roundResults
      .filter(r => r.isCorrect && r.reactionTimeMs > 0)
      .map(r => r.reactionTimeMs)
      .sort((a, b) => a - b);
    
    const medianReactionTime = correctReactionTimes.length > 0
      ? correctReactionTimes[Math.floor(correctReactionTimes.length / 2)]
      : 0;
    
    // XP calculation - v1.5: Using centralized XP
    const isPerfect = connectionRate >= 90;
    const xpAwarded = calculateGameXP(difficulty, isPerfect);
    
    // Score (0-100 based on connection rate and speed)
    const speedBonus = Math.max(0, (config.timerMs - medianReactionTime) / config.timerMs) * 20;
    const score = Math.min(100, Math.round(connectionRate * 0.8 + speedBonus));
    
    return {
      score,
      xpAwarded,
      connectionRate,
      farLinkHitRate,
      medianReactionTime: Math.round(medianReactionTime),
      isPerfect,
      difficulty,
      roundData: roundResults,
    };
  }, [phase, roundResults, difficulty, config]);
  
  // ============================================
  // RENDER
  // ============================================
  
  // Instruction Screen
  if (phase === "instruction") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center mb-6"
        >
          <span className="text-3xl">⚡</span>
        </motion.div>
        
        <h1 className="text-2xl font-bold text-foreground mb-3">Flash Connect</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          Find the word that best connects all three cues. Trust your intuition.
        </p>
        
        <div className="space-y-3 text-left text-xs text-muted-foreground mb-8">
          <div className="flex items-start gap-3">
            <span className="text-primary font-bold">1</span>
            <span>See 3 cue words</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-primary font-bold">2</span>
            <span>Tap the best connector</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-primary font-bold">3</span>
            <span>Be fast, be intuitive</span>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPhase("countdown")}
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          Start
        </motion.button>
      </motion.div>
    );
  }
  
  // Countdown
  if (phase === "countdown") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          key={countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="text-7xl font-bold text-primary"
        >
          {countdown}
        </motion.div>
      </div>
    );
  }
  
  // Incubation Pulse
  if (phase === "incubation") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Breathe...
        </motion.p>
      </div>
    );
  }
  
  // Results Screen
  if (phase === "results" && finalResults) {
    return (
      <FlashConnectResults
        connectionRate={finalResults.connectionRate}
        farLinkHitRate={finalResults.farLinkHitRate}
        medianReactionTime={finalResults.medianReactionTime}
        xpAwarded={finalResults.xpAwarded}
        isPerfect={finalResults.isPerfect}
        difficulty={difficulty}
        roundsCompleted={finalResults.roundData.length}
        totalRounds={12}
        durationSeconds={90}
        onContinue={() => onComplete(finalResults)}
      />
    );
  }
  
  // Main Game UI
  if (!currentPuzzle) return null;
  
  const timerProgress = timeRemaining / config.timerMs;
  
  return (
    <div className="flex flex-col items-center px-4 py-6 min-h-[60vh]">
      {/* Progress & Timer */}
      <div className="w-full max-w-sm mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Round {currentRound + 1} / {TOTAL_ROUNDS}
          </span>
          <span className="text-xs text-muted-foreground">
            {(timeRemaining / 1000).toFixed(1)}s
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors",
              timerProgress > 0.5 ? "bg-primary" : timerProgress > 0.25 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${timerProgress * 100}%` }}
          />
        </div>
      </div>
      
      {/* Cue Cards */}
      <motion.div
        key={`cues-${currentRound}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-10"
      >
        {currentPuzzle.cues.map((cue, i) => (
          <motion.div
            key={cue}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="px-4 py-3 rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-lg"
          >
            <span className="text-sm font-semibold text-foreground">{cue}</span>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Connector Options */}
      <motion.div
        key={`options-${currentRound}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 w-full max-w-sm"
      >
        {currentPuzzle.options.map((option, i) => {
          const isSelected = selectedOption === option.id;
          const showFeedback = phase === "feedback";
          const isCorrectOption = option.isCorrect;
          
          return (
            <motion.button
              key={option.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={phase === "playing" ? { scale: 1.02 } : {}}
              whileTap={phase === "playing" ? { scale: 0.98 } : {}}
              onClick={() => handleOptionSelect(option.id)}
              disabled={phase !== "playing"}
              className={cn(
                "p-4 rounded-xl border text-center transition-all",
                "bg-card hover:bg-muted/50",
                phase === "playing" && "cursor-pointer",
                phase === "feedback" && isSelected && isCorrectOption && "bg-emerald-500/20 border-emerald-500/50",
                phase === "feedback" && isSelected && !isCorrectOption && "bg-red-500/20 border-red-500/50",
                phase === "feedback" && !isSelected && isCorrectOption && "border-emerald-500/30",
                phase === "feedback" && !isSelected && !isCorrectOption && "opacity-50",
                !showFeedback && "border-border/50"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                showFeedback && isSelected && isCorrectOption && "text-emerald-400",
                showFeedback && isSelected && !isCorrectOption && "text-red-400",
                showFeedback && !isSelected && isCorrectOption && "text-emerald-400/70",
                !showFeedback && "text-foreground"
              )}>
                {option.word}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
      
      {/* Feedback Label */}
      <AnimatePresence>
        {phase === "feedback" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <span className={cn(
              "text-sm font-medium",
              isCorrectFeedback ? "text-emerald-400" : "text-muted-foreground"
            )}>
              {isCorrectFeedback ? "Clean link" : "Weak link"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
