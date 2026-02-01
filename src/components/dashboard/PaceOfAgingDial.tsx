/**
 * ============================================
 * PACE OF AGING DIAL (WHOOP-style)
 * ============================================
 * 
 * Circular gauge showing pace of cognitive aging:
 * - 0.5x: Aging much slower (green)
 * - 1.0x: Stable (neutral)
 * - 2.5x: Aging faster (red)
 * 
 * Based on 30d vs 180d performance trend.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaceOfAgingDialProps {
  pace: number | null; // 0.5 to 2.5
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function PaceOfAgingDial({ 
  pace, 
  size = "md",
  showLabel = true 
}: PaceOfAgingDialProps) {
  const displayPace = pace ?? 1.0;
  
  // Clamp pace to valid range
  const clampedPace = Math.max(0.5, Math.min(2.5, displayPace));
  
  // Calculate rotation: 0.5x = -90deg (left), 1.0x = 0deg (top), 2.5x = 90deg (right)
  // Linear mapping: pace 0.5-2.5 → angle -90 to 90
  const normalizedPace = (clampedPace - 0.5) / 2.0; // 0 to 1
  const angle = -90 + normalizedPace * 180; // -90 to 90
  
  // Determine color band
  const getColorInfo = () => {
    if (clampedPace <= 0.9) {
      return {
        color: "hsl(var(--success))",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        label: "Aging Slower",
        textColor: "text-emerald-500",
      };
    } else if (clampedPace <= 1.1) {
      return {
        color: "hsl(var(--muted-foreground))",
        bgColor: "bg-muted/30",
        borderColor: "border-border/50",
        label: "Stable",
        textColor: "text-muted-foreground",
      };
    } else {
      return {
        color: "hsl(var(--destructive))",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        label: "Aging Faster",
        textColor: "text-red-500",
      };
    }
  };
  
  const colorInfo = getColorInfo();
  
  // Size configurations
  const sizeConfig = {
    sm: {
      container: "w-16 h-10",
      arcWidth: 64,
      arcHeight: 40,
      strokeWidth: 4,
      fontSize: "text-[10px]",
      paceSize: "text-xs",
      needleLength: 20,
    },
    md: {
      container: "w-24 h-14",
      arcWidth: 96,
      arcHeight: 56,
      strokeWidth: 5,
      fontSize: "text-[10px]",
      paceSize: "text-sm",
      needleLength: 28,
    },
    lg: {
      container: "w-32 h-20",
      arcWidth: 128,
      arcHeight: 80,
      strokeWidth: 6,
      fontSize: "text-xs",
      paceSize: "text-base",
      needleLength: 36,
    },
  };
  
  const config = sizeConfig[size];
  const centerX = config.arcWidth / 2;
  const centerY = config.arcHeight - 4;
  const radius = config.arcWidth / 2 - config.strokeWidth - 2;
  
  // Create arc path (semicircle from left to right)
  const arcPath = `
    M ${config.strokeWidth + 2} ${centerY}
    A ${radius} ${radius} 0 0 1 ${config.arcWidth - config.strokeWidth - 2} ${centerY}
  `;
  
  // Calculate needle endpoint
  const needleAngle = (angle - 90) * (Math.PI / 180); // Convert to radians, adjust for SVG
  const needleX = centerX + Math.cos(needleAngle) * config.needleLength;
  const needleY = centerY + Math.sin(needleAngle) * config.needleLength;
  
  if (pace === null) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center",
        config.container,
      )}>
        <span className="text-[10px] text-muted-foreground/50">
          Calculating...
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "relative flex items-end justify-center",
        config.container,
      )}>
        <svg
          width={config.arcWidth}
          height={config.arcHeight}
          viewBox={`0 0 ${config.arcWidth} ${config.arcHeight}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Colored arc segments */}
          {/* Green zone (0.5x - 0.9x) */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--success))"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(0.4 / 2.0) * Math.PI * radius} ${Math.PI * radius}`}
            strokeDashoffset={0}
            opacity={0.3}
          />
          
          {/* Neutral zone (0.9x - 1.1x) - kept transparent */}
          
          {/* Red zone (1.1x - 2.5x) */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(1.4 / 2.0) * Math.PI * radius} ${Math.PI * radius}`}
            strokeDashoffset={`-${(0.6 / 2.0) * Math.PI * radius}`}
            opacity={0.3}
          />
          
          {/* Center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r={4}
            fill="hsl(var(--foreground))"
          />
          
          {/* Needle */}
          <motion.line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={colorInfo.color}
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ x2: centerX, y2: centerY - config.needleLength }}
            animate={{ x2: needleX, y2: needleY }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
          
          {/* Needle tip dot */}
          <motion.circle
            cx={needleX}
            cy={needleY}
            r={3}
            fill={colorInfo.color}
            initial={{ cx: centerX, cy: centerY - config.needleLength }}
            animate={{ cx: needleX, cy: needleY }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
          
          {/* Scale labels */}
          <text
            x={config.strokeWidth + 4}
            y={centerY - 4}
            className={cn("fill-muted-foreground", config.fontSize)}
            textAnchor="start"
          >
            0.5x
          </text>
          <text
            x={centerX}
            y={8}
            className={cn("fill-muted-foreground", config.fontSize)}
            textAnchor="middle"
          >
            1.0x
          </text>
          <text
            x={config.arcWidth - config.strokeWidth - 4}
            y={centerY - 4}
            className={cn("fill-muted-foreground", config.fontSize)}
            textAnchor="end"
          >
            2.5x
          </text>
        </svg>
      </div>
      
      {/* Value and label below */}
      <div className="flex flex-col items-center -mt-1">
        <span className={cn("font-semibold", config.paceSize, colorInfo.textColor)}>
          {clampedPace.toFixed(1)}x
        </span>
        {showLabel && (
          <span className={cn("text-[9px] uppercase tracking-wider", colorInfo.textColor)}>
            {colorInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}
