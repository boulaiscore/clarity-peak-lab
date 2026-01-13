import { motion } from "framer-motion";
import { Zap, TrendingUp, Activity, Brain, Clock, ChevronRight } from "lucide-react";
import { useCognitiveReadiness } from "@/hooks/useCognitiveReadiness";

export function IntuitionTab() {
  const { cognitiveReadinessScore, isLoading, cognitiveMetrics } = useCognitiveReadiness();
  const score = cognitiveReadinessScore ?? 50;
  
  // System 1 metrics
  const reactionSpeed = cognitiveMetrics?.reaction_speed ?? 50;
  const focusStability = cognitiveMetrics?.focus_stability ?? 50;
  const fastThinking = cognitiveMetrics?.fast_thinking ?? 50;
  const visualProcessing = cognitiveMetrics?.visual_processing ?? 50;
  
  const getScoreColor = (value: number) => {
    if (value >= 75) return "text-green-400";
    if (value >= 50) return "text-amber-400";
    return "text-red-400";
  };
  
  const getBarColor = (value: number) => {
    if (value >= 75) return "bg-green-500";
    if (value >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  // Ring calculations
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Ring */}
      <div className="flex flex-col items-center py-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
          </svg>
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(210, 70%, 55%)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Zap className="w-5 h-5 text-blue-400 mb-1" />
            <span className={`text-4xl font-bold tabular-nums ${getScoreColor(score)}`}>
              {isLoading ? "—" : `${Math.round(score)}%`}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Intuition Strength</p>
        <p className="text-[10px] text-muted-foreground/60">System 1 · Fast Thinking</p>
      </div>

      {/* Metric Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground px-1">Performance Breakdown</h3>
        
        <div className="space-y-3">
          <MetricRow 
            icon={<Activity className="w-4 h-4" />}
            label="Reaction Speed"
            value={reactionSpeed}
            description="Response time to stimuli"
            barColor={getBarColor(reactionSpeed)}
          />
          <MetricRow 
            icon={<Brain className="w-4 h-4" />}
            label="Focus Stability"
            value={focusStability}
            description="Sustained attention capacity"
            barColor={getBarColor(focusStability)}
          />
          <MetricRow 
            icon={<Zap className="w-4 h-4" />}
            label="Fast Thinking"
            value={fastThinking}
            description="Quick pattern recognition"
            barColor={getBarColor(fastThinking)}
          />
          <MetricRow 
            icon={<TrendingUp className="w-4 h-4" />}
            label="Visual Processing"
            value={visualProcessing}
            description="Visual info processing speed"
            barColor={getBarColor(visualProcessing)}
          />
        </div>
      </div>

      {/* Insight Card */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-400 mb-1">Training Impact</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Regular training improves reaction time by up to 15% in 4 weeks. 
              Focus on Go/No-Go and visual tracking drills.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  barColor: string;
}

function MetricRow({ icon, label, value, description, barColor }: MetricRowProps) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}
