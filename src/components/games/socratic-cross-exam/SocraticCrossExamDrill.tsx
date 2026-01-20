/**
 * SOCRATIC CROSS-EXAM — Drill Component
 * Premium S2-CT game training deliberate reasoning
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, ChevronRight } from "lucide-react";
import { 
  SocraticRound, 
  SocraticAssumption,
  ContradictionPair,
  generateSocraticSession,
  SOCRATIC_CONFIG 
} from "./socraticCrossExamContent";
import { SocraticRoundResult } from "./index";

interface Props {
  onComplete: (results: SocraticRoundResult[], durationSeconds: number) => void;
}

type Phase = "assumptions" | "crossExam" | "contradiction" | "feedback";

const EASE_PREMIUM = [0.4, 0, 0.2, 1];

export function SocraticCrossExamDrill({ onComplete }: Props) {
  const [rounds] = useState<SocraticRound[]>(() => generateSocraticSession());
  const [currentRound, setCurrentRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("assumptions");
  const [results, setResults] = useState<SocraticRoundResult[]>([]);
  
  // Round state
  const [selectedAssumptions, setSelectedAssumptions] = useState<string[]>([]);
  const [selectedCrossExam, setSelectedCrossExam] = useState<number | null>(null);
  const [selectedContradiction, setSelectedContradiction] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "partial" | "wrong" | null>(null);
  
  const sessionStartRef = useRef<number>(Date.now());
  const round = rounds[currentRound];
  
  // Handle assumption toggle (max 2)
  const handleAssumptionToggle = useCallback((id: string) => {
    setSelectedAssumptions(prev => {
      if (prev.includes(id)) {
        return prev.filter(a => a !== id);
      }
      if (prev.length >= 2) {
        // Shake animation would go here
        return prev;
      }
      return [...prev, id];
    });
  }, []);
  
  // Proceed to cross-exam
  const handleConfirmAssumptions = useCallback(() => {
    if (selectedAssumptions.length === 2) {
      setPhase("crossExam");
    }
  }, [selectedAssumptions]);
  
  // Handle cross-exam answer
  const handleCrossExamAnswer = useCallback((index: number) => {
    setSelectedCrossExam(index);
    setTimeout(() => setPhase("contradiction"), 300);
  }, []);
  
  // Handle contradiction selection and complete round
  const handleContradictionSelect = useCallback((pairId: string) => {
    setSelectedContradiction(pairId);
    
    const correct = round.correctAssumptions;
    const matchCount = selectedAssumptions.filter(a => correct.includes(a as any)).length;
    const assumptionScore = matchCount === 2 ? 100 : matchCount === 1 ? 60 : 0;
    
    // Check for decorative penalty
    const selectedDecorative = selectedAssumptions.some(id => 
      round.assumptions.find(a => a.id === id)?.isDecorative
    );
    const finalAssumptionScore = selectedDecorative ? Math.max(0, assumptionScore - 10) : assumptionScore;
    
    const crossExamCorrect = selectedCrossExam === round.crossExamQuestion.correctIndex;
    const caScore = crossExamCorrect ? 100 : 0;
    
    const selectedPair = round.contradictionPairs.find(p => p.id === pairId);
    let cmScore = 0;
    if (selectedPair?.id === round.minimalPairId) {
      cmScore = 100;
    } else if (selectedPair?.isValid) {
      cmScore = 50;
    }
    
    const roundScore = Math.round(0.45 * finalAssumptionScore + 0.35 * caScore + 0.20 * cmScore);
    
    const result: SocraticRoundResult = {
      roundIndex: currentRound,
      roundId: round.id,
      claim: round.claim,
      selectedAssumptions: selectedAssumptions as [string, string],
      correctAssumptions: round.correctAssumptions,
      assumptionScore: finalAssumptionScore,
      crossExamCorrect,
      selectedCrossExamOption: selectedCrossExam!,
      correctCrossExamOption: round.crossExamQuestion.correctIndex,
      selectedContradictionId: pairId,
      minimalPairId: round.minimalPairId,
      contradictionScore: cmScore,
      roundScore,
    };
    
    setResults(prev => [...prev, result]);
    setFeedbackState(roundScore >= 80 ? "correct" : roundScore >= 50 ? "partial" : "wrong");
    setPhase("feedback");
    
    setTimeout(() => proceedToNext(result), 600);
  }, [round, currentRound, selectedAssumptions, selectedCrossExam]);
  
  const proceedToNext = useCallback((lastResult: SocraticRoundResult) => {
    if (currentRound + 1 >= SOCRATIC_CONFIG.rounds) {
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      setResults(prev => {
        const allResults = prev.length === SOCRATIC_CONFIG.rounds ? prev : [...prev.slice(0, -1), lastResult];
        onComplete(allResults, duration);
        return allResults;
      });
    } else {
      setCurrentRound(prev => prev + 1);
      setPhase("assumptions");
      setSelectedAssumptions([]);
      setSelectedCrossExam(null);
      setSelectedContradiction(null);
      setFeedbackState(null);
    }
  }, [currentRound, onComplete]);
  
  const progressPercent = ((currentRound) / SOCRATIC_CONFIG.rounds) * 100;
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Socratic Cross-Exam</span>
          <span className="text-xs text-muted-foreground">
            Round {currentRound + 1}/{SOCRATIC_CONFIG.rounds}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1" />
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Claim */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20"
        >
          <p className="text-xs text-violet-400 mb-1">Claim</p>
          <p className="text-sm font-medium leading-relaxed">"{round.claim}"</p>
        </motion.div>
        
        {/* Argument Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-card/50 border border-border/40 backdrop-blur-sm"
        >
          <p className="text-xs text-muted-foreground mb-3">Argument</p>
          <div className="space-y-2">
            {round.premises.map((p, i) => (
              <div key={p.id} className="flex gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">{p.id}.</span>
                <span className="text-foreground/90">{p.text}</span>
              </div>
            ))}
            <div className="flex gap-2 text-xs pt-2 border-t border-border/30">
              <span className="text-violet-400 shrink-0">∴</span>
              <span className="text-foreground font-medium">{round.conclusion}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Phase-specific content */}
        <AnimatePresence mode="wait">
          {phase === "assumptions" && (
            <motion.div
              key="assumptions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground">
                Select 2 load-bearing assumptions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {round.assumptions.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleAssumptionToggle(a.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left text-xs transition-all",
                      selectedAssumptions.includes(a.id)
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-border/40 bg-card/30 hover:bg-card/50"
                    )}
                  >
                    <span className="text-muted-foreground">{a.id}. </span>
                    <span className="text-foreground/90">{a.text}</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleConfirmAssumptions}
                disabled={selectedAssumptions.length !== 2}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                Confirm Selection
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
          
          {phase === "crossExam" && (
            <motion.div
              key="crossExam"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="p-4 rounded-xl bg-card/50 border border-border/40">
                <p className="text-xs text-amber-400 mb-2">Cross-Examination</p>
                <p className="text-sm leading-relaxed">{round.crossExamQuestion.question}</p>
              </div>
              <div className="space-y-2">
                {round.crossExamQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleCrossExamAnswer(i)}
                    disabled={selectedCrossExam !== null}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left text-xs transition-all",
                      selectedCrossExam === i
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-border/40 bg-card/30 hover:bg-card/50"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {phase === "contradiction" && (
            <motion.div
              key="contradiction"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground">
                Select the minimal contradiction pair:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {round.contradictionPairs.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => handleContradictionSelect(pair.id)}
                    disabled={selectedContradiction !== null}
                    className={cn(
                      "p-3 rounded-lg border text-center text-xs transition-all",
                      selectedContradiction === pair.id
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-border/40 bg-card/30 hover:bg-card/50"
                    )}
                  >
                    {pair.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {phase === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center py-8"
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                feedbackState === "correct" && "bg-emerald-500/20",
                feedbackState === "partial" && "bg-amber-500/20",
                feedbackState === "wrong" && "bg-red-500/20"
              )}>
                {feedbackState === "correct" && <Check className="w-8 h-8 text-emerald-400" />}
                {feedbackState === "partial" && <Check className="w-8 h-8 text-amber-400" />}
                {feedbackState === "wrong" && <X className="w-8 h-8 text-red-400" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
