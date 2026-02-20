/**
 * RecoveryBatteryCard - WHOOP-style premium battery bar
 * 
 * Minimal, high-contrast battery indicator with clean typography.
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
      const hue = (value / 35) * 30;
      return `hsl(${hue}, 85%, 45%)`;
    } else if (value <= 65) {
      const hue = 30 + ((value - 35) / 30) * 40;
      return `hsl(${hue}, 80%, 48%)`;
    } else {
      const hue = 70 + ((value - 65) / 35) * 70;
      return `hsl(${hue}, 90%, 50%)`;
    }
  };

  const recoveryColor = getRecoveryColor(recovery);
  const status = getRecoveryStatus(recovery);
  const displayInfo = getMetricDisplayInfo(status.label, status.level, null, null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2.5">
        <div className="h-4 w-10 bg-muted/10 rounded animate-pulse" />
        <div className="w-full max-w-[200px] h-[6px] bg-muted/10 rounded-full animate-pulse" />
        <div className="h-5 w-16 bg-muted/10 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onClick={onClick}
      className="w-full flex flex-col items-center cursor-pointer group"
    >
      {/* Big number + status */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground leading-none">
          {Math.round(recovery)}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50">
          %
        </span>
        {deltaVsYesterday && (
          <span
            className="text-[9px] font-medium tabular-nums ml-1"
            style={{ color: recoveryColor, opacity: 0.7 }}
          >
            {deltaVsYesterday}
          </span>
        )}
      </div>

      {/* Minimal bar */}
      <div className="relative w-full max-w-[200px] h-[6px] rounded-full overflow-hidden bg-border/20 mb-2">
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
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </div>

      {/* Pill label — same style as Sharpness/Readiness/Reasoning */}
      <div className="flex items-center">
        <span className="px-3 py-1 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/80 group-hover:bg-muted/60 transition-colors flex items-center gap-1">
          Recovery
          <span
            className="text-[9px] font-medium normal-case tracking-normal"
            style={{ color: recoveryColor, opacity: 0.75 }}
          >
            · {displayInfo.text}
          </span>
        </span>
      </div>
    </motion.button>
  );
}
