/**
 * RecoveryBatteryCard - Horizontal battery/loading bar for Recovery metric
 * 
 * Displays Recovery as a horizontal progress bar, centered below the 3 rings.
 */

import { motion } from "framer-motion";
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
      <div className="flex flex-col items-center gap-1.5 px-2">
        <div className="h-3 bg-muted/20 rounded-full w-full animate-pulse" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className="w-full px-2 cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.99]"
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/80">
          Recovery
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-medium" style={{ color: recoveryColor, opacity: 0.8 }}>
            {displayInfo.text}
          </span>
          <span className="text-xs font-bold tabular-nums text-foreground">
            {Math.round(recovery)}%
          </span>
          {deltaVsYesterday && (
            <span className="text-[8px] font-medium tabular-nums" style={{ color: recoveryColor, opacity: 0.85 }}>
              {deltaVsYesterday}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: recoveryColor }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </motion.button>
  );
}
