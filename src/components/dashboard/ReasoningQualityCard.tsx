/**
 * ReasoningQualityCard - UI Component for RQ Metric
 * 
 * Displays the Reasoning Quality (RQ) metric with clean, sober design.
 * Tappable to navigate to Impact Analysis page.
 */

import { motion } from "framer-motion";
import { Info, AlertTriangle, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={() => navigate("/app/reasoning-quality-impact")}
      className="w-full p-5 rounded-2xl bg-card border border-border/40 text-left hover:bg-card/80 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">Reasoning Quality</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <span 
                    role="button"
                    onClick={(e) => e.stopPropagation()}
                    className="touch-manipulation cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </span>
                </PopoverTrigger>
                <PopoverContent 
                  side="top" 
                  sideOffset={8}
                  className="max-w-[240px] text-xs bg-popover text-popover-foreground border border-border shadow-lg z-50 p-3"
                >
                  <p className="font-medium mb-1.5">Depth of thought elaboration</p>
                  <p className="text-muted-foreground">Improve through System 2 thinking games, books, readings, and podcasts.</p>
                </PopoverContent>
              </Popover>
              {isDecaying && (
                <Popover>
                  <PopoverTrigger asChild>
                    <span 
                      role="button"
                      onClick={(e) => e.stopPropagation()}
                      className="touch-manipulation cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
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
          <p className="text-[11px] text-muted-foreground">
            Depth and quality of thought elaboration
          </p>
        </div>
        
        {/* Score + Chevron */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {Math.round(rq)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {getQualityLevel(rq)}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-foreground/20 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${rq}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      
      {/* Subtle footer */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-muted-foreground/60">
          Refined through deep reasoning practice
        </p>
        <span className="text-[10px] text-primary/70 font-medium">
          View Impact →
        </span>
      </div>
    </motion.button>
  );
}
