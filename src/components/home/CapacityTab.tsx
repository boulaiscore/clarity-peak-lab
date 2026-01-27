import { motion } from "framer-motion";
import { Leaf, Smartphone, Footprints, Battery, AlertCircle } from "lucide-react";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getRecoveryStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";


interface CapacityTabProps {
  onBackToOverview?: () => void;
}

export function CapacityTab({ onBackToOverview }: CapacityTabProps) {
  const { 
    recoveryEffective: recovery, 
    isUsingRRI,
    isV2Initialized,
    hasRecoveryData,
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
    isLoading 
  } = useRecoveryEffective();
  
  // Determine if we should show "No data" fallback
  // Show fallback when:
  // 1. v2 not initialized AND no RRI
  // 2. OR recovery is 0 with no weekly activity
  const showNoDataFallback = !isLoading && (
    (!isV2Initialized && !hasRecoveryData) ||
    (recovery === 0 && weeklyDetoxMinutes === 0 && weeklyWalkMinutes === 0)
  );
  
  // Ring calculations - LARGE
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = showNoDataFallback ? 0 : Math.min(recovery / 100, 1);
  const strokeDashoffset = circumference - progress * circumference;
  
  // Premium functional color - Teal for Recovery (fixed, not status-based)
  const ringColor = showNoDataFallback ? "hsl(var(--muted))" : "hsl(174, 72%, 45%)";

  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Today Header - Back to Overview */}
      {onBackToOverview && (
        <div className="flex justify-center">
          <button 
            onClick={onBackToOverview}
            className="px-4 py-1.5 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80 hover:bg-muted/60 transition-colors active:scale-[0.97]"
          >
            ← Today
          </button>
        </div>
      )}

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
            {isLoading ? (
              <span className="text-4xl font-bold text-muted-foreground">—</span>
            ) : showNoDataFallback ? (
              <>
                <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-2" />
                <span className="text-sm text-muted-foreground text-center px-4">
                  Nessun dato
                </span>
              </>
            ) : (
              <>
                <span className="text-6xl font-bold tabular-nums text-foreground">
                  {Math.round(recovery)}
                  <span className="text-3xl">%</span>
                </span>
                <span className="text-xs text-muted-foreground/70 mt-1">
                  {getMetricDisplayInfo(
                    getRecoveryStatus(recovery).label,
                    getRecoveryStatus(recovery).level,
                    null,
                    null
                  ).text}
                </span>
                {isUsingRRI && (
                  <span className="text-[10px] text-primary/60 mt-1">
                    Stima iniziale (RRI)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* No Data Fallback Content */}
      {showNoDataFallback && !isLoading && (
        <div className="px-2 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Completa una sessione di Digital Detox o Walking per iniziare.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/neuro-lab?tab=detox">
              <Button variant="outline" className="w-full h-12 text-sm gap-2">
                <Smartphone className="w-4 h-4" />
                Start Detox
              </Button>
            </Link>
            <Link to="/neuro-lab?tab=walk">
              <Button variant="outline" className="w-full h-12 text-sm gap-2">
                <Footprints className="w-4 h-4" />
                Start Walk
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Recovery Status Card - Only show when we have data */}
      {!showNoDataFallback && !isLoading && (
        <>
          <div className="px-2">
            <div className="flex items-start gap-3 mb-2">
              <Leaf className="w-5 h-5 text-teal-400 mt-0.5" />
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

          {/* CTA Button */}
          <div className="pt-2 px-2">
            <Link to="/neuro-lab?tab=detox">
              <Button variant="premium" className="w-full h-12 text-sm gap-2">
                <Battery className="w-4 h-4" />
                Start Recovery
              </Button>
            </Link>
          </div>
        </>
      )}
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
