import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { 
  RechargingResult, 
  getRechargingLevelLabel, 
  getRechargingLevelColor 
} from "@/lib/recharging";
import { cn } from "@/lib/utils";

interface RechargingResultsProps {
  result: RechargingResult;
  onFinish: () => void;
}

const METRIC_LABELS = {
  mentalNoise: "Mental noise",
  cognitiveFatigue: "Cognitive fatigue",
  readinessToClear: "Readiness to think clearly",
};

export function RechargingResults({ result, onFinish }: RechargingResultsProps) {
  const { preCheck, postCheck, score, level, deltas } = result;

  const getDeltaIcon = (delta: number, inverse: boolean = false) => {
    // For mental noise and fatigue, negative delta is good (inverse = true)
    const isPositive = inverse ? delta > 0 : delta > 0;
    const isNegative = inverse ? delta < 0 : delta < 0;
    
    // For noise/fatigue: decrease is good (green arrow down)
    // For readiness: increase is good (green arrow up)
    if (inverse) {
      if (delta > 0) return <ArrowDown className="w-3 h-3 text-emerald-400" />;
      if (delta < 0) return <ArrowUp className="w-3 h-3 text-red-400" />;
    } else {
      if (delta > 0) return <ArrowUp className="w-3 h-3 text-emerald-400" />;
      if (delta < 0) return <ArrowDown className="w-3 h-3 text-red-400" />;
    }
    return <Minus className="w-3 h-3 text-white/30" />;
  };

  const getDeltaColor = (delta: number, inverse: boolean = false) => {
    if (inverse) {
      if (delta > 0) return "text-emerald-400";
      if (delta < 0) return "text-red-400";
    } else {
      if (delta > 0) return "text-emerald-400";
      if (delta < 0) return "text-red-400";
    }
    return "text-white/30";
  };

  const metrics = [
    { key: "mentalNoise" as const, inverse: true },
    { key: "cognitiveFatigue" as const, inverse: true },
    { key: "readinessToClear" as const, inverse: false },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-[#06070A]">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Score Display */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-4"
          >
            <span className={cn(
              "text-5xl font-semibold tabular-nums",
              getRechargingLevelColor(level)
            )}>
              {score}
            </span>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn("text-sm font-medium", getRechargingLevelColor(level))}
          >
            {getRechargingLevelLabel(level)}
          </motion.p>
        </div>

        {/* Before vs After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-xl border border-white/10 p-4 mb-8"
        >
          {/* Header */}
          <div className="grid grid-cols-[1fr,60px,60px,40px] gap-2 mb-4 pb-3 border-b border-white/10">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Metric</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider text-center">Before</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider text-center">After</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider text-center">Δ</span>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            {metrics.map((metric, index) => {
              const delta = deltas[metric.key];
              const displayDelta = metric.inverse ? delta : delta;
              
              return (
                <motion.div
                  key={metric.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="grid grid-cols-[1fr,60px,60px,40px] gap-2 items-center"
                >
                  <span className="text-xs text-white/70">
                    {METRIC_LABELS[metric.key]}
                  </span>
                  <span className="text-sm text-white/50 text-center font-mono tabular-nums">
                    {preCheck[metric.key]}
                  </span>
                  <span className="text-sm text-white/80 text-center font-mono tabular-nums">
                    {postCheck[metric.key]}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    {getDeltaIcon(displayDelta, metric.inverse)}
                    <span className={cn(
                      "text-xs font-mono tabular-nums",
                      getDeltaColor(displayDelta, metric.inverse)
                    )}>
                      {Math.abs(displayDelta)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Explanation */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-white/30 text-center mb-8"
        >
          Recharging reflects short-term recovery of reasoning clarity.
        </motion.p>

        {/* Finish button */}
        <motion.button
          onClick={onFinish}
          className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/15 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.98 }}
        >
          Done
        </motion.button>
      </motion.div>
    </div>
  );
}
