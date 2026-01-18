/**
 * ============================================
 * S1 DIFFICULTY SELECTOR v1.0
 * ============================================
 * 
 * Reusable difficulty selector for System 1 games.
 * Shows enabled, recommended, and locked states.
 * Allows override selection if not locked.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Difficulty, DifficultyOption } from "@/lib/s1DifficultyEngine";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface S1DifficultySelectorProps {
  options: DifficultyOption[];
  recommended: Difficulty;
  selected: Difficulty;
  onSelect: (difficulty: Difficulty, isOverride: boolean) => void;
  isLoading?: boolean;
  safetyModeActive?: boolean;
  safetyLabel?: string;
  /** Accent color for buttons - matches game accent */
  accentColor?: "cyan" | "violet" | "emerald" | "amber";
}

const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  shortLabel: string;
  description: string;
}> = {
  easy: {
    label: "Easy",
    shortLabel: "E",
    description: "Wider margins, gentler pace",
  },
  medium: {
    label: "Medium",
    shortLabel: "M",
    description: "Balanced challenge",
  },
  hard: {
    label: "Hard",
    shortLabel: "H",
    description: "Tight margins, higher pressure",
  },
};

export function S1DifficultySelector({
  options,
  recommended,
  selected,
  onSelect,
  isLoading = false,
  safetyModeActive = false,
  safetyLabel,
  accentColor = "cyan",
}: S1DifficultySelectorProps) {
  // Get accent color classes
  const getAccentClasses = () => {
    switch (accentColor) {
      case "violet":
        return {
          bg: "bg-violet-500/15",
          border: "border-violet-500/30",
          text: "text-violet-400",
          ring: "ring-violet-500/20",
          gradient: "from-violet-500 to-violet-400",
        };
      case "emerald":
        return {
          bg: "bg-emerald-500/15",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          ring: "ring-emerald-500/20",
          gradient: "from-emerald-500 to-emerald-400",
        };
      case "amber":
        return {
          bg: "bg-amber-500/15",
          border: "border-amber-500/30",
          text: "text-amber-400",
          ring: "ring-amber-500/20",
          gradient: "from-amber-500 to-amber-400",
        };
      default:
        return {
          bg: "bg-cyan-500/15",
          border: "border-cyan-500/30",
          text: "text-cyan-400",
          ring: "ring-cyan-500/20",
          gradient: "from-cyan-500 to-cyan-400",
        };
    }
  };
  
  const accent = getAccentClasses();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Select Difficulty</span>
        {safetyModeActive && safetyLabel && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80">
            <AlertTriangle className="w-3 h-3" />
            <span>{safetyLabel}</span>
          </div>
        )}
      </div>
      
      {/* Difficulty buttons */}
      <div className="grid grid-cols-3 gap-2">
        <TooltipProvider>
          {options.map((option) => {
            const config = DIFFICULTY_CONFIG[option.difficulty];
            const isSelected = selected === option.difficulty;
            const isRecommended = option.status === "recommended";
            const isLocked = option.status === "locked";
            
            return (
              <Tooltip key={option.difficulty}>
                <TooltipTrigger asChild>
                  <motion.button
                    whileTap={!isLocked ? { scale: 0.95 } : undefined}
                    onClick={() => {
                      if (!isLocked) {
                        const isOverride = option.difficulty !== recommended;
                        onSelect(option.difficulty, isOverride);
                      }
                    }}
                    disabled={isLocked}
                    className={cn(
                      "relative p-3 rounded-xl border transition-all text-center",
                      isLocked
                        ? "bg-muted/20 border-border/30 opacity-50 cursor-not-allowed"
                        : isSelected
                          ? cn(accent.bg, accent.border, "ring-2", accent.ring)
                          : "bg-background/50 border-border/50 hover:border-border hover:bg-background/80"
                    )}
                  >
                    {/* Recommended badge */}
                    {isRecommended && !isLocked && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 border border-primary/30">
                        <Sparkles className="w-2.5 h-2.5 text-primary" />
                        <span className="text-[8px] font-medium text-primary">Suggested</span>
                      </div>
                    )}
                    
                    {/* Lock icon for locked */}
                    {isLocked && (
                      <div className="absolute top-1.5 right-1.5">
                        <Lock className="w-3 h-3 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "text-sm font-semibold mb-0.5",
                      isLocked 
                        ? "text-muted-foreground/50" 
                        : isSelected 
                          ? accent.text 
                          : "text-foreground"
                    )}>
                      {config.label}
                    </div>
                    
                    <div className="text-[9px] text-muted-foreground">
                      {config.description}
                    </div>
                  </motion.button>
                </TooltipTrigger>
                
                {isLocked && option.lockReason && (
                  <TooltipContent side="bottom" className="max-w-[180px]">
                    <div className="text-xs">
                      <p className="font-medium text-foreground">{option.lockReason.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Build recovery to unlock
                      </p>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
      
      {/* Override notice */}
      {selected !== recommended && !options.find(o => o.difficulty === selected)?.lockReason && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
          <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            You've selected <span className="text-foreground font-medium">{DIFFICULTY_CONFIG[selected].label}</span> 
            {" "}instead of the recommended <span className="text-foreground font-medium">{DIFFICULTY_CONFIG[recommended].label}</span>.
            This will be recorded.
          </p>
        </div>
      )}
    </div>
  );
}
