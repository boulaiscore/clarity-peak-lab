/**
 * RecoveryBatteryCard - WHOOP-style premium battery bar
 * 
 * Ultra-minimal, high-contrast recovery indicator with ambient glow.
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
      <div className="flex flex-col items-center gap-3 py-1">
        <div className="h-5 w-16 bg-muted/10 rounded-full animate-pulse" />
        <div className="h-5 w-12 bg-muted/10 rounded animate-pulse" />
        <div className="w-full max-w-[220px] h-[5px] bg-muted/10 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onClick={onClick}
      className="w-full flex flex-col items-center cursor-pointer group py-1"
    >
      {/* Pill label */}
      <span className="px-3 py-1 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/80 group-hover:bg-muted/60 transition-colors mb-3">
        Recovery
      </span>

      {/* Score + delta + status */}
      <div className="flex items-baseline gap-1 mb-3">
        <motion.span
          className="text-[28px] font-bold tabular-nums tracking-tighter leading-none"
          style={{ color: recoveryColor }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {Math.round(recovery)}
        </motion.span>
        <span className="text-[11px] font-medium text-muted-foreground/40 tracking-wide">%</span>
        {deltaVsYesterday && (
          <span
            className="text-[9px] font-medium tabular-nums ml-1.5 opacity-60"
            style={{ color: recoveryColor }}
          >
            {deltaVsYesterday}
          </span>
        )}
      </div>

      {/* Status text */}
      <span
        className="text-[9px] font-medium uppercase tracking-[0.15em] mb-2.5 opacity-70"
        style={{ color: recoveryColor }}
      >
        {displayInfo.text}
      </span>

      {/* Premium bar with glow */}
      <div className="relative w-full max-w-[220px]">
        {/* Ambient glow behind bar */}
        <motion.div
          className="absolute -inset-y-2 left-0 blur-lg rounded-full opacity-30"
          style={{ backgroundColor: recoveryColor }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />

        {/* Track */}
        <div className="relative h-[5px] rounded-full overflow-hidden bg-border/15">
          {/* Fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, 
                hsl(0, 80%, 42%) 0%, 
                hsl(20, 82%, 44%) 15%, 
                hsl(40, 78%, 46%) 30%, 
                hsl(55, 75%, 46%) 45%, 
                hsl(75, 80%, 46%) 60%, 
                hsl(100, 85%, 45%) 78%, 
                hsl(140, 85%, 48%) 100%
              )`,
              backgroundSize: `${100 / (fillPercent / 100)}% 100%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          />

          {/* Top highlight */}
          <motion.div
            className="absolute top-0 left-0 h-[1px] bg-white/25 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          />
        </div>
      </div>
    </motion.button>
  );
}
