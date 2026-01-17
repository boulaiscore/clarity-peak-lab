/**
 * Calibration Results Screen
 * 
 * Premium, clinical display of baseline scores
 */

import { motion } from "framer-motion";
import { Target, Zap, Brain, Lightbulb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalibrationResultsProps {
  scores: {
    AE: number;
    RA: number;
    CT: number;
    IN: number;
  };
  onSaveAndEnter: () => Promise<void>;
  isSaving: boolean;
}

const SKILL_CONFIG = {
  AE: {
    name: "Attentional Efficiency",
    abbr: "AE",
    icon: Target,
    color: "text-area-fast",
    bgColor: "bg-area-fast/10",
    borderColor: "border-area-fast/30",
    description: "Speed and precision of focused attention",
  },
  RA: {
    name: "Rapid Association",
    abbr: "RA",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    description: "Intuitive linking and pattern recognition",
  },
  CT: {
    name: "Critical Thinking",
    abbr: "CT",
    icon: Brain,
    color: "text-recovery",
    bgColor: "bg-recovery/10",
    borderColor: "border-recovery/30",
    description: "Deliberate analysis and causal reasoning",
  },
  IN: {
    name: "Insight",
    abbr: "IN",
    icon: Lightbulb,
    color: "text-area-slow",
    bgColor: "bg-area-slow/10",
    borderColor: "border-area-slow/30",
    description: "Deep integration and constraint solving",
  },
};

function getScoreLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Developing";
  return "Baseline";
}

export function CalibrationResults({ 
  scores, 
  onSaveAndEnter,
  isSaving 
}: CalibrationResultsProps) {
  const S1 = (scores.AE + scores.RA) / 2;
  const S2 = (scores.CT + scores.IN) / 2;
  const performanceAvg = (scores.AE + scores.RA + scores.CT + scores.IN + S2) / 5;

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Calibration Complete
          </h1>
          <p className="text-sm text-muted-foreground">
            Your baseline profile is ready
          </p>
        </div>

        {/* Skill Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(["AE", "RA", "CT", "IN"] as const).map((skill, i) => {
            const config = SKILL_CONFIG[skill];
            const score = scores[skill];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={skill}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {config.abbr}
                  </span>
                </div>
                <p className={`text-2xl font-semibold ${config.color} mb-1`}>
                  {Math.round(score)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 leading-tight">
                  {config.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* System scores */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-3 mb-8"
        >
          <div className="flex-1 p-3 rounded-lg bg-muted/10 border border-border/20 text-center">
            <p className="text-xs text-muted-foreground/60 mb-1">System 1</p>
            <p className="text-lg font-semibold text-foreground">{Math.round(S1)}</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-muted/10 border border-border/20 text-center">
            <p className="text-xs text-muted-foreground/60 mb-1">System 2</p>
            <p className="text-lg font-semibold text-foreground">{Math.round(S2)}</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground/60 mb-1">Overall</p>
            <p className="text-lg font-semibold text-primary">{Math.round(performanceAvg)}</p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={onSaveAndEnter}
            disabled={isSaving}
            className="w-full py-6 text-sm font-semibold"
            size="lg"
          >
            {isSaving ? "Saving..." : "Enter NeuroLoop"}
            {!isSaving && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest mt-6"
        >
          Baseline locked • Training begins
        </motion.p>
      </motion.div>
    </div>
  );
}
