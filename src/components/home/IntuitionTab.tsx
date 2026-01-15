import { motion } from "framer-motion";
import { Zap, Focus, Sparkles } from "lucide-react";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";

export function IntuitionTab() {
  const { 
    sharpness, 
    AE, 
    RA, 
    S1, 
    S2,
    recovery,
    isLoading 
  } = useTodayMetrics();
  
  // Ring calculations - LARGE
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(sharpness / 100, 1);
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
              stroke={getScoreColor(sharpness)}
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
              {isLoading ? "—" : `${Math.round(sharpness)}`}
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
          {sharpness >= 70 
            ? "Your mental sharpness is primed for rapid pattern recognition and quick decisions." 
            : sharpness >= 50 
              ? "Sharpness is stable—intuition and decision speed are responsive." 
              : "Sharpness is recovering. Focus on rest to restore intuitive clarity."}
        </p>
      </div>

      {/* Formula Variables Section */}
      <div className="space-y-3 px-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Formula Components</span>
          <span className="text-[10px]">0.50×S1 + 0.30×AE + 0.20×S2</span>
        </div>
        
        <div className="space-y-2">
          <StatRow 
            icon={<Zap className="w-4 h-4" />} 
            label="System 1 (S1)" 
            value={S1} 
            weight="50%"
            description="Intuition composite" 
          />
          <StatRow 
            icon={<Focus className="w-4 h-4" />} 
            label="Attentional Efficiency (AE)" 
            value={AE} 
            weight="30%"
            description="Focus & attention" 
          />
          <StatRow 
            icon={<Sparkles className="w-4 h-4" />} 
            label="System 2 (S2)" 
            value={S2} 
            weight="20%"
            description="Reasoning composite" 
          />
        </div>
        
        {/* Recovery modulation note */}
        <div className="pt-3 border-t border-border/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Recovery Modulation</span>
            <span className="font-medium text-foreground">×{(0.75 + 0.25 * recovery / 100).toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Sharpness = base × (0.75 + 0.25 × REC/100)
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
  weight,
  description 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  weight: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <div className="min-w-0">
          <span className="text-sm block truncate">{label}</span>
          <span className="text-[10px] text-muted-foreground/60">{description}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] text-muted-foreground">{weight}</span>
        <span className="text-sm font-medium tabular-nums w-8 text-right">{Math.round(value)}</span>
      </div>
    </div>
  );
}
