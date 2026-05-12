/**
 * SEMANTIC DRIFT — Main Game Component (v2)
 *
 * S1-RA fast intuitive semantic linking under time pressure.
 *
 * Fixes vs v1:
 * - Stale-closure bug: timer kept calling the first handleTimeout, so
 *   sessions never ended (>25 rounds). Now uses a ref for the latest
 *   handler.
 * - Flicker: timer bar no longer restarts a framer animation every 100ms;
 *   it uses a CSS transition on width.
 * - Premium pass: minimalist Executive-Calm aesthetic, larger seed,
 *   refined option chips, subtle dividers.
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

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

const safeHaptic = (duration: number) => {
  try {
    if ("vibrate" in navigator) navigator.vibrate(duration);
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
  const [phase, setPhase] = useState<"ready" | "playing" | "feedback" | "transitioning" | "complete">("ready");

  // Round state
  const [timerKey, setTimerKey] = useState(0); // bumps each round to restart CSS transition
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | "timeout" | null>(null);

  // Refs for the latest values (avoid stale closures in interval/timeout callbacks)
  const currentRoundRef = useRef(0);
  const resultsRef = useRef<RoundResult[]>([]);
  const phaseRef = useRef(phase);
  const selectedRef = useRef<number | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { selectedRef.current = selectedIndex; }, [selectedIndex]);

  const currentNode = nodes[currentRound];

  // Shuffle options once per round (not per phase change)
  const [shuffledOptions, setShuffledOptions] = useState<{ option: SemanticOption; originalIndex: number }[]>([]);
  useEffect(() => {
    if (!currentNode) return;
    const indexed = currentNode.options.map((opt, idx) => ({ option: opt, originalIndex: idx }));
    setShuffledOptions(indexed.sort(() => Math.random() - 0.5));
  }, [currentNode]);

  // Clear any pending timeout
  const clearRoundTimeout = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  // Forward declarations through refs to break the cycle
  const proceedRef = useRef<() => void>(() => {});
  const handleTimeoutRef = useRef<() => void>(() => {});

  // Proceed to next round (or finish)
  const proceedToNextRound = useCallback(() => {
    clearRoundTimeout();
    const next = currentRoundRef.current + 1;
    if (next >= config.rounds) {
      setPhase("complete");
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      setTimeout(() => onComplete(resultsRef.current, durationSeconds), 60);
      return;
    }
    setCurrentRound(next);
    setSelectedIndex(null);
    setFeedbackState(null);
    setPhase("playing");
    startRound(next);
  }, [clearRoundTimeout, config.rounds, onComplete]);

  // Handle a timed-out round
  const handleTimeout = useCallback(() => {
    if (phaseRef.current !== "playing" || selectedRef.current !== null) return;
    setFeedbackState("timeout");
    safeHaptic(30);

    const node = nodes[currentRoundRef.current];
    const correctOption = node.options.find((o) => o.tag === "directional")!;
    resultsRef.current.push({
      roundIndex: currentRoundRef.current,
      seed: node.seed,
      options: node.options,
      correctOption: correctOption.word,
      chosenOption: null,
      reactionTimeMs: null,
      timeoutFlag: true,
      chosenTag: null,
    });

    setTimeout(() => proceedRef.current(), 220);
  }, [nodes]);

  // Keep refs in sync with latest functions
  useEffect(() => { proceedRef.current = proceedToNextRound; }, [proceedToNextRound]);
  useEffect(() => { handleTimeoutRef.current = handleTimeout; }, [handleTimeout]);

  // Start round (timer + key bump for css bar)
  const startRound = useCallback(
    (roundIdx: number) => {
      clearRoundTimeout();
      roundStartTimeRef.current = Date.now();
      setTimerKey((k) => k + 1);
      // Single setTimeout per round – no interval, no flicker
      timeoutTimerRef.current = setTimeout(() => {
        handleTimeoutRef.current();
      }, config.timePerRound);
    },
    [clearRoundTimeout, config.timePerRound]
  );

  // Handle option selection
  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (phaseRef.current !== "playing" || selectedRef.current !== null) return;
      clearRoundTimeout();

      const reactionTime = Date.now() - roundStartTimeRef.current;
      const selected = shuffledOptions[optionIndex];
      const isCorrect = selected.option.tag === "directional";

      setSelectedIndex(optionIndex);
      setFeedbackState(isCorrect ? "correct" : "wrong");
      safeHaptic(isCorrect ? 15 : 25);

      const node = nodes[currentRoundRef.current];
      const correctOption = node.options.find((o) => o.tag === "directional")!;
      resultsRef.current.push({
        roundIndex: currentRoundRef.current,
        seed: node.seed,
        options: node.options,
        correctOption: correctOption.word,
        chosenOption: selected.option.word,
        reactionTimeMs: reactionTime,
        timeoutFlag: false,
        chosenTag: selected.option.tag,
      });

      setTimeout(() => proceedRef.current(), isCorrect ? 320 : 260);
    },
    [clearRoundTimeout, shuffledOptions, nodes]
  );

  // Kick off the session
  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(() => {
        setPhase("playing");
        sessionStartRef.current = Date.now();
        startRound(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [phase, startRound]);

  // Cleanup
  useEffect(() => {
    return () => clearRoundTimeout();
  }, [clearRoundTimeout]);

  const progress = ((currentRound + 1) / config.rounds) * 100;

  const seedMotion = useMemo(
    () => ({
      initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
      animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
      exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
      transition: { duration: 0.22, ease: EASE_PREMIUM },
    }),
    [prefersReducedMotion]
  );

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
      {onExit && <GameExitButton onExit={onExit} />}

      {/* Top bars: progress + timer (CSS-only, no framer flicker) */}
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="h-[2px] bg-muted/20 w-full overflow-hidden">
          <div
            className="h-full bg-foreground/40 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="h-[2px] bg-muted/10 w-full overflow-hidden">
          <div
            key={timerKey}
            className="h-full bg-primary/60 origin-right"
            style={{
              width: "100%",
              animation: `sd-shrink ${config.timePerRound}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes sd-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="w-full max-w-sm flex flex-col items-center">

          {/* Tiny header label */}
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-6">
            Pick the closest link
          </div>

          {/* Seed word — central concept */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`seed-${currentRound}`}
              {...seedMotion}
              className="text-center mb-12"
            >
              <div className="text-4xl sm:text-5xl font-light tracking-tight text-foreground">
                {currentNode?.seed}
              </div>
              <div className="mt-3 mx-auto h-px w-12 bg-foreground/20" />
            </motion.div>
          </AnimatePresence>

          {/* Options grid - 2x2 */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {shuffledOptions.map((item, index) => {
              const isSelected = selectedIndex === index;
              const isCorrect = item.option.tag === "directional";
              const reveal = feedbackState !== null;

              const stateClass = !reveal
                ? "border-border/40 bg-card/40 hover:bg-card/70 hover:border-border/70"
                : isSelected && isCorrect
                ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-400"
                : isSelected && !isCorrect
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : isCorrect
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400/90"
                : "border-border/20 bg-card/20 opacity-60";

              return (
                <motion.button
                  key={`${currentRound}-${index}`}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.18,
                    delay: prefersReducedMotion ? 0 : index * 0.04,
                    ease: EASE_PREMIUM,
                  }}
                  onClick={() => handleSelect(index)}
                  disabled={feedbackState !== null || phase !== "playing"}
                  whileTap={!reveal ? { scale: 0.97 } : undefined}
                  className={cn(
                    "py-5 px-3 rounded-xl border backdrop-blur-sm",
                    "text-base font-medium text-foreground",
                    "transition-colors duration-200",
                    stateClass
                  )}
                >
                  {item.option.word}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Round counter */}
      <div className="pb-[max(env(safe-area-inset-bottom),1.25rem)] text-center">
        <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground/70">
          {String(currentRound + 1).padStart(2, "0")} / {String(config.rounds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
