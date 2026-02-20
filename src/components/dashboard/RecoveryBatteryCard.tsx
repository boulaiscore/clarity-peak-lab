/**
 * RecoveryBatteryCard - Premium horizontal recovery bar
 * 
 * Displays Recovery as a sleek progress bar with gradient fill,
 * matching the executive calm aesthetic.
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
      <div className="px-1">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 w-20 bg-muted/15 rounded animate-pulse" />
          <div className="h-3 w-12 bg-muted/15 rounded animate-pulse" />
        </div>
        <div className="h-1.5 bg-muted/10 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
      className="w-full group cursor-pointer"
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Recovery
          </span>
          <span 
            className="text-[9px] font-medium tracking-wide"
            style={{ color: recoveryColor, opacity: 0.7 }}
          >
            {displayInfo.text}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {deltaVsYesterday && (
            <span 
              className="text-[9px] font-medium tabular-nums"
              style={{ color: recoveryColor, opacity: 0.6 }}
            >
              {deltaVsYesterday}
            </span>
          )}
          <span className="text-[11px] font-semibold tabular-nums text-foreground/90">
            {Math.round(recovery)}%
          </span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
        </div>
      </div>

      {/* Premium progress bar */}
      <div className="relative h-[5px] rounded-full overflow-hidden bg-muted/10">
        {/* Subtle track shine */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
        
        {/* Fill with multi-stop gradient */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
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
        
        {/* Subtle top highlight on fill */}
        <motion.div
          className="absolute top-0 left-0 h-[1px] rounded-full bg-white/20"
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        />
      </div>
    </motion.button>
  );
}
