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
  deltaVsYesterday
}: ReasoningQualityCardProps) {
  const navigate = useNavigate();
  if (isLoading) {
    return <div className="px-3 py-2 rounded-lg bg-card border border-border/40 animate-pulse">
        <div className="h-3 bg-muted rounded w-24 mb-1.5" />
        <div className="h-5 bg-muted rounded w-16 mb-1.5" />
        <div className="h-1 bg-muted rounded-full" />
      </div>;
  }
  return <motion.button initial={{
    opacity: 0,
    y: 8
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    ease: "easeOut"
  }} onClick={() => navigate("/app/reasoning-quality-impact")} className="w-full px-3 py-2 rounded-lg bg-card border border-border/40 text-left hover:bg-card/80 transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[10px] font-medium text-foreground/80 uppercase tracking-[0.12em]">Reasoning Quality</h3>
          {isDecaying && <Popover>
              <PopoverTrigger asChild>
                <span role="button" onClick={e => e.stopPropagation()} className="touch-manipulation cursor-pointer">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                </span>
              </PopoverTrigger>
              <PopoverContent side="top" sideOffset={8} className="text-xs bg-popover text-popover-foreground border border-border shadow-lg z-50 p-2">
                Decaying due to inactivity
              </PopoverContent>
            </Popover>}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
      </div>
      
      {/* Score row */}
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="font-bold tabular-nums text-lg">
          {Math.round(rq)}
        </span>
        <span className="text-[10px] text-primary">
          {getMetricDisplayInfo(getReasoningQualityStatus(rq).label, getReasoningQualityStatus(rq).level, null, null).text}
        </span>
        {deltaVsYesterday && <span className="text-[9px] font-medium tabular-nums ml-0.5 text-primary">
            {deltaVsYesterday}
          </span>}
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-primary/15 rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary rounded-full" initial={{
        width: 0
      }} animate={{
        width: `${rq}%`
      }} transition={{
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2
      }} />
      </div>
    </motion.button>;
}