/**
 * ReasoningQualityCard - UI Component for RQ Metric
 * 
 * Displays the Reasoning Quality (RQ) metric with clean, sober design.
 * Tappable to navigate to Impact Analysis page.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { getReasoningQualityStatus } from "@/lib/metricStatusLabels";
import { getMetricDisplayInfo } from "@/lib/metricDisplayLogic";

interface ReasoningQualityCardProps {
  rq: number;
  s2Core: number;
  s2Consistency: number;
  taskPriming: number;
  isDecaying: boolean;
  isLoading?: boolean;
  deltaVsYesterday?: string | null;
}

export function ReasoningQualityCard({
  rq,
  isDecaying,
  isLoading,
  deltaVsYesterday,
}: ReasoningQualityCardProps) {
  const navigate = useNavigate();
  
  
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border/40 animate-pulse">
        <div className="h-4 bg-muted rounded w-28 mb-3" />
        <div className="h-8 bg-muted rounded w-20 mb-3" />
        <div className="h-1.5 bg-muted rounded-full" />
      </div>
    );
  }
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={() => navigate("/app/reasoning-quality-impact")}
      className="w-full p-4 rounded-xl bg-card border border-border/40 text-left hover:bg-card/80 transition-colors"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reasoning Quality</h3>
          {isDecaying && (
            <Popover>
              <PopoverTrigger asChild>
                <span 
                  role="button"
                  onClick={(e) => e.stopPropagation()}
                  className="touch-manipulation cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                </span>
              </PopoverTrigger>
              <PopoverContent 
                side="top"
                sideOffset={8}
                className="text-xs bg-popover text-popover-foreground border border-border shadow-lg z-50 p-2"
              >
                Decaying due to inactivity
              </PopoverContent>
            </Popover>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
      </div>
      
      {/* Score row */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold tabular-nums">
          {Math.round(rq)}
        </span>
        <span className="text-xs text-muted-foreground">
          {getMetricDisplayInfo(
            getReasoningQualityStatus(rq).label,
            getReasoningQualityStatus(rq).level,
            null,
            null
          ).text}
        </span>
        {deltaVsYesterday && (
          <span className={cn(
            "text-[10px] font-medium tabular-nums ml-1",
            deltaVsYesterday.startsWith("+") ? "text-emerald-500" : deltaVsYesterday.startsWith("-") ? "text-rose-400" : "text-muted-foreground/60"
          )}>
            ({deltaVsYesterday} vs ieri)
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-primary/15 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${rq}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </motion.button>
  );
}
