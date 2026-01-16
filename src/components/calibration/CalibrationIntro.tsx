/**
 * Calibration Intro Screen
 * Premium, dark, clinical tone
 */

import { motion } from "framer-motion";
import { Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalibrationIntroProps {
  onBegin: () => void;
  onSkip?: () => void;
}

export function CalibrationIntro({ onBegin, onSkip }: CalibrationIntroProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-10">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8">
          <Zap className="w-8 h-8 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
          Baseline Calibration
        </h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Four targeted assessments to establish your cognitive baseline. 
          This data initializes your skill profile and enables personalized training.
        </p>

        {/* Duration indicator */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground/70 mb-10">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>AE — Signal Lock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>RA — Link Sprint</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground/70 mb-10">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>CT — Causal Lens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span>IN — Constraint Solve</span>
          </div>
        </div>

        {/* Time estimate */}
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest mb-8">
          Estimated duration: 2 minutes
        </p>

        {/* Begin button */}
        <Button
          onClick={onBegin}
          className="w-full py-6 text-sm font-semibold"
          size="lg"
        >
          Begin Calibration
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Skip option */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="mt-4 text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  );
}
