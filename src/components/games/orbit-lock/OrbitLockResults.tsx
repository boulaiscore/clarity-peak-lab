import { motion } from "framer-motion";
import { Target, Gauge, Shield, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrbitLockFinalResults } from "./OrbitLockDrill";

interface OrbitLockResultsProps {
  results: OrbitLockFinalResults;
  onContinue: () => void;
}

export function OrbitLockResults({ results, onContinue }: OrbitLockResultsProps) {
  // Determine primary insight
  const primaryInsight = getPrimaryInsight(results);
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/30"
          >
            <Target className="w-8 h-8 text-cyan-400" />
          </motion.div>
          
          <h2 className="text-xl font-semibold text-foreground">Session Complete</h2>
          
          {results.isPerfect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-xs font-medium"
            >
              <Star className="w-3 h-3 fill-amber-400" />
              Perfect Session
            </motion.div>
          )}
        </div>
        
        {/* XP Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="text-4xl font-bold text-cyan-400">+{results.xpAwarded}</div>
          <div className="text-sm text-muted-foreground">XP Earned</div>
        </motion.div>
        
        {/* Insight Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-2"
        >
          {/* Stability */}
          <InsightCard
            icon={Target}
            label="Stability"
            value={`${results.totalTimeInBandPct}%`}
            description="Time in band"
            isHighlighted={primaryInsight === "stability"}
            accentColor="cyan"
          />
          
          {/* Control */}
          <InsightCard
            icon={Gauge}
            label="Control"
            value={getControlRating(results.overcorrectionIndex)}
            description="Smoothness"
            isHighlighted={primaryInsight === "control"}
            accentColor="violet"
          />
          
          {/* Resistance */}
          <InsightCard
            icon={Shield}
            label="Resistance"
            value={`${Math.round(results.distractionResistanceIndex * 100)}%`}
            description="vs distractions"
            isHighlighted={primaryInsight === "resistance"}
            accentColor="amber"
          />
        </motion.div>
        
        {/* Act Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Performance by Act</div>
          <div className="flex items-center gap-2">
            <ActBar label="1" value={results.act1TimeInBandPct} />
            <ActBar label="2" value={results.act2TimeInBandPct} />
            <ActBar label="3" value={results.act3TimeInBandPct} />
          </div>
          
          {/* Degradation indicator */}
          {results.degradationSlope < -0.15 && (
            <div className="flex items-center gap-2 text-xs text-orange-400/80">
              <TrendingUp className="w-3 h-3 rotate-180" />
              <span>Focus declined across session — try shorter bursts</span>
            </div>
          )}
        </motion.div>
        
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <button
            onClick={onContinue}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {primaryInsight === "stability" && "Train Stability"}
            {primaryInsight === "control" && "Train Control"}
            {primaryInsight === "resistance" && "Train Resistance"}
          </button>
          
          <div className="text-center text-xs text-muted-foreground mt-3">
            {results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1)} difficulty • 3 acts
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function InsightCard({ 
  icon: Icon, 
  label, 
  value, 
  description, 
  isHighlighted,
  accentColor 
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  isHighlighted: boolean;
  accentColor: "cyan" | "violet" | "amber";
}) {
  const colorClasses = {
    cyan: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
    violet: "text-violet-400 border-violet-400/30 bg-violet-400/5",
    amber: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  };
  
  return (
    <div className={cn(
      "p-3 rounded-xl border transition-all",
      isHighlighted 
        ? colorClasses[accentColor]
        : "border-border/50 bg-muted/20"
    )}>
      <Icon className={cn(
        "w-4 h-4 mb-2",
        isHighlighted ? colorClasses[accentColor].split(" ")[0] : "text-muted-foreground"
      )} />
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ActBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>Act {label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            value >= 80 ? "bg-cyan-400" : value >= 60 ? "bg-violet-400" : "bg-orange-400"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getPrimaryInsight(results: OrbitLockFinalResults): "stability" | "control" | "resistance" {
  const stabilityScore = results.totalTimeInBandPct;
  const controlScore = (1 - results.overcorrectionIndex) * 100;
  const resistanceScore = results.distractionResistanceIndex * 100;
  
  // Find lowest area to suggest training
  if (stabilityScore <= controlScore && stabilityScore <= resistanceScore) {
    return "stability";
  }
  if (controlScore <= stabilityScore && controlScore <= resistanceScore) {
    return "control";
  }
  return "resistance";
}

function getControlRating(overcorrectionIndex: number): string {
  if (overcorrectionIndex < 0.15) return "Precise";
  if (overcorrectionIndex < 0.3) return "Stable";
  if (overcorrectionIndex < 0.5) return "Variable";
  return "Erratic";
}
