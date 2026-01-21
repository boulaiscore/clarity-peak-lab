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
  // === CRITICAL STATES (Priority 1-2) ===
  
  // Recovery critically low - blocks everything
  if (recovery < 35) {
    return {
      headline: "Recovery is your bottleneck.",
      action: "Prioritize rest. Training today would be counterproductive.",
      icon: Battery,
    };
  }
  
  // Recovery low but not critical
  if (recovery < 50) {
    return {
      headline: "Low recovery detected.",
      action: "Light activity only. A detox session would help.",
      icon: Battery,
    };
  }
  
  // === PEAK STATES (Priority 3-5) ===
  
  // Full peak - everything high
  if (sharpness >= 75 && readiness >= 75 && rq >= 60) {
    return {
      headline: "Peak cognitive state.",
      action: "This is your best window for complex decisions and deep work.",
      icon: Target,
    };
  }
  
  // High sharpness + readiness, but RQ is lagging
  if (sharpness >= 70 && readiness >= 70 && rq < 50) {
    return {
      headline: "High output, shallow depth.",
      action: "You're fast today. Add a reasoning task to deepen thinking.",
      icon: Brain,
    };
  }
  
  // Standard peak - sharpness and readiness aligned
  if (sharpness >= 70 && readiness >= 70) {
    return {
      headline: "Strong cognitive day.",
      action: "Tackle your hardest work now.",
      icon: Target,
    };
  }
  
  // === IMBALANCED STATES (Priority 6-10) ===
  
  // High RQ but low sharpness - deep but slow
  if (rq >= 60 && sharpness < 50) {
    return {
      headline: "Deep thinking, slow processing.",
      action: "Good for reflection and analysis. Avoid time-pressure tasks.",
      icon: Brain,
    };
  }
  
  // High RQ but low readiness - can think well but not for long
  if (rq >= 60 && readiness < 50) {
    return {
      headline: "Quality over duration.",
      action: "Short focused bursts. Take breaks between sessions.",
      icon: Brain,
    };
  }
  
  // High sharpness, low readiness - fast but limited endurance
  if (sharpness >= 70 && readiness < 55) {
    return {
      headline: "Quick bursts available.",
      action: "Effective for rapid decisions. Avoid marathon sessions.",
      icon: Zap,
    };
  }
  
  // High readiness, low sharpness - can sustain but not sharp
  if (readiness >= 70 && sharpness < 55) {
    return {
      headline: "Endurance is strong.",
      action: "Routine work flows well. Save complex tasks for peak days.",
      icon: Target,
    };
  }
  
  // Low RQ with good recovery - reasoning gap
  if (rq < 40 && recovery >= 55) {
    return {
      headline: "Reasoning depth is low.",
      action: "A library task or S2 game would sharpen your thinking.",
      icon: Brain,
    };
  }
  
  // === TRAINING OPPORTUNITIES (Priority 11-13) ===
  
  // Good recovery, weak sharpness - S1 training opportunity
  if (recovery >= 60 && sharpness < 50) {
    return {
      headline: "Recovery supports training.",
      action: "Focus games would boost your processing speed.",
      icon: Zap,
    };
  }
  
  // Good recovery, weak readiness - endurance training opportunity
  if (recovery >= 60 && readiness < 50) {
    return {
      headline: "Capacity available.",
      action: "Build reasoning to improve sustained performance.",
      icon: Brain,
    };
  }
  
  // === MODERATE STATES (Priority 14-15) ===
  
  // All metrics moderate - stable baseline
  if (sharpness >= 45 && sharpness < 70 && readiness >= 45 && readiness < 70 && rq >= 40 && rq < 60) {
    return {
      headline: "Steady baseline.",
      action: "Routine work is fine. One training session maintains momentum.",
      icon: Target,
    };
  }
  
  // Moderate with one weak area
  if (sharpness >= 50 && readiness >= 50 && rq < 40) {
    return {
      headline: "Functional but shallow.",
      action: "Consider a reading or task to build reasoning depth.",
      icon: Brain,
    };
  }
  
  // === DEFAULT ===
  return {
    headline: "Conditions are stable.",
    action: "Complete your planned session.",
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
