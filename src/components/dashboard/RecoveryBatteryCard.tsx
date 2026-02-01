/**
 * RecoveryBatteryCard - Horizontal battery indicator for Recovery metric
 * 
 * Displays Recovery as a phone-style horizontal battery with fill level.
 * Tappable to navigate to capacity details.
 */

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  
  // Recovery color - Teal
  const recoveryColor = "hsl(174, 72%, 45%)";
  
  // Get fill percentage (clamped 0-100)
  const fillPercent = Math.min(Math.max(recovery, 0), 100);
  
  // Get status info
  const status = getRecoveryStatus(recovery);
  const displayInfo = getMetricDisplayInfo(status.label, status.level, null, null);
  
  if (isLoading) {
    return (
      <div className="px-3 py-2 rounded-lg bg-card border border-border/40 animate-pulse">
        <div className="h-3 bg-muted rounded w-20 mb-1.5" />
        <div className="h-5 bg-muted rounded w-14 mb-1.5" />
        <div className="h-4 bg-muted rounded-sm w-full" />
      </div>
    );
  }
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className="w-full px-3 py-2 rounded-lg bg-card border border-border/40 text-left hover:bg-card/80 transition-colors"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] font-medium text-foreground/80 uppercase tracking-[0.12em]">
          Recovery
        </h3>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
      </div>
      
      {/* Score row */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="font-bold tabular-nums text-2xl">
          {Math.round(recovery)}%
        </span>
        <span 
          className="text-[10px] font-medium"
          style={{ color: recoveryColor }}
        >
          {displayInfo.text}
        </span>
        {deltaVsYesterday && (
          <span 
            className="text-[9px] font-medium tabular-nums ml-0.5"
            style={{ color: recoveryColor }}
          >
            {deltaVsYesterday}
          </span>
        )}
      </div>
      
      {/* Battery indicator */}
      <div className="flex items-center gap-1">
        {/* Battery body */}
        <div 
          className="relative flex-1 h-5 rounded-sm border-2 overflow-hidden"
          style={{ borderColor: `${recoveryColor}60` }}
        >
          {/* Battery fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-sm"
            style={{ backgroundColor: recoveryColor }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
          
          {/* Battery segments (visual detail) */}
          <div className="absolute inset-0 flex">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r last:border-r-0"
                style={{ borderColor: `${recoveryColor}20` }}
              />
            ))}
          </div>
        </div>
        
        {/* Battery cap */}
        <div 
          className="w-1.5 h-3 rounded-r-sm"
          style={{ backgroundColor: `${recoveryColor}60` }}
        />
      </div>
    </motion.button>
  );
}
