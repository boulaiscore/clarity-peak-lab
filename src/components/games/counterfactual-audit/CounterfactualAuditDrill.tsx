/**
 * COUNTERFACTUAL AUDIT — Main Game Component
 * 
 * S2-CT (Critical Thinking) training game.
 * Identifies the minimal missing/changed evidence that would flip a decision.
 * 
 * KEY DESIGN:
 * - 45s per-round countdown (subtle ring, not panic)
 * - Confidence slider after option selection
 * - Minimal feedback during play (correct/incorrect + 1-line)
 * - Premium dark UI matching NeuroLoop design
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { GameExitButton } from "@/components/games/GameExitButton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  generateSession,
  DIFFICULTY_CONFIG,
  AuditRound,
  AuditOption,
  Difficulty,
} from "./counterfactualAuditContent";

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

// Round result type
export interface RoundResult {
  roundIndex: number;
  decisionLabel: string;
  evidenceBullets: string[];
  options: AuditOption[];
  correctOptionId: string;
  chosenOptionId: string;
  isCorrect: boolean;
  confidencePct: number;
  responseTimeMs: number;
  timeoutFlag: boolean;
}

// Session metrics
export interface SessionMetrics {
  accuracyPct: number;
  evidenceDisciplineScore: number;
  calibrationScore: number;
  s2Consistency: number;
  sessionScore: number;
  meanRT: number;
  sdRT: number;
}

interface CounterfactualAuditDrillProps {
  difficulty: Difficulty;
  onComplete: (results: RoundResult[], metrics: SessionMetrics, durationSeconds: number) => void;
  onExit?: () => void;
}

export function CounterfactualAuditDrill({ difficulty, onComplete, onExit }: CounterfactualAuditDrillProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Session state
  const [rounds] = useState<AuditRound[]>(() => generateSession(difficulty));
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"playing" | "confidence" | "feedback" | "complete">("playing");
  
  // Round state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [feedbackState, setFeedbackState] = useState<{ correct: boolean; line: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(config.timePerRound);
  
  // Refs
  const roundStartTimeRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Current round data
  const currentRoundData = rounds[currentRound];
  const totalRounds = rounds.length;
  const progress = ((currentRound) / totalRounds) * 100;
  
  // Timer effect
  useEffect(() => {
    if (phase !== "playing") return;
    
    roundStartTimeRef.current = Date.now();
    setTimeRemaining(config.timePerRound);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto submit with timeout
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound, phase]);
  
  // Handle timeout (no selection made in time)
  const handleTimeout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const responseTime = Date.now() - roundStartTimeRef.current;
    
    // Create result with timeout
    const result: RoundResult = {
      roundIndex: currentRound,
      decisionLabel: currentRoundData.decisionLabel,
      evidenceBullets: currentRoundData.evidenceBullets,
      options: currentRoundData.options,
      correctOptionId: currentRoundData.correctOptionId,
      chosenOptionId: "",
      isCorrect: false,
      confidencePct: 0,
      responseTimeMs: responseTime,
      timeoutFlag: true,
    };
    
    safeHaptic(30);
    setResults(prev => [...prev, result]);
    setFeedbackState({ correct: false, line: "Time's up — no selection made." });
    setPhase("feedback");
    
    setTimeout(() => proceedToNextRound(), 1200);
  }, [currentRound, currentRoundData]);
  
  // Handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    if (phase !== "playing" || selectedOption !== null) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(optionId);
    setConfidence(50);
    setPhase("confidence");
    safeHaptic(10);
  }, [phase, selectedOption]);
  
  // Handle confidence submit
  const handleConfidenceSubmit = useCallback(() => {
    if (!selectedOption || phase !== "confidence") return;
    
    const responseTime = Date.now() - roundStartTimeRef.current;
    const chosenOption = currentRoundData.options.find(o => o.id === selectedOption);
    const isCorrect = selectedOption === currentRoundData.correctOptionId;
    
    // Create result
    const result: RoundResult = {
      roundIndex: currentRound,
      decisionLabel: currentRoundData.decisionLabel,
      evidenceBullets: currentRoundData.evidenceBullets,
      options: currentRoundData.options,
      correctOptionId: currentRoundData.correctOptionId,
      chosenOptionId: selectedOption,
      isCorrect,
      confidencePct: confidence,
      responseTimeMs: responseTime,
      timeoutFlag: false,
    };
    
    safeHaptic(isCorrect ? 15 : 25);
    setResults(prev => [...prev, result]);
    
    // Get feedback line
    const feedbackLine = isCorrect
      ? chosenOption?.feedbackLine || "This changes the core mechanism."
      : chosenOption?.feedbackLine || "Not the strongest flip.";
    
    setFeedbackState({ correct: isCorrect, line: feedbackLine });
    setPhase("feedback");
    
    setTimeout(() => proceedToNextRound(), 1200);
  }, [selectedOption, confidence, phase, currentRound, currentRoundData]);
  
  // Change choice (from confidence sheet)
  const handleChangeChoice = useCallback(() => {
    setSelectedOption(null);
    setPhase("playing");
    // Resume timer from where it was
    roundStartTimeRef.current = Date.now() - ((config.timePerRound - timeRemaining) * 1000);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [config.timePerRound, timeRemaining, handleTimeout]);
  
  // Proceed to next round or complete
  const proceedToNextRound = useCallback(() => {
    if (currentRound + 1 >= totalRounds) {
      setPhase("complete");
      
      // Calculate metrics
      setTimeout(() => {
        setResults(finalResults => {
          const metrics = calculateMetrics(finalResults);
          const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
          onComplete(finalResults, metrics, durationSeconds);
          return finalResults;
        });
      }, 100);
    } else {
      setCurrentRound(prev => prev + 1);
      setSelectedOption(null);
      setFeedbackState(null);
      setPhase("playing");
    }
  }, [currentRound, totalRounds, onComplete]);
  
  // Calculate all session metrics
  const calculateMetrics = (results: RoundResult[]): SessionMetrics => {
    const totalRounds = results.length;
    if (totalRounds === 0) {
      return {
        accuracyPct: 0,
        evidenceDisciplineScore: 0,
        calibrationScore: 0,
        s2Consistency: 0,
        sessionScore: 0,
        meanRT: 0,
        sdRT: 0,
      };
    }
    
    // 1) Accuracy
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracyPct = Math.round((correctCount / totalRounds) * 100);
    
    // 2) Evidence Discipline
    let noisePicks = 0;
    let proxyPicks = 0;
    let confounderPicks = 0;
    
    results.forEach(r => {
      if (r.timeoutFlag || r.isCorrect) return;
      const chosenOpt = r.options.find(o => o.id === r.chosenOptionId);
      if (!chosenOpt) return;
      
      if (chosenOpt.optionClass === "noise_irrelevant") noisePicks++;
      if (chosenOpt.optionClass === "proxy_symptom") proxyPicks++;
      if (chosenOpt.optionClass === "confounder_trap") confounderPicks++;
    });
    
    const noiseRate = noisePicks / totalRounds;
    const proxyRate = proxyPicks / totalRounds;
    const confounderRate = confounderPicks / totalRounds;
    const disciplineRaw = 1 - (0.70 * noiseRate + 0.40 * proxyRate + 0.55 * confounderRate);
    const evidenceDisciplineScore = Math.max(0, Math.min(100, Math.round(100 * disciplineRaw)));
    
    // 3) Calibration (Brier score based)
    let brierSum = 0;
    results.forEach(r => {
      const p = r.confidencePct / 100;
      const y = r.isCorrect ? 1 : 0;
      brierSum += Math.pow(p - y, 2);
    });
    const brierMean = brierSum / totalRounds;
    const calibrationScore = Math.max(0, Math.min(100, Math.round(100 * (1 - brierMean))));
    
    // 4) Session Score
    const sessionScore = Math.round(
      0.50 * accuracyPct +
      0.30 * evidenceDisciplineScore +
      0.20 * calibrationScore
    );
    
    // 5) S2 Consistency
    const nonTimeoutResults = results.filter(r => !r.timeoutFlag);
    const responseTimes = nonTimeoutResults.map(r => r.responseTimeMs);
    
    let meanRT = 0;
    let sdRT = 0;
    
    if (responseTimes.length > 0) {
      meanRT = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const variance = responseTimes.reduce((sum, rt) => sum + Math.pow(rt - meanRT, 2), 0) / responseTimes.length;
      sdRT = Math.sqrt(variance);
    }
    
    const rtCV = meanRT > 0 ? sdRT / meanRT : 0;
    const stabilityScore = 100 * (1 - Math.min(1, rtCV / 0.60));
    
    // Block steadiness (split into 3 blocks)
    const blockSize = Math.ceil(results.length / 3);
    const blocks: RoundResult[][] = [];
    for (let i = 0; i < results.length; i += blockSize) {
      blocks.push(results.slice(i, i + blockSize));
    }
    
    const blockAccuracies = blocks.map(block => {
      const correct = block.filter(r => r.isCorrect).length;
      return block.length > 0 ? correct / block.length : 0;
    });
    
    const meanBlockAcc = blockAccuracies.reduce((a, b) => a + b, 0) / blockAccuracies.length;
    const accVariance = blockAccuracies.reduce((sum, acc) => sum + Math.pow(acc - meanBlockAcc, 2), 0) / blockAccuracies.length;
    const accSD = Math.sqrt(accVariance);
    const steadinessScore = 100 * (1 - Math.min(1, accSD / 0.25));
    
    const s2Consistency = Math.max(0, Math.min(100, Math.round(
      0.70 * stabilityScore + 0.30 * steadinessScore
    )));
    
    return {
      accuracyPct,
      evidenceDisciplineScore,
      calibrationScore,
      s2Consistency,
      sessionScore,
      meanRT,
      sdRT,
    };
  };
  
  // Timer ring progress
  const timerProgress = (timeRemaining / config.timePerRound) * 100;
  const timerStroke = timeRemaining <= 10 ? "text-amber-400" : "text-muted-foreground/30";
  
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
      {/* Exit button */}
      {onExit && <GameExitButton onExit={onExit} className="right-14" />}
      {/* Progress bar */}
      <div className="h-1 bg-muted/30 w-full">
        <motion.div
          className="h-full bg-violet-500/60"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.28, ease: EASE_PREMIUM }}
        />
      </div>
      
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/20">
        <span className="text-sm font-medium">
          Round {currentRound + 1} / {totalRounds}
        </span>
        
        {/* Timer ring */}
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted/20"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * timerProgress) / 100}
              strokeLinecap="round"
              className={cn("transition-all duration-1000", timerStroke)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
            {timeRemaining}
          </span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto px-4 py-5">
        <div className="max-w-md mx-auto space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`round-${currentRound}`}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Decision Card */}
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-border/40"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                  Decision
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {currentRoundData.decisionLabel}
                </div>
              </motion.div>
              
              {/* Evidence Card */}
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-border/40"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Evidence
                </div>
                <ul className="space-y-1.5">
                  {currentRoundData.evidenceBullets.map((bullet, idx) => (
                    <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                      <span className="text-violet-400 mt-1.5">•</span>
                      <span className="line-clamp-1">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              {/* Question */}
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 pt-2">
                What would flip the decision?
              </div>
              
              {/* Options */}
              <div className="space-y-2">
                {currentRoundData.options.map((option, index) => {
                  const isSelected = selectedOption === option.id;
                  const showFeedback = feedbackState && isSelected;
                  
                  let borderClass = "border-border/40";
                  let bgClass = "bg-card";
                  let glowClass = "";
                  
                  if (showFeedback && feedbackState.correct) {
                    borderClass = "border-emerald-500/40";
                    bgClass = "bg-emerald-500/5";
                    glowClass = "shadow-[0_0_12px_rgba(16,185,129,0.12)]";
                  } else if (showFeedback && !feedbackState.correct) {
                    borderClass = "border-muted-foreground/20";
                    bgClass = "bg-muted/10";
                  } else if (isSelected) {
                    borderClass = "border-violet-500/40";
                    bgClass = "bg-violet-500/5";
                  }
                  
                  return (
                    <motion.button
                      key={option.id}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={phase !== "playing" || selectedOption !== null}
                      className={cn(
                        "w-full p-3.5 rounded-xl border text-left transition-all duration-150",
                        borderClass,
                        bgClass,
                        glowClass,
                        phase === "playing" && !selectedOption && "hover:border-violet-500/30 hover:bg-violet-500/5 active:scale-[0.98]",
                        (phase !== "playing" || selectedOption) && "pointer-events-none"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "border-violet-500 bg-violet-500" : "border-muted-foreground/30"
                        )}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm text-foreground/90">{option.text}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Feedback line */}
              <AnimatePresence>
                {feedbackState && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "text-xs text-center py-2",
                      feedbackState.correct ? "text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    {feedbackState.correct ? "✓ " : ""}{feedbackState.line}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Confidence Bottom Sheet */}
      <Sheet open={phase === "confidence"} onOpenChange={() => {}}>
        <SheetContent side="bottom" className="rounded-t-2xl [&>button]:hidden">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: EASE_PREMIUM }}
          >
            <SheetHeader className="pb-4">
              <SheetTitle className="text-base font-semibold">Confidence</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 pb-6">
              {/* Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Unsure</span>
                  <span className="font-medium text-foreground">{confidence}%</span>
                  <span>Certain</span>
                </div>
                <Slider
                  value={[confidence]}
                  onValueChange={([val]) => setConfidence(val)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/50">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleChangeChoice}
                >
                  Change choice
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={handleConfidenceSubmit}
                >
                  Submit
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
