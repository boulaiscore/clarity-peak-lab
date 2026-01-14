import { motion } from "framer-motion";
import { Zap, Activity, Brain, TrendingUp } from "lucide-react";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";

export function IntuitionTab() {
  const { cognitiveReadinessScore, isLoading, cognitiveMetrics } = useCognitiveReadiness();
  const score = cognitiveReadinessScore ?? 50;
  
  // System 1 metrics
  const reactionSpeed = cognitiveMetrics?.reaction_speed ?? 50;
  const focusStability = cognitiveMetrics?.focus_stability ?? 50;
  const fastThinking = cognitiveMetrics?.fast_thinking ?? 50;
  const visualProcessing = cognitiveMetrics?.visual_processing ?? 50;
  
  // Ring calculations - LARGE
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;
  
  const getScoreColor = (value: number) => {
    if (value >= 75) return "hsl(142, 71%, 45%)";
    if (value >= 50) return "hsl(80, 60%, 50%)";
    return "hsl(45, 85%, 50%)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Main Ring - Large & Centered */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted)/0.3)"
              strokeWidth={strokeWidth}
            />
          </svg>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={getScoreColor(score)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Sharpness</p>
            <span className="text-6xl font-bold tabular-nums text-foreground">
              {isLoading ? "—" : `${Math.round(score)}`}
              <span className="text-3xl">%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Insight Card */}
      <div className="px-2">
        <div className="flex items-start gap-3 mb-2">
          <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Mental Sharpness</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your mental sharpness is {score >= 70 ? "primed for rapid pattern recognition" : score >= 50 ? "stable and responsive" : "recovering—focus on rest"}. 
          Quick decisions draw from this intuitive layer.
        </p>
      </div>

      {/* Statistics Section */}
      <div className="space-y-3 px-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Performance Metrics</span>
          <span>vs. baseline</span>
        </div>
        
        <div className="space-y-2">
          <StatRow icon={<Activity className="w-4 h-4" />} label="Reaction Speed" value={reactionSpeed} />
          <StatRow icon={<Brain className="w-4 h-4" />} label="Focus Stability" value={focusStability} />
          <StatRow icon={<Zap className="w-4 h-4" />} label="Fast Thinking" value={fastThinking} />
          <StatRow icon={<TrendingUp className="w-4 h-4" />} label="Visual Processing" value={visualProcessing} />
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium tabular-nums">{Math.round(value)}</span>
    </div>
  );
}
