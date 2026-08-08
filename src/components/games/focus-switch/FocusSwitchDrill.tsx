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
import { GameExitButton } from "@/components/games/GameExitButton";
import { useSafeTimeout } from "@/hooks/useSafeTimeout";

// ============================================
// TYPES & CONFIGURATION
// ============================================

export interface FocusSwitchFinalResults {
  score: number;
  xpAwarded: number;
  switchLatencyAvg: number;
  perseverationRate: number;
  postSwitchErrorRate: number;
  hitRate: number;
  falseAlarmRate: number;
  rtVariability: number;
  recoverySpeedIndex: number;
  degradationSlope: number;
  block1Score: number;
  block2Score: number;
  block3Score: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  qualityScore: number;
  qualityLine?: string;
  bonusApplied: boolean;
}

interface FocusSwitchDrillProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (results: FocusSwitchFinalResults) => Promise<number>;
  onExit?: () => void;
  onStart?: () => void;
}

type BlockMode = "lock" | "inhibit" | "invert";

interface BlockConfig {
  duration: number;
  label: string;
  description: string;
  rule: string;
  mode: BlockMode;
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
import { GAME_XP_BY_DIFFICULTY, calculateScoredDrillXP } from "@/lib/trainingPlans";
import { calculateQualityBonus } from "@/lib/gameQualityBonus";

const BLOCK_CONFIGS: BlockConfig[] = [
  { duration: 20, label: "Lock", description: "Find the active lane", rule: "Tap the highlighted lane when a target appears", mode: "lock", switchIntervalMin: 3, switchIntervalMax: 4 },
  { duration: 25, label: "Inhibit", description: "Resist the lures", rule: "Tap solid targets in the highlighted lane. Ignore hollow lures elsewhere.", mode: "inhibit", switchIntervalMin: 2.5, switchIntervalMax: 3.5 },
  { duration: 25, label: "Invert", description: "Flip the rule", rule: "Rule reversed: tap the target in the NON-highlighted lane", mode: "invert", switchIntervalMin: 2, switchIntervalMax: 3 },
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

export function FocusSwitchDrill({ difficulty, onComplete, onExit, onStart }: FocusSwitchDrillProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const scheduleTimeout = useSafeTimeout();
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
  const [goTargetsPresented, setGoTargetsPresented] = useState(0);
  const [postSwitchActions, setPostSwitchActions] = useState(0);
  const [actionsAfterSwitch, setActionsAfterSwitch] = useState(0);
  const [errorsAfterSwitch, setErrorsAfterSwitch] = useState(0);
  const [hasRespondedAfterSwitch, setHasRespondedAfterSwitch] = useState(false);
  
  // Refs for timing
  const lastUpdateTime = useRef(Date.now());
  const nextSwitchTime = useRef(0);
  const gameStartTime = useRef(0);
  
  // Target system: target appears periodically with a lane + type that depends on block mode
  const [currentTarget, setCurrentTarget] = useState<{ lane: number; type: "solid" | "hollow" } | null>(null);
  const [persistedXP, setPersistedXP] = useState<number | null>(null);
  const saveStartedRef = useRef(false);
  const targetIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeLaneRef = useRef(0);
  useEffect(() => { activeLaneRef.current = activeLane; }, [activeLane]);
  
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
  
  // Target spawn loop — depends on block mode
  useEffect(() => {
    if (phase !== "playing") {
      if (targetIntervalRef.current) clearInterval(targetIntervalRef.current);
      if (targetHideTimeoutRef.current) clearTimeout(targetHideTimeoutRef.current);
      setCurrentTarget(null);
      return;
    }

    const mode = BLOCK_CONFIGS[currentBlock].mode;

    const spawn = () => {
      const active = activeLaneRef.current;
      const others: number[] = [];
      for (let i = 0; i < laneCount; i++) if (i !== active) others.push(i);
      const randOther = () => others[Math.floor(Math.random() * others.length)];

      let target: { lane: number; type: "solid" | "hollow" };
      if (mode === "lock") {
        target = { lane: active, type: "solid" };
      } else if (mode === "inhibit") {
        // 60% GO (solid in active), 40% LURE (hollow in non-active)
        target = Math.random() < 0.6
          ? { lane: active, type: "solid" }
          : { lane: randOther(), type: "hollow" };
      } else {
        // invert: target solid in a NON-highlighted lane
        target = { lane: randOther(), type: "solid" };
      }

      setCurrentTarget(target);
      if (target.type === "solid") {
        setGoTargetsPresented(prev => prev + 1);
      }
      if (targetHideTimeoutRef.current) clearTimeout(targetHideTimeoutRef.current);
      targetHideTimeoutRef.current = setTimeout(() => setCurrentTarget(null), 850);
    };

    // Initial spawn after small delay
    const initialDelay = setTimeout(spawn, 400);
    targetIntervalRef.current = setInterval(spawn, 1300);

    return () => {
      clearTimeout(initialDelay);
      if (targetIntervalRef.current) clearInterval(targetIntervalRef.current);
      if (targetHideTimeoutRef.current) clearTimeout(targetHideTimeoutRef.current);
    };
  }, [phase, currentBlock, laneCount]);
  
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
    onStart?.();
    setPhase("countdown");
    setCountdown(3);
  };
  
  const handleLaneTap = (lane: number) => {
    if (phase !== "playing") return;

    const now = Date.now();
    const timeSinceSwitch = now - lastSwitchTime;
    const mode = BLOCK_CONFIGS[currentBlock].mode;

    setTotalTaps(prev => prev + 1);
    if (actionsAfterSwitch < 2) {
      setActionsAfterSwitch(prev => prev + 1);
      setPostSwitchActions(prev => prev + 1);
    }

    // Determine the "expected" lane to tap given current target + mode.
    // null target => any tap is a (mild) error in inhibit/invert; in lock we ignore.
    let isCorrect = false;
    if (currentTarget) {
      if (mode === "lock") {
        isCorrect = lane === activeLane && currentTarget.lane === activeLane;
      } else if (mode === "inhibit") {
        // Tap only solid GO target in active lane. Hollow lure = no tap.
        isCorrect = currentTarget.type === "solid" && lane === currentTarget.lane;
      } else {
        // invert: target solid in non-active lane, tap that lane
        isCorrect = lane === currentTarget.lane;
      }
    }

    if (isCorrect) {
      setCorrectTaps(prev => prev + 1);
      setBlockScores(prev => {
        const updated = [...prev];
        updated[currentBlock] += 10;
        return updated;
      });
      if (!hasRespondedAfterSwitch) {
        setSwitchLatencies(prev => [...prev, timeSinceSwitch]);
        setHasRespondedAfterSwitch(true);
      }
      setShowFeedback({ lane, type: "correct" });
      // Consume the target so repeated taps don't farm points
      setCurrentTarget(null);
    } else {
      setBlockScores(prev => {
        const updated = [...prev];
        updated[currentBlock] = Math.max(0, updated[currentBlock] - 5);
        return updated;
      });
      if (lane === previousLane) {
        setPerseverations(prev => [...prev, timeSinceSwitch]);
      }
      if (actionsAfterSwitch < 2) {
        setErrorsAfterSwitch(prev => prev + 1);
        setPostSwitchErrors(prev => [...prev, 1]);
      }
      setShowFeedback({ lane, type: "error" });
    }

    scheduleTimeout(() => setShowFeedback(null), 200);
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
    
    const postSwitchErrorRate = postSwitchActions > 0
      ? postSwitchErrors.length / postSwitchActions
      : 0;

    const hitRate = goTargetsPresented > 0 ? correctTaps / goTargetsPresented : 0;
    const falseAlarmRate = totalTaps > 0 ? (totalTaps - correctTaps) / totalTaps : 0;
    const rtVariability = switchLatencies.length > 0
      ? Math.sqrt(switchLatencies.reduce((sum, value) => sum + Math.pow(value - switchLatencyAvg, 2), 0) / switchLatencies.length)
      : 0;
    
    // Recovery speed: inverse of switch latency, normalized
    const recoverySpeedIndex = Math.max(0, Math.min(1, 1 - (switchLatencyAvg / 2000)));
    
    // Degradation: Block 1 vs Block 3
    const block1Score = blockScores[0];
    const block3Score = blockScores[2];
    const maxBlockScore = Math.max(block1Score, block3Score, 1);
    const degradationSlope = (block3Score - block1Score) / maxBlockScore;
    
    // Total score
    const precision = 1 - falseAlarmRate;
    const totalScore = Math.round(Math.max(0, Math.min(100, 100 * (0.6 * hitRate + 0.4 * precision))));
    
    // XP calculation - v1.5: Using centralized XP
    const isPerfect = totalScore >= 90 && perseverationRate < 0.1 && switchLatencyAvg < 500 && degradationSlope > -0.2;
    const baseXP = calculateScoredDrillXP(difficulty, totalScore, isPerfect);
    const quality = calculateQualityBonus("S1-AE", baseXP, {
      hitRate,
      falseAlarmRate,
      rtVariability,
      degradationSlope,
    }, difficulty);
    
    return {
      score: totalScore,
      xpAwarded: quality.totalXP,
      switchLatencyAvg,
      perseverationRate,
      postSwitchErrorRate,
      hitRate,
      falseAlarmRate,
      rtVariability,
      recoverySpeedIndex,
      degradationSlope,
      block1Score,
      block2Score: blockScores[1],
      block3Score,
      isPerfect,
      difficulty,
      qualityScore: quality.qualityScore,
      qualityLine: quality.qualityLine,
      bonusApplied: quality.bonus > 0,
    };
  }, [phase, blockScores, switchLatencies, perseverations, postSwitchErrors, postSwitchActions, totalTaps, correctTaps, goTargetsPresented, difficulty]);

  useEffect(() => {
    if (phase !== "results" || !results || saveStartedRef.current) return;
    saveStartedRef.current = true;
    void onComplete(results).then(setPersistedXP).catch(() => setPersistedXP(0));
  }, [onComplete, phase, results]);
  
  // ============================================
  // RENDER
  // ============================================
  
  // Instruction screen
  if (phase === "instruction") {
    return (
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-8">
        {onExit && <GameExitButton onExit={onExit} />}
        <motion.div
          initial={false}
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
                <span className="text-foreground font-medium">3 blocks, 3 rules</span> — Lock, Inhibit, Invert. The rule changes each block.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleStart}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm"
          >
            Start Drill
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Countdown screen
  if (phase === "countdown") {
    return (
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center">
        {onExit && <GameExitButton onExit={onExit} />}
        <motion.div
          key={countdown}
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
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
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-8">
        {onExit && <GameExitButton onExit={onExit} />}
        <motion.div
          initial={false}
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

          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-left space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">New rule</div>
            <div className="text-sm text-foreground font-medium">
              {BLOCK_CONFIGS[currentBlock + 1].label}
            </div>
            <div className="text-xs text-muted-foreground">
              {BLOCK_CONFIGS[currentBlock + 1].rule}
            </div>
          </div>

          <button
            onClick={handleNextBlock}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm"
          >
            Start Block {currentBlock + 2}
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Results screen
  if (phase === "results" && results) {
    if (persistedXP === null) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center text-sm text-muted-foreground">
          Saving session…
        </div>
      );
    }
    return (
      <div className="relative">
        {onExit && <GameExitButton onExit={onExit} />}
        <FocusSwitchResults
          results={{ ...results, xpAwarded: persistedXP }}
          onContinue={() => onExit?.()}
        />
      </div>
    );
  }
  
  // Playing screen
  const blockProgress = 1 - (blockTimeRemaining / BLOCK_CONFIGS[currentBlock].duration);
  
  const blockMode = BLOCK_CONFIGS[currentBlock].mode;
  const ruleText = BLOCK_CONFIGS[currentBlock].rule;

  return (
    <div className="relative min-h-[70vh] flex flex-col px-4 py-6">
      {onExit && <GameExitButton onExit={onExit} />}
      {/* Header */}
      <div className="text-center mb-4 space-y-2">
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

      {/* Rule banner — distinct per block */}
      <div className="max-w-md mx-auto w-full mb-4">
        <div className={cn(
          "px-3 py-2 rounded-lg text-xs text-center border",
          blockMode === "lock" && "bg-cyan-500/10 border-cyan-400/30 text-cyan-100",
          blockMode === "inhibit" && "bg-amber-500/10 border-amber-400/30 text-amber-100",
          blockMode === "invert" && "bg-rose-500/10 border-rose-400/30 text-rose-100",
        )}>
          {ruleText}
        </div>
      </div>

      {/* Lanes */}
      <div className="flex-1 flex gap-3 justify-center items-stretch max-w-md mx-auto w-full">
        {Array.from({ length: laneCount }).map((_, i) => {
          const isActive = i === activeLane;
          const colors = LANE_COLORS[i];
          const hasFeedback = showFeedback?.lane === i;
          const showTargetHere = currentTarget?.lane === i;
          const targetType = currentTarget?.type;

          return (
            <motion.button
              key={i}
              onClick={() => handleLaneTap(i)}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "flex-1 rounded-2xl relative overflow-hidden transition-all duration-200 select-none",
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
              {/* Highlight halo (active lane) */}
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm" />
                </div>
              )}

              {/* Inactive subtle indicator */}
              {!isActive && !showTargetHere && (
                <div className="w-8 h-8 rounded-full border border-white/10" />
              )}

              {/* Target — appears in target.lane (could be active or non-active depending on mode) */}
              <AnimatePresence>
                {showTargetHere && (
                  <motion.div
                    key={`target-${i}-${targetType}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={cn(
                      "absolute w-12 h-12 rounded-full pointer-events-none",
                      targetType === "solid"
                        ? "bg-white shadow-lg shadow-white/40"
                        : "border-[3px] border-white/80 bg-transparent"
                    )}
                  />
                )}
              </AnimatePresence>

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
