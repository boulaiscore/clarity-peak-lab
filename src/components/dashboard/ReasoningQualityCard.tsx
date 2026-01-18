/**
 * ReasoningQualityCard - UI Component for RQ Metric
 * 
 * Displays the Reasoning Quality (RQ) metric with breakdown.
 * 
 * UI COPY:
 * Title: Reasoning Quality
 * Subtitle: How clearly and effectively you think
 * Tooltip: Training builds capacity. Reading and reflection refine reasoning.
 */

import { motion } from "framer-motion";
import { Brain, BookOpen, TrendingUp, Info, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
    if (value >= 80) return { label: "Elite", color: "text-emerald-500" };
    if (value >= 60) return { label: "High", color: "text-primary" };
    if (value >= 40) return { label: "Developing", color: "text-amber-500" };
    return { label: "Building", color: "text-muted-foreground" };
  };
  
  const quality = getQualityLevel(rq);
  
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border/40 animate-pulse">
        <div className="h-5 bg-muted rounded w-32 mb-2" />
        <div className="h-3 bg-muted rounded w-48 mb-4" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border/40"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Reasoning Quality</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Training builds capacity.</p>
                    <p>Reading and reflection refine reasoning.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-[10px] text-muted-foreground">
              How clearly and effectively you think
            </p>
          </div>
        </div>
        
        {isDecaying && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                RQ is decaying due to inactivity. Complete an S2 game or task.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Main Score */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold tabular-nums">
          {Math.round(rq)}%
        </span>
        <span className={cn("text-sm font-medium", quality.color)}>
          {quality.label}
        </span>
      </div>
      
      {/* Breakdown */}
      <div className="space-y-2.5">
        <BreakdownRow
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="S2 Capacity"
          value={s2Core}
          weight={50}
        />
        <BreakdownRow
          icon={<Brain className="w-3.5 h-3.5" />}
          label="Consistency"
          value={s2Consistency}
          weight={30}
        />
        <BreakdownRow
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="Task Priming"
          value={taskPriming}
          weight={20}
        />
      </div>
    </motion.div>
  );
}

interface BreakdownRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  weight: number;
}

function BreakdownRow({ icon, label, value, weight }: BreakdownRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <span className="text-[11px] font-mono text-foreground">
            {Math.round(value)}
            <span className="text-muted-foreground/60 ml-1">×{weight}%</span>
          </span>
        </div>
        <Progress value={value} className="h-1" />
      </div>
    </div>
  );
}
