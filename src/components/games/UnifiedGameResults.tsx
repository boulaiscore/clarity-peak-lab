/**
 * ============================================
 * UNIFIED GAME RESULTS v1.0
 * ============================================
 * 
 * Standard End Screen for ALL NLOOP games (S1 & S2).
 * Follows the Global Game Feedback Specification.
 * 
 * STRUCTURE (fixed order):
 * 1. Session Summary
 * 2. Primary KPIs (max 3)
 * 3. Skill Impact Statement
 * 4. CTA Row (Review Mistakes | Play Again | Back to Gym)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Target, Clock, Zap, Brain, Lightbulb, 
  RotateCcw, ArrowRight, ChevronRight, 
  Eye, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReviewMistakesSheet, ReviewMistake } from "./ReviewMistakesSheet";

// ============================================
// TYPES
// ============================================

export type GameSkill = "AE" | "RA" | "CT" | "IN";
export type SystemType = "S1" | "S2";

export interface KPIData {
  id: string;
  label: string;
  value: string;
  sublabel?: string;
  tier?: "low" | "medium" | "high"; // Relative label, never threshold
}

export interface UnifiedGameResultsProps {
  // Session Summary
  gameName: string;
  difficulty: "easy" | "medium" | "hard";
  roundsCompleted: number;
  totalRounds: number;
  durationSeconds: number;
  
  // Skill routing
  skill: GameSkill;
  systemType: SystemType;
  xpAwarded: number;
  
  // Primary KPIs (max 3, skill-dependent)
  kpis: KPIData[];
  
  // Optional: Perfect session
  isPerfect?: boolean;
  
  // Optional: Review Mistakes data
  mistakes?: ReviewMistake[];
  
  // Optional: Quality bonus line (from gameQualityBonus)
  qualityLine?: string;
  
  // Actions
  onPlayAgain: () => void;
  onExit: () => void;
}

// ============================================
// SKILL IMPACT STATEMENTS
// ============================================

const SKILL_IMPACT_STATEMENTS: Record<GameSkill, string> = {
  AE: "This session trained attentional control under time pressure.",
  RA: "This session strengthened fast, intuitive associations.",
  CT: "This session trained structured and deliberate reasoning.",
  IN: "This session trained deep insight under constraints.",
};

const SKILL_NAMES: Record<GameSkill, string> = {
  AE: "Attentional Efficiency",
  RA: "Rapid Association",
  CT: "Critical Thinking",
  IN: "Insight",
};

const SKILL_ICONS: Record<GameSkill, React.ElementType> = {
  AE: Target,
  RA: Lightbulb,
  CT: Brain,
  IN: Sparkles,
};

const SKILL_COLORS: Record<GameSkill, string> = {
  AE: "text-cyan-400",
  RA: "text-amber-400",
  CT: "text-violet-400",
  IN: "text-emerald-400",
};

// ============================================
// MAIN COMPONENT
// ============================================

export function UnifiedGameResults({
  gameName,
  difficulty,
  roundsCompleted,
  totalRounds,
  durationSeconds,
  skill,
  systemType,
  xpAwarded,
  kpis,
  isPerfect = false,
  mistakes = [],
  qualityLine,
  onPlayAgain,
  onExit,
}: UnifiedGameResultsProps) {
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  
  const SkillIcon = SKILL_ICONS[skill];
  const skillColor = SKILL_COLORS[skill];
  const skillName = SKILL_NAMES[skill];
  const impactStatement = SKILL_IMPACT_STATEMENTS[skill];
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Only show first 3 KPIs
  const displayKpis = kpis.slice(0, 3);
  
  // Has mistakes to review
  const hasMistakes = mistakes.length > 0;

  return (
    <>
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
            className="mb-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/30"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Perfect Session!</span>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            B1) SESSION SUMMARY
        ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-1">{gameName}</h2>
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="capitalize">{difficulty}</span>
            <span>•</span>
            <span>{roundsCompleted}/{totalRounds} rounds</span>
            <span>•</span>
            <span>{formatDuration(durationSeconds)}</span>
          </div>
        </motion.div>

        {/* XP Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-center"
        >
          <div className={cn("text-4xl font-bold", skillColor)}>+{xpAwarded}</div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
            <Zap className="w-3.5 h-3.5" />
            <span>XP → {skillName}</span>
          </div>
          {/* Quality Line (subtle, only if bonus applied) */}
          {qualityLine && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-xs text-muted-foreground/70 mt-2 italic"
            >
              {qualityLine}
            </motion.p>
          )}
        </motion.div>

        {/* ─────────────────────────────────────────────
            B2) PRIMARY KPIs (max 3)
        ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "grid gap-3 w-full max-w-sm mb-6",
            displayKpis.length === 3 ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          {displayKpis.map((kpi, index) => (
            <KPICard key={kpi.id} kpi={kpi} index={index} />
          ))}
        </motion.div>

        {/* ─────────────────────────────────────────────
            B3) SKILL IMPACT STATEMENT
        ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8 px-4"
        >
          <p className="text-xs text-muted-foreground italic max-w-xs mx-auto">
            {impactStatement}
          </p>
        </motion.div>

        {/* ─────────────────────────────────────────────
            B4) CTA ROW
        ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm space-y-3"
        >
          {/* Primary: Review Mistakes (if available) */}
          {hasMistakes && (
            <Button
              onClick={() => setShowReviewSheet(true)}
              variant="outline"
              className="w-full gap-2 border-primary/30 hover:bg-primary/10"
            >
              <Eye className="w-4 h-4" />
              Review Mistakes
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          )}
          
          {/* Secondary row */}
          <div className="flex items-center gap-3">
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
          </div>
        </motion.div>
      </motion.div>

      {/* Review Mistakes Sheet */}
      <ReviewMistakesSheet
        open={showReviewSheet}
        onOpenChange={setShowReviewSheet}
        mistakes={mistakes}
        gameName={gameName}
      />
    </>
  );
}

// ============================================
// KPI CARD COMPONENT
// ============================================

function KPICard({ kpi, index }: { kpi: KPIData; index: number }) {
  const getTierColor = (tier?: "low" | "medium" | "high") => {
    switch (tier) {
      case "high": return "text-emerald-400";
      case "medium": return "text-amber-400";
      case "low": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      className="p-3 rounded-xl bg-card border border-border/30 text-center"
    >
      <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
        {kpi.label}
      </div>
      <div className={cn("text-lg font-semibold", getTierColor(kpi.tier))}>
        {kpi.value}
      </div>
      {kpi.sublabel && (
        <div className="text-[9px] text-muted-foreground mt-0.5">
          {kpi.sublabel}
        </div>
      )}
    </motion.div>
  );
}
