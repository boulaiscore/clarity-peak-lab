/**
 * CAUSAL LEDGER — Main Game Component
 * 
 * S2-CT (Critical Thinking) training game.
 * Deliberate evaluation of causal claims under uncertainty.
 * 
 * KEY DESIGN:
 * - NO countdown timer (deliberate thinking encouraged)
 * - Soft time guidance only (30-45s recommended)
 * - Minimal feedback during play
 * - Difficulty increases by ambiguity, not speed
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, HelpCircle, XCircle } from "lucide-react";
import {
  generateSessionScenarios,
  CAUSAL_LEDGER_CONFIG,
  DECISION_LABELS,
  CausalScenario,
  Decision,
} from "./causalLedgerContent";

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

export interface RoundResult {
  roundIndex: number;
  actIndex: number;
  scenarioId: string;
  scenario: string;
  claim: string;
  correctDecision: Decision;
  userDecision: Decision;
  isCorrect: boolean;
  decisionTimeMs: number;
}

interface CausalLedgerDrillProps {
  onComplete: (results: RoundResult[], durationSeconds: number) => void;
}

export function CausalLedgerDrill({ onComplete }: CausalLedgerDrillProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Session state
  const [scenarios] = useState<CausalScenario[]>(() => generateSessionScenarios());
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"ready" | "reading" | "deciding" | "feedback" | "complete">("ready");
  
  // Round state
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);
  
  // Timing refs
  const roundStartTimeRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(Date.now());
  
  // Current scenario
  const currentScenario = scenarios[currentRound];
  const currentAct = currentScenario?.act || 1;
  
  // Decision options
  const decisions: Decision[] = ["supported", "underspecified", "flawed"];
  
  // Motion config
  const motionConfig = useMemo(() => ({
    card: {
      initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
      animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
      exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
      transition: { duration: 0.3, ease: EASE_PREMIUM },
    },
    option: (index: number) => ({
      initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 },
      animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 },
      transition: { 
        duration: 0.2, 
        delay: prefersReducedMotion ? 0 : 0.3 + index * 0.08,
        ease: EASE_PREMIUM,
      },
    }),
  }), [prefersReducedMotion]);
  
  // Handle decision selection
  const handleDecision = useCallback((decision: Decision) => {
    if (phase !== "deciding" || selectedDecision !== null) return;
    
    const decisionTime = Date.now() - roundStartTimeRef.current;
    const isCorrect = decision === currentScenario.correctDecision;
    
    setSelectedDecision(decision);
    setFeedbackState(isCorrect ? "correct" : "wrong");
    
    // Subtle haptic
    safeHaptic(isCorrect ? 15 : 25);
    
    const result: RoundResult = {
      roundIndex: currentRound,
      actIndex: currentAct,
      scenarioId: currentScenario.id,
      scenario: currentScenario.scenario,
      claim: currentScenario.claim,
      correctDecision: currentScenario.correctDecision,
      userDecision: decision,
      isCorrect,
      decisionTimeMs: decisionTime,
    };
    
    setResults(prev => [...prev, result]);
    setPhase("feedback");
    
    // Brief feedback then proceed
    setTimeout(() => proceedToNextRound(), 400);
  }, [phase, selectedDecision, currentScenario, currentRound, currentAct]);
  
  // Proceed to next round
  const proceedToNextRound = useCallback(() => {
    if (currentRound + 1 >= CAUSAL_LEDGER_CONFIG.rounds) {
      // Session complete
      setPhase("complete");
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      setTimeout(() => {
        // Get final results including last one
        setResults(finalResults => {
          onComplete(finalResults, durationSeconds);
          return finalResults;
        });
      }, 100);
    } else {
      setCurrentRound(prev => prev + 1);
      setSelectedDecision(null);
      setFeedbackState(null);
      setPhase("reading");
      roundStartTimeRef.current = Date.now();
    }
  }, [currentRound, onComplete]);
  
  // Start game after ready phase
  useEffect(() => {
    if (phase === "ready") {
      const timeout = setTimeout(() => {
        setPhase("reading");
        sessionStartRef.current = Date.now();
        roundStartTimeRef.current = Date.now();
        
        // After brief reading pause, enable decisions
        setTimeout(() => {
          setPhase("deciding");
        }, 800);
      }, 500);
      return () => clearTimeout(timeout);
    }
    
    if (phase === "reading") {
      const timeout = setTimeout(() => {
        setPhase("deciding");
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [phase, currentRound]);
  
  // Progress calculation
  const progress = ((currentRound + 1) / CAUSAL_LEDGER_CONFIG.rounds) * 100;
  
  // Get decision icon
  const getDecisionIcon = (decision: Decision) => {
    switch (decision) {
      case "supported": return CheckCircle2;
      case "underspecified": return HelpCircle;
      case "flawed": return XCircle;
    }
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
      {/* Progress bar */}
      <div className="h-1 bg-muted/30 w-full">
        <motion.div
          className="h-full bg-violet-500/60"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: EASE_PREMIUM }}
        />
      </div>
      
      {/* Act indicator */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Act {currentAct}</span>
          <span className="text-[10px] text-muted-foreground/60">
            {currentAct === 1 && "Clear Flaws"}
            {currentAct === 2 && "Ambiguous Evidence"}
            {currentAct === 3 && "Borderline Cases"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentRound + 1} / {CAUSAL_LEDGER_CONFIG.rounds}
        </span>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`scenario-${currentRound}`}
              {...motionConfig.card}
              className="space-y-5"
            >
              {/* Scenario Card */}
              <div className="p-4 rounded-xl bg-card border border-border/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Scenario
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {currentScenario?.scenario}
                </p>
              </div>
              
              {/* Claim Card */}
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <div className="text-[10px] uppercase tracking-wider text-violet-400/70 mb-2">
                  Claim to Evaluate
                </div>
                <p className="text-sm text-foreground font-medium leading-relaxed">
                  "{currentScenario?.claim}"
                </p>
              </div>
              
              {/* Decision Options */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
                  Your Evaluation
                </div>
                
                {decisions.map((decision, index) => {
                  const Icon = getDecisionIcon(decision);
                  const label = DECISION_LABELS[decision];
                  const isSelected = selectedDecision === decision;
                  const isCorrectAnswer = feedbackState && decision === currentScenario.correctDecision;
                  const isWrongSelection = feedbackState === "wrong" && isSelected;
                  
                  // Feedback styling
                  let borderClass = "border-border/40";
                  let bgClass = "bg-card";
                  let glowClass = "";
                  let opacityClass = "";
                  
                  if (feedbackState === "correct" && isSelected) {
                    borderClass = "border-emerald-500/50";
                    bgClass = "bg-emerald-500/5";
                    glowClass = "shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                  } else if (isWrongSelection) {
                    borderClass = "border-muted-foreground/30";
                    bgClass = "bg-muted/20";
                    opacityClass = "opacity-70";
                  } else if (feedbackState && !isSelected) {
                    opacityClass = "opacity-50";
                  }
                  
                  const optionMotion = motionConfig.option(index);
                  
                  return (
                    <motion.button
                      key={decision}
                      initial={optionMotion.initial}
                      animate={optionMotion.animate}
                      transition={optionMotion.transition}
                      onClick={() => handleDecision(decision)}
                      disabled={phase !== "deciding" || feedbackState !== null}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all duration-150",
                        borderClass,
                        bgClass,
                        glowClass,
                        opacityClass,
                        phase === "deciding" && !feedbackState && "hover:border-violet-500/40 hover:bg-violet-500/5 active:scale-[0.98]",
                        feedbackState && "pointer-events-none"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          feedbackState === "correct" && isSelected ? "bg-emerald-500/20" : "bg-violet-500/10"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            feedbackState === "correct" && isSelected ? "text-emerald-400" : "text-violet-400"
                          )} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {label.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {label.description}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Soft time guidance */}
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
