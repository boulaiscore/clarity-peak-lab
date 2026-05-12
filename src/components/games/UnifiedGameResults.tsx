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
  Eye, Sparkles, TrendingUp, TrendingDown, Minus, Activity
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
  
  // Optional: Cognitive Insight block (post-session depth)
  insight?: {
    vsAverage?: { delta: number; unit?: string; label?: string }; // delta vs personal 7d avg on primary KPI
    trend?: number[]; // last N session values for sparkline (primary KPI)
    metricImpact?: { metric: "Sharpness" | "Readiness" | "RQ" | "Thinking"; delta: number }; // estimated lift
    calibrationNote?: string; // e.g. "Difficulty adapted to your level"
  };
  
  // Actions
  onPlayAgain: () => void;
  onExit: () => void;
}

// ============================================
// SKILL IMPACT STATEMENTS
// ============================================

const SKILL_IMPACT_STATEMENTS: Record<GameSkill, string> = {
  AE: "Trains sustained attention and inhibitory control — the substrate of focused work under load.",
  RA: "Strengthens semantic retrieval and associative fluency — the engine of fast intuition and creative recombination.",
  CT: "Trains causal inference and evidence calibration — the discipline of reasoning when stakes are high.",
  IN: "Trains hypothesis testing and pattern abstraction — the ability to cut through noise and reach insight.",
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

// Routing of each skill to a top-level cognitive metric (shown in recap)
const SKILL_TO_GLOBAL: Record<GameSkill, string> = {
  AE: "Sharpness",
  RA: "Sharpness",
  CT: "Reasoning Quality",
  IN: "Thinking",
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
  insight,
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
          className="mb-7 text-center"
        >
          <div className={cn("text-5xl font-light tracking-tight", skillColor)}>+{xpAwarded}</div>
          <div className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1.5 mt-2 uppercase tracking-[0.18em]">
            <Zap className="w-3 h-3" />
            <span>XP · {skillName}</span>
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-1.5">
            Contributes to <span className="text-foreground/80">{SKILL_TO_GLOBAL[skill]}</span>
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
        <div className="w-full max-w-sm mb-2 px-1 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Session signals
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            shape {SKILL_TO_GLOBAL[skill]}
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "grid gap-2.5 w-full max-w-sm mb-6",
            displayKpis.length === 3 ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          {displayKpis.map((kpi, index) => (
            <KPICard key={kpi.id} kpi={kpi} index={index} />
          ))}
        </motion.div>

        {/* ─────────────────────────────────────────────
            B2.5) COGNITIVE INSIGHT (optional, premium depth)
        ───────────────────────────────────────────── */}
        {insight && (insight.vsAverage || insight.trend || insight.metricImpact || insight.calibrationNote) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full max-w-sm mb-6 p-3.5 rounded-xl bg-card/40 border border-border/30"
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium">
                Cognitive Insight
              </span>
            </div>

            <div className="space-y-2">
              {insight.vsAverage && <VsAverageRow data={insight.vsAverage} />}
              {insight.trend && insight.trend.length > 1 && <TrendRow values={insight.trend} />}
              {insight.metricImpact && <MetricImpactRow data={insight.metricImpact} skillColor={skillColor} />}
            </div>

            {insight.calibrationNote && (
              <p className="text-[10px] text-muted-foreground/70 mt-3 pt-2.5 border-t border-border/20 leading-relaxed">
                {insight.calibrationNote}
              </p>
            )}
          </motion.div>
        )}

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

// ============================================
// COGNITIVE INSIGHT SUB-COMPONENTS
// ============================================

function VsAverageRow({ data }: { data: { delta: number; unit?: string; label?: string } }) {
  const isUp = data.delta > 0;
  const isFlat = data.delta === 0;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const tone = isFlat ? "text-muted-foreground" : isUp ? "text-emerald-400" : "text-amber-400";
  const sign = data.delta > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-muted-foreground">{data.label || "vs your 7-day avg"}</span>
      <span className={cn("font-medium flex items-center gap-1", tone)}>
        <Icon className="w-3 h-3" />
        {sign}{data.delta}{data.unit || "%"}
      </span>
    </div>
  );
}

function TrendRow({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const w = 70;
  const h = 18;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-muted-foreground">Recent trend</span>
      <svg width={w} height={h} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground/70"
        />
      </svg>
    </div>
  );
}

function MetricImpactRow({
  data,
  skillColor,
}: {
  data: { metric: "Sharpness" | "Readiness" | "RQ" | "Thinking"; delta: number };
  skillColor: string;
}) {
  const sign = data.delta >= 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-muted-foreground">Estimated {data.metric} lift</span>
      <span className={cn("font-medium", skillColor)}>
        {sign}{data.delta.toFixed(1)}
      </span>
    </div>
  );
}
