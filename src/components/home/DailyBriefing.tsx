/**
 * DailyBriefing - Whoop-style daily cognitive summary
 * 
 * Provides actionable insight based on the combination of all 4 core metrics.
 * Deterministic logic, no LLM required.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Battery, Brain, Zap, Target } from "lucide-react";

interface DailyBriefingProps {
  sharpness: number;
  readiness: number;
  recovery: number;
  rq: number;
  isLoading?: boolean;
}

interface BriefingResult {
  headline: string;
  action: string;
  icon: React.ElementType;
}

function generateBriefing(
  sharpness: number,
  readiness: number,
  recovery: number,
  rq: number
): BriefingResult {
  // Priority 1: Recovery is critically low
  if (recovery < 40) {
    return {
      headline: "Recovery is limiting you.",
      action: "Rest before training.",
      icon: Battery,
    };
  }
  
  // Priority 2: Peak state - both sharpness and readiness high
  if (sharpness >= 70 && readiness >= 70) {
    return {
      headline: "Peak state today.",
      action: "Tackle hard cognitive work.",
      icon: Target,
    };
  }
  
  // Priority 3: Good recovery but RQ is low - focus on reasoning
  if (recovery >= 50 && rq < 40) {
    return {
      headline: "Reasoning needs attention.",
      action: "Try a task or S2 game.",
      icon: Brain,
    };
  }
  
  // Priority 4: Good recovery with weak sharpness - build fast thinking
  if (recovery >= 60 && sharpness < 50) {
    return {
      headline: "Good recovery available.",
      action: "Build fast processing today.",
      icon: Zap,
    };
  }
  
  // Priority 5: Good recovery with weak readiness - build reasoning
  if (recovery >= 60 && readiness < 50) {
    return {
      headline: "Good recovery available.",
      action: "Train reasoning capacity.",
      icon: Brain,
    };
  }
  
  // Priority 6: Everything moderate - steady state
  if (sharpness >= 45 && sharpness < 70 && readiness >= 45 && readiness < 70) {
    return {
      headline: "Steady baseline.",
      action: "Maintain with light training.",
      icon: Target,
    };
  }
  
  // Priority 7: High readiness, lower sharpness
  if (readiness >= 70 && sharpness < 60) {
    return {
      headline: "Endurance is strong.",
      action: "Focus on quick processing.",
      icon: Zap,
    };
  }
  
  // Priority 8: High sharpness, lower readiness
  if (sharpness >= 70 && readiness < 60) {
    return {
      headline: "Quick bursts are optimal.",
      action: "Avoid long sessions.",
      icon: Zap,
    };
  }
  
  // Default: balanced moderate state
  return {
    headline: "Conditions are stable.",
    action: "Complete your session.",
    icon: Target,
  };
}

export function DailyBriefing({
  sharpness,
  readiness,
  recovery,
  rq,
  isLoading,
}: DailyBriefingProps) {
  const briefing = useMemo(
    () => generateBriefing(sharpness, readiness, recovery, rq),
    [sharpness, readiness, recovery, rq]
  );
  
  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-card/50 border border-border/30 animate-pulse">
        <div className="h-4 bg-muted rounded w-48 mb-2" />
        <div className="h-3 bg-muted rounded w-32" />
      </div>
    );
  }
  
  const IconComponent = briefing.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-4 p-4 rounded-xl bg-card/50 border border-border/30"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <IconComponent className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {briefing.headline}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <ArrowRight className="w-3 h-3" />
            {briefing.action}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
