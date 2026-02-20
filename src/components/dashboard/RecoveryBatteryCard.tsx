/**
 * RecoveryBatteryCard - Circular ring indicator for Recovery metric
 * 
 * Displays Recovery as a progress ring matching Sharpness/Readiness/Reasoning style.
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
  const size = 90;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const fillPercent = Math.min(Math.max(recovery, 0), 100);
  const progress = fillPercent / 100;
  const strokeDashoffset = circumference - progress * circumference;

  // Dynamic color based on recovery value
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
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-muted/20 animate-pulse" style={{ width: size, height: size }} />
        <div className="mt-2 h-5 w-16 bg-muted/30 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.97]"
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
            className="opacity-20"
          />
        </svg>
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={recoveryColor} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-medium mb-0.5" style={{ color: recoveryColor, opacity: 0.8 }}>
            {displayInfo.text}
          </span>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {Math.round(recovery)}
          </span>
          {deltaVsYesterday && (
            <span className="text-[8px] font-medium mt-0.5 tabular-nums" style={{ color: recoveryColor, opacity: 0.85 }}>
              {deltaVsYesterday}
            </span>
          )}
        </div>
      </div>
      {/* Label below the ring */}
      <span className="mt-2 px-3 py-1 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/80 hover:bg-muted/60 transition-colors">
        Recovery
      </span>
    </motion.button>
  );
}
