/**
 * ============================================
 * FLASH CONNECT – RESULTS SCREEN
 * ============================================
 * 
 * Session summary shown after completing 12 rounds.
 */

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Zap, Clock, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FlashConnectResultsProps {
  connectionRate: number; // % correct
  farLinkHitRate: number | null; // % correct on hard rounds only
  medianReactionTime: number; // ms
  xpAwarded: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  onContinue: () => void;
}

export function FlashConnectResults({
  connectionRate,
  farLinkHitRate,
  medianReactionTime,
  xpAwarded,
  isPerfect,
  difficulty,
  onContinue,
}: FlashConnectResultsProps) {
  // Determine performance tier
  const getTier = () => {
    if (connectionRate >= 90) return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (connectionRate >= 75) return { label: "Good", color: "text-primary", bg: "bg-primary/20" };
    if (connectionRate >= 60) return { label: "Moderate", color: "text-amber-400", bg: "bg-amber-500/20" };
    return { label: "Developing", color: "text-muted-foreground", bg: "bg-muted/20" };
  };
  
  const tier = getTier();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8"
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
          {Math.round(connectionRate)}%
        </div>
        <div className={cn("text-sm font-medium px-3 py-1 rounded-full inline-block", tier.bg, tier.color)}>
          {tier.label}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Connection Rate</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8"
      >
        {/* Reaction Time */}
        <div className="p-4 rounded-xl bg-card border border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Reaction Time</span>
          </div>
          <div className="text-xl font-semibold text-foreground">
            {medianReactionTime}ms
          </div>
        </div>

        {/* Far-Link Hit Rate (only for hard) */}
        {difficulty === "hard" && farLinkHitRate !== null && (
          <div className="p-4 rounded-xl bg-card border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-muted-foreground">Far-Link Rate</span>
            </div>
            <div className="text-xl font-semibold text-foreground">
              {Math.round(farLinkHitRate)}%
            </div>
          </div>
        )}

        {/* XP Awarded */}
        <div className={cn(
          "p-4 rounded-xl bg-card border border-border/30",
          difficulty !== "hard" && "col-span-2"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">XP Earned</span>
          </div>
          <div className="text-xl font-semibold text-primary">
            +{xpAwarded} XP
          </div>
        </div>
      </motion.div>

      {/* Difficulty Badge */}
      <div className="mb-6 text-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {difficulty} mode
        </span>
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onContinue}
          size="lg"
          className="px-8"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
