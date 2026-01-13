import { motion } from "framer-motion";
import { Brain, Scale, Lightbulb, Target, BookOpen, TrendingUp } from "lucide-react";
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
  const progress = Math.min(overallScore / 100, 1);
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
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Brain className="w-5 h-5 text-primary mb-1" />
            <span className={`text-4xl font-bold tabular-nums ${getScoreColor(overallScore)}`}>
              {`${overallScore}%`}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Reasoning Strength</p>
        <p className="text-[10px] text-muted-foreground/60">System 2 · Deep Thinking</p>
      </div>

      {/* Metric Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground px-1">Performance Breakdown</h3>
        
        <div className="space-y-3">
          <MetricRow 
            icon={<Target className="w-4 h-4" />}
            label="Reasoning Accuracy"
            value={reasoningAccuracy}
            description="Logical deduction precision"
            barColor={getBarColor(reasoningAccuracy)}
          />
          <MetricRow 
            icon={<Brain className="w-4 h-4" />}
            label="Slow Thinking"
            value={slowThinking}
            description="Deliberate analysis depth"
            barColor={getBarColor(slowThinking)}
          />
          <MetricRow 
            icon={<Lightbulb className="w-4 h-4" />}
            label="Critical Thinking"
            value={criticalThinking}
            description="Argument evaluation skill"
            barColor={getBarColor(criticalThinking)}
          />
          <MetricRow 
            icon={<Scale className="w-4 h-4" />}
            label="Bias Resistance"
            value={biasResistance}
            description="Cognitive bias mitigation"
            barColor={getBarColor(biasResistance)}
          />
          <MetricRow 
            icon={<TrendingUp className="w-4 h-4" />}
            label="Decision Quality"
            value={decisionQuality}
            description="Outcome optimization"
            barColor={getBarColor(decisionQuality)}
          />
        </div>
      </div>

      {/* Insight Card */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary mb-1">Training Impact</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Deep reasoning exercises improve decision quality by 20% over 8 weeks.
              Focus on Socratic questioning and counterexample drills.
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
