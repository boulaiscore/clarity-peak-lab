/**
 * ReasoningQualityCard - UI Component for RQ Metric
 * 
 * Displays the Reasoning Quality (RQ) metric with premium design.
 * 
 * UI COPY:
 * Title: Reasoning Quality
 * Subtitle: How clearly and effectively you think
 * Tooltip: Training builds capacity. Reading and reflection refine reasoning.
 */

import { motion } from "framer-motion";
import { Brain, Sparkles, Info, AlertTriangle } from "lucide-react";
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
  // Quality level based on RQ
  const getQualityLevel = (value: number) => {
    if (value >= 80) return { label: "Elite", color: "text-emerald-400", bgColor: "from-emerald-500/20 to-emerald-500/5" };
    if (value >= 60) return { label: "High", color: "text-primary", bgColor: "from-primary/20 to-primary/5" };
    if (value >= 40) return { label: "Developing", color: "text-amber-400", bgColor: "from-amber-500/20 to-amber-500/5" };
    return { label: "Building", color: "text-muted-foreground", bgColor: "from-muted/20 to-muted/5" };
  };
  
  const quality = getQualityLevel(rq);
  
  // Get status for each component
  const getComponentStatus = (value: number) => {
    if (value >= 70) return "strong";
    if (value >= 40) return "moderate";
    return "developing";
  };
  
  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/40 animate-pulse">
        <div className="h-5 bg-muted rounded w-32 mb-2" />
        <div className="h-3 bg-muted rounded w-48 mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/90 border border-border/40"
    >
      {/* Subtle gradient overlay based on quality */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none",
        quality.bgColor
      )} />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              {rq >= 70 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </motion.div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-tight">Reasoning Quality</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      <p className="font-medium mb-1">Training builds capacity.</p>
                      <p className="text-muted-foreground">Reading and reflection refine reasoning.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-[11px] text-muted-foreground">
                How clearly and effectively you think
              </p>
            </div>
          </div>
          
          {isDecaying && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[180px]">
                  RQ is decaying due to inactivity. Complete a slow thinking game or task.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Main Score with Arc */}
        <div className="flex items-center gap-6 mb-5">
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
              {/* Background arc */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/20"
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="url(#rqGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(rq / 100) * 213.6} 213.6`}
                initial={{ strokeDasharray: "0 213.6" }}
                animate={{ strokeDasharray: `${(rq / 100) * 213.6} 213.6` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
              <defs>
                <linearGradient id="rqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className="text-2xl font-bold tabular-nums"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {Math.round(rq)}%
              </motion.span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className={cn("text-sm font-semibold mb-1", quality.color)}>
              {quality.label}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {rq >= 70 
                ? "Your reasoning is sharp and refined"
                : rq >= 50 
                  ? "Good foundation, room to grow"
                  : "Building your reasoning skills"
              }
            </p>
          </div>
        </div>
        
        {/* Component Indicators - Minimal dots */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/30">
          <ComponentDot 
            label="Capacity" 
            status={getComponentStatus(s2Core)} 
          />
          <ComponentDot 
            label="Consistency" 
            status={getComponentStatus(s2Consistency)} 
          />
          <ComponentDot 
            label="Depth" 
            status={getComponentStatus(taskPriming)} 
          />
        </div>
      </div>
    </motion.div>
  );
}

interface ComponentDotProps {
  label: string;
  status: "strong" | "moderate" | "developing";
}

function ComponentDot({ label, status }: ComponentDotProps) {
  const colors = {
    strong: "bg-emerald-400",
    moderate: "bg-primary",
    developing: "bg-muted-foreground/40"
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-1.5 h-1.5 rounded-full", colors[status])} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
