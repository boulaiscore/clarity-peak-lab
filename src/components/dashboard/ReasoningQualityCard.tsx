/**
 * ReasoningQualityCard - UI Component for RQ Metric
 * 
 * Displays the Reasoning Quality (RQ) metric with premium design.
 * Emphasizes that RQ improves through podcasts, books, and reading.
 */

import { motion } from "framer-motion";
import { Brain, Headphones, BookOpen, FileText, Info, AlertTriangle, TrendingUp } from "lucide-react";
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
  s2Core,
  s2Consistency,
  taskPriming,
  isDecaying,
  isLoading,
}: ReasoningQualityCardProps) {
  const getQualityLevel = (value: number) => {
    if (value >= 80) return { label: "Elite", color: "text-emerald-400", accent: "emerald" };
    if (value >= 60) return { label: "High", color: "text-primary", accent: "primary" };
    if (value >= 40) return { label: "Developing", color: "text-amber-400", accent: "amber" };
    return { label: "Building", color: "text-muted-foreground", accent: "muted" };
  };
  
  const quality = getQualityLevel(rq);
  
  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-card border border-border/40 animate-pulse">
        <div className="h-5 bg-muted rounded w-32 mb-2" />
        <div className="h-3 bg-muted rounded w-48 mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border/40"
    >
      {/* Premium glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
      
      <div className="relative p-5">
        {/* Header with score */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-tight">Reasoning Quality</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] text-xs">
                      <p className="font-medium mb-1">Training builds capacity.</p>
                      <p className="text-muted-foreground">Reading, podcasts and books refine your reasoning quality.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isDecaying && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-[180px]">
                        RQ is decaying. Complete a task to maintain it.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                How clearly and effectively you think
              </p>
            </div>
          </div>
          
          {/* Score badge */}
          <div className="text-right">
            <motion.div 
              className="text-2xl font-bold tabular-nums"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {Math.round(rq)}%
            </motion.div>
            <span className={cn("text-[11px] font-medium", quality.color)}>
              {quality.label}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-5">
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${rq}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>
        
        {/* Content sources that improve RQ */}
        <div className="pt-4 border-t border-border/30">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-3">
            Improve with curated content
          </p>
          <div className="grid grid-cols-3 gap-2">
            <ContentPill 
              icon={<Headphones className="w-3.5 h-3.5" />} 
              label="Podcasts"
              active={taskPriming > 30}
            />
            <ContentPill 
              icon={<BookOpen className="w-3.5 h-3.5" />} 
              label="Books"
              active={taskPriming > 50}
            />
            <ContentPill 
              icon={<FileText className="w-3.5 h-3.5" />} 
              label="Reading"
              active={taskPriming > 20}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ContentPillProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function ContentPill({ icon, label, active }: ContentPillProps) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all",
      active 
        ? "bg-primary/10 text-primary border border-primary/20" 
        : "bg-muted/20 text-muted-foreground border border-transparent"
    )}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}
