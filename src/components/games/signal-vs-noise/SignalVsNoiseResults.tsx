/**
 * ============================================
 * SIGNAL VS NOISE - RESULTS SCREEN
 * ============================================
 * 
 * End screen with KPIs and Review Mistakes.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, BrainCircuit, Shield, ChevronRight, 
  ChevronDown, ArrowLeft, Sparkles, Play, RotateCcw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CaseResult, SessionMetrics } from "./SignalVsNoiseDrill";
import { Difficulty } from "./signalVsNoiseContent";

// ============================================
// TYPES
// ============================================

interface SignalVsNoiseResultsProps {
  results: CaseResult[];
  metrics: SessionMetrics;
  difficulty: Difficulty;
  durationSeconds: number;
  xpAwarded: number;
  onPlayAgain: () => void;
  onBackToLab: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getQualityLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 55) return "Developing";
  return "Building";
}

function getRobustnessLabel(score: number): string {
  if (score >= 75) return "Thorough";
  if (score >= 50) return "Partial";
  return "Surface";
}

function getSessionTitle(score: number): string {
  if (score >= 80) return "Clear Signal";
  if (score >= 60) return "Good Detection";
  return "Keep Practicing";
}

// ============================================
// SPARKLINE COMPONENT
// ============================================

function MiniSparkline({ data, color = "currentColor" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 48;
  const height = 20;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SignalVsNoiseResults({
  results,
  metrics,
  difficulty,
  durationSeconds,
  xpAwarded,
  onPlayAgain,
  onBackToLab,
}: SignalVsNoiseResultsProps) {
  const [showReview, setShowReview] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Select up to 5 mistakes for review
  const reviewCards = useMemo(() => {
    const mistakes = results.filter(r => !r.isDriverCorrect || !r.isWhyCorrect);
    
    // Priority: high confidence wrong, wrong explanation with correct driver, slowest
    const sorted = [...mistakes].sort((a, b) => {
      // First: wrong driver with high confidence
      if (!a.isDriverCorrect && !b.isDriverCorrect) {
        return b.confidencePct - a.confidencePct;
      }
      if (!a.isDriverCorrect) return -1;
      if (!b.isDriverCorrect) return 1;
      
      // Second: wrong explanation (driver correct)
      if (a.isDriverCorrect && !a.isWhyCorrect && b.isDriverCorrect && !b.isWhyCorrect) {
        return b.confidencePct - a.confidencePct;
      }
      
      // Third: by response time (slowest)
      return b.responseTimeMs - a.responseTimeMs;
    });
    
    return sorted.slice(0, 5);
  }, [results]);

  const correctWhy = (caseResult: CaseResult) => {
    const whyOptions = [
      { id: "w1", type: "mechanism" },
      { id: "w2", type: "confound" },
      { id: "w3", type: "irrelevant" },
    ];
    return caseResult.correctWhyId;
  };

  if (showReview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowReview(false)}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold">Review Mistakes</h1>
              <p className="text-[10px] text-muted-foreground">
                {reviewCards.length} cases to review
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {reviewCards.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-primary/50" />
                <p className="text-sm font-medium">Perfect session!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No mistakes to review.
                </p>
              </div>
            ) : (
              reviewCards.map((caseResult, idx) => (
                <motion.div
                  key={caseResult.caseId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          Case {caseResult.caseIndex}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded-full">
                          {caseResult.domain}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          expandedCard === idx && "rotate-180"
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-medium">{caseResult.outcomeLabel}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full",
                            !caseResult.isDriverCorrect 
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {caseResult.isDriverCorrect ? "Driver ✓" : "Wrong driver"}
                          </span>
                          {caseResult.isDriverCorrect && !caseResult.isWhyCorrect && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                              Weak explanation
                            </span>
                          )}
                        </div>
                      </div>
                      <MiniSparkline 
                        data={caseResult.outcomeSeries}
                        color="hsl(var(--primary))"
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedCard === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border/30"
                      >
                        <div className="p-4 space-y-3">
                          {/* Driver comparison */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-muted/30">
                              <span className="text-[9px] text-muted-foreground block mb-1">
                                Your pick
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold",
                                  "bg-amber-500/20 text-amber-400"
                                )}>
                                  {caseResult.chosenDriver || "—"}
                                </span>
                                <span className="text-[10px]">
                                  {caseResult.chosenDriver 
                                    ? caseResult.drivers[caseResult.chosenDriver].label
                                    : "Timeout"}
                                </span>
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                              <span className="text-[9px] text-emerald-400 block mb-1">
                                Best signal
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold bg-emerald-500/20 text-emerald-400">
                                  {caseResult.correctDriver}
                                </span>
                                <span className="text-[10px]">
                                  {caseResult.drivers[caseResult.correctDriver].label}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Insight cue */}
                          <p className="text-[10px] text-muted-foreground italic text-center">
                            {caseResult.insightCue}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}

            {/* Learning note */}
            <p className="text-[9px] text-muted-foreground/50 text-center italic py-4">
              Insight improves with pattern recognition practice.
            </p>
          </div>
        </ScrollArea>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4"
    >
      {/* Header */}
      <div className="text-center mb-6 pt-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-lg font-semibold mb-1">
            {getSessionTitle(metrics.sessionScore)}
          </h1>
          <p className="text-xs text-muted-foreground">Session Complete</p>
        </motion.div>
      </div>

      {/* Score + XP */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex justify-center gap-8 mb-8"
      >
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-1">
            {metrics.sessionScore}
          </div>
          <p className="text-[10px] text-muted-foreground">Score</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-emerald-400 mb-1">
            +{xpAwarded}
          </div>
          <p className="text-[10px] text-muted-foreground">XP Earned</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="space-y-3 mb-6">
        <motion.div
          initial={{ x: -8, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border border-border/50 bg-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">Signal Detection</p>
                <p className="text-[10px] text-muted-foreground">Primary driver accuracy</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{metrics.signalDetectionPct}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: -8, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-xl border border-border/50 bg-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-area-slow/15 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-area-slow" />
              </div>
              <div>
                <p className="text-xs font-medium">Explanation Quality</p>
                <p className="text-[10px] text-muted-foreground">
                  {getQualityLabel(metrics.explanationQualityScore)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{metrics.explanationQualityScore}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: -8, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl border border-border/50 bg-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium">Robustness Thinking</p>
                <p className="text-[10px] text-muted-foreground">
                  {getRobustnessLabel(metrics.robustnessThinkingScore)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{metrics.robustnessThinkingScore}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RQ Impact Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-[10px] text-muted-foreground text-center mb-8"
      >
        Feeds RQ via consistency + explanation stability.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        {reviewCards.length > 0 && (
          <Button
            onClick={() => setShowReview(true)}
            variant="outline"
            className="w-full"
          >
            Review Mistakes
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={onPlayAgain}
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          <Button
            onClick={onBackToLab}
            className="flex-1"
          >
            Back to Lab
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
