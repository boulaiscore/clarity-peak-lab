/**
 * RecoveryBatteryCard - Device-style charging bar for Recovery metric
 * 
 * Displays Recovery as a phone-style horizontal battery with fill level
 * and a pill label matching the ProgressRing label style.
 */

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { getRecoveryStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";

interface RecoveryBatteryCardProps {
  recovery: number;
  isLoading?: boolean;
  deltaVsYesterday?: string | null;
  onClick?: () => void;
}

export function RecoveryBatteryCard({
  recovery,
  isLoading,
  deltaVsYesterday,
  onClick
}: RecoveryBatteryCardProps) {
  const fillPercent = Math.min(Math.max(recovery, 0), 100);

  const getRecoveryColor = (value: number): string => {
    if (value <= 35) {
      const hue = 0 + (value / 35) * 30;
      return `hsl(${hue}, 85%, 45%)`;
    } else if (value <= 65) {
      const p = (value - 35) / 30;
      const hue = 30 + p * 40;
      return `hsl(${hue}, 80%, 48%)`;
    } else {
      const p = (value - 65) / 35;
      const hue = 70 + p * 70;
      return `hsl(${hue}, 90%, 50%)`;
    }
  };

  const recoveryColor = getRecoveryColor(recovery);
  const status = getRecoveryStatus(recovery);
  const displayInfo = getMetricDisplayInfo(status.label, status.level, null, null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1 w-full max-w-[220px]">
          <div className="flex-1 h-6 bg-muted/15 rounded-[4px] animate-pulse" />
          <div className="w-[5px] h-3 bg-muted/15 rounded-r-sm animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-muted/15 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      className="w-full flex flex-col items-center gap-1.5 cursor-pointer group"
    >
      {/* Value + status row */}
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-medium tracking-wide"
          style={{ color: recoveryColor, opacity: 0.75 }}
        >
          {displayInfo.text}
        </span>
        <span className="text-lg font-bold tabular-nums text-foreground leading-none">
          {Math.round(recovery)}%
        </span>
        {deltaVsYesterday && (
          <span
            className="text-[9px] font-medium tabular-nums"
            style={{ color: recoveryColor, opacity: 0.6 }}
          >
            {deltaVsYesterday}
          </span>
        )}
      </div>

      {/* Battery body — device charging style */}
      <div className="flex items-center gap-[3px] w-full max-w-[240px]">
        {/* Main battery shell */}
        <div
          className="relative flex-1 h-[22px] rounded-[5px] border-[1.5px] overflow-hidden"
          style={{ borderColor: `color-mix(in srgb, ${recoveryColor} 35%, transparent)` }}
        >
          {/* Fill with multi-stop gradient */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-[3px]"
            style={{
              background: `linear-gradient(90deg, 
                hsl(0, 80%, 42%) 0%, 
                hsl(25, 82%, 44%) 20%, 
                hsl(40, 78%, 46%) 35%, 
                hsl(55, 75%, 46%) 50%, 
                hsl(75, 80%, 46%) 65%, 
                hsl(110, 85%, 45%) 82%, 
                hsl(140, 85%, 48%) 100%
              )`,
              backgroundSize: `${100 / (fillPercent / 100)}% 100%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
          />

          {/* Top highlight shine */}
          <motion.div
            className="absolute top-0 left-0 h-[1px] bg-white/15 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
          />

          {/* Segment lines for device feel */}
          <div className="absolute inset-0 flex pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r last:border-r-0"
                style={{ borderColor: `color-mix(in srgb, ${recoveryColor} 12%, transparent)` }}
              />
            ))}
          </div>
        </div>

        {/* Battery cap */}
        <div
          className="w-[5px] h-[10px] rounded-r-[2px]"
          style={{ backgroundColor: `color-mix(in srgb, ${recoveryColor} 35%, transparent)` }}
        />
      </div>

      {/* Pill label — matching ProgressRing label style */}
      <span className="mt-0.5 px-3 py-1 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/80 group-hover:bg-muted/60 transition-colors flex items-center gap-1.5">
        Recovery
        <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40" />
      </span>
    </motion.button>
  );
}
