import { motion } from "framer-motion";
import { Leaf, Smartphone, Footprints } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";

export function CapacityTab() {
  const { 
    recovery, 
    isLoading 
  } = useTodayMetrics();
  
  // Ring calculations - LARGE
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(recovery / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;
  
  // Dynamic color based on progress
  const ringColor = recovery >= 90 
    ? "hsl(142, 71%, 45%)" 
    : recovery >= 60 
      ? "hsl(80, 60%, 50%)" 
      : recovery >= 30 
        ? "hsl(45, 85%, 50%)" 
        : "hsl(25, 90%, 50%)";

  // Status text based on recovery level
  const getRecoveryLabel = () => {
    if (recovery >= 80) return "High";
    if (recovery >= 50) return "Moderate";
    if (recovery >= 20) return "Low";
    return "Very Low";
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
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Recovery</p>
            <span className="text-6xl font-bold tabular-nums text-foreground">
              {isLoading ? "—" : `${Math.round(recovery)}`}
              <span className="text-3xl">%</span>
            </span>
            <span className="text-xs text-muted-foreground mt-1">{getRecoveryLabel()}</span>
          </div>
        </div>
      </div>

      {/* Recovery Status Card */}
      <div className="px-2">
        <div className="flex items-start gap-3 mb-2">
          <Leaf className="w-5 h-5 text-amber-400 mt-0.5" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Recovery Status</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {recovery >= 80 
            ? "Recovery is high. Cognitive capacity is fully available." 
            : recovery >= 50 
              ? "Recovery is moderate. Deep focus is accessible."
              : "Recovery is currently low. Build recovery through Detox or Walk to restore capacity."}
        </p>
      </div>

      {/* Recovery Actions */}
      <div className="space-y-3 px-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Recovery Actions
        </div>
        
        <div className="space-y-3">
          <RecoveryActionCard 
            icon={<Smartphone className="w-5 h-5 text-teal-400" />}
            label="Digital Detox"
            impact="Full recovery impact"
            example="30 min ≈ +4% Recovery"
          />
          <RecoveryActionCard 
            icon={<Footprints className="w-5 h-5 text-emerald-400" />}
            label="Walking"
            impact="Moderate recovery impact"
            example="30 min ≈ +2% Recovery"
          />
        </div>
        
        {/* Explanatory Note */}
        <div className="pt-4">
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            Training builds cognitive skills.{" "}
            <span className="text-muted-foreground/50">
              Recovery determines when they can be used effectively.
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RecoveryActionCard({ 
  icon, 
  label, 
  impact,
  example 
}: { 
  icon: React.ReactNode; 
  label: string; 
  impact: string;
  example: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{label}</span>
        <span className="text-[11px] text-muted-foreground block mt-0.5">{impact}</span>
        <span className="text-[10px] text-primary/80 block mt-1">{example}</span>
      </div>
    </div>
  );
}
