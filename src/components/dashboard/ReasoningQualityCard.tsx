/**
 * ReasoningQualityCard - UI Component for RQ Metric
 * 
 * Displays the Reasoning Quality (RQ) metric with clean, sober design.
 */

import { motion } from "framer-motion";
import { Info, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  const getQualityLevel = (value: number) => {
    if (value >= 80) return "Elite";
    if (value >= 60) return "High";
    if (value >= 40) return "Developing";
    return "Building";
  };
  
  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-card border border-border/40 animate-pulse">
        <div className="h-5 bg-muted rounded w-32 mb-2" />
        <div className="h-3 bg-muted rounded w-48 mb-4" />
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-5 rounded-2xl bg-card border border-border/40"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">Reasoning Quality</h3>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="touch-manipulation">
                      <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    sideOffset={8}
                    className="max-w-[220px] text-xs bg-popover text-popover-foreground border border-border shadow-lg z-50"
                  >
                    <p>Training builds capacity. Reading and reflection refine it.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isDecaying && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="touch-manipulation">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top"
                      sideOffset={8}
                      className="text-xs bg-popover text-popover-foreground border border-border shadow-lg z-50"
                    >
                      Decaying due to inactivity
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          <p className="text-[11px] text-muted-foreground">
            How clearly and effectively you think
          </p>
        </div>
        
        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-cyan-500">
            {Math.round(rq)}%
          </div>
          <span className="text-[11px] text-muted-foreground">
            {getQualityLevel(rq)}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-cyan-500/20 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-cyan-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${rq}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      
      {/* Subtle footer */}
      <p className="text-[10px] text-muted-foreground/60 mt-3">
        Built through training and curated content
      </p>
    </motion.div>
  );
}
