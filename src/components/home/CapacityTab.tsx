import { motion } from "framer-motion";
import { Leaf, Smartphone, Footprints } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";

export function CapacityTab() {
  const { 
    recovery, 
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
    detoxTarget,
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

  // Calculate effective recovery input
  const effectiveRecoveryInput = weeklyDetoxMinutes + 0.5 * weeklyWalkMinutes;
  
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
          </div>
        </div>
      </div>

      {/* Insight Card */}
      <div className="px-2">
        <div className="flex items-start gap-3 mb-2">
          <Leaf className="w-5 h-5 text-amber-400 mt-0.5" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Recovery Status</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {recovery >= 100 
            ? "Weekly recovery target met. Cognitive capacity fully restored." 
            : recovery >= 50 
              ? `${Math.round(100 - recovery)}% remaining to meet weekly recovery target.`
              : "Recovery is low. Build recovery through Detox or Walk to restore capacity."}
        </p>
      </div>

      {/* Recovery Actions - Detox and Walk build Recovery */}
      <div className="space-y-3 px-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Recovery Actions</span>
          <span className="text-[10px]">target: {detoxTarget} min</span>
        </div>
        
        <div className="space-y-2">
          <RecoveryRow 
            icon={<Smartphone className="w-4 h-4 text-teal-400" />}
            label="Digital Detox"
            minutes={weeklyDetoxMinutes}
            contribution="100%"
            description="Stopping digital input builds recovery"
          />
          <RecoveryRow 
            icon={<Footprints className="w-4 h-4 text-emerald-400" />}
            label="Walking"
            minutes={weeklyWalkMinutes}
            contribution="50%"
            description="Light movement builds partial recovery"
          />
        </div>
        
        {/* Formula explanation */}
        <div className="pt-3 border-t border-border/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Effective Input</span>
            <span className="font-medium text-foreground">{Math.round(effectiveRecoveryInput)} min</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            REC = min(100, (detox + 0.5×walk) / {detoxTarget} × 100)
          </p>
        </div>
        
        {/* Note: No Training or Tasks here - per spec */}
        <div className="pt-2">
          <p className="text-[10px] text-muted-foreground/50 italic">
            Note: Training and Tasks contribute to cognitive skills, not recovery.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RecoveryRow({ 
  icon, 
  label, 
  minutes, 
  contribution,
  description 
}: { 
  icon: React.ReactNode; 
  label: string; 
  minutes: number;
  contribution: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon}
        <div className="min-w-0">
          <span className="text-sm block">{label}</span>
          <span className="text-[10px] text-muted-foreground/60">{description}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] text-muted-foreground">{contribution}</span>
        <span className="text-sm font-medium tabular-nums">{Math.round(minutes)} min</span>
      </div>
    </div>
  );
}
