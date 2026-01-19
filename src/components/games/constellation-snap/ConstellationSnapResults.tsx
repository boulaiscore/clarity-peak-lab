/**
 * ============================================
 * CONSTELLATION SNAP – RESULTS SCREEN
 * ============================================
 * 
 * Session summary shown after completing 30 rounds.
 */

import { motion } from "framer-motion";
import { Zap, Clock, Target, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConstellationSnapResultsProps {
  sessionScore: number; // 0-100
  accuracy: number; // % correct
  remoteAccuracy: number; // % correct on remote rounds
  medianReactionTime: number; // ms
  xpAwarded: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  onPlayAgain: () => void;
  onExit: () => void;
}

export function ConstellationSnapResults({
  sessionScore,
  accuracy,
  remoteAccuracy,
  medianReactionTime,
  xpAwarded,
  isPerfect,
  difficulty,
  onPlayAgain,
  onExit,
}: ConstellationSnapResultsProps) {
  // Determine performance tier
  const getTier = () => {
    if (sessionScore >= 90) return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (sessionScore >= 75) return { label: "Good", color: "text-amber-400", bg: "bg-amber-500/20" };
    if (sessionScore >= 60) return { label: "Moderate", color: "text-primary", bg: "bg-primary/20" };
    return { label: "Developing", color: "text-muted-foreground", bg: "bg-muted/20" };
  };
  
  const tier = getTier();
  
  // Speed interpretation
  const getSpeedLabel = () => {
    const thresholds = {
      easy: { fast: 500, medium: 700 },
      medium: { fast: 400, medium: 600 },
      hard: { fast: 350, medium: 500 },
    };
    const t = thresholds[difficulty];
    if (medianReactionTime <= t.fast) return "Lightning";
    if (medianReactionTime <= t.medium) return "Quick";
    return "Steady";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8"
    >
      {/* Perfect Badge */}
      {isPerfect && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/30"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Perfect Session!</span>
        </motion.div>
      )}

      {/* Main Score */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <div className="text-6xl font-bold text-foreground mb-2">
          {sessionScore}
        </div>
        <div className={cn("text-sm font-medium px-3 py-1 rounded-full inline-block", tier.bg, tier.color)}>
          {tier.label}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Association Score</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8"
      >
        {/* Accuracy */}
        <div className="p-3 rounded-xl bg-card border border-border/30">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">Accuracy</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {Math.round(accuracy)}%
          </div>
        </div>

        {/* Association Speed */}
        <div className="p-3 rounded-xl bg-card border border-border/30">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-muted-foreground">Speed</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {getSpeedLabel()}
          </div>
          <p className="text-[9px] text-muted-foreground">{medianReactionTime}ms</p>
        </div>

        {/* Remote Link Rate */}
        <div className="p-3 rounded-xl bg-card border border-border/30">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] text-muted-foreground">Remote Links</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            {Math.round(remoteAccuracy)}%
          </div>
        </div>

        {/* XP Awarded */}
        <div className="p-3 rounded-xl bg-card border border-border/30">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-muted-foreground">XP Earned</span>
          </div>
          <div className="text-lg font-semibold text-amber-400">
            +{xpAwarded}
          </div>
          <p className="text-[9px] text-muted-foreground">→ Rapid Association</p>
        </div>
      </motion.div>

      {/* Difficulty Badge */}
      <div className="mb-6 text-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {difficulty} mode
        </span>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 w-full max-w-sm"
      >
        <Button
          variant="outline"
          onClick={onPlayAgain}
          className="flex-1 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </Button>
        <Button
          onClick={onExit}
          className="flex-1 gap-2"
        >
          Back to Lab
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
