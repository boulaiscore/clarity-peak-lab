/**
 * COUNTEREXAMPLE FORGE — Main Game Component
 * 
 * S2-IN (Insight) training game.
 * Disprove rules, patch them, stress-test.
 * 
 * 10 rounds across 3 acts:
 * - Act I (1-4): BREAK - find counterexample
 * - Act II (5-7): PATCH - choose & test patch
 * - Act III (8-10): STRESS-TEST - stress the patched rule
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, Lightbulb, Hammer, FlaskConical, Shield, ArrowRight } from "lucide-react";
import {
  generateSession,
  SESSION_CONFIG,
  RuleSet,
  TestCase,
  PatchOption,
  Difficulty,
  ActIndex,
  RoundType,
  FeatureChip,
} from "./counterexampleForgeContent";

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Safe haptic
const safeHaptic = (duration: number) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  } catch {}
};

// Round result for analytics
export interface RoundResult {
  roundIndex: number;
  actIndex: ActIndex;
  roundType: RoundType;
  options: { id: string; infoGainScore: number; isCounterexample: boolean }[];
  chosenOptionId: string;
  chosenInfoGain: number;
  outcome: "success" | "failure";
  isCounterexample: boolean;
  reactionTimeMs: number;
  // Patch specific
  chosenPatchId?: "patch1" | "patch2";
}

// Session metrics
export interface SessionMetrics {
  counterexampleFoundActI: boolean;
  assistedBreak: boolean;
  attemptsUsedActI: number;
  chosenPatch: "patch1" | "patch2" | null;
  bestPatch: "patch1" | "patch2";
  efficiency: number;
  patchQuality: number;
  stressTestQuality: number;
  sessionScore: number;
}

interface CounterexampleForgeDrillProps {
  difficulty: Difficulty;
  onComplete: (results: RoundResult[], metrics: SessionMetrics, durationSeconds: number) => void;
}

export function CounterexampleForgeDrill({ difficulty, onComplete }: CounterexampleForgeDrillProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Session state
  const [ruleSet] = useState<RuleSet>(() => generateSession(difficulty));
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"ready" | "playing" | "feedback" | "patch_choice" | "complete">("ready");
  
  // Act I state (Break)
  const [breakAttempts, setBreakAttempts] = useState(0);
  const [counterexampleFound, setCounterexampleFound] = useState(false);
  const [assistedBreak, setAssistedBreak] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  // Act II state (Patch)
  const [chosenPatch, setChosenPatch] = useState<"patch1" | "patch2" | null>(null);
  const [patchTestRound, setPatchTestRound] = useState(0);
  
  // Idle hint
  const [showIdleHint, setShowIdleHint] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timing refs
  const roundStartTimeRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(Date.now());
  
  // Elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  useEffect(() => {
    if (phase === "playing" || phase === "patch_choice") {
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);
  
  // Idle hint timer
  useEffect(() => {
    if (phase === "playing") {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      setShowIdleHint(false);
      idleTimeoutRef.current = setTimeout(() => {
        setShowIdleHint(true);
      }, SESSION_CONFIG.idleHintMs);
    }
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [phase, currentRound]);
  
  // Determine round type and act
  const getRoundType = (roundIdx: number): RoundType => {
    if (roundIdx < 4) return "break";
    if (roundIdx === 4) return "patch_choice";
    if (roundIdx < 7) return "break"; // Actually testing the patch
    return "stress";
  };
  
  const getActIndex = (roundIdx: number): ActIndex => {
    if (roundIdx < 4) return 1;
    if (roundIdx < 7) return 2;
    return 3;
  };
  
  const roundType = getRoundType(currentRound);
  const actIndex = getActIndex(currentRound);
  
  // Current test options
  const getCurrentTestCases = (): TestCase[] => {
    if (actIndex === 1) {
      return ruleSet.breakCases[currentRound] || [];
    } else if (actIndex === 3) {
      return ruleSet.stressCases[currentRound - 7] || [];
    }
    return [];
  };
  
  const testCases = getCurrentTestCases();
  
  // Motion config
  const motionConfig = useMemo(() => ({
    card: {
      initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
      animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
      exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
      transition: { duration: 0.3, ease: EASE_PREMIUM },
    },
  }), [prefersReducedMotion]);
  
  // Handle test case selection (Act I Break or Act III Stress)
  const handleTestSelect = useCallback((testCase: TestCase) => {
    if (phase !== "playing") return;
    
    const reactionTime = Date.now() - roundStartTimeRef.current;
    safeHaptic(15);
    
    // Record result
    const result: RoundResult = {
      roundIndex: currentRound,
      actIndex,
      roundType: actIndex === 1 ? "break" : "stress",
      options: testCases.map(t => ({ id: t.id, infoGainScore: t.infoGainScore, isCounterexample: t.isCounterexample })),
      chosenOptionId: testCase.id,
      chosenInfoGain: testCase.infoGainScore,
      outcome: testCase.actualOutcome,
      isCounterexample: testCase.isCounterexample,
      reactionTimeMs: reactionTime,
    };
    setResults(prev => [...prev, result]);
    
    // Show feedback
    if (actIndex === 1) {
      // Break phase
      if (testCase.isCounterexample) {
        setFeedbackMessage("Claim broken!");
        setCounterexampleFound(true);
        setBreakAttempts(prev => prev + 1);
      } else {
        setFeedbackMessage("Claim survived");
        setBreakAttempts(prev => prev + 1);
      }
    } else {
      // Stress phase
      if (testCase.infoGainScore < 40) {
        setFeedbackMessage("Low signal");
      } else {
        setFeedbackMessage(testCase.actualOutcome === "success" ? "Claim held" : "Edge case found");
      }
    }
    
    setPhase("feedback");
    
    // Proceed after brief pause
    setTimeout(() => {
      setFeedbackMessage(null);
      
      if (actIndex === 1) {
        // Check if we need to assist or proceed
        if (testCase.isCounterexample || breakAttempts + 1 >= SESSION_CONFIG.maxBreakAttempts) {
          if (!testCase.isCounterexample && breakAttempts + 1 >= SESSION_CONFIG.maxBreakAttempts) {
            // Assisted break
            setAssistedBreak(true);
            setCounterexampleFound(true);
          }
          // Move to patch choice (round 4 -> 4 which is patch_choice)
          if (currentRound >= 3) {
            setPhase("patch_choice");
            setCurrentRound(4);
            roundStartTimeRef.current = Date.now();
          } else {
            proceedToNextRound();
          }
        } else {
          proceedToNextRound();
        }
      } else {
        proceedToNextRound();
      }
    }, 600);
  }, [phase, testCases, currentRound, actIndex, breakAttempts]);
  
  // Handle patch choice
  const handlePatchChoice = useCallback((patchId: "patch1" | "patch2") => {
    if (phase !== "patch_choice") return;
    
    safeHaptic(15);
    setChosenPatch(patchId);
    
    // Record patch choice result
    const result: RoundResult = {
      roundIndex: currentRound,
      actIndex: 2,
      roundType: "patch_choice",
      options: ruleSet.patches.map(p => ({ id: p.id, infoGainScore: p.isBetter ? 100 : 0, isCounterexample: false })),
      chosenOptionId: patchId,
      chosenInfoGain: ruleSet.patches.find(p => p.id === patchId)?.isBetter ? 100 : 0,
      outcome: "success",
      isCounterexample: false,
      reactionTimeMs: Date.now() - roundStartTimeRef.current,
      chosenPatchId: patchId,
    };
    setResults(prev => [...prev, result]);
    
    // Show feedback briefly
    setFeedbackMessage("Patch applied");
    setPhase("feedback");
    
    setTimeout(() => {
      setFeedbackMessage(null);
      // Skip to Act III (stress tests)
      setCurrentRound(7);
      setPhase("playing");
      roundStartTimeRef.current = Date.now();
    }, 800);
  }, [phase, ruleSet.patches, currentRound]);
  
  // Proceed to next round
  const proceedToNextRound = useCallback(() => {
    if (currentRound + 1 >= SESSION_CONFIG.totalRounds) {
      setPhase("complete");
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      
      setTimeout(() => {
        setResults(finalResults => {
          const metrics = calculateMetrics(finalResults, ruleSet, counterexampleFound, assistedBreak, breakAttempts, chosenPatch);
          onComplete(finalResults, metrics, durationSeconds);
          return finalResults;
        });
      }, 100);
    } else {
      const nextRound = currentRound + 1;
      
      // Check if entering patch choice
      if (nextRound === 4 && actIndex === 1) {
        setPhase("patch_choice");
        setCurrentRound(4);
      } else if (nextRound >= 5 && nextRound < 7) {
        // Skip patch test rounds (5-6) and go straight to stress tests
        setCurrentRound(7);
        setPhase("playing");
      } else {
        setCurrentRound(nextRound);
        setPhase("playing");
      }
      roundStartTimeRef.current = Date.now();
    }
  }, [currentRound, onComplete, ruleSet, counterexampleFound, assistedBreak, breakAttempts, chosenPatch, actIndex]);
  
  // Calculate session metrics
  const calculateMetrics = (
    allResults: RoundResult[],
    rules: RuleSet,
    foundCounterexample: boolean,
    wasAssisted: boolean,
    attempts: number,
    patch: "patch1" | "patch2" | null
  ): SessionMetrics => {
    // Efficiency
    let efficiency = 30; // Default if assisted
    if (!wasAssisted && foundCounterexample) {
      efficiency = attempts === 1 ? 100 : 60;
    }
    
    // Patch quality
    const bestPatch = rules.patches.find(p => p.isBetter)?.id || "patch1";
    const patchQuality = patch === bestPatch ? 100 : 0;
    
    // Stress test quality
    const stressResults = allResults.filter(r => r.roundType === "stress");
    const stressTestQuality = stressResults.length > 0
      ? Math.round(stressResults.reduce((sum, r) => sum + r.chosenInfoGain, 0) / stressResults.length)
      : 0;
    
    // Session score
    const sessionScore = Math.round(
      Math.max(0, Math.min(100, 0.40 * efficiency + 0.25 * patchQuality + 0.35 * stressTestQuality))
    );
    
    return {
      counterexampleFoundActI: foundCounterexample,
      assistedBreak: wasAssisted,
      attemptsUsedActI: attempts,
      chosenPatch: patch,
      bestPatch: bestPatch as "patch1" | "patch2",
      efficiency,
      patchQuality,
      stressTestQuality,
      sessionScore,
    };
  };
  
  // Start game
  useEffect(() => {
    if (phase === "ready") {
      const timeout = setTimeout(() => {
        setPhase("playing");
        sessionStartRef.current = Date.now();
        roundStartTimeRef.current = Date.now();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [phase]);
  
  // Progress calculation
  const progress = ((currentRound + 1) / SESSION_CONFIG.totalRounds) * 100;
  
  // Format elapsed time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  // Render feature chips
  const renderChips = (chips: FeatureChip[]) => (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip, i) => (
        <span key={i} className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", chip.color)}>
          {chip.label}: {chip.value}
        </span>
      ))}
    </div>
  );
  
  if (phase === "complete") {
    return (
      <motion.div 
        className="fixed inset-0 bg-background"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    );
  }
  
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted/30 w-full">
        <motion.div
          className="h-full bg-violet-500/60"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: EASE_PREMIUM }}
        />
      </div>
      
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-violet-400">
            Act {actIndex}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {actIndex === 1 && "Break"}
            {actIndex === 2 && "Patch"}
            {actIndex === 3 && "Stress-Test"}
          </span>
          <span className="text-[10px] text-muted-foreground/40">•</span>
          <span className="text-xs text-muted-foreground">
            {currentRound + 1} / {SESSION_CONFIG.totalRounds}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/50 font-mono">
          {formatTime(elapsedSeconds)}
        </span>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-5">
          <AnimatePresence mode="wait">
            {/* CLAIM CARD (visible in all phases except patch choice) */}
            {phase !== "patch_choice" && (
              <motion.div key="claim" {...motionConfig.card}>
                <div className="p-4 rounded-xl bg-card border border-border/40">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-violet-400" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      {actIndex === 3 ? "Patched Rule" : "Proposed Rule"}
                    </span>
                  </div>
                  
                  {/* Claim chips */}
                  <div className="flex items-center gap-2 mb-2">
                    {renderChips(actIndex === 3 ? ruleSet.patchedClaimChips : ruleSet.claimChips)}
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      {ruleSet.claimOutcome}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground/70">
                    {actIndex === 3 ? ruleSet.patchedClaimDescription : ruleSet.claimDescription}
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* ACT I & III: TEST CASE SELECTION */}
            {(actIndex === 1 || actIndex === 3) && phase === "playing" && (
              <motion.div key={`tests-${currentRound}`} {...motionConfig.card} className="space-y-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">
                  {actIndex === 1 ? "Pick a test to break the rule" : "Pick a stress test"}
                </div>
                
                {testCases.map((testCase, idx) => (
                  <button
                    key={testCase.id}
                    onClick={() => handleTestSelect(testCase)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-all",
                      "bg-card border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-violet-400">{String.fromCharCode(65 + idx)}</span>
                      </div>
                      <div className="flex-1">
                        {renderChips(testCase.features)}
                      </div>
                    </div>
                  </button>
                ))}
                
                {actIndex === 1 && (
                  <div className="text-center text-[10px] text-muted-foreground/50">
                    Attempt {breakAttempts + 1}/{SESSION_CONFIG.maxBreakAttempts}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* PATCH CHOICE (Act II start) */}
            {phase === "patch_choice" && (
              <motion.div key="patch-choice" {...motionConfig.card} className="space-y-5">
                <div className="text-center space-y-2 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                    <Hammer className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-base font-semibold">Choose a Patch</h3>
                  <p className="text-xs text-muted-foreground">
                    Which fix makes the rule more robust?
                  </p>
                </div>
                
                <div className="space-y-3">
                  {ruleSet.patches.map((patch) => (
                    <button
                      key={patch.id}
                      onClick={() => handlePatchChoice(patch.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        "bg-card border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-violet-400">
                            {patch.id === "patch1" ? "1" : "2"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            {patch.description}
                          </div>
                          {renderChips(patch.chips)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* FEEDBACK OVERLAY */}
            {phase === "feedback" && feedbackMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10"
              >
                <div className={cn(
                  "px-6 py-3 rounded-xl border",
                  feedbackMessage.includes("broken") || feedbackMessage.includes("Edge")
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : feedbackMessage.includes("Low")
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-muted/30 border-border/30 text-muted-foreground"
                )}>
                  <span className="text-sm font-medium">{feedbackMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Idle hint */}
      <AnimatePresence>
        {showIdleHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pb-4 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/30">
              <Lightbulb className="w-3 h-3 text-amber-400/70" />
              <span className="text-[10px] text-muted-foreground">
                Pick the strongest test.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom guidance */}
      <motion.div 
        className="pb-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-[10px] text-muted-foreground/50">
          Take your time • Deliberate thinking encouraged
        </span>
      </motion.div>
    </div>
  );
}
