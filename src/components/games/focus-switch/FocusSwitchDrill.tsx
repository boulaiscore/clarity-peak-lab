/**
 * ============================================
 * FOCUS SWITCH DRILL – S1-AE Game v1.0
 * ============================================
 * 
 * Trains rapid attentional re-orienting and recovery after focus changes.
 * 
 * Core Mechanic:
 * - 3-4 parallel lanes/streams on screen
 * - Only ONE lane is active at a time (highlighted)
 * - Focus changes unpredictably every 2-4 seconds
 * - User must tap ONLY on the active lane
 * 
 * Metrics tracked (for guidance only, NOT for cognitive metrics):
 * - switch_latency_ms: time to first correct response after focus change
 * - perseveration_rate: responses to previous focus after switch
 * - post_switch_error_rate: errors within first 2 actions after switch
 * - degradation_slope: Block 1 vs Block 3 performance delta
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FocusSwitchResults } from "./FocusSwitchResults";

// ============================================
// TYPES & CONFIGURATION
// ============================================

export interface FocusSwitchFinalResults {
  score: number;
  xpAwarded: number;
  switchLatencyAvg: number;
  perseverationRate: number;
  postSwitchErrorRate: number;
  recoverySpeedIndex: number;
  degradationSlope: number;
  block1Score: number;
  block2Score: number;
  block3Score: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
}

interface FocusSwitchDrillProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (results: FocusSwitchFinalResults) => void;
}

interface BlockConfig {
  duration: number;
  label: string;
  description: string;
  switchIntervalMin: number;
  switchIntervalMax: number;
}

interface DifficultyConfig {
  lanes: number;
  switchIntervalMin: number;
  switchIntervalMax: number;
  hasLureTiming: boolean;
}

// v1.5: XP imported from centralized config
import { GAME_XP_BY_DIFFICULTY, calculateGameXP } from "@/lib/trainingPlans";

const BLOCK_CONFIGS: BlockConfig[] = [
  { duration: 15, label: "Lock", description: "Find the active lane", switchIntervalMin: 3, switchIntervalMax: 4 },
  { duration: 20, label: "Switch", description: "Track the focus", switchIntervalMin: 2, switchIntervalMax: 3.5 },
  { duration: 25, label: "Snap", description: "React instantly", switchIntervalMin: 1.5, switchIntervalMax: 3 },
];

const DIFFICULTY_CONFIGS: Record<"easy" | "medium" | "hard", DifficultyConfig> = {
  easy: { lanes: 3, switchIntervalMin: 3, switchIntervalMax: 4, hasLureTiming: false },
  medium: { lanes: 4, switchIntervalMin: 2, switchIntervalMax: 3.5, hasLureTiming: false },
  hard: { lanes: 4, switchIntervalMin: 1.5, switchIntervalMax: 3, hasLureTiming: true },
};

const LANE_COLORS = [
  { active: "from-cyan-400 to-cyan-500", inactive: "bg-cyan-500/10", glow: "shadow-cyan-400/50" },
  { active: "from-violet-400 to-violet-500", inactive: "bg-violet-500/10", glow: "shadow-violet-400/50" },
  { active: "from-amber-400 to-amber-500", inactive: "bg-amber-500/10", glow: "shadow-amber-400/50" },
  { active: "from-rose-400 to-rose-500", inactive: "bg-rose-500/10", glow: "shadow-rose-400/50" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function FocusSwitchDrill({ difficulty, onComplete }: FocusSwitchDrillProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const laneCount = config.lanes;
  
  // Game phases
  const [phase, setPhase] = useState<"instruction" | "countdown" | "playing" | "block_complete" | "results">("instruction");
  const [currentBlock, setCurrentBlock] = useState(0);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(BLOCK_CONFIGS[0].duration);
  const [countdown, setCountdown] = useState(3);
  
  // Core gameplay state
  const [activeLane, setActiveLane] = useState(0);
  const [previousLane, setPreviousLane] = useState<number | null>(null);
  const [lastSwitchTime, setLastSwitchTime] = useState(0);
  const [showFeedback, setShowFeedback] = useState<{ lane: number; type: "correct" | "error" } | null>(null);
  
  // Tracking for scoring
  const [blockScores, setBlockScores] = useState<number[]>([0, 0, 0]);
  const [switchLatencies, setSwitchLatencies] = useState<number[]>([]);
  const [perseverations, setPerseverations] = useState<number[]>([]);
  const [postSwitchErrors, setPostSwitchErrors] = useState<number[]>([]);
  const [totalTaps, setTotalTaps] = useState(0);
  const [correctTaps, setCorrectTaps] = useState(0);
  const [actionsAfterSwitch, setActionsAfterSwitch] = useState(0);
  const [errorsAfterSwitch, setErrorsAfterSwitch] = useState(0);
  const [hasRespondedAfterSwitch, setHasRespondedAfterSwitch] = useState(false);
  
  // Refs for timing
  const lastUpdateTime = useRef(Date.now());
  const nextSwitchTime = useRef(0);
  const gameStartTime = useRef(0);
  
  // Generate target in active lane
  const [targetVisible, setTargetVisible] = useState(false);
  const targetIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================
  // HELPERS
  // ============================================
  
  const getNextSwitchInterval = useCallback(() => {
    const blockConfig = BLOCK_CONFIGS[currentBlock];
    const min = blockConfig?.switchIntervalMin ?? config.switchIntervalMin;
    const max = blockConfig?.switchIntervalMax ?? config.switchIntervalMax;
    return (min + Math.random() * (max - min)) * 1000;
  }, [currentBlock, config]);
  
  const switchFocus = useCallback(() => {
    setPreviousLane(activeLane);
    
    // Pick new lane different from current
    let newLane: number;
    do {
      newLane = Math.floor(Math.random() * laneCount);
    } while (newLane === activeLane);
    
    setActiveLane(newLane);
    setLastSwitchTime(Date.now());
    setHasRespondedAfterSwitch(false);
    setActionsAfterSwitch(0);
    setErrorsAfterSwitch(0);
    
    // Schedule next switch
    nextSwitchTime.current = Date.now() + getNextSwitchInterval();
  }, [activeLane, laneCount, getNextSwitchInterval]);
  
  // ============================================
  // GAME LOOP
  // ============================================
  
  useEffect(() => {
    if (phase !== "playing") return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Check for focus switch
      if (now >= nextSwitchTime.current) {
        switchFocus();
      }
      
      // Update block timer
      const dt = (now - lastUpdateTime.current) / 1000;
      lastUpdateTime.current = now;
      
      setBlockTimeRemaining(prev => {
        const newTime = prev - dt;
        if (newTime <= 0) {
          // Block complete
          if (currentBlock < 2) {
            setPhase("block_complete");
          } else {
            // Game complete
            setPhase("results");
          }
          return 0;
        }
        return newTime;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [phase, currentBlock, switchFocus]);
  
  // Target visibility pulse
  useEffect(() => {
    if (phase !== "playing") {
      if (targetIntervalRef.current) clearInterval(targetIntervalRef.current);
      return;
    }
    
    // Show target periodically in active lane
    targetIntervalRef.current = setInterval(() => {
      setTargetVisible(true);
      setTimeout(() => setTargetVisible(false), 800);
    }, 1200);
    
    return () => {
      if (targetIntervalRef.current) clearInterval(targetIntervalRef.current);
    };
  }, [phase]);
  
  // Countdown timer
  useEffect(() => {
    if (phase !== "countdown") return;
    
    if (countdown <= 0) {
      setPhase("playing");
      gameStartTime.current = Date.now();
      lastUpdateTime.current = Date.now();
      setLastSwitchTime(Date.now()); // Initialize lastSwitchTime to prevent huge values
      nextSwitchTime.current = Date.now() + getNextSwitchInterval();
      return;
    }
    
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown, getNextSwitchInterval]);
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const handleStart = () => {
    setPhase("countdown");
    setCountdown(3);
  };
  
  const handleLaneTap = (lane: number) => {
    if (phase !== "playing") return;
    
    const now = Date.now();
    const timeSinceSwitch = now - lastSwitchTime;
    
    setTotalTaps(prev => prev + 1);
    
    // Track actions after switch for post-switch error rate
    if (actionsAfterSwitch < 2) {
      setActionsAfterSwitch(prev => prev + 1);
    }
    
    if (lane === activeLane) {
      // Correct tap
      setCorrectTaps(prev => prev + 1);
      setBlockScores(prev => {
        const updated = [...prev];
        updated[currentBlock] += 10;
        return updated;
      });
      
      // Track switch latency (first correct response after switch)
      if (!hasRespondedAfterSwitch) {
        setSwitchLatencies(prev => [...prev, timeSinceSwitch]);
        setHasRespondedAfterSwitch(true);
      }
      
      setShowFeedback({ lane, type: "correct" });
    } else {
      // Error
      setBlockScores(prev => {
        const updated = [...prev];
        updated[currentBlock] = Math.max(0, updated[currentBlock] - 5);
        return updated;
      });
      
      // Check for perseveration (tapped previous lane)
      if (lane === previousLane) {
        setPerseverations(prev => [...prev, timeSinceSwitch]);
      }
      
      // Track post-switch errors
      if (actionsAfterSwitch < 2) {
        setErrorsAfterSwitch(prev => prev + 1);
        setPostSwitchErrors(prev => [...prev, 1]);
      }
      
      setShowFeedback({ lane, type: "error" });
    }
    
    // Clear feedback
    setTimeout(() => setShowFeedback(null), 200);
  };
  
  const handleNextBlock = () => {
    setCurrentBlock(prev => prev + 1);
    setBlockTimeRemaining(BLOCK_CONFIGS[currentBlock + 1].duration);
    setPhase("playing");
    lastUpdateTime.current = Date.now();
    nextSwitchTime.current = Date.now() + getNextSwitchInterval();
  };
  
  // ============================================
  // RESULTS CALCULATION
  // ============================================
  
  const results = useMemo((): FocusSwitchFinalResults | null => {
    if (phase !== "results") return null;
    
    // Calculate metrics
    const switchLatencyAvg = switchLatencies.length > 0
      ? switchLatencies.reduce((a, b) => a + b, 0) / switchLatencies.length
      : 500;
    
    const perseverationRate = totalTaps > 0
      ? perseverations.length / totalTaps
      : 0;
    
    const postSwitchErrorRate = postSwitchErrors.length > 0
      ? postSwitchErrors.reduce((a, b) => a + b, 0) / (postSwitchErrors.length * 2)
      : 0;
    
    // Recovery speed: inverse of switch latency, normalized
    const recoverySpeedIndex = Math.max(0, Math.min(1, 1 - (switchLatencyAvg / 2000)));
    
    // Degradation: Block 1 vs Block 3
    const block1Score = blockScores[0];
    const block3Score = blockScores[2];
    const maxBlockScore = Math.max(block1Score, block3Score, 1);
    const degradationSlope = (block1Score - block3Score) / maxBlockScore;
    
    // Total score
    const totalScore = blockScores.reduce((a, b) => a + b, 0);
    
    // XP calculation
    const baseXP = config.xpPerBlock * 3;
    const isPerfect = perseverationRate < 0.1 && switchLatencyAvg < 500 && degradationSlope < 0.2;
    const xpAwarded = isPerfect ? baseXP + PERFECT_BONUS_XP : baseXP;
    
    return {
      score: totalScore,
      xpAwarded,
      switchLatencyAvg,
      perseverationRate,
      postSwitchErrorRate,
      recoverySpeedIndex,
      degradationSlope,
      block1Score,
      block2Score: blockScores[1],
      block3Score,
      isPerfect,
      difficulty,
    };
  }, [phase, blockScores, switchLatencies, perseverations, postSwitchErrors, totalTaps, config.xpPerBlock, difficulty]);
  
  // ============================================
  // RENDER
  // ============================================
  
  // Instruction screen
  if (phase === "instruction") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6 text-center"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Focus Switch</h2>
            <p className="text-sm text-muted-foreground">
              Train rapid attentional re-orienting
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">1</div>
              <p className="text-sm text-muted-foreground">
                Watch {laneCount} lanes on screen
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">2</div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Tap only the highlighted lane</span> when targets appear
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">3</div>
              <p className="text-sm text-muted-foreground">
                The active lane switches unpredictably — <span className="text-foreground font-medium">react fast!</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={handleStart}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm"
          >
            Start Session
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Countdown screen
  if (phase === "countdown") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-7xl font-bold text-primary"
        >
          {countdown || "GO!"}
        </motion.div>
      </div>
    );
  }
  
  // Block complete screen
  if (phase === "block_complete") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-6 text-center"
        >
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            Block {currentBlock + 1} / 3 Complete
          </div>
          <div className="text-3xl font-bold text-foreground">
            {BLOCK_CONFIGS[currentBlock].label}
          </div>
          <div className="text-lg text-primary font-semibold">
            +{blockScores[currentBlock]} points
          </div>
          
          <button
            onClick={handleNextBlock}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm"
          >
            Next Block: {BLOCK_CONFIGS[currentBlock + 1].label}
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Results screen
  if (phase === "results" && results) {
    return (
      <FocusSwitchResults
        results={results}
        onContinue={() => onComplete(results)}
      />
    );
  }
  
  // Playing screen
  const blockProgress = 1 - (blockTimeRemaining / BLOCK_CONFIGS[currentBlock].duration);
  
  return (
    <div className="min-h-[70vh] flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Block {currentBlock + 1} / 3 • {BLOCK_CONFIGS[currentBlock].label}
        </div>
        
        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden max-w-xs mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${blockProgress * 100}%` }}
          />
        </div>
        
        <div className="text-2xl font-bold text-foreground tabular-nums">
          {Math.ceil(blockTimeRemaining)}s
        </div>
      </div>
      
      {/* Lanes */}
      <div className="flex-1 flex gap-3 justify-center items-stretch max-w-md mx-auto w-full">
        {Array.from({ length: laneCount }).map((_, i) => {
          const isActive = i === activeLane;
          const colors = LANE_COLORS[i];
          const hasFeedback = showFeedback?.lane === i;
          
          return (
            <motion.button
              key={i}
              onClick={() => handleLaneTap(i)}
              className={cn(
                "flex-1 rounded-2xl relative overflow-hidden transition-all duration-200",
                "flex items-center justify-center",
                "min-h-[300px]",
                isActive
                  ? `bg-gradient-to-b ${colors.active} shadow-lg ${colors.glow}`
                  : colors.inactive,
                hasFeedback && showFeedback.type === "correct" && "ring-2 ring-emerald-400",
                hasFeedback && showFeedback.type === "error" && "ring-2 ring-rose-400"
              )}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AnimatePresence>
                      {targetVisible && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="w-10 h-10 rounded-full bg-white shadow-lg"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              
              {/* Inactive lane subtle indicator */}
              {!isActive && (
                <div className="w-8 h-8 rounded-full border border-white/10" />
              )}
              
              {/* Feedback flash */}
              <AnimatePresence>
                {hasFeedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "absolute inset-0",
                      showFeedback.type === "correct" ? "bg-emerald-400" : "bg-rose-400"
                    )}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      
      {/* Score */}
      <div className="text-center mt-6">
        <div className="text-sm text-muted-foreground">Score</div>
        <div className="text-2xl font-bold text-foreground tabular-nums">
          {blockScores.reduce((a, b) => a + b, 0)}
        </div>
      </div>
    </div>
  );
}
