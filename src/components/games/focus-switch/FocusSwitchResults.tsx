import { motion } from "framer-motion";
import { Zap, RefreshCw, Brain, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FocusSwitchFinalResults } from "./FocusSwitchDrill";

interface FocusSwitchResultsProps {
  results: FocusSwitchFinalResults;
  onContinue: () => void;
}

export function FocusSwitchResults({ results, onContinue }: FocusSwitchResultsProps) {
  // Determine primary insight based on weakest area
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30"
          >
            <RefreshCw className="w-8 h-8 text-emerald-400" />
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
          <div className="text-4xl font-bold text-emerald-400">+{results.xpAwarded}</div>
          <div className="text-sm text-muted-foreground">XP Earned</div>
        </motion.div>
        
        {/* Insight Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-2"
        >
          {/* Switch Speed */}
          <InsightCard
            icon={Zap}
            label="Speed"
            value={`${Math.round(results.switchLatencyAvg)}ms`}
            description="Switch latency"
            isHighlighted={primaryInsight === "speed"}
            accentColor="cyan"
          />
          
          {/* Focus Lock */}
          <InsightCard
            icon={Brain}
            label="Focus"
            value={`${Math.round((1 - results.perseverationRate) * 100)}%`}
            description="Lock accuracy"
            isHighlighted={primaryInsight === "focus"}
            accentColor="violet"
          />
          
          {/* Recovery */}
          <InsightCard
            icon={RefreshCw}
            label="Recovery"
            value={`${Math.round(results.recoverySpeedIndex * 100)}%`}
            description="Stabilization"
            isHighlighted={primaryInsight === "recovery"}
            accentColor="emerald"
          />
        </motion.div>
        
        {/* Block Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Performance by Block</div>
          <div className="flex items-center gap-2">
            <BlockBar label="Lock" value={results.block1Score} maxValue={Math.max(results.block1Score, results.block2Score, results.block3Score, 100)} />
            <BlockBar label="Switch" value={results.block2Score} maxValue={Math.max(results.block1Score, results.block2Score, results.block3Score, 100)} />
            <BlockBar label="Snap" value={results.block3Score} maxValue={Math.max(results.block1Score, results.block2Score, results.block3Score, 100)} />
          </div>
          
          {/* Degradation indicator */}
          {results.degradationSlope > 0.2 && (
            <div className="flex items-center gap-2 text-xs text-orange-400/80">
              <TrendingUp className="w-3 h-3 rotate-180" />
              <span>Focus declined across session — practice switching speed</span>
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
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
          
          <div className="text-center text-xs text-muted-foreground mt-3">
            {results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1)} difficulty • 3 blocks
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
  accentColor: "cyan" | "violet" | "emerald";
}) {
  const colorClasses = {
    cyan: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
    violet: "text-violet-400 border-violet-400/30 bg-violet-400/5",
    emerald: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
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

function BlockBar({ label, value, maxValue }: { label: string; value: number; maxValue: number }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-cyan-400" : "bg-orange-400"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getPrimaryInsight(results: FocusSwitchFinalResults): "speed" | "focus" | "recovery" {
  const speedScore = 1 - (results.switchLatencyAvg / 2000); // Lower latency = better
  const focusScore = 1 - results.perseverationRate;
  const recoveryScore = results.recoverySpeedIndex;
  
  // Find lowest to suggest improvement
  if (speedScore <= focusScore && speedScore <= recoveryScore) {
    return "speed";
  }
  if (focusScore <= speedScore && focusScore <= recoveryScore) {
    return "focus";
  }
  return "recovery";
}
