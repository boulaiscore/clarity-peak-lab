/**
 * COUNTERFACTUAL AUDIT — Results Screen
 * 
 * End screen following the Unified Game Feedback System.
 * Shows session score, XP, 3 KPIs, and Review Mistakes option.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Brain, ChevronRight, RotateCcw, ArrowLeft, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoundResult, SessionMetrics } from "./CounterfactualAuditDrill";
import { Difficulty } from "./counterfactualAuditContent";

interface CounterfactualAuditResultsProps {
  results: RoundResult[];
  metrics: SessionMetrics;
  difficulty: Difficulty;
  durationSeconds: number;
  xpAwarded: number;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

// Get discipline label
function getDisciplineLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Mixed";
  return "Noisy";
}

// Get calibration label
function getCalibrationLabel(score: number): string {
  if (score >= 75) return "Well-calibrated";
  if (score >= 50) return "Overconfident";
  return "Underconfident";
}

// Get session title based on score
function getSessionTitle(score: number): string {
  if (score >= 80) return "Clear Thinking";
  if (score >= 60) return "Solid Reasoning";
  return "Keep Practicing";
}

// Get actionable prompt
function getActionablePrompt(metrics: SessionMetrics): string {
  const { accuracyPct, evidenceDisciplineScore, calibrationScore } = metrics;
  
  // Find the weakest area
  if (evidenceDisciplineScore < accuracyPct && evidenceDisciplineScore < calibrationScore) {
    return "Focus: Avoid noise and proxies — find the core mechanism.";
  }
  if (calibrationScore < accuracyPct && calibrationScore < evidenceDisciplineScore) {
    return "Focus: Match confidence to actual accuracy.";
  }
  return "Focus: Identify what actually flips the decision.";
}

export function CounterfactualAuditResults({
  results,
  metrics,
  difficulty,
  durationSeconds,
  xpAwarded,
  onPlayAgain,
  onBackToLab,
}: CounterfactualAuditResultsProps) {
  const [showReview, setShowReview] = useState(false);
  
  // Generate review cards (up to 5)
  const reviewCards = useMemo(() => {
    const wrongResults = results.filter(r => !r.isCorrect);
    
    // Priority 1: Wrong with high confidence (top 2)
    const highConfWrong = wrongResults
      .filter(r => r.confidencePct >= 70)
      .sort((a, b) => b.confidencePct - a.confidencePct)
      .slice(0, 2);
    
    // Priority 2: Noise/proxy picks (up to 2)
    const noiseProxyWrong = wrongResults
      .filter(r => {
        const chosen = r.options.find(o => o.id === r.chosenOptionId);
        return chosen?.optionClass === "noise_irrelevant" || chosen?.optionClass === "proxy_symptom";
      })
      .filter(r => !highConfWrong.includes(r))
      .slice(0, 2);
    
    // Priority 3: Slowest wrong
    const remaining = wrongResults
      .filter(r => !highConfWrong.includes(r) && !noiseProxyWrong.includes(r))
      .sort((a, b) => b.responseTimeMs - a.responseTimeMs)
      .slice(0, 1);
    
    return [...highConfWrong, ...noiseProxyWrong, ...remaining].slice(0, 5);
  }, [results]);
  
  const sessionTitle = getSessionTitle(metrics.sessionScore);
  const actionablePrompt = getActionablePrompt(metrics);
  
  // Review screen
  if (showReview) {
    return (
      <div className="min-h-screen bg-background">
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
        
        {/* Review cards */}
        <div className="p-4 space-y-4 max-w-md mx-auto">
          {reviewCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <p>Perfect session — no mistakes to review!</p>
            </div>
          ) : (
            reviewCards.map((result, idx) => {
              const correctOption = result.options.find(o => o.id === result.correctOptionId);
              const chosenOption = result.options.find(o => o.id === result.chosenOptionId);
              
              return (
                <motion.div
                  key={result.roundIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="p-4 rounded-xl bg-card border border-border/40 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Round {result.roundIndex + 1} • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                    {result.timeoutFlag && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                        Timeout
                      </span>
                    )}
                  </div>
                  
                  {/* Decision */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                      Decision
                    </div>
                    <div className="text-sm font-medium">{result.decisionLabel}</div>
                  </div>
                  
                  {/* Evidence */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                      Evidence
                    </div>
                    <ul className="space-y-1">
                      {result.evidenceBullets.slice(0, 3).map((bullet, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-violet-400">•</span>
                          <span className="line-clamp-1">{bullet}</span>
                        </li>
                      ))}
                      {result.evidenceBullets.length > 3 && (
                        <li className="text-xs text-muted-foreground/50">
                          +{result.evidenceBullets.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Your pick vs Best flip */}
                  <div className="space-y-2 pt-1">
                    {/* Your pick */}
                    {chosenOption && (
                      <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div className="flex items-center gap-1.5 text-[10px] text-destructive/80 mb-1">
                          <X className="w-3 h-3" />
                          Your pick
                        </div>
                        <p className="text-xs text-foreground/80">{chosenOption.text}</p>
                      </div>
                    )}
                    
                    {/* Best flip */}
                    {correctOption && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mb-1">
                          <Check className="w-3 h-3" />
                          Best flip
                        </div>
                        <p className="text-xs text-foreground/80">{correctOption.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{correctOption.feedbackLine}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          
          {/* Done button */}
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowReview(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main results screen
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-border/30">
        <span className="font-semibold">Session Complete</span>
      </div>
      
      <div className="p-6 max-w-md mx-auto space-y-6">
        {/* Title + Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-3"
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-xl font-semibold">{sessionTitle}</h1>
          <div className="text-4xl font-bold text-foreground">{metrics.sessionScore}</div>
          <div className="text-sm text-muted-foreground">Session Score</div>
        </motion.div>
        
        {/* XP */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <span className="text-lg font-semibold text-amber-400">+{xpAwarded} XP</span>
          <span className="text-xs text-amber-400/70">→ Critical Thinking</span>
        </motion.div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3">
          {/* Counterfactual Accuracy */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-card border border-border/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Counterfactual Accuracy</div>
                <div className="text-2xl font-semibold">{metrics.accuracyPct}%</div>
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded-full",
                metrics.accuracyPct >= 70 ? "bg-emerald-500/10 text-emerald-400" :
                metrics.accuracyPct >= 50 ? "bg-amber-500/10 text-amber-400" :
                "bg-muted/50 text-muted-foreground"
              )}>
                {metrics.accuracyPct >= 70 ? "Strong" : metrics.accuracyPct >= 50 ? "Developing" : "Building"}
              </div>
            </div>
          </motion.div>
          
          {/* Evidence Discipline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-card border border-border/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Evidence Discipline</div>
                <div className="text-2xl font-semibold">{metrics.evidenceDisciplineScore}</div>
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded-full",
                metrics.evidenceDisciplineScore >= 75 ? "bg-emerald-500/10 text-emerald-400" :
                metrics.evidenceDisciplineScore >= 50 ? "bg-amber-500/10 text-amber-400" :
                "bg-muted/50 text-muted-foreground"
              )}>
                {getDisciplineLabel(metrics.evidenceDisciplineScore)}
              </div>
            </div>
          </motion.div>
          
          {/* Calibration */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-xl bg-card border border-border/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Calibration</div>
                <div className="text-2xl font-semibold">{metrics.calibrationScore}</div>
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded-full",
                metrics.calibrationScore >= 75 ? "bg-emerald-500/10 text-emerald-400" :
                metrics.calibrationScore >= 50 ? "bg-amber-500/10 text-amber-400" :
                "bg-muted/50 text-muted-foreground"
              )}>
                {getCalibrationLabel(metrics.calibrationScore)}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* RQ Impact note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground/70"
        >
          RQ Impact: feeds RQ via steadiness + calibration (S2).
        </motion.div>
        
        {/* Actionable prompt */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20"
        >
          <p className="text-sm text-foreground/90">{actionablePrompt}</p>
        </motion.div>
        
        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 pt-2"
        >
          <Button
            className="w-full bg-violet-600 hover:bg-violet-700"
            onClick={() => setShowReview(true)}
          >
            Review Mistakes
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={onPlayAgain}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onBackToLab}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lab
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
