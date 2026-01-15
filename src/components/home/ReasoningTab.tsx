import { motion } from "framer-motion";
import { Brain, Target, Lightbulb, Focus } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";

export function ReasoningTab() {
  const { 
    readiness, 
    recovery,
    AE, 
    CT,
    IN,
    S1,
    S2,
    hasWearableData,
    isLoading 
  } = useTodayMetrics();
  
  // Ring calculations - LARGE
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(readiness / 100, 1);
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
              stroke={getScoreColor(readiness)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Readiness</p>
            <span className="text-6xl font-bold tabular-nums text-foreground">
              {isLoading ? "—" : `${Math.round(readiness)}`}
              <span className="text-3xl">%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Insight Card */}
      <div className="px-2">
        <div className="flex items-start gap-3 mb-2">
          <Brain className="w-5 h-5 text-primary mt-0.5" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Cognitive Readiness</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {readiness >= 70 
            ? "Your cognitive readiness is sharp for complex problem-solving and important decisions." 
            : readiness >= 50 
              ? "Readiness is balanced for deliberate thinking. Pace high-load tasks." 
              : "Readiness is low—avoid high-stakes decisions and prioritize recovery."}
        </p>
      </div>

      {/* Formula Variables Section */}
      <div className="space-y-3 px-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Formula Components</span>
          <span className="text-[10px]">
            {hasWearableData ? "50% Physio + 50% Cognitive" : "0.35×REC + 0.35×S2 + 0.30×AE"}
          </span>
        </div>
        
        {hasWearableData ? (
          // With wearable: show cognitive component breakdown
          <div className="space-y-2">
            <StatRow 
              icon={<Target className="w-4 h-4" />} 
              label="Critical Thinking (CT)" 
              value={CT} 
              weight="30%"
            />
            <StatRow 
              icon={<Focus className="w-4 h-4" />} 
              label="Attentional Efficiency (AE)" 
              value={AE} 
              weight="25%"
            />
            <StatRow 
              icon={<Lightbulb className="w-4 h-4" />} 
              label="Insight (IN)" 
              value={IN} 
              weight="20%"
            />
            <StatRow 
              icon={<Brain className="w-4 h-4" />} 
              label="System 2 (S2)" 
              value={S2} 
              weight="15%"
            />
            <StatRow 
              icon={<Brain className="w-4 h-4" />} 
              label="System 1 (S1)" 
              value={S1} 
              weight="10%"
            />
          </div>
        ) : (
          // Without wearable
          <div className="space-y-2">
            <StatRow 
              icon={<Brain className="w-4 h-4" />} 
              label="Recovery (REC)" 
              value={recovery} 
              weight="35%"
            />
            <StatRow 
              icon={<Target className="w-4 h-4" />} 
              label="System 2 (S2)" 
              value={S2} 
              weight="35%"
            />
            <StatRow 
              icon={<Focus className="w-4 h-4" />} 
              label="Attentional Efficiency (AE)" 
              value={AE} 
              weight="30%"
            />
          </div>
        )}
        
        {/* Wearable status note */}
        <div className="pt-3 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/60">
            {hasWearableData 
              ? "Using wearable data for physio component (HRV, sleep, resting HR)."
              : "Connect a wearable for enhanced readiness calculation with physiological data."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ 
  icon, 
  label, 
  value, 
  weight 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  weight: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">{weight}</span>
        <span className="text-sm font-medium tabular-nums w-8 text-right">{Math.round(value)}</span>
      </div>
    </div>
  );
}
