/**
 * HIDDEN RULE LAB — Results Screen
 * 
 * S2-IN (Insight) training game results.
 * Displays session KPIs and review mistakes.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Check, X, Lock, FlaskConical, Target, Star, 
  ChevronRight, ChevronDown, ArrowLeft, Play, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoundResult, SessionMetrics } from "./HiddenRuleLabDrill";
import { Difficulty, XP_BASE, CLEAN_LOCK_BONUS } from "./hiddenRuleLabContent";

interface HiddenRuleLabResultsProps {
  results: RoundResult[];
  metrics: SessionMetrics;
  difficulty: Difficulty;
  durationSeconds: number;
  xpAwarded: number;
  hasCleanLock: boolean;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

export function HiddenRuleLabResults({
  results,
  metrics,
  difficulty,
  durationSeconds,
  xpAwarded,
  hasCleanLock,
  onPlayAgain,
  onBackToLab,
}: HiddenRuleLabResultsProps) {
  const [showReview, setShowReview] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  
  // Select up to 5 mistakes for review
  const reviewCards = useMemo(() => {
    const mistakes: { result: RoundResult; priority: number; microcopy: string }[] = [];
    
    // Priority 1: Wrong locked rule
    const lockResult = results.find(r => r.roundType === "lock");
    if (lockResult && !lockResult.isCorrect) {
      mistakes.push({
        result: lockResult,
        priority: 1,
        microcopy: "The locked rule didn't match the hidden mechanism.",
      });
    }
    
    // Priority 2: Low info gain test choices
    const testResults = results.filter(r => r.roundType === "test");
    const lowInfoTests = testResults
      .filter(r => (r.chosenTestInfoGain || 0) < 40)
      .sort((a, b) => (a.chosenTestInfoGain || 0) - (b.chosenTestInfoGain || 0));
    
    lowInfoTests.slice(0, 2).forEach(r => {
      mistakes.push({
        result: r,
        priority: 2,
        microcopy: "A better test would separate the remaining hypotheses.",
      });
    });
    
    // Priority 3: Wrong apply predictions
    const applyResults = results.filter(r => r.roundType === "apply" && !r.isCorrect);
    applyResults.forEach(r => {
      mistakes.push({
        result: r,
        priority: 3,
        microcopy: `The locked rule predicts "${r.outputCorrect?.label}" here.`,
      });
    });
    
    return mistakes.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [results]);
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  // KPI tier labels
  const getTier = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: "Excellent", color: "text-emerald-400" };
    if (score >= 60) return { label: "Good", color: "text-blue-400" };
    if (score >= 40) return { label: "Developing", color: "text-amber-400" };
    return { label: "Needs Work", color: "text-muted-foreground" };
  };
  
  const lockResult = results.find(r => r.roundType === "lock");
  const ruleCorrect = lockResult?.isCorrect || false;
  
  // Review Screen
  if (showReview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReview(false)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Review Mistakes</span>
        </div>
        
        {/* Review Cards */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {reviewCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground">No significant mistakes to review!</p>
            </div>
          ) : (
            reviewCards.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl border border-border/40 bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      item.result.roundType === "lock" ? "bg-violet-500/10" :
                      item.result.roundType === "test" ? "bg-amber-500/10" : "bg-rose-500/10"
                    )}>
                      {item.result.roundType === "lock" && <Lock className="w-4 h-4 text-violet-400" />}
                      {item.result.roundType === "test" && <FlaskConical className="w-4 h-4 text-amber-400" />}
                      {item.result.roundType === "apply" && <Target className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        Round {item.result.roundIndex + 1} — 
                        {item.result.roundType === "lock" && " Lock"}
                        {item.result.roundType === "test" && " Test"}
                        {item.result.roundType === "apply" && " Apply"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.result.roundType === "test" && `Info gain: ${item.result.chosenTestInfoGain || 0}/100`}
                        {item.result.roundType === "apply" && `Predicted: ${item.result.userPrediction?.label}`}
                        {item.result.roundType === "lock" && `Chose: ${item.result.lockedRule}`}
                      </div>
                    </div>
                  </div>
                  {expandedCard === idx ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedCard === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/30"
                    >
                      <div className="p-4 space-y-3">
                        {/* Input display */}
                        {item.result.inputObject && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.result.inputObject.displayChips.map((chip, i) => (
                              <span key={i} className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", chip.color)}>
                                {chip.label}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* What you chose */}
                        {item.result.roundType === "test" && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">You chose test with</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                              {item.result.chosenTestInfoGain}/100 signal
                            </span>
                          </div>
                        )}
                        
                        {item.result.roundType === "apply" && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Your prediction:</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">
                              {item.result.userPrediction?.label}
                            </span>
                            <span className="text-muted-foreground">→ Correct:</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                              {item.result.outputCorrect?.label}
                            </span>
                          </div>
                        )}
                        
                        {/* Microcopy */}
                        <p className="text-[11px] text-muted-foreground/80 italic">
                          {item.microcopy}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
        
        {/* Back button */}
        <div className="p-4 border-t border-border/30">
          <Button onClick={() => setShowReview(false)} className="w-full">
            Back to Results
          </Button>
        </div>
      </motion.div>
    );
  }
  
  // Main Results Screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="p-6 text-center border-b border-border/20">
        <h2 className="text-xl font-semibold mb-1">Session Complete</h2>
        <p className="text-sm text-muted-foreground">
          You inferred and tested a hidden mechanism.
        </p>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-sm mx-auto space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-3">
            {/* Rule Lock */}
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium">Rule Lock</span>
                </div>
                {ruleCorrect ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                    Correct
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400">
                    Missed
                  </span>
                )}
              </div>
              {hasCleanLock && (
                <div className="text-[10px] text-emerald-400/80">
                  ✨ Clean lock bonus applied
                </div>
              )}
            </div>
            
            {/* Test Quality */}
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium">Test Quality</span>
                </div>
                <span className={cn("text-lg font-semibold", getTier(metrics.testQualityScore).color)}>
                  {metrics.testQualityScore}/100
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                How informative your tests were.
              </p>
              {metrics.redundantTestsCount > 0 && (
                <div className="text-[10px] text-amber-400/80 mt-1">
                  {metrics.redundantTestsCount} low-signal test{metrics.redundantTestsCount > 1 ? "s" : ""}
                </div>
              )}
            </div>
            
            {/* Generalization */}
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Generalization</span>
                </div>
                <span className={cn("text-lg font-semibold", getTier(metrics.generalizationAcc).color)}>
                  {metrics.generalizationAcc}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Applied the rule to new cases.
              </p>
            </div>
          </div>
          
          {/* XP Award */}
          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/50" />
              <span className="text-lg font-semibold text-violet-300">+{xpAwarded} XP</span>
              <span className="text-sm text-muted-foreground">→ Insight</span>
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              XP grows your Insight skill over time. Today's KPIs are feedback.
            </p>
          </div>
          
          {/* Session stats */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60">
            <span>Duration: {formatDuration(durationSeconds)}</span>
            <span>•</span>
            <span>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
          </div>
        </div>
      </div>
      
      {/* CTAs */}
      <div className="p-4 space-y-2 border-t border-border/30">
        {reviewCards.length > 0 && (
          <Button
            onClick={() => setShowReview(true)}
            variant="outline"
            className="w-full"
          >
            Review Mistakes
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onPlayAgain}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
          <Button
            onClick={onBackToLab}
            className="flex items-center gap-2"
          >
            Back to Lab
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
