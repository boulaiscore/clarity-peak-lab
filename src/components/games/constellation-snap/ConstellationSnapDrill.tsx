/**
 * ============================================
 * CONSTELLATION SNAP DRILL – S1-RA Game v1.0
 * ============================================
 * 
 * Trains Rapid Association (RA): fast, intuitive, non-deliberate associations.
 * 
 * Core Mechanic:
 * - 30 rounds per session (3 acts × 10 rounds)
 * - 3 constellation tiles displayed, 4 candidate options
 * - User selects the best associative link
 * - Hard time limits force System 1 decisions
 * 
 * XP Routes: 100% to RA (fast_thinking)
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConstellationSnapResults } from "./ConstellationSnapResults";
import { 
  getPuzzlesForSession, 
  shuffleOptions, 
  ConstellationPuzzle,
  ConstellationTile,
} from "./constellationSnapContent";
import * as LucideIcons from "lucide-react";

// ============================================
// TYPES & CONFIGURATION
// ============================================

export interface ConstellationSnapFinalResults {
  sessionScore: number;
  xpAwarded: number;
  accuracy: number;
  remoteAccuracy: number;
  medianReactionTime: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  roundData: RoundResult[];
}

interface ConstellationSnapDrillProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (results: ConstellationSnapFinalResults) => void;
}

interface RoundResult {
  roundIndex: number;
  act: number;
  puzzleId: string;
  tag: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  reactionTimeMs: number;
  isCorrect: boolean;
  isTimeout: boolean;
}

interface DifficultyConfig {
  timerMs: number;
  xpBase: number;
  difficultyBonus: number;
}

const DIFFICULTY_CONFIGS: Record<"easy" | "medium" | "hard", DifficultyConfig> = {
  easy: { timerMs: 900, xpBase: 25, difficultyBonus: 0 },
  medium: { timerMs: 750, xpBase: 25, difficultyBonus: 10 },
  hard: { timerMs: 600, xpBase: 25, difficultyBonus: 20 },
};

const TOTAL_ROUNDS = 30;
const ROUNDS_PER_ACT = 10;
const PERFECT_BONUS_XP = 10;
const CONSTELLATION_FADE_IN_MS = 150;
const FEEDBACK_DURATION_MS = 180;
const INTER_ROUND_DELAY_MS = 300;
const ACT_TRANSITION_MS = 800;

const ACT_NAMES = ["Focus", "Drift", "Leap"];

// ============================================
// ICON RENDERER
// ============================================

function TileRenderer({ tile, size = "md" }: { tile: ConstellationTile; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-12 h-12 text-xs",
    lg: "w-16 h-16 text-sm",
  };
  
  if (tile.type === "word") {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-card/80 border border-border/50",
        "font-medium text-foreground uppercase tracking-wide",
        sizeClasses[size]
      )}>
        {tile.value}
      </div>
    );
  }
  
  // Icon type - render from lucide
  const IconComponent = (LucideIcons as any)[tile.value];
  if (!IconComponent) {
    // Fallback to word if icon not found
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-card/80 border border-border/50",
        "font-medium text-foreground uppercase tracking-wide text-[8px]",
        sizeClasses[size]
      )}>
        {tile.value}
      </div>
    );
  }
  
  const iconSizes = { sm: 16, md: 24, lg: 32 };
  
  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg bg-card/80 border border-border/50",
      sizeClasses[size]
    )}>
      <IconComponent size={iconSizes[size]} className="text-primary" />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ConstellationSnapDrill({ difficulty, onComplete }: ConstellationSnapDrillProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  // Game phases
  const [phase, setPhase] = useState<"instruction" | "countdown" | "playing" | "feedback" | "act-transition" | "results">("instruction");
  const [countdown, setCountdown] = useState(3);
  
  // Round state
  const [currentRound, setCurrentRound] = useState(0);
  const [currentAct, setCurrentAct] = useState(1);
  const [puzzles, setPuzzles] = useState<ConstellationPuzzle[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<ConstellationTile[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(config.timerMs);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  
  // Tracking
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const roundStartTime = useRef<number>(0);
  const sessionStartTime = useRef<number>(0);
  
  // Initialize puzzles
  useEffect(() => {
    setPuzzles(getPuzzlesForSession(difficulty, TOTAL_ROUNDS));
  }, [difficulty]);
  
  // Shuffle options when round changes
  useEffect(() => {
    if (puzzles.length > 0 && currentRound < puzzles.length) {
      setShuffledOptions(shuffleOptions(puzzles[currentRound]));
    }
  }, [puzzles, currentRound]);
  
  // Countdown effect
  useEffect(() => {
    if (phase !== "countdown") return;
    
    if (countdown <= 0) {
      setPhase("playing");
      roundStartTime.current = Date.now();
      sessionStartTime.current = Date.now();
      setTimeRemaining(config.timerMs);
      return;
    }
    
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown, config.timerMs]);
  
  // Timer countdown during playing
  useEffect(() => {
    if (phase !== "playing") return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 10) {
          // Timeout - mark as miss
          handleTimeout();
          return 0;
        }
        return prev - 10;
      });
    }, 10);
    
    return () => clearInterval(interval);
  }, [phase]);
  
  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (phase !== "playing") return;
    
    const puzzle = puzzles[currentRound];
    if (!puzzle) return;
    
    const result: RoundResult = {
      roundIndex: currentRound,
      act: currentAct,
      puzzleId: puzzle.id,
      tag: puzzle.tag,
      selectedOptionId: null,
      correctOptionId: puzzle.correctOption.id,
      reactionTimeMs: config.timerMs,
      isCorrect: false,
      isTimeout: true,
    };
    
    setRoundResults(prev => [...prev, result]);
    setIsCorrectFeedback(false);
    setPhase("feedback");
    
    setTimeout(() => {
      proceedToNextRound();
    }, FEEDBACK_DURATION_MS + INTER_ROUND_DELAY_MS);
  }, [phase, currentRound, currentAct, puzzles, config.timerMs]);
  
  // Handle option selection
  const handleSelect = useCallback((optionId: string) => {
    if (phase !== "playing" || selectedOption !== null) return;
    
    const puzzle = puzzles[currentRound];
    if (!puzzle) return;
    
    const reactionTime = Date.now() - roundStartTime.current;
    const isCorrect = optionId === puzzle.correctOption.id;
    
    const result: RoundResult = {
      roundIndex: currentRound,
      act: currentAct,
      puzzleId: puzzle.id,
      tag: puzzle.tag,
      selectedOptionId: optionId,
      correctOptionId: puzzle.correctOption.id,
      reactionTimeMs: reactionTime,
      isCorrect,
      isTimeout: false,
    };
    
    setRoundResults(prev => [...prev, result]);
    setSelectedOption(optionId);
    setIsCorrectFeedback(isCorrect);
    setPhase("feedback");
    
    setTimeout(() => {
      proceedToNextRound();
    }, FEEDBACK_DURATION_MS + INTER_ROUND_DELAY_MS);
  }, [phase, selectedOption, currentRound, currentAct, puzzles]);
  
  // Proceed to next round
  const proceedToNextRound = useCallback(() => {
    const nextRound = currentRound + 1;
    
    if (nextRound >= TOTAL_ROUNDS) {
      // Game complete
      setPhase("results");
      return;
    }
    
    // Check for act transition
    const nextAct = Math.floor(nextRound / ROUNDS_PER_ACT) + 1;
    if (nextAct > currentAct) {
      setCurrentAct(nextAct);
      setCurrentRound(nextRound);
      setPhase("act-transition");
      
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrectFeedback(null);
        setPhase("playing");
        roundStartTime.current = Date.now();
        setTimeRemaining(config.timerMs);
      }, ACT_TRANSITION_MS);
    } else {
      setCurrentRound(nextRound);
      setSelectedOption(null);
      setIsCorrectFeedback(null);
      setPhase("playing");
      roundStartTime.current = Date.now();
      setTimeRemaining(config.timerMs);
    }
  }, [currentRound, currentAct, config.timerMs]);
  
  // Calculate final results
  const calculateResults = useMemo((): ConstellationSnapFinalResults => {
    const correctCount = roundResults.filter(r => r.isCorrect).length;
    const accuracy = (correctCount / TOTAL_ROUNDS) * 100;
    
    // Remote accuracy
    const remoteRounds = roundResults.filter(r => r.tag === "remote");
    const remoteCorrect = remoteRounds.filter(r => r.isCorrect).length;
    const remoteAccuracy = remoteRounds.length > 0 
      ? (remoteCorrect / remoteRounds.length) * 100 
      : 0;
    
    // Median reaction time (excluding timeouts)
    const validTimes = roundResults
      .filter(r => !r.isTimeout)
      .map(r => r.reactionTimeMs)
      .sort((a, b) => a - b);
    const medianRT = validTimes.length > 0
      ? validTimes[Math.floor(validTimes.length / 2)]
      : config.timerMs;
    
    // Speed score (normalized 0-100, faster = better)
    const speedBands = {
      easy: { min: 300, max: 900 },
      medium: { min: 250, max: 750 },
      hard: { min: 200, max: 600 },
    };
    const band = speedBands[difficulty];
    const speedScore = Math.max(0, Math.min(100, 
      ((band.max - medianRT) / (band.max - band.min)) * 100
    ));
    
    // Session score (70% accuracy, 30% speed)
    const sessionScore = Math.round(0.7 * accuracy + 0.3 * speedScore);
    
    // XP calculation
    const isPerfect = sessionScore >= 90;
    let xpAwarded = config.xpBase + config.difficultyBonus;
    if (isPerfect) xpAwarded += PERFECT_BONUS_XP;
    
    return {
      sessionScore,
      xpAwarded,
      accuracy,
      remoteAccuracy,
      medianReactionTime: Math.round(medianRT),
      isPerfect,
      difficulty,
      roundData: roundResults,
    };
  }, [roundResults, difficulty, config]);
  
  // Start game
  const startGame = () => {
    setPhase("countdown");
    setCountdown(3);
  };
  
  // Handle results actions
  const handlePlayAgain = () => {
    // Reset all state
    setPhase("instruction");
    setCurrentRound(0);
    setCurrentAct(1);
    setRoundResults([]);
    setSelectedOption(null);
    setIsCorrectFeedback(null);
    setPuzzles(getPuzzlesForSession(difficulty, TOTAL_ROUNDS));
  };
  
  const handleExit = () => {
    onComplete(calculateResults);
  };
  
  // Current puzzle
  const currentPuzzle = puzzles[currentRound];
  
  // Timer progress (0-1)
  const timerProgress = timeRemaining / config.timerMs;
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        {/* Instruction Screen */}
        {phase === "instruction" && (
          <motion.div
            key="instruction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-400/10 flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
              <LucideIcons.Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-3">Constellation Snap</h2>
            
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              See a constellation of 3 tiles. Find the 4th tile that completes the pattern.
              Trust your intuition — you have {config.timerMs}ms per round.
            </p>
            
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="p-2 rounded-lg bg-card/50 border border-border/30">
                <div className="text-lg font-bold text-foreground">{TOTAL_ROUNDS}</div>
                <div className="text-[9px] text-muted-foreground">Rounds</div>
              </div>
              <div className="p-2 rounded-lg bg-card/50 border border-border/30">
                <div className="text-lg font-bold text-foreground">3</div>
                <div className="text-[9px] text-muted-foreground">Acts</div>
              </div>
              <div className="p-2 rounded-lg bg-card/50 border border-border/30">
                <div className="text-lg font-bold text-amber-400">{config.timerMs}ms</div>
                <div className="text-[9px] text-muted-foreground">Per Round</div>
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={startGame}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-black"
            >
              Start Session
            </motion.button>
          </motion.div>
        )}
        
        {/* Countdown */}
        {phase === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-center"
          >
            <div className="text-7xl font-bold text-amber-400">{countdown}</div>
            <p className="text-sm text-muted-foreground mt-2">Get ready...</p>
          </motion.div>
        )}
        
        {/* Act Transition */}
        {phase === "act-transition" && (
          <motion.div
            key="act-transition"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center"
          >
            <div className="text-4xl font-bold text-foreground mb-2">
              Act {currentAct}
            </div>
            <div className="text-lg text-amber-400">{ACT_NAMES[currentAct - 1]}</div>
          </motion.div>
        )}
        
        {/* Playing Phase */}
        {(phase === "playing" || phase === "feedback") && currentPuzzle && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-muted-foreground">
                Act {currentAct}: {ACT_NAMES[currentAct - 1]}
              </div>
              <div className="text-xs font-medium text-foreground">
                {currentRound + 1}/{TOTAL_ROUNDS}
              </div>
            </div>
            
            {/* Timer Bar */}
            <div className="h-1 bg-muted/30 rounded-full mb-6 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  timerProgress > 0.3 ? "bg-amber-400" : "bg-red-400"
                )}
                initial={{ width: "100%" }}
                animate={{ width: `${timerProgress * 100}%` }}
                transition={{ duration: 0.01 }}
              />
            </div>
            
            {/* Constellation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: CONSTELLATION_FADE_IN_MS / 1000 }}
              className="flex items-center justify-center gap-4 mb-8 p-4 rounded-xl bg-card/30 border border-border/20"
            >
              {currentPuzzle.constellation.map((tile, idx) => (
                <TileRenderer key={tile.id} tile={tile} size="lg" />
              ))}
            </motion.div>
            
            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3">
              {shuffledOptions.map((option) => {
                const isSelected = selectedOption === option.id;
                const isCorrect = option.id === currentPuzzle.correctOption.id;
                const showResult = phase === "feedback" && (isSelected || (isCorrectFeedback === false && isCorrect));
                
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: phase === "playing" ? 0.95 : 1 }}
                    onClick={() => handleSelect(option.id)}
                    disabled={phase !== "playing"}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex items-center justify-center min-h-[80px]",
                      phase === "playing" && "hover:border-amber-400/50 hover:bg-card/50 active:bg-card/70",
                      !showResult && "border-border/30 bg-card/20",
                      showResult && isCorrect && "border-emerald-400 bg-emerald-500/10",
                      showResult && isSelected && !isCorrect && "border-red-400 bg-red-500/10"
                    )}
                  >
                    <TileRenderer tile={option} size="md" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {/* Results */}
        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <ConstellationSnapResults
              sessionScore={calculateResults.sessionScore}
              accuracy={calculateResults.accuracy}
              remoteAccuracy={calculateResults.remoteAccuracy}
              medianReactionTime={calculateResults.medianReactionTime}
              xpAwarded={calculateResults.xpAwarded}
              isPerfect={calculateResults.isPerfect}
              difficulty={difficulty}
              roundsCompleted={roundResults.length}
              totalRounds={TOTAL_ROUNDS}
              durationSeconds={Math.round((Date.now() - sessionStartTime.current) / 1000)}
              onPlayAgain={handlePlayAgain}
              onExit={handleExit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
