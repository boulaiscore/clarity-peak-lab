import { motion } from "framer-motion";
import { Brain, Scale, Lightbulb, Target, TrendingUp } from "lucide-react";
import { useUserMetrics } from "@/hooks/useExercises";
import { useAuth } from "@/contexts/AuthContext";

export function ReasoningTab() {
  const { user } = useAuth();
  const { data: userMetrics } = useUserMetrics(user?.id);
  
  // System 2 metrics
  const reasoningAccuracy = userMetrics?.reasoning_accuracy ?? 50;
  const slowThinking = userMetrics?.slow_thinking ?? 50;
  const criticalThinking = userMetrics?.critical_thinking_score ?? 50;
  const biasResistance = userMetrics?.bias_resistance ?? 50;
  const decisionQuality = userMetrics?.decision_quality ?? 50;
  
  // Calculate overall
  const overallScore = Math.round(
    (reasoningAccuracy + slowThinking + criticalThinking + biasResistance) / 4
  );
  
  // Ring calculations - LARGE
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(overallScore / 100, 1);
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
              stroke={getScoreColor(overallScore)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Reasoning</p>
            <span className="text-6xl font-bold tabular-nums text-foreground">
              {`${overallScore}`}
              <span className="text-3xl">%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Insight Card */}
      <div className="px-2">
        <div className="flex items-start gap-3 mb-2">
          <Brain className="w-5 h-5 text-primary mt-0.5" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Deep Analysis</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your System 2 is {overallScore >= 70 ? "sharp for complex problem-solving" : overallScore >= 50 ? "balanced for deliberate thinking" : "fatigued—avoid major decisions"}. 
          Analytical tasks engage this cognitive layer.
        </p>
      </div>

      {/* Statistics Section */}
      <div className="space-y-3 px-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Performance Metrics</span>
          <span>vs. baseline</span>
        </div>
        
        <div className="space-y-2">
          <StatRow icon={<Target className="w-4 h-4" />} label="Reasoning Accuracy" value={reasoningAccuracy} />
          <StatRow icon={<Brain className="w-4 h-4" />} label="Slow Thinking" value={slowThinking} />
          <StatRow icon={<Lightbulb className="w-4 h-4" />} label="Critical Thinking" value={criticalThinking} />
          <StatRow icon={<Scale className="w-4 h-4" />} label="Bias Resistance" value={biasResistance} />
          <StatRow icon={<TrendingUp className="w-4 h-4" />} label="Decision Quality" value={decisionQuality} />
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
