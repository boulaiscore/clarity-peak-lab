/**
 * ReasoningQualityCard - UI Component for RQ Metric
 * 
 * Displays the Reasoning Quality (RQ) metric with clean, sober design.
 * Tappable to navigate to Impact Analysis page.
 */

import { motion } from "framer-motion";
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
}

export function ReasoningQualityCard({
  rq,
  isDecaying,
  isLoading,
}: ReasoningQualityCardProps) {
  const navigate = useNavigate();
  
  
  if (isLoading) {
    return (
      <div className="p-3 rounded-xl bg-card border border-border/40 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-1" />
        <div className="h-6 bg-muted rounded w-16" />
      </div>
    );
  }
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={() => navigate("/app/reasoning-quality-impact")}
      className="w-full p-3 rounded-xl bg-card border border-border/40 text-left hover:bg-card/80 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Reasoning Quality</h3>
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
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xl font-bold tabular-nums">
              {Math.round(rq)}
            </span>
            <span className="text-[10px] text-muted-foreground/70 ml-1.5">
              {getMetricDisplayInfo(
                getReasoningQualityStatus(rq).label,
                getReasoningQualityStatus(rq).level,
                null,
                null
              ).text}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
        </div>
      </div>
    </motion.button>
  );
}
