/**
 * HIDDEN RULE LAB — Main Game Component
 * 
 * S2-IN (Insight) training game.
 * Abductive reasoning + hypothesis testing.
 * 
 * 12 rounds across 3 acts:
 * - Act I (1-4): DISCOVER - observe examples, pick hypothesis
 * - Act II (5-8): TEST - pick informative tests, update hypothesis
 * - Act III (9-12): LOCK (round 9) + APPLY (rounds 10-12)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, Lightbulb, FlaskConical, Lock, ArrowRight } from "lucide-react";
import { GameExitButton } from "@/components/games/GameExitButton";
import {
  generateSession,
  SESSION_CONFIG,
  RuleSet,
  Hypothesis,
  RoundType,
  ActIndex,
  InputObject,
  OutputResult,
  TestOption,
  Difficulty,
} from "./hiddenRuleLabContent";

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
  inputObject: InputObject | null;
  outputCorrect: OutputResult | null;
  userHypothesis: Hypothesis | "NA" | null;
  lockedRule: Hypothesis | null;
  userPrediction: OutputResult | null;
  isCorrect: boolean;
  reactionTimeMs: number;
  testOptions?: { id: string; infoGainScore: number }[];
  chosenTestId?: string;
  chosenTestInfoGain?: number;
}

// Session metrics
export interface SessionMetrics {
  ruleIdAcc: number;        // 100 if locked rule correct, else 0
  testQualityScore: number; // Average infoGain of chosen tests (0-100)
  generalizationAcc: number; // % correct in apply rounds
  hypothesisSwitchCount: number;
  redundantTestsCount: number;
  sessionScore: number;     // Composite score 0-100
}

interface HiddenRuleLabDrillProps {
  difficulty: Difficulty;
  onComplete: (results: RoundResult[], metrics: SessionMetrics, durationSeconds: number) => void;
  onExit?: () => void;
}

export function HiddenRuleLabDrill({ difficulty, onComplete, onExit }: HiddenRuleLabDrillProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Session state
  const [ruleSet] = useState<RuleSet>(() => generateSession(difficulty));
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"ready" | "playing" | "feedback" | "complete">("ready");
  
  // Hypothesis tracking
  const [currentHypothesis, setCurrentHypothesis] = useState<Hypothesis | "NA" | null>(null);
  const [lockedRule, setLockedRule] = useState<Hypothesis | null>(null);
  const [hypothesisHistory, setHypothesisHistory] = useState<(Hypothesis | "NA")[]>([]);
  
  // Test phase state
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(null);
  const [revealedOutput, setRevealedOutput] = useState<OutputResult | null>(null);
  const [testPhaseStep, setTestPhaseStep] = useState<"pick-test" | "see-output" | "pick-hypothesis">("pick-test");
  
  // Apply phase state
  const [userPrediction, setUserPrediction] = useState<number | null>(null);
  
  // Idle hint
  const [showIdleHint, setShowIdleHint] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timing refs
  const roundStartTimeRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(Date.now());
  
  // Determine round type
  const getRoundType = (roundIdx: number): RoundType => {
    if (roundIdx < 4) return "discover";
    if (roundIdx < 8) return "test";
    if (roundIdx === 8) return "lock";
    return "apply";
  };
  
  const getActIndex = (roundIdx: number): ActIndex => {
    if (roundIdx < 4) return 1;
    if (roundIdx < 8) return 2;
    return 3;
  };
  
  const roundType = getRoundType(currentRound);
  const actIndex = getActIndex(currentRound);
  
  // Current data
  const currentExample = roundType === "discover" ? ruleSet.discoverExamples[currentRound] : null;
  const currentTestOptions = roundType === "test" ? ruleSet.testOptions[currentRound - 4] : null;
  const currentApplyInput = roundType === "apply" ? ruleSet.applyInputs[currentRound - 9] : null;
  
  // Elapsed time display
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  useEffect(() => {
    if (phase === "playing") {
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
  }, [phase, currentRound, testPhaseStep]);
  
  // Motion config
  const motionConfig = useMemo(() => ({
    card: {
      initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
      animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
      exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
      transition: { duration: 0.3, ease: EASE_PREMIUM },
    },
  }), [prefersReducedMotion]);
  
  // Handle hypothesis selection (Discover & Test phases)
  const handleHypothesisSelect = useCallback((hyp: Hypothesis | "NA") => {
    if (phase !== "playing") return;
    
    const reactionTime = Date.now() - roundStartTimeRef.current;
    safeHaptic(15);
    setCurrentHypothesis(hyp);
    setHypothesisHistory(prev => [...prev, hyp]);
    
    if (roundType === "discover") {
      // Record discover result
      const result: RoundResult = {
        roundIndex: currentRound,
        actIndex,
        roundType: "discover",
        inputObject: currentExample?.input || null,
        outputCorrect: currentExample?.output || null,
        userHypothesis: hyp,
        lockedRule: null,
        userPrediction: null,
        isCorrect: hyp === ruleSet.correctHypothesis,
        reactionTimeMs: reactionTime,
      };
      setResults(prev => [...prev, result]);
      proceedToNextRound();
    } else if (roundType === "test" && testPhaseStep === "pick-hypothesis") {
      // Complete test round
      const chosenTest = currentTestOptions?.[selectedTestIndex!];
      const result: RoundResult = {
        roundIndex: currentRound,
        actIndex,
        roundType: "test",
        inputObject: chosenTest?.input || null,
        outputCorrect: revealedOutput,
        userHypothesis: hyp,
        lockedRule: null,
        userPrediction: null,
        isCorrect: hyp === ruleSet.correctHypothesis,
        reactionTimeMs: reactionTime,
        testOptions: currentTestOptions?.map(t => ({ id: t.input.id, infoGainScore: t.infoGainScore })),
        chosenTestId: chosenTest?.input.id,
        chosenTestInfoGain: chosenTest?.infoGainScore,
      };
      setResults(prev => [...prev, result]);
      setSelectedTestIndex(null);
      setRevealedOutput(null);
      setTestPhaseStep("pick-test");
      proceedToNextRound();
    }
  }, [phase, roundType, testPhaseStep, currentRound, actIndex, currentExample, currentTestOptions, selectedTestIndex, revealedOutput, ruleSet.correctHypothesis]);
  
  // Handle test selection
  const handleTestSelect = useCallback((index: number) => {
    if (phase !== "playing" || testPhaseStep !== "pick-test") return;
    
    safeHaptic(12);
    setSelectedTestIndex(index);
    
    // Reveal output based on ACTUAL hidden rule
    const chosenTest = currentTestOptions![index];
    const actualOutput = ruleSet.hypotheses.find(h => h.id === ruleSet.correctHypothesis)!.evaluate(chosenTest.input);
    setRevealedOutput(actualOutput);
    setTestPhaseStep("see-output");
    
    // Auto-advance to hypothesis selection after brief pause
    setTimeout(() => {
      setTestPhaseStep("pick-hypothesis");
    }, 1200);
  }, [phase, testPhaseStep, currentTestOptions, ruleSet]);
  
  // Handle lock rule
  const handleLockRule = useCallback((hyp: Hypothesis) => {
    if (phase !== "playing" || roundType !== "lock") return;
    
    const reactionTime = Date.now() - roundStartTimeRef.current;
    safeHaptic(20);
    setLockedRule(hyp);
    setHypothesisHistory(prev => [...prev, hyp]);
    
    const result: RoundResult = {
      roundIndex: currentRound,
      actIndex,
      roundType: "lock",
      inputObject: null,
      outputCorrect: null,
      userHypothesis: hyp,
      lockedRule: hyp,
      userPrediction: null,
      isCorrect: hyp === ruleSet.correctHypothesis,
      reactionTimeMs: reactionTime,
    };
    setResults(prev => [...prev, result]);
    proceedToNextRound();
  }, [phase, roundType, currentRound, actIndex, ruleSet.correctHypothesis]);
  
  // Handle apply prediction
  const handleApplyPrediction = useCallback((prediction: number) => {
    if (phase !== "playing" || roundType !== "apply" || !lockedRule) return;
    
    const reactionTime = Date.now() - roundStartTimeRef.current;
    
    // Calculate correct output based on locked rule
    const lockedHyp = ruleSet.hypotheses.find(h => h.id === lockedRule)!;
    const correctOutput = lockedHyp.evaluate(currentApplyInput!);
    const isCorrect = prediction === correctOutput.category;
    
    safeHaptic(isCorrect ? 15 : 25);
    setUserPrediction(prediction);
    setPhase("feedback");
    
    const result: RoundResult = {
      roundIndex: currentRound,
      actIndex,
      roundType: "apply",
      inputObject: currentApplyInput,
      outputCorrect: correctOutput,
      userHypothesis: lockedRule,
      lockedRule,
      userPrediction: { category: prediction, label: prediction === 0 ? "Alpha" : "Beta" },
      isCorrect,
      reactionTimeMs: reactionTime,
    };
    setResults(prev => [...prev, result]);
    
    // Brief feedback then proceed
    setTimeout(() => {
      setUserPrediction(null);
      setPhase("playing");
      proceedToNextRound();
    }, 600);
  }, [phase, roundType, lockedRule, currentApplyInput, currentRound, actIndex, ruleSet]);
  
  // Proceed to next round
  const proceedToNextRound = useCallback(() => {
    if (currentRound + 1 >= SESSION_CONFIG.totalRounds) {
      setPhase("complete");
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      
      setTimeout(() => {
        setResults(finalResults => {
          const metrics = calculateMetrics(finalResults, ruleSet.correctHypothesis);
          onComplete(finalResults, metrics, durationSeconds);
          return finalResults;
        });
      }, 100);
    } else {
      setCurrentRound(prev => prev + 1);
      roundStartTimeRef.current = Date.now();
    }
  }, [currentRound, onComplete, ruleSet.correctHypothesis]);
  
  // Calculate session metrics
  const calculateMetrics = (allResults: RoundResult[], correctRule: Hypothesis): SessionMetrics => {
    // Rule identification accuracy
    const lockResult = allResults.find(r => r.roundType === "lock");
    const ruleIdAcc = lockResult?.lockedRule === correctRule ? 100 : 0;
    
    // Test quality score
    const testResults = allResults.filter(r => r.roundType === "test");
    const testQualityScore = testResults.length > 0
      ? Math.round(testResults.reduce((sum, r) => sum + (r.chosenTestInfoGain || 0), 0) / testResults.length)
      : 0;
    
    // Generalization accuracy
    const applyResults = allResults.filter(r => r.roundType === "apply");
    const generalizationAcc = applyResults.length > 0
      ? Math.round((applyResults.filter(r => r.isCorrect).length / applyResults.length) * 100)
      : 0;
    
    // Hypothesis switch count
    const hypothesisSelections = allResults
      .filter(r => r.userHypothesis !== null)
      .map(r => r.userHypothesis);
    let hypothesisSwitchCount = 0;
    for (let i = 1; i < hypothesisSelections.length; i++) {
      if (hypothesisSelections[i] !== hypothesisSelections[i - 1]) {
        hypothesisSwitchCount++;
      }
    }
    
    // Redundant tests count
    const redundantTestsCount = testResults.filter(r => (r.chosenTestInfoGain || 0) < 40).length;
    
    // Composite session score
    const sessionScore = Math.round(
      Math.max(0, Math.min(100, 0.45 * ruleIdAcc + 0.35 * testQualityScore + 0.20 * generalizationAcc))
    );
    
    return {
      ruleIdAcc,
      testQualityScore,
      generalizationAcc,
      hypothesisSwitchCount,
      redundantTestsCount,
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
      {/* Exit button - offset to avoid timer overlap */}
      {onExit && <GameExitButton onExit={onExit} className="right-14" />}
      
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
            {actIndex === 1 && "Discover"}
            {actIndex === 2 && "Test"}
            {actIndex === 3 && (roundType === "lock" ? "Lock" : "Apply")}
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
        <div className="max-w-md mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {/* DISCOVER PHASE */}
            {roundType === "discover" && currentExample && (
              <motion.div key={`discover-${currentRound}`} {...motionConfig.card} className="space-y-5">
                {/* Example Card */}
                <div className="p-4 rounded-xl bg-card border border-border/40">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
                    Observed Example
                  </div>
                  
                  {/* Input chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentExample.input.displayChips.map((chip, i) => (
                      <span key={i} className={cn("px-2 py-1 rounded-full text-xs font-medium", chip.color)}>
                        {chip.label}
                      </span>
                    ))}
                  </div>
                  
                  {/* Arrow + Output */}
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                    <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <span className="text-sm font-medium text-violet-300">
                        {currentExample.output.label}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Hypothesis Selection */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
                    Current Hypothesis
                  </div>
                  
                  {ruleSet.hypotheses.map((hyp) => (
                    <button
                      key={hyp.id}
                      onClick={() => handleHypothesisSelect(hyp.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left transition-all",
                        "bg-card border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-violet-400">{hyp.id}</span>
                        </div>
                        <span className="text-sm text-foreground">{hyp.shortLabel}</span>
                      </div>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handleHypothesisSelect("NA")}
                    className="w-full p-3 rounded-xl border text-left transition-all bg-card border-border/40 hover:border-muted-foreground/30 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">?</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Not enough info</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* TEST PHASE */}
            {roundType === "test" && currentTestOptions && (
              <motion.div key={`test-${currentRound}`} {...motionConfig.card} className="space-y-5">
                {testPhaseStep === "pick-test" && (
                  <>
                    {/* Current hypotheses chips */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-foreground/60">Remaining:</span>
                      {ruleSet.hypotheses.map((hyp) => (
                        <span key={hyp.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-300">
                          {hyp.id}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
                      Pick a Test Input
                    </div>
                    
                    {currentTestOptions.map((testOpt, idx) => (
                      <button
                        key={testOpt.input.id}
                        onClick={() => handleTestSelect(idx)}
                        className={cn(
                          "w-full p-4 rounded-xl border text-left transition-all",
                          "bg-card border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.98]"
                        )}
                      >
                        <div className="flex flex-wrap gap-2">
                          {testOpt.input.displayChips.map((chip, i) => (
                            <span key={i} className={cn("px-2 py-1 rounded-full text-xs font-medium", chip.color)}>
                              {chip.label}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </>
                )}
                
                {testPhaseStep === "see-output" && selectedTestIndex !== null && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-card border border-border/40">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
                        Test Result
                      </div>
                      
                      {/* Input chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentTestOptions[selectedTestIndex].input.displayChips.map((chip, i) => (
                          <span key={i} className={cn("px-2 py-1 rounded-full text-xs font-medium", chip.color)}>
                            {chip.label}
                          </span>
                        ))}
                      </div>
                      
                      {/* Arrow + Output */}
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20"
                        >
                          <span className="text-sm font-medium text-violet-300">
                            {revealedOutput?.label}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Low signal badge */}
                    {currentTestOptions[selectedTestIndex].infoGainScore < 40 && (
                      <div className="text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80">
                          Low signal
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {testPhaseStep === "pick-hypothesis" && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                        <FlaskConical className="w-3 h-3" />
                        <span>Test revealed: <strong className="text-violet-300">{revealedOutput?.label}</strong></span>
                      </div>
                    </div>
                    
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
                      Update Hypothesis
                    </div>
                    
                    {ruleSet.hypotheses.map((hyp) => (
                      <button
                        key={hyp.id}
                        onClick={() => handleHypothesisSelect(hyp.id)}
                        className={cn(
                          "w-full p-3 rounded-xl border text-left transition-all",
                          "bg-card border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.98]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-violet-400">{hyp.id}</span>
                          </div>
                          <span className="text-sm text-foreground">{hyp.shortLabel}</span>
                        </div>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handleHypothesisSelect("NA")}
                      className="w-full p-3 rounded-xl border text-left transition-all bg-card border-border/40 hover:border-muted-foreground/30 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center">
                          <span className="text-xs font-semibold text-muted-foreground">?</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Not enough info</span>
                      </div>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* LOCK PHASE */}
            {roundType === "lock" && (
              <motion.div key="lock" {...motionConfig.card} className="space-y-5">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Lock Your Rule</h3>
                  <p className="text-xs text-muted-foreground">
                    Choose the rule you believe is correct. No going back.
                  </p>
                </div>
                
                <div className="space-y-2 pt-4">
                  {ruleSet.hypotheses.map((hyp) => (
                    <button
                      key={hyp.id}
                      onClick={() => handleLockRule(hyp.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        "bg-card border-border/40 hover:border-violet-500/50 hover:bg-violet-500/5 active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-400">{hyp.id}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{hyp.shortLabel}</div>
                          <div className="text-[10px] text-muted-foreground/70">{hyp.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* APPLY PHASE */}
            {roundType === "apply" && currentApplyInput && lockedRule && (
              <motion.div key={`apply-${currentRound}`} {...motionConfig.card} className="space-y-5">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30 mb-4">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                    <Lock className="w-3 h-3 text-violet-400" />
                    <span>Locked rule: <strong className="text-violet-300">{lockedRule}</strong></span>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-card border border-border/40">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
                    New Input — Predict Output
                  </div>
                  
                  {/* Input chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentApplyInput.displayChips.map((chip, i) => (
                      <span key={i} className={cn("px-2 py-1 rounded-full text-xs font-medium", chip.color)}>
                        {chip.label}
                      </span>
                    ))}
                  </div>
                  
                  {/* Prediction buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApplyPrediction(0)}
                      className={cn(
                        "flex-1 p-3 rounded-xl border transition-all",
                        userPrediction === 0 
                          ? "bg-violet-500/20 border-violet-500/50" 
                          : "bg-card border-border/40 hover:border-violet-500/40"
                      )}
                    >
                      <span className="text-sm font-medium">Alpha</span>
                    </button>
                    <button
                      onClick={() => handleApplyPrediction(1)}
                      className={cn(
                        "flex-1 p-3 rounded-xl border transition-all",
                        userPrediction === 1 
                          ? "bg-violet-500/20 border-violet-500/50" 
                          : "bg-card border-border/40 hover:border-violet-500/40"
                      )}
                    >
                      <span className="text-sm font-medium">Beta</span>
                    </button>
                  </div>
                </div>
                
                {/* Feedback indicator */}
                {phase === "feedback" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center"
                  >
                    {results[results.length - 1]?.isCorrect ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                        <X className="w-4 h-4 text-muted-foreground/60" />
                      </div>
                    )}
                  </motion.div>
                )}
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
                {roundType === "test" && testPhaseStep === "pick-test" && "Choose your best test."}
                {roundType === "test" && testPhaseStep === "pick-hypothesis" && "Update your hypothesis."}
                {roundType === "discover" && "Pick your current hypothesis."}
                {roundType === "lock" && "Lock your final answer."}
                {roundType === "apply" && "Apply the locked rule."}
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
