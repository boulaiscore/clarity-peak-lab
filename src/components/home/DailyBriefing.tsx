/**
 * DailyBriefing - Daily cognitive summary in plain prose
 * 
 * Provides actionable insight based on the combination of all 4 core metrics.
 * No icons, no bullets - just clear, readable text.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";

interface DailyBriefingProps {
  sharpness: number;
  readiness: number;
  recovery: number;
  rq: number;
  isLoading?: boolean;
}

export function generateBriefing(
  sharpness: number,
  readiness: number,
  recovery: number,
  rq: number
): string {
  // === CRITICAL STATES ===
  
  if (recovery < 35) {
    return "Your recovery is low today, which limits how effectively you can think and train. Prioritize rest—pushing through would be counterproductive.";
  }
  
  if (recovery < 50) {
    return "Recovery is below optimal. Keep cognitive demands light today and consider a detox session to restore your mental energy.";
  }
  
  // === PEAK STATES ===
  
  if (sharpness >= 75 && readiness >= 75 && rq >= 60) {
    return "You're in peak cognitive state today. This is your best window for complex decisions, strategic thinking, and demanding deep work.";
  }
  
  if (sharpness >= 70 && readiness >= 70 && rq < 50) {
    return "Your speed and endurance are strong, but reasoning depth is lagging. You're effective at execution today—consider adding a task or reading to build depth.";
  }
  
  if (sharpness >= 70 && readiness >= 70) {
    return "Strong cognitive day. Your processing and endurance are aligned—tackle your hardest work now while conditions are favorable.";
  }
  
  // === IMBALANCED STATES ===
  
  if (rq >= 60 && sharpness < 50) {
    return "Your reasoning is sharp but processing speed is slow today. Good conditions for reflection and analysis, but avoid tasks with time pressure.";
  }
  
  if (rq >= 60 && readiness < 50) {
    return "Quality thinking is available but endurance is limited. Work in short focused bursts with breaks between sessions.";
  }
  
  if (sharpness >= 70 && readiness < 55) {
    return "Quick bursts are available but sustained effort will be difficult. Effective for rapid decisions—avoid marathon sessions.";
  }
  
  if (readiness >= 70 && sharpness < 55) {
    return "You can sustain effort well today, but sharpness is moderate. Routine work will flow smoothly—save complex tasks for peak days.";
  }
  
  if (rq < 40 && recovery >= 55) {
    return "Your reasoning depth could use attention. A library task or reasoning game would help sharpen your thinking.";
  }
  
  // === TRAINING OPPORTUNITIES ===
  
  if (recovery >= 60 && sharpness < 50) {
    return "Good recovery supports training today. Focus games would help boost your processing speed.";
  }
  
  if (recovery >= 60 && readiness < 50) {
    return "You have capacity available for training. Building reasoning would improve your sustained performance.";
  }
  
  // === MODERATE STATES ===
  
  if (sharpness >= 45 && sharpness < 70 && readiness >= 45 && readiness < 70 && rq >= 40 && rq < 60) {
    return "Steady baseline today. Routine work is fine, and one training session will help maintain your momentum.";
  }
  
  if (sharpness >= 50 && readiness >= 50 && rq < 40) {
    return "Functional but shallow—your speed and endurance are fine, but reasoning depth is low. Consider a reading or task to build depth.";
  }
  
  // === DEFAULT ===
  return "Conditions are stable. Complete your planned session to maintain your cognitive baseline.";
}

export function DailyBriefing({
  sharpness,
  readiness,
  recovery,
  rq,
  isLoading,
}: DailyBriefingProps) {
  const briefingText = useMemo(
    () => generateBriefing(sharpness, readiness, recovery, rq),
    [sharpness, readiness, recovery, rq]
  );
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-3 bg-muted rounded w-full mb-2" />
        <div className="h-3 bg-muted rounded w-3/4" />
      </div>
    );
  }
  
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="text-[11px] text-muted-foreground leading-relaxed"
    >
      {briefingText}
    </motion.p>
  );
}
